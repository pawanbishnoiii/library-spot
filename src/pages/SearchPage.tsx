import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  Users,
  Wifi,
  Snowflake,
  Car,
  X,
  SlidersHorizontal,
  Grid,
  List,
  Heart,
  Clock,
  IndianRupee,
  BookOpen,
  Home,
  BedDouble,
  Building2,
  Bed,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/useWishlist";

interface Library {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  address: string;
  banner_url: string | null;
  profile_url: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  total_seats: number | null;
  total_rooms: number | null;
  total_beds: number | null;
  facilities: any;
  whatsapp_number: string | null;
  owner_id: string;
  property_type: string | null;
  gender_preference: string | null;
  minPrice?: number;
  monthlyPrice?: number;
}

interface Profile {
  id: string;
  full_name: string;
}

const propertyTypes = [
  { id: "all", label: "All", icon: Search },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "pg", label: "PG / Hostel", icon: Home },
  { id: "hotel", label: "Hotel / Room", icon: BedDouble },
];

const facilityOptions = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "ac", label: "AC", icon: Snowflake },
  { id: "parking", label: "Parking", icon: Car },
  { id: "silent_zone", label: "Silent Zone", icon: Users },
  { id: "power_backup", label: "Power Backup", icon: Users },
];

const shiftOptions = [
  { id: "morning", label: "Morning (6AM - 12PM)" },
  { id: "afternoon", label: "Afternoon (12PM - 6PM)" },
  { id: "evening", label: "Evening (6PM - 10PM)" },
  { id: "night", label: "Night (10PM - 6AM)" },
];

const sortOptions = [
  { id: "rating", label: "Highest Rated" },
  { id: "price_low", label: "Price: Low to High" },
  { id: "price_high", label: "Price: High to Low" },
  { id: "reviews", label: "Most Reviews" },
  { id: "recent", label: "Recently Added" },
];

const genderOptions = [
  { id: "all", label: "All" },
  { id: "co-ed", label: "Co-Ed" },
  { id: "boys", label: "Boys Only" },
  { id: "girls", label: "Girls Only" },
];

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
  const [selectedState, setSelectedState] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedPropertyType, setSelectedPropertyType] = useState(searchParams.get("type") || "all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(
    searchParams.get("facilities")?.split(",").filter(Boolean) || []
  );
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("rating");
  const [ratingFilter, setRatingFilter] = useState(0);

  useEffect(() => {
    fetchLibraries();
  }, []);

  const fetchLibraries = async () => {
    setIsLoading(true);
    try {
      const { data: librariesData, error } = await supabase
        .from("libraries")
        .select("*")
        .eq("status", "approved");

      if (error) throw error;

      if (librariesData) {
        const libraryIds = librariesData.map(lib => lib.id);
        
        // Fetch shifts for pricing
        const { data: shiftsData } = await supabase
          .from("shifts")
          .select("library_id, price_per_seat, monthly_price")
          .in("library_id", libraryIds)
          .eq("is_active", true);

        // Fetch rooms for PG/hostel pricing
        const { data: roomsData } = await supabase
          .from("rooms")
          .select("library_id, price_per_bed, monthly_price")
          .in("library_id", libraryIds)
          .eq("is_available", true);

        const minPrices: Record<string, number> = {};
        const monthlyPrices: Record<string, number> = {};
        
        shiftsData?.forEach(shift => {
          const price = shift.price_per_seat;
          const monthly = shift.monthly_price || 0;
          if (!minPrices[shift.library_id] || price < minPrices[shift.library_id]) {
            minPrices[shift.library_id] = price;
          }
          if (!monthlyPrices[shift.library_id] || (monthly > 0 && monthly < monthlyPrices[shift.library_id])) {
            monthlyPrices[shift.library_id] = monthly;
          }
        });

        roomsData?.forEach(room => {
          const monthly = room.monthly_price || room.price_per_bed;
          if (!monthlyPrices[room.library_id] || monthly < monthlyPrices[room.library_id]) {
            monthlyPrices[room.library_id] = monthly;
          }
        });

        const librariesWithPrices = librariesData.map(lib => ({
          ...lib,
          minPrice: minPrices[lib.id] || 0,
          monthlyPrice: monthlyPrices[lib.id] || 0,
        }));

        setLibraries(librariesWithPrices);
        
        const uniqueCities = [...new Set(librariesData.map(lib => lib.city))].sort();
        const uniqueStates = [...new Set(librariesData.map(lib => lib.state))].sort();
        setCities(uniqueCities);
        setStates(uniqueStates);

        const ownerIds = [...new Set(librariesData.map(lib => lib.owner_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ownerIds);

        if (profilesData) {
          const profilesMap: Record<string, Profile> = {};
          profilesData.forEach(p => {
            profilesMap[p.id] = p;
          });
          setProfiles(profilesMap);
        }
      }
    } catch (error) {
      console.error("Error fetching libraries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFacility = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  const toggleShift = (shift: string) => {
    setSelectedShifts((prev) =>
      prev.includes(shift) ? prev.filter((s) => s !== shift) : [...prev, shift]
    );
  };

  const filteredLibraries = useMemo(() => {
    let result = [...libraries];

    // Property type filter
    if (selectedPropertyType !== "all") {
      result = result.filter(lib => lib.property_type === selectedPropertyType);
    }

    // Gender filter
    if (selectedGender !== "all") {
      result = result.filter(lib => lib.gender_preference === selectedGender);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (lib) =>
          lib.name.toLowerCase().includes(query) ||
          lib.city.toLowerCase().includes(query) ||
          lib.state.toLowerCase().includes(query) ||
          lib.address.toLowerCase().includes(query)
      );
    }

    if (selectedCity) {
      result = result.filter(lib => lib.city === selectedCity);
    }

    if (selectedState) {
      result = result.filter(lib => lib.state === selectedState);
    }

    // Price filter (monthly)
    result = result.filter(
      (lib) => (lib.monthlyPrice || lib.minPrice || 0) >= priceRange[0] && (lib.monthlyPrice || lib.minPrice || 0) <= priceRange[1]
    );

    // Facilities filter
    if (selectedFacilities.length > 0) {
      result = result.filter((lib) => {
        const libFacilities = Array.isArray(lib.facilities) ? lib.facilities : [];
        return selectedFacilities.every((f) => libFacilities.includes(f));
      });
    }

    // Rating filter
    if (ratingFilter > 0) {
      result = result.filter((lib) => (lib.average_rating || 0) >= ratingFilter);
    }

    // Sorting
    switch (sortBy) {
      case "rating":
        result.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case "price_low":
        result.sort((a, b) => (a.monthlyPrice || a.minPrice || 0) - (b.monthlyPrice || b.minPrice || 0));
        break;
      case "price_high":
        result.sort((a, b) => (b.monthlyPrice || b.minPrice || 0) - (a.monthlyPrice || a.minPrice || 0));
        break;
      case "reviews":
        result.sort((a, b) => (b.total_reviews || 0) - (a.total_reviews || 0));
        break;
      case "recent":
        result.sort((a, b) => b.id.localeCompare(a.id));
        break;
    }

    return result;
  }, [libraries, searchQuery, selectedCity, selectedState, priceRange, selectedFacilities, sortBy, ratingFilter, selectedPropertyType, selectedGender]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCity("");
    setSelectedState("");
    setPriceRange([0, 10000]);
    setSelectedFacilities([]);
    setSelectedShifts([]);
    setRatingFilter(0);
    setSortBy("rating");
    setSelectedPropertyType("all");
    setSelectedGender("all");
  };

  const hasActiveFilters =
    searchQuery || selectedCity || selectedState ||
    priceRange[0] > 0 || priceRange[1] < 10000 ||
    selectedFacilities.length > 0 || selectedShifts.length > 0 ||
    ratingFilter > 0 || selectedPropertyType !== "all" || selectedGender !== "all";

  const getPropertyBadge = (type: string | null) => {
    switch(type) {
      case 'library': return { label: 'Library', className: 'bg-primary/10 text-primary' };
      case 'pg': return { label: 'PG / Hostel', className: 'bg-success/10 text-success' };
      case 'hotel': return { label: 'Hotel', className: 'bg-info/10 text-info' };
      default: return { label: 'Library', className: 'bg-primary/10 text-primary' };
    }
  };

  const LibraryCard = ({ library }: { library: Library }) => {
    const owner = profiles[library.owner_id];
    const { toggleWishlist, isWishlisted } = useWishlist();
    const wishlisted = isWishlisted(library.id);
    const badge = getPropertyBadge(library.property_type);
    const isAccommodation = library.property_type === 'pg' || library.property_type === 'hotel';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        className={`bg-card rounded-2xl border border-border overflow-hidden group ${
          viewMode === "list" ? "flex" : ""
        }`}
      >
        {/* Image */}
        <div className={`relative ${viewMode === "list" ? "w-72 flex-shrink-0" : "aspect-[4/3]"}`}>
          <img
            src={library.banner_url || "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80"}
            alt={library.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          
          {/* Property Type Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          </div>

          {/* Profile Image */}
          <div className="absolute -bottom-6 left-4">
            <img
              src={library.profile_url || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&q=80"}
              alt={owner?.full_name || "Owner"}
              className="w-14 h-14 rounded-full border-3 border-card object-cover shadow-lg"
            />
          </div>

          {/* Heart */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(library.id, e);
            }}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
              wishlisted ? "bg-destructive/90 text-white" : "bg-card/80 opacity-0 group-hover:opacity-100"
            }`}
          >
            <Heart className={`w-4 h-4 ${wishlisted ? "fill-current" : ""}`} />
          </motion.button>

          {/* Price Badge */}
          <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <span className="text-xs text-muted-foreground">From</span>
            <span className="text-lg font-bold text-primary ml-1">
              ₹{library.monthlyPrice || library.minPrice || 0}
            </span>
            <span className="text-xs text-muted-foreground">/mo</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pt-8 flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <Link to={`/library/${library.slug}`}>
                <h3 className="font-heading font-semibold text-lg group-hover:text-primary transition-colors">
                  {library.name}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground">{owner?.full_name || "Property Owner"}</p>
            </div>
            <div className="flex items-center gap-1 bg-warning/10 text-warning px-2 py-1 rounded-lg">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-semibold text-sm">{library.average_rating?.toFixed(1) || "New"}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <MapPin className="w-4 h-4" />
            <span>{library.city}, {library.state}</span>
          </div>

          {/* Gender & Capacity Info */}
          <div className="flex flex-wrap gap-2 mb-3">
            {library.gender_preference && library.gender_preference !== 'co-ed' && (
              <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium capitalize">
                {library.gender_preference}
              </span>
            )}
            {isAccommodation ? (
              <>
                {(library.total_rooms || 0) > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="w-3 h-3" /> {library.total_rooms} rooms
                  </span>
                )}
                {(library.total_beds || 0) > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Bed className="w-3 h-3" /> {library.total_beds} beds
                  </span>
                )}
              </>
            ) : (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" /> {library.total_seats || 0} seats
              </span>
            )}
          </div>

          {/* Facilities */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {Array.isArray(library.facilities) && library.facilities.slice(0, 4).map((facility: string) => (
              <span key={facility} className="px-2 py-0.5 rounded-full bg-muted text-xs capitalize">
                {facility.replace('_', ' ')}
              </span>
            ))}
            {Array.isArray(library.facilities) && library.facilities.length > 4 && (
              <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                +{library.facilities.length - 4}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-1">
              <IndianRupee className="w-4 h-4 text-primary" />
              <span className="font-semibold text-primary">{library.minPrice || 0}</span>
              <span className="text-xs text-muted-foreground">/day</span>
            </div>
            
            <div className="flex items-center gap-2">
              {library.whatsapp_number && (
                <a
                  href={`https://wa.me/${library.whatsapp_number.replace(/\s/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-9 h-9 rounded-full bg-success/10 text-success flex items-center justify-center hover:bg-success hover:text-white transition-colors"
                >
                  <FaWhatsapp className="w-4 h-4" />
                </a>
              )}
              <Link
                to={`/library/${library.slug}`}
                className="btn-primary px-4 py-2 text-sm"
              >
                View
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const SkeletonCard = () => (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <Skeleton className="aspect-[4/3]" />
      <div className="p-4 pt-8 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex justify-between pt-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />

      <main className="pt-20 md:pt-24">
        {/* Search Header */}
        <div className="bg-gradient-hero border-b border-border">
          <div className="section-container py-6">
            {/* Property Type Tabs */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
              {propertyTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedPropertyType(type.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    selectedPropertyType === type.id
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "bg-card border border-border hover:border-primary text-muted-foreground"
                  }`}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, city, or state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              {/* City Filter */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-3.5 rounded-xl bg-card border border-border focus:border-primary outline-none"
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              {/* Filter Toggle (Mobile) */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    !
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="section-container py-6">
          <div className="flex gap-6">
            {/* Filters Sidebar */}
            <AnimatePresence>
              {(showFilters || typeof window !== 'undefined' && window.innerWidth >= 768) && (
                <motion.aside
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`${
                    showFilters
                      ? "fixed inset-0 z-50 bg-background p-6 overflow-auto md:relative md:inset-auto md:z-auto md:p-0"
                      : "hidden md:block"
                  } w-full md:w-64 flex-shrink-0`}
                >
                  {/* Mobile Filter Header */}
                  <div className="flex items-center justify-between mb-6 md:hidden">
                    <h3 className="font-heading text-lg font-semibold">Filters</h3>
                    <button onClick={() => setShowFilters(false)}>
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* State Filter */}
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <h4 className="font-semibold mb-3 text-sm">State</h4>
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                      >
                        <option value="">All States</option>
                        {states.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>

                    {/* Gender Filter */}
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <h4 className="font-semibold mb-3 text-sm">Gender Preference</h4>
                      <div className="flex flex-wrap gap-2">
                        {genderOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setSelectedGender(option.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              selectedGender === option.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <h4 className="font-semibold mb-3 text-sm">Monthly Price</h4>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        min={0}
                        max={10000}
                        step={500}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>₹{priceRange[0]}</span>
                        <span>₹{priceRange[1]}</span>
                      </div>
                    </div>

                    {/* Facilities */}
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <h4 className="font-semibold mb-3 text-sm">Facilities</h4>
                      <div className="space-y-2.5">
                        {facilityOptions.map((facility) => (
                          <label
                            key={facility.id}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedFacilities.includes(facility.id)}
                              onCheckedChange={() => toggleFacility(facility.id)}
                            />
                            <facility.icon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{facility.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Shifts */}
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <h4 className="font-semibold mb-3 text-sm">Shift Timings</h4>
                      <div className="space-y-2.5">
                        {shiftOptions.map((shift) => (
                          <label
                            key={shift.id}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedShifts.includes(shift.id)}
                              onCheckedChange={() => toggleShift(shift.id)}
                            />
                            <span className="text-sm">{shift.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <h4 className="font-semibold mb-3 text-sm">Minimum Rating</h4>
                      <div className="flex flex-wrap gap-2">
                        {[0, 3, 4, 4.5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setRatingFilter(rating)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                              ratingFilter === rating
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                          >
                            {rating > 0 ? (
                              <>
                                <Star className="w-3 h-3 fill-current" />
                                {rating}+
                              </>
                            ) : (
                              "All"
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="w-full"
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </div>

                  {/* Mobile Apply Button */}
                  <div className="md:hidden mt-6">
                    <Button
                      className="w-full btn-primary"
                      onClick={() => setShowFilters(false)}
                    >
                      Show {filteredLibraries.length} Results
                    </Button>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Results */}
            <div className="flex-1 min-w-0">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground text-sm">
                  <span className="text-foreground font-semibold">{filteredLibraries.length}</span>{" "}
                  {selectedPropertyType === 'all' ? 'properties' : selectedPropertyType === 'library' ? 'libraries' : 'accommodations'} found
                </p>

                <div className="flex items-center gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-card border border-border text-sm focus:border-primary outline-none"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <div className="hidden md:flex items-center border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 ${
                        viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card"
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 ${
                        viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : filteredLibraries.length > 0 ? (
                <div
                  className={`grid gap-6 ${
                    viewMode === "grid"
                      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                      : "grid-cols-1"
                  }`}
                >
                  {filteredLibraries.map((library) => (
                    <LibraryCard key={library.id} library={library} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold mb-2">No properties found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your filters or search query
                  </p>
                  <Button onClick={clearFilters}>Clear All Filters</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default SearchPage;
