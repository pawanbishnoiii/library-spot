import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Star,
  Clock,
  Users,
  Phone,
  Wifi,
  Snowflake,
  Car,
  Shield,
  ChevronRight,
  Calendar,
  Share2,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronDown,
  Check,
  Copy,
  Zap,
  Volume2,
} from "lucide-react";
import { FaWhatsapp, FaTelegram, FaFacebook, FaTwitter } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
// SEO meta tags handled inline

// Mock data for fallback
const mockLibrary = {
  id: "1",
  slug: "pandit-ji-library",
  name: "Pandit Ji Library",
  description: "Premium study space in Risinghnagar with AC, WiFi, and peaceful environment. Perfect for competitive exam preparation. Monthly membership available with daily price ₹50/day.",
  city: "Risinghnagar",
  state: "Rajasthan",
  address: "Main Market, Risinghnagar, Rajasthan - 335001",
  banner_url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=80",
  profile_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  ownerName: "Pawan Kumar",
  contact_phone: "8285896680",
  whatsapp_number: "918285896680",
  average_rating: 4.9,
  total_reviews: 156,
  total_seats: 42,
  total_rows: 6,
  seats_per_row: 7,
  opening_hours: { open: "06:00", close: "23:00" },
  map_lat: 27.8507,
  map_lng: 74.6211,
  upi_id: "pawankumar@upi",
  facilities: ["wifi", "ac", "parking", "power", "silent", "cctv"],
  staff: ["Ramesh Kumar", "Suresh Singh"],
  shifts: [
    { id: "1", name: "Morning", start_time: "06:00", end_time: "12:00", price_per_seat: 50, monthly_price: 1500, discount_percent: 10, seats_available: 20 },
    { id: "2", name: "Afternoon", start_time: "12:00", end_time: "18:00", price_per_seat: 50, monthly_price: 1500, discount_percent: 0, seats_available: 15 },
    { id: "3", name: "Evening", start_time: "18:00", end_time: "22:00", price_per_seat: 55, monthly_price: 1650, discount_percent: 5, seats_available: 12 },
    { id: "4", name: "Night", start_time: "22:00", end_time: "06:00", price_per_seat: 45, monthly_price: 1350, discount_percent: 15, seats_available: 30 },
  ],
  status: "approved",
};

const mockReviews = [
  {
    id: "1",
    user_name: "Anjali Verma",
    user_image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    rating: 5,
    comment: "Best library in Risinghnagar! The environment is very peaceful and AC works perfectly. Highly recommended for serious students.",
    created_at: "2024-01-15",
  },
  {
    id: "2",
    user_name: "Prateek Singh",
    user_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    rating: 4,
    comment: "Good library with all facilities. The morning shift is the best. Monthly membership is worth it.",
    created_at: "2024-01-10",
  },
  {
    id: "3",
    user_name: "Meera Patel",
    user_image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    rating: 5,
    comment: "Pawan sir is very helpful. I cleared my UPSC prelims studying here. The staff maintains complete silence.",
    created_at: "2024-01-05",
  },
];

const facilityData: Record<string, { name: string; icon: React.ReactNode }> = {
  wifi: { name: "High-Speed WiFi", icon: <Wifi className="w-5 h-5" /> },
  ac: { name: "AC Rooms", icon: <Snowflake className="w-5 h-5" /> },
  parking: { name: "Free Parking", icon: <Car className="w-5 h-5" /> },
  power: { name: "Power Backup", icon: <Zap className="w-5 h-5" /> },
  silent: { name: "Silent Zone", icon: <Volume2 className="w-5 h-5" /> },
  cctv: { name: "CCTV Security", icon: <Shield className="w-5 h-5" /> },
};

// Generate seat layout
const generateSeats = (rows: number, seatsPerRow: number, bookedSeats: string[] = []) => {
  const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const seats: { id: string; row: string; number: number; status: "available" | "booked" | "selected" | "prebooked" | "disabled" }[] = [];

  for (let r = 0; r < rows; r++) {
    for (let s = 1; s <= seatsPerRow; s++) {
      const seatId = `${rowLabels[r]}${s}`;
      let status: "available" | "booked" | "prebooked" | "disabled" = "available";
      
      if (bookedSeats.includes(seatId)) {
        status = "booked";
      } else {
        const random = Math.random();
        if (random < 0.15) status = "booked";
        else if (random < 0.22) status = "prebooked";
        else if (random < 0.27) status = "disabled";
      }

      seats.push({ id: seatId, row: rowLabels[r], number: s, status });
    }
  }
  return seats;
};

const LibraryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [library, setLibrary] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [seats, setSeats] = useState<any[]>([]);
  const [bookingType, setBookingType] = useState<"daily" | "monthly">("monthly");

  useEffect(() => {
    fetchLibraryData();
  }, [slug]);

  const fetchLibraryData = async () => {
    setIsLoading(true);
    try {
      // Fetch library by slug
      const { data: libraryData } = await supabase
        .from("libraries")
        .select(`*, staff (name, role)`)
        .eq("slug", slug)
        .maybeSingle();

      if (libraryData) {
        // Fetch owner profile separately
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", libraryData.owner_id)
          .maybeSingle();

        setLibrary({
          ...libraryData,
          ownerName: ownerProfile?.full_name || "Library Owner",
          staff: libraryData.staff?.map((s: any) => s.name) || [],
        });

        // Fetch shifts
        const { data: shiftsData } = await supabase
          .from("shifts")
          .select("*")
          .eq("library_id", libraryData.id)
          .eq("is_active", true);

        if (shiftsData && shiftsData.length > 0) {
          setShifts(shiftsData);
          setSelectedShift(shiftsData[0]);
        } else {
          setShifts(mockLibrary.shifts);
          setSelectedShift(mockLibrary.shifts[0]);
        }

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select(`
            *,
            profiles:user_id (full_name, avatar_url)
          `)
          .eq("library_id", libraryData.id)
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(10);

        if (reviewsData && reviewsData.length > 0) {
          setReviews(reviewsData.map((r: any) => ({
            ...r,
            user_name: r.profiles?.full_name || "Anonymous",
            user_image: r.profiles?.avatar_url,
          })));
        } else {
          setReviews(mockReviews);
        }

        // Generate seats
        const seatCount = libraryData.total_rows || 6;
        const perRow = libraryData.seats_per_row || 7;
        setSeats(generateSeats(seatCount, perRow));
      } else {
        // Use mock data for demo
        setLibrary(mockLibrary);
        setShifts(mockLibrary.shifts);
        setSelectedShift(mockLibrary.shifts[0]);
        setReviews(mockReviews);
        setSeats(generateSeats(mockLibrary.total_rows, mockLibrary.seats_per_row));
      }
    } catch (error) {
      console.error("Error fetching library:", error);
      setLibrary(mockLibrary);
      setShifts(mockLibrary.shifts);
      setSelectedShift(mockLibrary.shifts[0]);
      setReviews(mockReviews);
      setSeats(generateSeats(mockLibrary.total_rows, mockLibrary.seats_per_row));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeatClick = (seatId: string, status: string) => {
    if (status === "booked" || status === "prebooked" || status === "disabled") return;

    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    );
  };

  const calculateTotal = () => {
    if (!selectedShift) return 0;
    const price = bookingType === "monthly" 
      ? (selectedShift.monthly_price || selectedShift.price_per_seat * 30)
      : selectedShift.price_per_seat;
    const basePrice = price * selectedSeats.length;
    const discount = ((selectedShift.discount_percent || 0) / 100) * basePrice;
    return basePrice - discount;
  };

  const getDailyPrice = () => {
    if (!selectedShift) return 0;
    return selectedShift.price_per_seat || 50;
  };

  const getHours = () => {
    if (!selectedShift) return 0;
    const [startH] = selectedShift.start_time.split(":").map(Number);
    const [endH] = selectedShift.end_time.split(":").map(Number);
    return endH > startH ? endH - startH : 24 - startH + endH;
  };

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book seats",
        variant: "destructive",
      });
      navigate("/auth/login");
      return;
    }

    if (selectedSeats.length === 0) {
      toast({
        title: "Select Seats",
        description: "Please select at least one seat",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Booking Initiated",
      description: `${selectedSeats.length} seat(s) selected. Total: ₹${calculateTotal()}. Please complete payment via UPI.`,
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied!", description: "Share it with your friends." });
    setShowShareMenu(false);
  };

  const shareUrl = encodeURIComponent(window.location.href);
  const shareText = encodeURIComponent(`Check out ${library?.name || "this library"} on LibraryBook!`);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 md:pt-20">
          <Skeleton className="h-64 md:h-96 w-full" />
          <div className="section-container pt-20 pb-16">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
              <div>
                <Skeleton className="h-96 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{library?.name} - Library Booking | LibraryBook</title>
        <meta
          name="description"
          content={`Book seats at ${library?.name} in ${library?.city}, ${library?.state}. ${library?.description?.slice(0, 150)}`}
        />
        <meta property="og:title" content={`${library?.name} - LibraryBook`} />
        <meta property="og:description" content={library?.description?.slice(0, 200)} />
        <meta property="og:image" content={library?.banner_url} />
        <link rel="canonical" href={`https://librarybook.in/library/${library?.slug}`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-16 md:pt-20">
          {/* Banner */}
          <div className="relative h-64 md:h-96">
            <img
              src={library?.banner_url || mockLibrary.banner_url}
              alt={library?.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />

            {/* Back Button */}
            <Link
              to="/search"
              className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-card/80 backdrop-blur-sm text-sm font-medium hover:bg-card transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Search
            </Link>

            {/* Actions */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center"
              >
                <Heart className="w-5 h-5" />
              </motion.button>
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center"
                >
                  <Share2 className="w-5 h-5" />
                </motion.button>

                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute right-0 top-12 bg-card rounded-xl shadow-xl border border-border p-3 min-w-[180px] z-20"
                    >
                      <div className="space-y-2">
                        <button
                          onClick={copyLink}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                        >
                          <Copy className="w-4 h-4" />
                          Copy Link
                        </button>
                        <a
                          href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-success"
                        >
                          <FaWhatsapp className="w-4 h-4" />
                          WhatsApp
                        </a>
                        <a
                          href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-info"
                        >
                          <FaTelegram className="w-4 h-4" />
                          Telegram
                        </a>
                        <a
                          href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                        >
                          <FaTwitter className="w-4 h-4" />
                          Twitter
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Profile Image */}
            <div className="absolute -bottom-16 left-4 md:left-8">
              <div className="w-32 h-32 rounded-2xl border-4 border-card overflow-hidden shadow-xl">
                <img
                  src={library?.profile_url || mockLibrary.profile_url}
                  alt={library?.ownerName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="section-container pt-20 pb-16">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Header */}
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="badge-success">Open Now</span>
                    <span className="badge-primary">{library?.total_seats || 42} Seats</span>
                  </div>
                  <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">
                    {library?.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-warning fill-warning" />
                      <span className="font-semibold text-foreground">
                        {library?.average_rating || 4.9}
                      </span>
                      <span>({library?.total_reviews || 156} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-5 h-5" />
                      <span>
                        {library?.city}, {library?.state}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Owner Info */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <img
                    src={library?.profile_url || mockLibrary.profile_url}
                    alt={library?.ownerName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{library?.ownerName || "Pawan Kumar"}</p>
                    <p className="text-sm text-muted-foreground">Library Owner</p>
                  </div>
                  <a
                    href={`https://wa.me/${library?.whatsapp_number || "918285896680"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    <FaWhatsapp className="w-4 h-4" />
                    Chat on WhatsApp
                  </a>
                </div>

                {/* Description */}
                <div>
                  <h2 className="font-heading text-xl font-semibold mb-3">About</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {library?.description || mockLibrary.description}
                  </p>
                </div>

                {/* Facilities */}
                <div>
                  <h2 className="font-heading text-xl font-semibold mb-4">Facilities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(library?.facilities || mockLibrary.facilities).map((facility: string) => (
                      <div
                        key={facility}
                        className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          {facilityData[facility]?.icon}
                        </div>
                        <span className="font-medium text-sm">{facilityData[facility]?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Staff */}
                {(library?.staff?.length > 0 || mockLibrary.staff.length > 0) && (
                  <div>
                    <h2 className="font-heading text-xl font-semibold mb-4">Staff</h2>
                    <div className="flex flex-wrap gap-2">
                      {(library?.staff || mockLibrary.staff).map((name: string, idx: number) => (
                        <span key={idx} className="px-3 py-1.5 rounded-full bg-muted text-sm">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timing */}
                <div>
                  <h2 className="font-heading text-xl font-semibold mb-4">Operating Hours</h2>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                    <Clock className="w-6 h-6 text-primary" />
                    <div>
                      <p className="font-semibold">
                        {library?.opening_hours?.open || "06:00"} -{" "}
                        {library?.opening_hours?.close || "23:00"}
                      </p>
                      <p className="text-sm text-muted-foreground">Open all days</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h2 className="font-heading text-xl font-semibold mb-4">Location</h2>
                  <div className="rounded-xl overflow-hidden border border-border">
                    <div className="p-4 bg-card">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">{library?.address || mockLibrary.address}</p>
                          <a
                            href={`https://maps.google.com/?q=${library?.map_lat || mockLibrary.map_lat},${library?.map_lng || mockLibrary.map_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Get Directions →
                          </a>
                        </div>
                      </div>
                    </div>
                    <iframe
                      src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${library?.map_lng || mockLibrary.map_lng}!3d${library?.map_lat || mockLibrary.map_lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjfCsDUxJzAyLjUiTiA3NMKwMzcnMTYuMCJF!5e0!3m2!1sen!2sin!4v1234567890`}
                      width="100%"
                      height="200"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Shifts & Pricing */}
                <div>
                  <h2 className="font-heading text-xl font-semibold mb-4">Shifts & Pricing</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {shifts.map((shift) => (
                      <motion.div
                        key={shift.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedShift(shift)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedShift?.id === shift.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{shift.name}</h3>
                          {shift.discount_percent > 0 && (
                            <span className="badge-success text-xs">
                              {shift.discount_percent}% OFF
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {shift.start_time} - {shift.end_time}
                        </p>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Monthly</p>
                            <p className="text-xl font-bold text-primary">
                              ₹{shift.monthly_price || shift.price_per_seat * 30}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Per Day</p>
                            <p className="text-sm font-semibold">₹{shift.price_per_seat}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Seat Map */}
                <div>
                  <h2 className="font-heading text-xl font-semibold mb-4">Select Your Seat</h2>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="seat seat-available">A1</div>
                      <span className="text-sm">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="seat seat-selected">A1</div>
                      <span className="text-sm">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="seat seat-booked">A1</div>
                      <span className="text-sm">Booked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="seat seat-prebooked">A1</div>
                      <span className="text-sm">Pre-booked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="seat seat-disabled">A1</div>
                      <span className="text-sm">Unavailable</span>
                    </div>
                  </div>

                  {/* Seat Grid */}
                  <div className="p-6 rounded-xl bg-card border border-border overflow-x-auto">
                    <div className="min-w-[600px]">
                      {/* Front */}
                      <div className="text-center mb-8">
                        <div className="inline-block px-8 py-2 rounded-full bg-muted text-sm font-medium">
                          FRONT / ENTRANCE
                        </div>
                      </div>

                      {/* Seats */}
                      <div className="space-y-2">
                        {Array.from(new Set(seats.map((s) => s.row))).map((row) => (
                          <div key={row} className="flex items-center gap-2">
                            <div className="w-6 text-center font-semibold text-muted-foreground">
                              {row}
                            </div>
                            <div className="flex gap-1.5 flex-1 justify-center">
                              {seats
                                .filter((s) => s.row === row)
                                .map((seat) => (
                                  <motion.button
                                    key={seat.id}
                                    whileHover={
                                      seat.status !== "booked" &&
                                      seat.status !== "prebooked" &&
                                      seat.status !== "disabled"
                                        ? { scale: 1.15 }
                                        : {}
                                    }
                                    whileTap={
                                      seat.status !== "booked" &&
                                      seat.status !== "prebooked" &&
                                      seat.status !== "disabled"
                                        ? { scale: 0.95 }
                                        : {}
                                    }
                                    onClick={() => handleSeatClick(seat.id, seat.status)}
                                    className={`seat ${
                                      selectedSeats.includes(seat.id)
                                        ? "seat-selected"
                                        : `seat-${seat.status}`
                                    }`}
                                    disabled={
                                      seat.status === "booked" ||
                                      seat.status === "prebooked" ||
                                      seat.status === "disabled"
                                    }
                                  >
                                    {seat.number}
                                  </motion.button>
                                ))}
                            </div>
                            <div className="w-6 text-center font-semibold text-muted-foreground">
                              {row}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reviews */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-heading text-xl font-semibold">
                      Reviews ({library?.total_reviews || reviews.length})
                    </h2>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-warning fill-warning" />
                      <span className="font-bold text-lg">
                        {library?.average_rating || 4.9}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-4 rounded-xl bg-card border border-border"
                      >
                        <div className="flex items-start gap-4">
                          <img
                            src={review.user_image || `https://ui-avatars.com/api/?name=${review.user_name}`}
                            alt={review.user_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold">{review.user_name}</p>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? "text-warning fill-warning"
                                        : "text-muted"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-muted-foreground text-sm mb-2">
                              {review.comment}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar - Booking Panel */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 rounded-2xl bg-card border border-border shadow-lg"
                  >
                    <h3 className="font-heading text-xl font-semibold mb-4">Book Your Seat</h3>

                    {/* Booking Type Toggle */}
                    <div className="flex rounded-xl bg-muted p-1 mb-4">
                      <button
                        onClick={() => setBookingType("monthly")}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                          bookingType === "monthly"
                            ? "bg-card shadow text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setBookingType("daily")}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                          bookingType === "daily"
                            ? "bg-card shadow text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        Daily
                      </button>
                    </div>

                    {/* Selected Shift */}
                    {selectedShift && (
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 mb-4">
                        <p className="text-sm text-muted-foreground">Selected Shift</p>
                        <p className="font-semibold">{selectedShift.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedShift.start_time} - {selectedShift.end_time} ({getHours()} hrs)
                        </p>
                      </div>
                    )}

                    {/* Date Selection */}
                    <div className="mb-4">
                      <label className="text-sm font-medium mb-2 block">Start Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                      />
                    </div>

                    {/* Selected Seats */}
                    <div className="mb-4">
                      <label className="text-sm font-medium mb-2 block">
                        Selected Seats ({selectedSeats.length})
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedSeats.length > 0 ? (
                          selectedSeats.map((seat) => (
                            <span
                              key={seat}
                              className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                            >
                              {seat}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No seats selected</p>
                        )}
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-2 py-4 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {bookingType === "monthly" ? "Monthly" : "Daily"} Price
                        </span>
                        <span>
                          ₹{bookingType === "monthly" 
                            ? (selectedShift?.monthly_price || getDailyPrice() * 30)
                            : getDailyPrice()} × {selectedSeats.length}
                        </span>
                      </div>
                      {selectedShift?.discount_percent > 0 && (
                        <div className="flex justify-between text-sm text-success">
                          <span>Discount ({selectedShift.discount_percent}%)</span>
                          <span>
                            -₹{Math.round(calculateTotal() * (selectedShift.discount_percent / 100))}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                        <span>Total</span>
                        <span className="text-primary">₹{calculateTotal()}</span>
                      </div>
                    </div>

                    {/* UPI Info */}
                    {library?.upi_id && (
                      <div className="p-3 rounded-xl bg-muted mb-4">
                        <p className="text-xs text-muted-foreground mb-1">Pay via UPI</p>
                        <p className="font-mono text-sm font-medium">{library.upi_id}</p>
                      </div>
                    )}

                    {/* Book Button */}
                    <Button
                      onClick={handleBooking}
                      disabled={selectedSeats.length === 0}
                      className="w-full btn-primary py-6 text-lg"
                    >
                      {user ? "Confirm Booking" : "Login to Book"}
                    </Button>

                    {/* WhatsApp Contact */}
                    <a
                      href={`https://wa.me/${library?.whatsapp_number || "918285896680"}?text=Hi, I want to book a seat at ${library?.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-success text-success hover:bg-success/5 transition-colors"
                    >
                      <FaWhatsapp className="w-5 h-5" />
                      Contact on WhatsApp
                    </a>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default LibraryPage;
