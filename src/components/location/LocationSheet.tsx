import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Navigation, Search, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useUserLocation } from "@/contexts/LocationContext";

const LocationSheet = () => {
  const { sheetOpen, closeSheet, detectLocation, setManualLocation, isLocating, permission } =
    useUserLocation();
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (!sheetOpen || cities.length) return;
    let cancelled = false;
    (async () => {
      const [libs, vends] = await Promise.all([
        supabase.from("libraries").select("city").eq("status", "approved").limit(500),
        supabase.from("vendors").select("city").eq("status", "approved").limit(500),
      ]);
      if (cancelled) return;
      const all = [
        ...(libs.data ?? []).map((r) => r.city),
        ...(vends.data ?? []).map((r) => r.city),
      ].filter(Boolean) as string[];
      setCities(Array.from(new Set(all)).sort());
    })();
    return () => {
      cancelled = true;
    };
  }, [sheetOpen, cities.length]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities.slice(0, 8);
    return cities.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [cities, query]);

  return (
    <AnimatePresence>
      {sheetOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSheet}
            className="fixed inset-0 z-[70] bg-foreground/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            role="dialog"
            aria-label="Choose your location"
            className="fixed bottom-0 left-0 right-0 z-[71] rounded-t-3xl bg-card p-5 pb-8 shadow-xl sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:w-[440px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl safe-area-bottom"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted sm:hidden" />
            <button
              onClick={closeSheet}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </span>
              <div>
                <h2 className="text-lg font-bold leading-tight">Discover what's near you</h2>
                <p className="text-xs text-muted-foreground">
                  Better recommendations, real distances, nearby offers.
                </p>
              </div>
            </div>

            <Button
              onClick={detectLocation}
              disabled={isLocating}
              className="mt-4 h-12 w-full gap-2 rounded-2xl text-base"
            >
              {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
              Use my current location
            </Button>

            {permission === "denied" && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Location is blocked in your browser — pick a city below instead.
              </p>
            )}

            <div className="relative mt-5">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city or locality"
                aria-label="Search city"
                className="input-premium pl-11"
              />
            </div>

            <div className="mt-3 max-h-56 space-y-1 overflow-y-auto custom-scrollbar">
              {results.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No matching city yet. Try current location.
                </p>
              )}
              {results.map((city) => (
                <button
                  key={city}
                  onClick={() => setManualLocation(city)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{city}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LocationSheet;
