import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserLocation } from "@/contexts/LocationContext";
import { useMemo } from "react";

export interface Listing {
  id: string;
  owner_id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  category_id: string;
  subcategory_id: string | null;
  gender_preference: string;
  city: string | null;
  locality: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  price_current: number | null;
  price_original: number | null;
  price_offer: number | null;
  price_unit: string;
  average_rating: number;
  total_reviews: number;
  is_featured: boolean;
  is_open_now: boolean;
  verification: string;
  available_units: number | null;
  created_at: string;
  categories?: { slug: string; name: string; kind: string } | null;
}

export interface ListingFilters {
  q?: string;
  category?: string;
  subcategory?: string;
  city?: string;
  gender?: string;
  maxPrice?: number;
  minRating?: number;
  amenities?: string[];
  openNow?: boolean;
  verifiedOnly?: boolean;
  sort?: "recommended" | "nearest" | "rating" | "price" | "newest";
}

export type RankedListing = Listing & { distance: number | null; score: number };

const SELECT =
  "id,owner_id,slug,title,description,cover_url,category_id,subcategory_id,gender_preference,city,locality,address,lat,lng,price_current,price_original,price_offer,price_unit,average_rating,total_reviews,is_featured,is_open_now,verification,available_units,created_at,categories(slug,name,kind)";

export function useListings(filters: ListingFilters = {}) {
  const { distanceFrom } = useUserLocation();

  const query = useQuery({
    queryKey: ["listings", filters.category, filters.subcategory, filters.city, filters.q],
    staleTime: 60_000,
    queryFn: async (): Promise<Listing[]> => {
      let q = supabase.from("listings").select(SELECT).eq("status", "published").limit(200);
      if (filters.city) q = q.ilike("city", `%${filters.city}%`);
      if (filters.q) {
        const term = `%${filters.q}%`;
        q = q.or(
          `title.ilike.${term},description.ilike.${term},locality.ilike.${term},city.ilike.${term},address.ilike.${term}`
        );
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Listing[];
    },
  });

  const ranked = useMemo<RankedListing[]>(() => {
    const rows = query.data ?? [];
    const now = Date.now();

    const filtered = rows.filter((l) => {
      if (filters.category && l.categories?.slug !== filters.category) return false;
      if (filters.gender && filters.gender !== "any" && l.gender_preference !== filters.gender)
        return false;
      if (filters.maxPrice && (l.price_current ?? 0) > filters.maxPrice) return false;
      if (filters.minRating && l.average_rating < filters.minRating) return false;
      if (filters.openNow && !l.is_open_now) return false;
      if (filters.verifiedOnly && l.verification !== "verified") return false;
      return true;
    });

    const withScore = filtered.map((l) => {
      const distance = distanceFrom(l.lat, l.lng);
      const proximity = distance == null ? 0.4 : Math.max(0, 1 - distance / 15);
      const rating = l.average_rating / 5;
      const trust = Math.min(1, l.total_reviews / 25);
      const fresh = Math.max(0, 1 - (now - new Date(l.created_at).getTime()) / (90 * 864e5));
      const availability = (l.available_units ?? 1) > 0 ? 1 : 0.3;
      const featured = l.is_featured ? 0.15 : 0;
      const score =
        proximity * 0.35 + rating * 0.25 + trust * 0.12 + fresh * 0.1 + availability * 0.13 + featured;
      return { ...l, distance, score };
    });

    const sort = filters.sort ?? "recommended";
    withScore.sort((a, b) => {
      switch (sort) {
        case "nearest":
          return (a.distance ?? 1e9) - (b.distance ?? 1e9);
        case "rating":
          return b.average_rating - a.average_rating;
        case "price":
          return (a.price_current ?? 1e9) - (b.price_current ?? 1e9);
        case "newest":
          return +new Date(b.created_at) - +new Date(a.created_at);
        default:
          return b.score - a.score;
      }
    });
    return withScore;
  }, [query.data, filters, distanceFrom]);

  return { ...query, listings: ranked };
}

export function useListing(slug?: string) {
  return useQuery({
    queryKey: ["listing", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(
          `*, categories(slug,name,kind), subcategories(name,slug),
           listing_media(id,url,media_type,is_cover,sort_order),
           listing_services(*), listing_plans(*), listing_hours(*),
           offers(*), delivery_areas(*),
           listing_amenities(amenity_id, amenities(name,slug,icon))`
        )
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useMyListings(ownerId?: string) {
  return useQuery({
    queryKey: ["my-listings", ownerId],
    enabled: !!ownerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(SELECT + ",status")
        .eq("owner_id", ownerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
