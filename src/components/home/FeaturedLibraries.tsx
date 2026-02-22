import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Star,
  MapPin,
  Users,
  Wifi,
  Snowflake,
  Clock,
  ArrowRight,
  Heart,
  Car,
  Shield,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/useWishlist";

interface Library {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  banner_url: string | null;
  profile_url: string | null;
  owner_id: string;
  average_rating: number | null;
  total_reviews: number | null;
  total_seats: number | null;
  facilities: string[] | null;
  whatsapp_number: string | null;
  is_featured: boolean | null;
  status: string | null;
}

// Fallback mock data when no libraries in DB
const fallbackLibraries = [
  {
    id: "1",
    slug: "pandit-ji-library",
    name: "Pandit Ji Library",
    city: "Risinghnagar",
    state: "Rajasthan",
    banner_url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80",
    profile_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    owner_id: "",
    ownerName: "Pawan Kumar",
    average_rating: 4.9,
    total_reviews: 156,
    total_seats: 42,
    startingPrice: 1500,
    facilities: ["wifi", "ac", "parking", "power"],
    whatsapp_number: "918285896680",
    is_featured: true,
    status: "approved",
  },
  {
    id: "2",
    slug: "knowledge-hub-delhi",
    name: "Knowledge Hub",
    city: "New Delhi",
    state: "Delhi",
    banner_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    profile_url: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&q=80",
    owner_id: "",
    ownerName: "Rahul Sharma",
    average_rating: 4.8,
    total_reviews: 245,
    total_seats: 120,
    startingPrice: 2000,
    facilities: ["wifi", "ac", "parking"],
    whatsapp_number: "919876543210",
    is_featured: true,
    status: "approved",
  },
  {
    id: "3",
    slug: "study-nest-jaipur",
    name: "Study Nest",
    city: "Jaipur",
    state: "Rajasthan",
    banner_url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80",
    profile_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    owner_id: "",
    ownerName: "Priya Sharma",
    average_rating: 4.7,
    total_reviews: 189,
    total_seats: 80,
    startingPrice: 1800,
    facilities: ["wifi", "ac"],
    whatsapp_number: "919876543211",
    is_featured: true,
    status: "approved",
  },
  {
    id: "4",
    slug: "focus-zone-mumbai",
    name: "Focus Zone",
    city: "Mumbai",
    state: "Maharashtra",
    banner_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    profile_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    owner_id: "",
    ownerName: "Vikram Singh",
    average_rating: 4.9,
    total_reviews: 312,
    total_seats: 150,
    startingPrice: 2500,
    facilities: ["wifi", "ac", "parking", "power"],
    whatsapp_number: "919876543212",
    is_featured: true,
    status: "approved",
  },
];

const facilityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3.5 h-3.5" />,
  ac: <Snowflake className="w-3.5 h-3.5" />,
  parking: <Car className="w-3.5 h-3.5" />,
  power: <Shield className="w-3.5 h-3.5" />,
  silent: <Users className="w-3.5 h-3.5" />,
};

const LibraryCard = ({
  library,
  index,
}: {
  library: (typeof fallbackLibraries)[0];
  index: number;
}) => {
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(library.id);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link to={`/library/${library.slug}`}>
        <motion.div
          whileHover={{ y: -8 }}
          className="group card-premium overflow-hidden"
        >
          {/* Image */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={library.banner_url || "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80"}
              alt={library.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />

            {/* Status Badge */}
            <div className="absolute top-4 left-4">
              <span className="badge-success">Open Now</span>
            </div>

            {/* Wishlist Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`absolute top-4 right-4 w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center shadow-lg ${
                wishlisted ? "bg-destructive/90 text-white" : "bg-card/80"
              }`}
              onClick={(e) => toggleWishlist(library.id, e)}
            >
              <Heart className={`w-4 h-4 ${wishlisted ? "fill-current" : "text-muted-foreground"}`} />
            </motion.button>

            {/* Profile Image */}
            <div className="absolute -bottom-6 left-4">
              <div className="w-14 h-14 rounded-xl border-3 border-card overflow-hidden shadow-lg">
                <img
                  src={library.profile_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"}
                  alt={library.ownerName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Price Badge */}
            <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <span className="text-xs text-muted-foreground">From</span>
              <span className="text-lg font-bold text-primary ml-1">
                ₹{library.startingPrice}
              </span>
              <span className="text-xs text-muted-foreground">/mo</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 pt-8">
            {/* Title & Rating */}
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-heading font-semibold text-lg group-hover:text-primary transition-colors">
                {library.name}
              </h3>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="font-semibold">{library.average_rating}</span>
                <span className="text-muted-foreground text-sm">
                  ({library.total_reviews})
                </span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
              <MapPin className="w-4 h-4" />
              <span>
                {library.city}, {library.state}
              </span>
            </div>

            {/* Owner */}
            <p className="text-sm text-muted-foreground mb-3">
              by{" "}
              <span className="text-foreground font-medium">
                {library.ownerName}
              </span>
            </p>

            {/* Bottom Row */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              {/* Facilities */}
              <div className="flex items-center gap-2">
                {library.facilities?.slice(0, 3).map((facility) => (
                  <div
                    key={facility}
                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"
                  >
                    {facilityIcons[facility]}
                  </div>
                ))}
              </div>

              {/* WhatsApp */}
              {library.whatsapp_number && (
                <a
                  href={`https://wa.me/${library.whatsapp_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-sm text-success hover:underline"
                >
                  <FaWhatsapp className="w-4 h-4" />
                  Chat
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

const LibraryCardSkeleton = () => (
  <div className="card-premium overflow-hidden">
    <Skeleton className="h-48 w-full" />
    <div className="p-4 pt-8 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
      <div className="flex justify-between pt-3 border-t border-border">
        <div className="flex gap-2">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>
        <Skeleton className="h-5 w-12" />
      </div>
    </div>
  </div>
);

const FeaturedLibraries = () => {
  const [libraries, setLibraries] = useState<typeof fallbackLibraries>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLibraries();
  }, []);

  const fetchLibraries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("libraries")
        .select(`
          *,
          profiles:owner_id (full_name),
          shifts (price_per_seat, monthly_price)
        `)
        .eq("status", "approved")
        .eq("is_featured", true)
        .limit(4);

      if (data && data.length > 0) {
        const formattedLibraries = data.map((lib: any) => ({
          ...lib,
          ownerName: lib.profiles?.full_name || "Library Owner",
          startingPrice: lib.shifts?.[0]?.monthly_price || lib.shifts?.[0]?.price_per_seat || 1500,
          facilities: Array.isArray(lib.facilities) ? lib.facilities : [],
        }));
        setLibraries(formattedLibraries);
      } else {
        // Use fallback data if no libraries in DB
        setLibraries(fallbackLibraries);
      }
    } catch (error) {
      console.error("Error fetching libraries:", error);
      setLibraries(fallbackLibraries);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="section-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="badge-primary mb-3 inline-block"
            >
              Featured Libraries
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-heading text-3xl md:text-4xl font-bold"
            >
              Top-Rated Study Spaces
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/search">
              <Button variant="ghost" className="gap-2 group">
                View All Libraries
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? [1, 2, 3, 4].map((i) => <LibraryCardSkeleton key={i} />)
            : libraries.map((library, index) => (
                <LibraryCard key={library.id} library={library} index={index} />
              ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedLibraries;
