import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  enablePush,
  isPushConfigured,
  isPushDismissed,
  isPushGranted,
  dismissPushPrompt,
  hasStoredToken,
  listenForegroundPush,
  registerExistingPermission,
} from "@/lib/push";

/**
 * Shows a bottom sheet 2–5s (random) after login when the user has not
 * subscribed to push yet. Degrades silently when Firebase config is missing.
 */
const NotificationPrompt = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  // Foreground messages -> toast
  useEffect(() => {
    let unsub: (() => void) | null = null;
    listenForegroundPush((data) => {
      toast({ title: data.title || "New update", description: data.body });
    }).then((u) => {
      unsub = u ?? null;
    });
    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (!user) return;

    if (!isPushConfigured()) {
      console.warn(
        "[push] Web push credentials missing — notifications are disabled. Configure the Firebase Cloud Messaging connection."
      );
      return;
    }

    let cancelled = false;

    const run = async () => {
      // Permission already granted but token missing -> re-register quietly.
      if (isPushGranted()) {
        if (!hasStoredToken()) await registerExistingPermission();
        return;
      }
      if (typeof Notification !== "undefined" && Notification.permission === "denied") return;
      if (isPushDismissed()) return;

      const delay = 2000 + Math.random() * 3000; // 2–5 seconds
      const timer = setTimeout(() => {
        if (!cancelled) setOpen(true);
      }, delay);
      return () => clearTimeout(timer);
    };

    let cleanup: (() => void) | undefined;
    run().then((c) => {
      cleanup = c;
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [user]);

  const later = () => {
    dismissPushPrompt();
    setOpen(false);
  };

  const handleEnable = async () => {
    setIsWorking(true);
    const result = await enablePush();
    setIsWorking(false);

    switch (result.status) {
      case "registered":
        toast({ title: "Notifications on", description: "You'll get booking, payment and nearby alerts." });
        setOpen(false);
        break;
      case "open-in-new-tab":
        toast({
          title: "Open in a new tab",
          description: "Browsers block permission prompts inside the preview frame.",
        });
        break;
      case "denied":
        toast({
          variant: "destructive",
          title: "Permission blocked",
          description: "Allow notifications from your browser's site settings.",
        });
        later();
        break;
      case "not-configured":
      case "unsupported":
        toast({ title: "Notifications unavailable", description: "Push is not set up on this device yet." });
        later();
        break;
      default:
        toast({ variant: "destructive", title: "Something went wrong", description: result.message });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={later}
            className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            role="dialog"
            aria-label="Enable notifications"
            className="fixed bottom-0 left-0 right-0 z-[61] rounded-t-3xl bg-card p-6 pb-8 shadow-xl sm:left-1/2 sm:right-auto sm:bottom-6 sm:w-[420px] sm:-translate-x-1/2 sm:rounded-3xl safe-area-bottom"
          >
            <button
              onClick={later}
              aria-label="Dismiss"
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Bell className="h-6 w-6 text-primary" />
            </span>
            <h2 className="text-lg font-bold">Never miss important updates</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Get alerts for bookings, offers, payment reminders and new places near you.
            </p>

            <div className="mt-5 flex gap-3">
              <Button variant="ghost" className="h-12 flex-1 rounded-2xl" onClick={later}>
                Maybe later
              </Button>
              <Button className="h-12 flex-1 gap-2 rounded-2xl" onClick={handleEnable} disabled={isWorking}>
                {isWorking && <Loader2 className="h-4 w-4 animate-spin" />}
                Enable
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPrompt;
