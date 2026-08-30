const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

export interface PushPayload {
  title: string;
  body: string;
  banner_url?: string | null;
  icon_url?: string | null;
  tag?: string | null;
  action_url?: string | null;
}

function headers() {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  const connectionKey = Deno.env.get("FIREBASE_MESSAGING_API_KEY");
  if (!connectionKey) throw new Error("FIREBASE_MESSAGING_API_KEY is not configured");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
    "Content-Type": "application/json",
  };
}

function dataPayload(p: PushPayload): Record<string, string> {
  const data: Record<string, string> = { title: p.title, body: p.body };
  if (p.banner_url) data.banner_url = p.banner_url;
  if (p.icon_url) data.icon_url = p.icon_url;
  if (p.tag) data.tag = p.tag;
  if (p.action_url) data.action_url = p.action_url;
  return data;
}

/** Sends to one device token. Returns 'ok' | 'stale' | 'failed'. */
export async function sendToToken(token: string, p: PushPayload): Promise<"ok" | "stale" | "failed"> {
  const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      message: {
        token,
        notification: { title: p.title, body: p.body, ...(p.banner_url ? { image: p.banner_url } : {}) },
        data: dataPayload(p),
        webpush: {
          fcm_options: { link: p.action_url || "/" },
        },
      },
    }),
  });

  if (res.ok) return "ok";
  const text = await res.text();
  console.error(`FCM send failed [${res.status}]: ${text}`);
  if (res.status === 404 || (res.status === 400 && text.includes("INVALID_ARGUMENT"))) return "stale";
  return "failed";
}

export async function sendToTokens(tokens: string[], p: PushPayload) {
  let sent = 0;
  let failed = 0;
  const stale: string[] = [];

  for (let i = 0; i < tokens.length; i += 20) {
    const batch = tokens.slice(i, i + 20);
    const results = await Promise.all(batch.map((t) => sendToToken(t, p).catch(() => "failed" as const)));
    results.forEach((r, idx) => {
      if (r === "ok") sent++;
      else {
        failed++;
        if (r === "stale") stale.push(batch[idx]);
      }
    });
  }

  return { sent, failed, stale };
}
