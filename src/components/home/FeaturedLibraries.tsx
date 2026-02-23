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
  BookOpen,
  Home,
  BedDouble,
  Building2,
  Bed,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/useWishlist";

interface FeaturedProperty {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  banner_url: string | null;
  profile_url: string | null;
  owner_id: string;
  ownerName: string;
  average_rating: number | null;
  total_reviews: number | null;
  total_seats: number | null;
  total_rooms: number | null;
  total_beds: number | null;
  startingPrice: number;
  facilities: string[];
  whatsapp_number: string | null;
  is_featured: boolean | null;
  status: string | null;
  property_type: string | null;
}

const fallbackProperties: FeaturedProperty[] = [
  {
    id: "1", slug: "pandit-ji-library", name: "Pandit Ji Library", city: "Risinghnagar", state: "Rajasthan",
    banner_url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80",
    profile_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    owner_id: "", ownerName: "Pawan Kumar", average_rating: 4.9, total_reviews: 156, total_seats: 42,
    total_rooms: 0, total_beds: 0, startingPrice: 1500, facilities: ["wifi", "ac", "parking"],
    whatsapp_number: "918285896680", is_featured: true, status: "approved", property_type: "library",
  },
  {
    id: "2", slug: "sunrise-pg-delhi", name: "Sunrise PG", city: "New Delhi", state: "Delhi",
    banner_url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
    profile_url: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&q=80",
    owner_id: "", ownerName: "Rahul Sharma", average_rating: 4.8, total_reviews: 245, total_seats: 0,
    total_rooms: 20, total_beds: 60, startingPrice: 5000, facilities: ["wifi", "ac", "parking"],
    whatsapp_number: "919876543210", is_featured: true, status: "approved", property_type: "pg",
  },
  {
    id: "3", slug: "study-nest-jaipur", name: "Study Nest", city: "Jaipur", state: "Rajasthan",
    banner_url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80",
    profile_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    owner_id: "", ownerName: "Priya Sharma", average_rating: 4.7, total_reviews: 189, total_seats: 80,
    total_rooms: 0, total_beds: 0, startingPrice: 1800, facilities: ["wifi", "ac"],
    whatsapp_number: "919876543211", is_featured: true, status: "approved", property_type: "library",
  },
  {
    id: "4", slug: "comfort-hostel-mumbai", name: "Comfort Hostel", city: "Mumbai", state: "Maharashtra",
    banner_url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
    profile_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    owner_id: "", ownerName: "Vikram Singh", average_rating: 4.9, total_reviews: 312, total_seats: 0,
    total_rooms: 30, total_beds: 90, startingPrice: 4500, facilities: ["wifi", "ac", "parking"],
    whatsapp_number: "919876543212", is_featured: true, status: "approved", property_type: "pg",
  },
];

const facilityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3.5 h-3.5" />,
  ac: <Snowflake className="w-3.5 h-3.5" />,
  parking: <Car className="w-3.5 h-3.5" />,
  power: <Shield className="w-3.5 h-3.5" />,
  silent: <Users className="w-3.5 h-3.5" />,
};

const getPropertyIcon = (type: string | null) => {
  switch(type) {
    case 'pg': return <Home className="w-3 h-3" />;
    case 'hotel': return <BedDouble className="w-3 h-3" />;
    default: return <BookOpen className="w-3 h-3" />;
  }
};

const getPropertyLabel = (type: string | null) => {
  switch(type) {
    case 'pg': return 'PG / Hostel';
    case 'hotel': return 'Hotel';
    default: return 'Library';
  }
};

const LibraryCard = ({ library, index }: { library: FeaturedProperty; index: number }) => {
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(library.id);
  const isAccommodation = library.property_type === 'pg' || library.property_type === 'hotel';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link to={`/library/${library.slug}`}>
        <motion.div whileHover={{ y: -8 }} className="group card-premium overflow-hidden">
          <div className="relative h-48 overflow-hidden">
            <img
              src={library.banner_url || "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80"}
              alt={library.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />

            {/* Property Type Badge */}
            <div className="absolute top-4 left-4">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                library.property_type === 'pg' ? 'bg-success/90 text-white' : 
                library.property_type === 'hotel' ? 'bg-info/90 text-white' : 
                'bg-primary/90 text-white'
              }`}>
                {getPropertyIcon(library.property_type)}
                {getPropertyLabel(library.property_type)}
              </span>
            </div>

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

            <div className="absolute -bottom-6 left-4">
              <div className="w-14 h-14 rounded-xl border-3 border-card overflow-hidden shadow-lg">
                <img src={library.profile_url || ""} alt={library.ownerName} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <span className="text-xs text-muted-foreground">From</span>
              <span className="text-lg font-bold text-primary ml-1">₹{library.startingPrice}</span>
              <span className="text-xs text-muted-foreground">/mo</span>
            </div>
          </div>

          <div className="p-4 pt-8">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-heading font-semibold text-lg group-hover:text-primary transition-colors">
                {library.name}
              </h3>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="font-semibold">{library.average_rating}</span>
                <span className="text-muted-foreground text-sm">({library.total_reviews})</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
              <MapPin className="w-4 h-4" />
              <span>{library.city}, {library.state}</span>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              by <span className="text-foreground font-medium">{library.ownerName}</span>
              {isAccommodation && (
                <span className="ml-2 text-xs">· {library.total_rooms} rooms · {library.total_beds} beds</span>
              )}
              {!isAccommodation && (
                <span className="ml-2 text-xs">· {library.total_seats} seats</span>
              )}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                {library.facilities?.slice(0, 3).map((facility) => (
                  <div key={facility} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    {facilityIcons[facility]}
                  </div>
                ))}
              </div>
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
        </div>
        <Skeleton className="h-5 w-12" />
      </div>
    </div>
  </div>
);

const FeaturedLibraries = () => {
  const [properties, setProperties] = useState<FeaturedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
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
        .limit(8);

      if (data && data.length > 0) {
        const formatted = data.map((lib: any) => ({
          ...lib,
          ownerName: lib.profiles?.full_name || "Property Owner",
          startingPrice: lib.shifts?.[0]?.monthly_price || lib.shifts?.[0]?.price_per_seat || 1500,
          facilities: Array.isArray(lib.facilities) ? lib.facilities : [],
        }));
        setProperties(formatted);
      } else {
        setProperties(fallbackProperties);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      setProperties(fallbackProperties);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProperties = activeTab === "all" 
    ? properties 
    : properties.filter(p => p.property_type === activeTab);

  const tabs = [
    { id: "all", label: "All" },
    { id: "library", label: "Libraries" },
    { id: "pg", label: "PG & Hostels" },
    { id: "hotel", label: "Hotels" },
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="section-container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="badge-primary mb-3 inline-block"
            >
              Featured Properties
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-heading text-3xl md:text-4xl font-bold"
            >
              Top-Rated Study & Stay Spaces
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
                View All Properties
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? [1, 2, 3, 4].map((i) => <LibraryCardSkeleton key={i} />)
            : filteredProperties.slice(0, 4).map((property, index) => (
                <LibraryCard key={property.id} library={property} index={index} />
              ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedLibraries;
