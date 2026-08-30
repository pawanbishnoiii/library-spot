import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  kind: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface Amenity {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  group_name: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSubcategories(categoryId?: string | null) {
  return useQuery({
    queryKey: ["subcategories", categoryId],
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Subcategory[]> => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .eq("category_id", categoryId!)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAmenities() {
  return useQuery({
    queryKey: ["amenities"],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Amenity[]> => {
      const { data, error } = await supabase
        .from("amenities")
        .select("*")
        .eq("is_active", true)
        .order("group_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
