import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, MapPin, BadgeCheck, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useUserLocation } from "@/contexts/LocationContext";

export interface DiscoverItem {
  id: string;
  slug: string;
  name: string;
  cover: string | null;
  city: string;
  locality: string;
  rating: number;
  reviews: number;
  price: number | null;
  kind: string;
  href: string;
  lat: number | null;
  lng: number | null;
  featured: boolean;
}

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&q=70&auto=format&fit=crop";

export function useDiscoverItems() {
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [libs, vends] = await Promise.all([
        supabase
          .from("libraries")
          .select(
            "id,slug,name,banner_url,profile_url,city,address,average_rating,total_reviews,map_lat,map_lng,property_type,is_featured"
          )
          .eq("status", "approved")
          .limit(40),
        supabase
          .from("vendors")
          .select(
            "id,slug,business_name,banner_url,logo_url,city,address,average_rating,total_reviews,map_lat,map_lng,is_featured"
          )
          .eq("status", "approved")
          .limit(40),
      ]);
      if (cancelled) return;

      const mapped: DiscoverItem[] = [
        ...(libs.data ?? []).map((l) => ({
          id: l.id,
          slug: l.slug,
          name: l.name,
          cover: l.banner_url ?? l.profile_url,
          city: l.city ?? "",
          locality: l.address ?? "",
          rating: Number(l.average_rating ?? 0),
          reviews: l.total_reviews ?? 0,
          price: null,
          kind: l.property_type ?? "library",
          href: `/library/${l.slug}`,
          lat: l.map_lat != null ? Number(l.map_lat) : null,
          lng: l.map_lng != null ? Number(l.map_lng) : null,
          featured: Boolean(l.is_featured),
        })),
        ...(vends.data ?? []).map((v) => ({
          id: v.id,
          slug: v.slug,
          name: v.business_name,
          cover: v.banner_url ?? v.logo_url,
          city: v.city ?? "",
          locality: v.address ?? "",
          rating: Number(v.average_rating ?? 0),
          reviews: v.total_reviews ?? 0,
          price: null,
          kind: "service",
          href: `/vendor/${v.slug}`,
          lat: v.map_lat != null ? Number(v.map_lat) : null,
          lng: v.map_lng != null ? Number(v.map_lng) : null,
          featured: Boolean(v.is_featured),
        })),
      ];

      setItems(mapped);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, isLoading };
}

interface RailProps {
  title: string;
  subtitle?: string;
  items: DiscoverItem[];
  isLoading: boolean;
  viewAllHref?: string;
}

const NearYouRail = ({ title, subtitle, items, isLoading, viewAllHref = "/search" }: RailProps) => {
  const { distanceFrom } = useUserLocation();

  const withDistance = useMemo(
    () => items.map((item) => ({ ...item, distance: distanceFrom(item.lat, item.lng) })),
    [items, distanceFrom]
  );

  if (!isLoading && withDistance.length === 0) return null;

  return (
    <section className="py-4" aria-label={title}>
      <div className="section-container mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <Link
          to={viewAllHref}
          className="flex items-center gap-0.5 text-sm font-semibold text-primary"
        >
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 custom-scrollbar sm:px-6 lg:px-8">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-[76vw] shrink-0 sm:w-64">
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className="mt-1 h-3 w-1/2" />
            </div>
          ))}

        {!isLoading &&
          withDistance.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i, 5) * 0.04, duration: 0.25 }}
              className="w-[76vw] shrink-0 snap-start sm:w-64"
            >
              <Link
                to={item.href}
                className="block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative h-36 w-full overflow-hidden bg-muted">
                  <img
                    src={item.cover ?? PLACEHOLDER}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  {item.featured && (
                    <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      Popular
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1">
                    <h3 className="truncate text-sm font-bold">{item.name}</h3>
                    <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5 font-semibold text-foreground">
                      <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                      {item.rating ? item.rating.toFixed(1) : "New"}
                    </span>
                    {item.reviews > 0 && <span>({item.reviews})</span>}
                    {item.distance != null && <span>• {item.distance.toFixed(1)} km</span>}
                  </div>
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {item.city || item.locality || "Nearby"}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
      </div>
    </section>
  );
};

export default NearYouRail;
