import { useState, useMemo } from "react";
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
  Filter,
  X,
  ChevronDown,
  SlidersHorizontal,
  Grid,
  List,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Mock library data
const mockLibraries = [
  {
    id: "1",
    slug: "knowledge-hub-delhi",
    name: "Knowledge Hub",
    city: "New Delhi",
    state: "Delhi",
    address: "123 Study Lane, Connaught Place",
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80",
    profileImage: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&q=80",
    ownerName: "Rahul Sharma",
    rating: 4.9,
    reviews: 245,
    totalSeats: 120,
    startingPrice: 50,
    facilities: ["wifi", "ac", "parking", "silent_zone", "power_backup"],
    shifts: ["morning", "afternoon", "evening", "night"],
    isOpen: true,
  },
  {
    id: "2",
    slug: "study-nest-mumbai",
    name: "Study Nest",
    city: "Mumbai",
    state: "Maharashtra",
    address: "45 Book Street, Andheri West",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    ownerName: "Priya Patel",
    rating: 4.8,
    reviews: 189,
    totalSeats: 80,
    startingPrice: 60,
    facilities: ["wifi", "ac", "power_backup"],
    shifts: ["morning", "afternoon", "evening"],
    isOpen: true,
  },
  {
    id: "3",
    slug: "focus-zone-bangalore",
    name: "Focus Zone",
    city: "Bangalore",
    state: "Karnataka",
    address: "78 Learning Road, Koramangala",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    ownerName: "Arun Kumar",
    rating: 4.7,
    reviews: 156,
    totalSeats: 100,
    startingPrice: 55,
    facilities: ["wifi", "ac", "parking", "silent_zone"],
    shifts: ["morning", "afternoon", "evening", "night"],
    isOpen: false,
  },
  {
    id: "4",
    slug: "scholar-space-pune",
    name: "Scholar Space",
    city: "Pune",
    state: "Maharashtra",
    address: "34 Education Park, Hinjewadi",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    ownerName: "Vikram Singh",
    rating: 4.9,
    reviews: 312,
    totalSeats: 150,
    startingPrice: 45,
    facilities: ["wifi", "ac", "parking", "power_backup"],
    shifts: ["morning", "afternoon", "evening"],
    isOpen: true,
  },
  {
    id: "5",
    slug: "quiet-corner-hyderabad",
    name: "Quiet Corner",
    city: "Hyderabad",
    state: "Telangana",
    address: "12 Silent Street, Madhapur",
    image: "https://images.unsplash.com/photo-1568667256549-094345857637?w=800&q=80",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    ownerName: "Sanjay Reddy",
    rating: 4.6,
    reviews: 98,
    totalSeats: 60,
    startingPrice: 40,
    facilities: ["wifi", "ac", "silent_zone"],
    shifts: ["morning", "afternoon"],
    isOpen: true,
  },
  {
    id: "6",
    slug: "brain-boost-chennai",
    name: "Brain Boost Library",
    city: "Chennai",
    state: "Tamil Nadu",
    address: "56 Knowledge Avenue, T Nagar",
    image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    ownerName: "Karthik Iyer",
    rating: 4.8,
    reviews: 167,
    totalSeats: 90,
    startingPrice: 35,
    facilities: ["wifi", "ac", "parking", "power_backup", "silent_zone"],
    shifts: ["morning", "afternoon", "evening", "night"],
    isOpen: true,
  },
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
];

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("location") || "");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("rating");
  const [ratingFilter, setRatingFilter] = useState(0);

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
    let result = [...mockLibraries];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (lib) =>
          lib.name.toLowerCase().includes(query) ||
          lib.city.toLowerCase().includes(query) ||
          lib.state.toLowerCase().includes(query)
      );
    }

    // Price filter
    result = result.filter(
      (lib) => lib.startingPrice >= priceRange[0] && lib.startingPrice <= priceRange[1]
    );

    // Facilities filter
    if (selectedFacilities.length > 0) {
      result = result.filter((lib) =>
        selectedFacilities.every((f) => lib.facilities.includes(f))
      );
    }

    // Shifts filter
    if (selectedShifts.length > 0) {
      result = result.filter((lib) =>
        selectedShifts.some((s) => lib.shifts.includes(s))
      );
    }

    // Rating filter
    if (ratingFilter > 0) {
      result = result.filter((lib) => lib.rating >= ratingFilter);
    }

    // Sorting
    switch (sortBy) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "price_low":
        result.sort((a, b) => a.startingPrice - b.startingPrice);
        break;
      case "price_high":
        result.sort((a, b) => b.startingPrice - a.startingPrice);
        break;
      case "reviews":
        result.sort((a, b) => b.reviews - a.reviews);
        break;
    }

    return result;
  }, [searchQuery, priceRange, selectedFacilities, selectedShifts, sortBy, ratingFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setPriceRange([0, 100]);
    setSelectedFacilities([]);
    setSelectedShifts([]);
    setRatingFilter(0);
    setSortBy("rating");
  };

  const hasActiveFilters =
    searchQuery ||
    priceRange[0] > 0 ||
    priceRange[1] < 100 ||
    selectedFacilities.length > 0 ||
    selectedShifts.length > 0 ||
    ratingFilter > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 md:pt-24">
        {/* Search Header */}
        <div className="bg-gradient-hero border-b border-border">
          <div className="section-container py-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by city, state, or library name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

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

        <div className="section-container py-8">
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <AnimatePresence>
              {(showFilters || window.innerWidth >= 768) && (
                <motion.aside
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`${
                    showFilters
                      ? "fixed inset-0 z-50 bg-background p-6 overflow-auto md:relative md:inset-auto md:z-auto md:p-0"
                      : "hidden md:block"
                  } w-full md:w-72 flex-shrink-0`}
                >
                  {/* Mobile Filter Header */}
                  <div className="flex items-center justify-between mb-6 md:hidden">
                    <h3 className="font-heading text-lg font-semibold">Filters</h3>
                    <button onClick={() => setShowFilters(false)}>
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Price Range */}
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <h4 className="font-semibold mb-4">Price Range</h4>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        min={0}
                        max={100}
                        step={5}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>₹{priceRange[0]}/hr</span>
                        <span>₹{priceRange[1]}/hr</span>
                      </div>
                    </div>

                    {/* Facilities */}
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <h4 className="font-semibold mb-4">Facilities</h4>
                      <div className="space-y-3">
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
                      <h4 className="font-semibold mb-4">Shift Timings</h4>
                      <div className="space-y-3">
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
                      <h4 className="font-semibold mb-4">Minimum Rating</h4>
                      <div className="flex gap-2">
                        {[0, 3, 4, 4.5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setRatingFilter(rating)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
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
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  <span className="text-foreground font-semibold">{filteredLibraries.length}</span>{" "}
                  libraries found
                </p>

                <div className="flex items-center gap-3">
                  {/* Sort */}
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

                  {/* View Toggle */}
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
              {filteredLibraries.length > 0 ? (
                <div
                  className={`grid gap-6 ${
                    viewMode === "grid"
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                      : "grid-cols-1"
                  }`}
                >
                  {filteredLibraries.map((library, index) => (
                    <motion.div
                      key={library.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link to={`/library/${library.slug}`}>
                        <motion.div
                          whileHover={{ y: -5 }}
                          className={`group card-premium overflow-hidden ${
                            viewMode === "list" ? "flex" : ""
                          }`}
                        >
                          {/* Image */}
                          <div
                            className={`relative overflow-hidden ${
                              viewMode === "list" ? "w-48 h-full" : "h-48"
                            }`}
                          >
                            <img
                              src={library.image}
                              alt={library.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />

                            {/* Status Badge */}
                            <div className="absolute top-3 left-3">
                              <span
                                className={`badge-${library.isOpen ? "success" : "warning"}`}
                              >
                                {library.isOpen ? "Open" : "Closed"}
                              </span>
                            </div>

                            {/* Wishlist */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => e.preventDefault()}
                              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center"
                            >
                              <Heart className="w-4 h-4" />
                            </motion.button>

                            {/* Price */}
                            <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                              <span className="font-bold text-primary">
                                ₹{library.startingPrice}
                              </span>
                              <span className="text-xs text-muted-foreground">/hr</span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-heading font-semibold text-lg group-hover:text-primary transition-colors">
                                {library.name}
                              </h3>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-warning fill-warning" />
                                <span className="font-semibold">{library.rating}</span>
                                <span className="text-muted-foreground text-sm">
                                  ({library.reviews})
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {library.city}, {library.state}
                              </span>
                            </div>

                            <p className="text-sm text-muted-foreground mb-3">
                              by{" "}
                              <span className="text-foreground font-medium">
                                {library.ownerName}
                              </span>
                            </p>

                            <div className="flex items-center justify-between pt-3 border-t border-border">
                              <div className="flex items-center gap-1.5">
                                {library.facilities.slice(0, 4).map((f) => {
                                  const FacilityIcon =
                                    facilityOptions.find((fo) => fo.id === f)?.icon || Users;
                                  return (
                                    <div
                                      key={f}
                                      className="w-6 h-6 rounded bg-muted flex items-center justify-center"
                                    >
                                      <FacilityIcon className="w-3 h-3 text-muted-foreground" />
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span>{library.totalSeats} seats</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold mb-2">No libraries found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search query
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;
