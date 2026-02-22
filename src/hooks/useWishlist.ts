import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export const useWishlist = () => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("wishlists")
      .select("library_id")
      .eq("user_id", user.id);

    if (data) {
      setWishlistIds(new Set(data.map((w) => w.library_id)));
    }
  };

  const toggleWishlist = useCallback(
    async (libraryId: string, e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();

      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to save properties",
          variant: "destructive",
        });
        return;
      }

      const isWishlisted = wishlistIds.has(libraryId);

      if (isWishlisted) {
        await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("library_id", libraryId);

        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(libraryId);
          return next;
        });
        toast({ title: "Removed from saved" });
      } else {
        await supabase.from("wishlists").insert({
          user_id: user.id,
          library_id: libraryId,
        });

        setWishlistIds((prev) => new Set(prev).add(libraryId));
        toast({ title: "Saved to wishlist" });
      }
    },
    [user, wishlistIds]
  );

  const isWishlisted = useCallback(
    (libraryId: string) => wishlistIds.has(libraryId),
    [wishlistIds]
  );

  return { toggleWishlist, isWishlisted };
};
