import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { sendToTokens } from "../_shared/fcm.ts";

const BodySchema = z.object({
  library_id: z.string().uuid(),
  radius_km: z.number().min(1).max(200).default(30),
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

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { library_id, radius_km } = parsed.data;

    const { data: lib } = await admin
      .from("libraries")
      .select("id, name, slug, city, state, owner_id, map_lat, map_lng, property_type, banner_url, status")
      .eq("id", library_id)
      .maybeSingle();

    if (!lib) return json({ error: "Property not found" }, 404);

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (lib.owner_id !== userData.user.id && !isAdmin) return json({ error: "Not allowed" }, 403);
    if (lib.status !== "approved") return json({ error: "Property must be approved first" }, 400);
    if (lib.map_lat == null || lib.map_lng == null) return json({ error: "Property has no map location set" }, 400);

    const kind = lib.property_type === "library" ? "library" : "stay";
    const payload = {
      title: `New ${kind} near you: ${lib.name}`,
      body: `${lib.name} just launched in ${lib.city}, ${lib.state}. Tap to view seats, rooms and pricing.`,
      banner_url: lib.banner_url,
      tag: "nearby-launch",
      action_url: `/library/${lib.slug}`,
    };

    const { data: devices } = await admin.rpc("nearby_push_devices", {
      _lat: lib.map_lat,
      _lng: lib.map_lng,
      _radius_km: radius_km,
    });

    const rows = (devices ?? []) as { token: string; user_id: string | null }[];
    const tokens = rows.map((r) => r.token);

    const { data: campaign } = await admin
      .from("push_campaigns")
      .insert({
        created_by: userData.user.id,
        title: payload.title,
        body: payload.body,
        banner_url: payload.banner_url,
        tag: payload.tag,
        action_url: payload.action_url,
        audience: "nearby",
        audience_lat: lib.map_lat,
        audience_lng: lib.map_lng,
        radius_km,
        source: "automatic",
        status: "sending",
      })
      .select()
      .single();

    if (tokens.length === 0) {
      if (campaign) await admin.from("push_campaigns").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", campaign.id);
      return json({ sent: 0, failed: 0, message: "No nearby subscribers" });
    }

    const { sent, failed, stale } = await sendToTokens(tokens, payload);
    if (stale.length) await admin.from("push_devices").delete().in("token", stale);

    if (campaign) {
      await admin
        .from("push_campaigns")
        .update({ status: "sent", sent_count: sent, failed_count: failed, sent_at: new Date().toISOString() })
        .eq("id", campaign.id);
    }

    const uniqueUsers = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
    if (uniqueUsers.length) {
      await admin.from("notifications").insert(
        uniqueUsers.map((uid) => ({
          user_id: uid,
          title: payload.title,
          body: payload.body,
          type: "general",
          action_url: payload.action_url,
        })),
      );
    }

    return json({ sent, failed, nearby_devices: tokens.length });
  } catch (e) {
    console.error("notify-nearby-property error", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
