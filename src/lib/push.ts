import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { supabase } from "@/integrations/supabase/client";

const appId = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID as string | undefined;
const vapidKey = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY as string | undefined;

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY as string | undefined,
  projectId: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID as string | undefined,
  appId,
  messagingSenderId: appId?.split(":")[1] ?? "",
};

export type PushStatus =
  | "registered"
  | "not-configured"
  | "unsupported"
  | "open-in-new-tab"
  | "denied"
  | "error";

export type PushResult = { status: PushStatus; token?: string; message?: string };

export const PUSH_DISMISS_KEY = "bnoy_push_prompt_dismissed_at";
export const PUSH_TOKEN_KEY = "bnoy_push_token";

export function isPushGranted() {
  return typeof Notification !== "undefined" && Notification.permission === "granted";
}

export function isPushDismissed() {
  const at = localStorage.getItem(PUSH_DISMISS_KEY);
  if (!at) return false;
  // re-ask after 7 days
  return Date.now() - Number(at) < 7 * 24 * 60 * 60 * 1000;
}

export function dismissPushPrompt() {
  localStorage.setItem(PUSH_DISMISS_KEY, String(Date.now()));
}

async function getCoords(): Promise<{ lat: number | null; lng: number | null }> {
  if (!("geolocation" in navigator)) return { lat: null, lng: null };
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ lat: null, lng: null }), 6000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        resolve({ lat: null, lng: null });
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
    );
  });
}

export async function saveDeviceToken(token: string) {
  const { data: auth } = await supabase.auth.getUser();
  const coords = await getCoords();

  const payload = {
    token,
    user_id: auth.user?.id ?? null,
    platform: "web",
    user_agent: navigator.userAgent.slice(0, 300),
    is_active: true,
    last_seen_at: new Date().toISOString(),
    ...(coords.lat !== null ? { lat: coords.lat, lng: coords.lng } : {}),
  };

  const { data: existing } = await supabase
    .from("push_devices")
    .select("id")
    .eq("token", token)
    .maybeSingle();

  if (existing) {
    await supabase.from("push_devices").update(payload).eq("token", token);
  } else {
    await supabase.from("push_devices").insert(payload);
  }

  localStorage.setItem(PUSH_TOKEN_KEY, token);
}

/** Must be called from a user gesture (click). */
export async function enablePush(): Promise<PushResult> {
  try {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !appId || !vapidKey || !firebaseConfig.messagingSenderId) {
      return { status: "not-configured" };
    }
    if (!("Notification" in window) || !(await isSupported())) {
      return { status: "unsupported" };
    }
    if (window.top !== window.self) {
      return { status: "open-in-new-tab" };
    }

    const permission =
      Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") return { status: "denied" };

    const query = new URLSearchParams(firebaseConfig as Record<string, string>).toString();
    const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig as Record<string, string>);
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });

    if (!token) return { status: "denied" };
    await saveDeviceToken(token);
    return { status: "registered", token };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Foreground message listener — returns an unsubscribe fn (or null). */
export async function listenForegroundPush(cb: (payload: Record<string, string>) => void) {
  try {
    if (!firebaseConfig.apiKey || !(await isSupported())) return null;
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig as Record<string, string>);
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => cb((payload.data ?? {}) as Record<string, string>));
  } catch {
    return null;
  }
}

/** True when Firebase web-push credentials are present in the environment. */
export function isPushConfigured() {
  return Boolean(
    firebaseConfig.apiKey && firebaseConfig.projectId && appId && vapidKey && firebaseConfig.messagingSenderId
  );
}

export function hasStoredToken() {
  return Boolean(localStorage.getItem(PUSH_TOKEN_KEY));
}

/** Permission already granted but no token stored — register silently. */
export async function registerExistingPermission(): Promise<PushResult> {
  if (!isPushConfigured()) return { status: "not-configured" };
  if (!isPushGranted()) return { status: "denied" };
  return enablePush();
}
