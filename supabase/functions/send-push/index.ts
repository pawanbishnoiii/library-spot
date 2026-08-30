import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { sendToTokens } from "../_shared/fcm.ts";

const BodySchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(500),
  banner_url: z.string().url().max(1000).optional().nullable(),
  icon_url: z.string().url().max(1000).optional().nullable(),
  tag: z.string().trim().max(50).optional().nullable(),
  action_url: z.string().trim().max(1000).optional().nullable(),
  audience: z.enum(["all", "users", "owners", "city", "nearby"]).default("all"),
  audience_city: z.string().trim().max(100).optional().nullable(),
  audience_lat: z.number().min(-90).max(90).optional().nullable(),
  audience_lng: z.number().min(-180).max(180).optional().nullable(),
  radius_km: z.number().min(1).max(500).default(30),
});

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admins only" }, 403);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const p = parsed.data;

    // Resolve target tokens
    let tokens: string[] = [];
    if (p.audience === "nearby" && p.audience_lat != null && p.audience_lng != null) {
      const { data } = await admin.rpc("nearby_push_devices", {
        _lat: p.audience_lat,
        _lng: p.audience_lng,
        _radius_km: p.radius_km,
      });
      tokens = (data ?? []).map((d: { token: string }) => d.token);
    } else {
      let q = admin.from("push_devices").select("token, user_id, city").eq("is_active", true);
      if (p.audience === "city" && p.audience_city) q = q.ilike("city", p.audience_city);
      if (p.audience === "users") q = q.not("user_id", "is", null);
      const { data } = await q;
      let rows = data ?? [];

      if (p.audience === "owners") {
        const { data: owners } = await admin.from("user_roles").select("user_id").eq("role", "owner");
        const ids = new Set((owners ?? []).map((o: { user_id: string }) => o.user_id));
        rows = rows.filter((r: { user_id: string | null }) => r.user_id && ids.has(r.user_id));
      }
      tokens = rows.map((r: { token: string }) => r.token);
    }

    const { data: campaign } = await admin
      .from("push_campaigns")
      .insert({
        created_by: userData.user.id,
        title: p.title,
        body: p.body,
        banner_url: p.banner_url ?? null,
        icon_url: p.icon_url ?? null,
        tag: p.tag ?? null,
        action_url: p.action_url ?? null,
        audience: p.audience,
        audience_city: p.audience_city ?? null,
        audience_lat: p.audience_lat ?? null,
        audience_lng: p.audience_lng ?? null,
        radius_km: p.radius_km,
        source: "admin",
        status: "sending",
      })
      .select()
      .single();

    if (tokens.length === 0) {
      if (campaign) {
        await admin.from("push_campaigns").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", campaign.id);
      }
      return json({ sent: 0, failed: 0, message: "No subscribed devices yet" });
    }

    const { sent, failed, stale } = await sendToTokens(tokens, p);
    if (stale.length) await admin.from("push_devices").delete().in("token", stale);

    if (campaign) {
      await admin
        .from("push_campaigns")
        .update({ status: "sent", sent_count: sent, failed_count: failed, sent_at: new Date().toISOString() })
        .eq("id", campaign.id);
    }

    // In-app notification feed for signed-in recipients
    const { data: deviceUsers } = await admin
      .from("push_devices")
      .select("user_id")
      .in("token", tokens)
      .not("user_id", "is", null);
    const uniqueUsers = [...new Set((deviceUsers ?? []).map((d: { user_id: string }) => d.user_id))];
    if (uniqueUsers.length) {
      await admin.from("notifications").insert(
        uniqueUsers.map((uid) => ({
          user_id: uid,
          title: p.title,
          body: p.body,
          type: "general",
          action_url: p.action_url ?? null,
        })),
      );
    }

    return json({ sent, failed, campaign_id: campaign?.id ?? null });
  } catch (e) {
    console.error("send-push error", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
