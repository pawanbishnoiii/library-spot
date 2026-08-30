import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X, MapPin, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import pushArt from "@/assets/push-notification-card.png";
import {
  enablePush,
  isPushDismissed,
  isPushGranted,
  dismissPushPrompt,
  listenForegroundPush,
} from "@/lib/push";

const PushSubscribeCard = () => {
  const [open, setOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    listenForegroundPush((data) => {
      toast({ title: data.title || "New update", description: data.body });
    }).then((u) => {
      unsub = u ?? null;
    });

    if (isPushGranted() || isPushDismissed()) return;
    const timer = setTimeout(() => setOpen(true), 6000);
    return () => {
      clearTimeout(timer);
      unsub?.();
    };
  }, []);

  const close = () => {
    dismissPushPrompt();
    setOpen(false);
  };

  const handleEnable = async () => {
    setIsWorking(true);
    const result = await enablePush();
    setIsWorking(false);

    switch (result.status) {
      case "registered":
        toast({ title: "Notifications on 🔔", description: "Aapko nearby new properties aur offers ke alerts milenge." });
        setOpen(false);
        break;
      case "open-in-new-tab":
        toast({
          title: "Open in a new tab",
          description: "Preview iframe me browser permission block hoti hai. App ko apne tab me kholein.",
        });
        break;
      case "denied":
        toast({
          variant: "destructive",
          title: "Permission blocked",
          description: "Browser site settings me notifications allow karein.",
        });
        close();
        break;
      case "unsupported":
        toast({ variant: "destructive", title: "Not supported", description: "Ye browser web push support nahi karta." });
        close();
        break;
      case "not-configured":
        toast({ variant: "destructive", title: "Push not configured", description: "Web push credentials missing hain." });
        close();
        break;
      default:
        toast({ variant: "destructive", title: "Something went wrong", description: result.message });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
          onClick={close}
        >
          <motion.div
            initial={{ y: 40, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          >
            <button
              onClick={close}
              aria-label="Close notification prompt"
              className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative bg-gradient-to-br from-primary/15 via-accent/10 to-transparent px-6 pt-8">
              <motion.img
                src={pushArt}
                alt="Push notification bell illustration"
                width={768}
                height={768}
                loading="lazy"
                className="mx-auto h-40 w-40 object-contain drop-shadow-xl"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <div className="space-y-4 p-6">
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-bold">Stay ahead of every new listing</h3>
                <p className="text-sm text-muted-foreground">
                  Turn on notifications and we&apos;ll ping you the moment a new library, PG, hostel or service
                  launches around you.
                </p>
              </div>

              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>New properties within 30 km of you</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Exclusive offers, discounts &amp; booking updates</span>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="ghost" className="flex-1" onClick={close}>
                  Not now
                </Button>
                <Button className="flex-1 gap-2" onClick={handleEnable} disabled={isWorking}>
                  {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                  Enable alerts
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PushSubscribeCard;
