import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, MapPin, Star, Trash2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/layout/BottomNav";
import Navbar from "@/components/layout/Navbar";

const SavedPage = () => {
  const { user } = useAuth();
  const [savedLibraries, setSavedLibraries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchSaved();
    else setIsLoading(false);
  }, [user]);

  const fetchSaved = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("wishlists")
      .select(`
        id,
        library_id,
        libraries (
          id, slug, name, city, state, banner_url, profile_url,
          average_rating, total_reviews, total_seats, facilities,
          whatsapp_number, property_type
        )
      `)
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (data) {
      setSavedLibraries(data.filter((d: any) => d.libraries));
    }
    setIsLoading(false);
  };

  const removeFromWishlist = async (wishlistId: string) => {
    await supabase.from("wishlists").delete().eq("id", wishlistId);
    setSavedLibraries((prev) => prev.filter((s) => s.id !== wishlistId));
    toast({ title: "Removed from saved" });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="pt-20 section-container">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold">Saved</h1>
          <p className="text-sm text-muted-foreground">
            {savedLibraries.length} saved properties
          </p>
        </div>

        {!user ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="font-heading text-lg font-semibold mb-2">Sign in to save</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Sign in to save your favorite properties
            </p>
            <Link to="/auth/login">
              <Button className="btn-primary">Sign In</Button>
            </Link>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : savedLibraries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="font-heading text-lg font-semibold mb-2">No saved properties</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Tap the heart icon on any property to save it here
            </p>
            <Link to="/search">
              <Button className="btn-primary">Explore Properties</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {savedLibraries.map((item) => {
                const lib = item.libraries;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="flex gap-4 p-3 bg-card rounded-2xl border border-border"
                  >
                    <Link to={`/library/${lib.slug}`} className="flex-shrink-0">
                      <img
                        src={lib.banner_url || "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&q=80"}
                        alt={lib.name}
                        className="w-28 h-24 rounded-xl object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/library/${lib.slug}`}>
                        <h3 className="font-semibold text-sm truncate">{lib.name}</h3>
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{lib.city}, {lib.state}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-warning fill-warning" />
                        <span className="text-xs font-semibold">
                          {lib.average_rating?.toFixed(1) || "New"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({lib.total_reviews || 0})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {lib.whatsapp_number && (
                          <a
                            href={`https://wa.me/${lib.whatsapp_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-success"
                          >
                            <FaWhatsapp className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="self-start p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default SavedPage;
