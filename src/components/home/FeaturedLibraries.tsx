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
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock data for featured libraries
const featuredLibraries = [
  {
    id: "1",
    slug: "knowledge-hub-delhi",
    name: "Knowledge Hub",
    city: "New Delhi",
    state: "Delhi",
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80",
    profileImage: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&q=80",
    ownerName: "Rahul Sharma",
    rating: 4.9,
    reviews: 245,
    totalSeats: 120,
    startingPrice: 50,
    facilities: ["wifi", "ac", "parking"],
    isOpen: true,
  },
  {
    id: "2",
    slug: "study-nest-mumbai",
    name: "Study Nest",
    city: "Mumbai",
    state: "Maharashtra",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    ownerName: "Priya Patel",
    rating: 4.8,
    reviews: 189,
    totalSeats: 80,
    startingPrice: 60,
    facilities: ["wifi", "ac"],
    isOpen: true,
  },
  {
    id: "3",
    slug: "focus-zone-bangalore",
    name: "Focus Zone",
    city: "Bangalore",
    state: "Karnataka",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    ownerName: "Arun Kumar",
    rating: 4.7,
    reviews: 156,
    totalSeats: 100,
    startingPrice: 55,
    facilities: ["wifi", "ac", "parking"],
    isOpen: false,
  },
  {
    id: "4",
    slug: "scholar-space-pune",
    name: "Scholar Space",
    city: "Pune",
    state: "Maharashtra",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    ownerName: "Vikram Singh",
    rating: 4.9,
    reviews: 312,
    totalSeats: 150,
    startingPrice: 45,
    facilities: ["wifi", "ac", "parking"],
    isOpen: true,
  },
];

const facilityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3.5 h-3.5" />,
  ac: <Snowflake className="w-3.5 h-3.5" />,
  parking: <Users className="w-3.5 h-3.5" />,
};

const LibraryCard = ({ library, index }: { library: typeof featuredLibraries[0]; index: number }) => {
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
              src={library.image}
              alt={library.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
            
            {/* Status Badge */}
            <div className="absolute top-4 left-4">
              <span className={`badge-${library.isOpen ? 'success' : 'warning'}`}>
                {library.isOpen ? "Open Now" : "Closed"}
              </span>
            </div>

            {/* Wishlist Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-lg"
            >
              <Heart className="w-4 h-4 text-muted-foreground" />
            </motion.button>

            {/* Profile Image */}
            <div className="absolute -bottom-6 left-4">
              <div className="w-14 h-14 rounded-xl border-3 border-card overflow-hidden shadow-lg">
                <img
                  src={library.profileImage}
                  alt={library.ownerName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Price Badge */}
            <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <span className="text-xs text-muted-foreground">From</span>
              <span className="text-lg font-bold text-primary ml-1">₹{library.startingPrice}</span>
              <span className="text-xs text-muted-foreground">/hr</span>
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
                <span className="font-semibold">{library.rating}</span>
                <span className="text-muted-foreground text-sm">({library.reviews})</span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
              <MapPin className="w-4 h-4" />
              <span>{library.city}, {library.state}</span>
            </div>

            {/* Owner */}
            <p className="text-sm text-muted-foreground mb-3">
              by <span className="text-foreground font-medium">{library.ownerName}</span>
            </p>

            {/* Bottom Row */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              {/* Facilities */}
              <div className="flex items-center gap-2">
                {library.facilities.map((facility) => (
                  <div
                    key={facility}
                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"
                  >
                    {facilityIcons[facility]}
                  </div>
                ))}
              </div>

              {/* Seats Info */}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{library.totalSeats} seats</span>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

const FeaturedLibraries = () => {
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
          {featuredLibraries.map((library, index) => (
            <LibraryCard key={library.id} library={library} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedLibraries;
