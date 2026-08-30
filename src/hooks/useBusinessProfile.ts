import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BusinessProfile {
  id: string;
  user_id: string;
  display_name: string;
  business_name: string | null;
  title: string | null;
  about: string | null;
  avatar_url: string | null;
  slug: string | null;
  started_year: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  youtube: string | null;
  address: string | null;
  city: string | null;
  locality: string | null;
  state: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  primary_category_id: string | null;
  onboarding_step: number;
  onboarding_complete: boolean;
  verification: string;
  average_rating: number;
  total_reviews: number;
}

export function useBusinessProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["business-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<BusinessProfile | null> => {
      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as BusinessProfile | null;
    },
  });
}

export function useBusinessBySlug(slug?: string) {
  return useQuery({
    queryKey: ["business-public", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
