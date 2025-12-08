import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  MapPin, 
  Star,
  Wifi,
  Snowflake,
  Car,
  Building2,
  Clock,
  IndianRupee,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Library {
  id: string;
  name: string;
  city: string;
  state: string;
  slug: string;
}

interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  price_per_seat: number;
  library_id: string;
}

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [selectedShift, setSelectedShift] = useState("");
  
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [shifts, setShifts] = useState<{ name: string; id: string }[]>([]);
  const [suggestions, setSuggestions] = useState<Library[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLibraries();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchLibraries = async () => {
    const { data } = await supabase
      .from("libraries")
      .select("id, name, city, state, slug")
      .eq("status", "approved");
    
    if (data) {
      setLibraries(data);
      const uniqueCities = [...new Set(data.map(lib => lib.city))];
      setCities(uniqueCities);
    }

    // Fetch unique shifts
    const { data: shiftData } = await supabase
      .from("shifts")
      .select("name")
      .eq("is_active", true);
    
    if (shiftData) {
      const uniqueShifts = [...new Set(shiftData.map(s => s.name))].map((name, i) => ({
        name,
        id: name.toLowerCase()
      }));
      setShifts(uniqueShifts);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.length > 0) {
      const filtered = libraries.filter(lib =>
        lib.name.toLowerCase().includes(value.toLowerCase()) ||
        lib.city.toLowerCase().includes(value.toLowerCase()) ||
        lib.state.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (library: Library) => {
    navigate(`/library/${library.slug}`);
    setShowSuggestions(false);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCity) params.set("city", selectedCity);
    if (selectedFacilities.length > 0) params.set("facilities", selectedFacilities.join(","));
    if (priceRange[0] > 0 || priceRange[1] < 200) params.set("price", `${priceRange[0]}-${priceRange[1]}`);
    if (selectedShift) params.set("shift", selectedShift);
    navigate(`/search?${params.toString()}`);
  };

  const toggleFacility = (facility: string) => {
    setSelectedFacilities(prev =>
      prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility]
    );
  };

  const facilities = [
    { id: "wifi", label: "WiFi", icon: Wifi },
    { id: "ac", label: "AC", icon: Snowflake },
    { id: "parking", label: "Parking", icon: Car },
  ];

  const stats = [
    { value: "500+", label: "Libraries" },
    { value: "50K+", label: "Students" },
    { value: "100+", label: "Cities" },
    { value: "4.9", label: "Rating", icon: Star },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
        />
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative section-container pt-24 md:pt-32 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-primary">
              1000+ Students studying right now
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            Find Your Perfect
            <br />
            <span className="text-gradient">Study Space</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            Discover and book seats at premium study libraries across India. 
            AC rooms, high-speed WiFi, and peaceful environment guaranteed.
          </motion.p>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-card rounded-2xl shadow-premium p-4 md:p-6 max-w-4xl mx-auto mb-8"
          >
            {/* Main Search Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
              {/* City Select */}
              <div className="md:col-span-3 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:bg-background outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Library Name Search with Autocomplete */}
              <div className="md:col-span-5 relative" ref={searchRef}>
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <input
                  type="text"
                  placeholder="Search library name..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchQuery && setShowSuggestions(true)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:bg-background outline-none transition-all"
                />
                
                {/* Autocomplete Suggestions */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-xl border border-border z-50 overflow-hidden"
                    >
                      {suggestions.map(lib => (
                        <button
                          key={lib.id}
                          onClick={() => handleSuggestionClick(lib)}
                          className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                        >
                          <Building2 className="w-4 h-4 text-primary" />
                          <div>
                            <p className="font-medium">{lib.name}</p>
                            <p className="text-sm text-muted-foreground">{lib.city}, {lib.state}</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Shift Select */}
              <div className="md:col-span-2 relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:bg-background outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Shifts</option>
                  {shifts.map(shift => (
                    <option key={shift.id} value={shift.name}>{shift.name}</option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <Button 
                onClick={handleSearch}
                className="md:col-span-2 btn-primary h-auto py-4 text-base"
              >
                <Search className="w-5 h-5" />
                Search
              </Button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-primary hover:underline flex items-center gap-2 mx-auto"
            >
              {showFilters ? "Hide Filters" : "More Filters"}
              <motion.span animate={{ rotate: showFilters ? 180 : 0 }}>▼</motion.span>
            </button>

            {/* Expanded Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Facilities */}
                    <div>
                      <label className="text-sm font-medium mb-3 block">Facilities</label>
                      <div className="flex flex-wrap gap-2">
                        {facilities.map(facility => (
                          <button
                            key={facility.id}
                            onClick={() => toggleFacility(facility.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                              selectedFacilities.includes(facility.id)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                          >
                            <facility.icon className="w-4 h-4" />
                            {facility.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="text-sm font-medium mb-3 block">
                        Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}/hr
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                          className="flex-1"
                        />
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Selected Filters */}
                  {(selectedFacilities.length > 0 || selectedCity || selectedShift) && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                      {selectedCity && (
                        <span className="badge-primary flex items-center gap-1">
                          {selectedCity}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCity("")} />
                        </span>
                      )}
                      {selectedShift && (
                        <span className="badge-primary flex items-center gap-1">
                          {selectedShift}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedShift("")} />
                        </span>
                      )}
                      {selectedFacilities.map(f => (
                        <span key={f} className="badge-primary flex items-center gap-1">
                          {f}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => toggleFacility(f)} />
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Quick Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            {facilities.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border"
              >
                <feature.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{feature.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="font-heading text-3xl md:text-4xl font-bold text-foreground">
                    {stat.value}
                  </span>
                  {stat.icon && <stat.icon className="w-5 h-5 text-warning fill-warning" />}
                </div>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ height: [8, 16, 8] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 bg-muted-foreground/50 rounded-full"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;