import { useState } from "react";
import { useParams, Link } from "react-router-dom";
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
} from "lucide-react";
import { FaWhatsapp, FaTelegram, FaFacebook, FaTwitter } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Mock data for a single library
const mockLibrary = {
  id: "1",
  slug: "knowledge-hub-delhi",
  name: "Knowledge Hub",
  description: "A premium study space with state-of-the-art facilities. Perfect for UPSC, CAT, and competitive exam preparation. We provide a peaceful environment with comfortable seating, high-speed WiFi, and AC rooms.",
  city: "New Delhi",
  state: "Delhi",
  address: "123 Study Lane, Connaught Place, New Delhi - 110001",
  bannerImage: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=80",
  profileImage: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80",
  ownerName: "Rahul Sharma",
  phone: "+91 98765 43210",
  rating: 4.9,
  reviews: 245,
  totalSeats: 120,
  rowCount: 10,
  seatsPerRow: 12,
  openingTime: "06:00",
  closingTime: "23:00",
  mapCoords: { lat: 28.6139, lng: 77.2090 },
  facilities: [
    { id: "wifi", name: "High-Speed WiFi", icon: "wifi" },
    { id: "ac", name: "AC Rooms", icon: "ac" },
    { id: "parking", name: "Free Parking", icon: "parking" },
    { id: "silent_zone", name: "Silent Zone", icon: "silent" },
    { id: "power_backup", name: "Power Backup", icon: "power" },
    { id: "cctv", name: "CCTV Security", icon: "security" },
  ],
  staff: ["Amit Kumar", "Neha Singh", "Raj Verma"],
  shifts: [
    { id: "morning", name: "Morning", startTime: "06:00", endTime: "12:00", price: 50, discount: 10, seatsAvailable: 45 },
    { id: "afternoon", name: "Afternoon", startTime: "12:00", endTime: "18:00", price: 60, discount: 0, seatsAvailable: 32 },
    { id: "evening", name: "Evening", startTime: "18:00", endTime: "22:00", price: 55, discount: 5, seatsAvailable: 28 },
    { id: "night", name: "Night", startTime: "22:00", endTime: "06:00", price: 45, discount: 15, seatsAvailable: 60 },
  ],
  isOpen: true,
};

const mockReviews = [
  {
    id: "1",
    userName: "Anjali Verma",
    userImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    rating: 5,
    comment: "Amazing study space! The AC is perfect, WiFi is super fast, and the environment is very peaceful. Highly recommended for serious students.",
    date: "2024-01-15",
  },
  {
    id: "2",
    userName: "Prateek Singh",
    userImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    rating: 4,
    comment: "Good library with all facilities. The morning shift is the best. Only suggestion is to add more power sockets.",
    date: "2024-01-10",
  },
  {
    id: "3",
    userName: "Meera Patel",
    userImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    rating: 5,
    comment: "Best library in Delhi! I cleared my CA exam studying here. The staff is very helpful and maintains complete silence.",
    date: "2024-01-05",
  },
];

const facilityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-5 h-5" />,
  ac: <Snowflake className="w-5 h-5" />,
  parking: <Car className="w-5 h-5" />,
  silent: <Users className="w-5 h-5" />,
  power: <Shield className="w-5 h-5" />,
  security: <Shield className="w-5 h-5" />,
};

// Generate seat layout
const generateSeats = (rows: number, seatsPerRow: number) => {
  const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const seats: { id: string; row: string; number: number; status: "available" | "booked" | "selected" | "prebooked" | "disabled" }[] = [];
  
  for (let r = 0; r < rows; r++) {
    for (let s = 1; s <= seatsPerRow; s++) {
      const random = Math.random();
      let status: "available" | "booked" | "prebooked" | "disabled" = "available";
      if (random < 0.2) status = "booked";
      else if (random < 0.3) status = "prebooked";
      else if (random < 0.35) status = "disabled";
      
      seats.push({
        id: `${rowLabels[r]}${s}`,
        row: rowLabels[r],
        number: s,
        status,
      });
    }
  }
  return seats;
};

const LibraryPage = () => {
  const { slug } = useParams();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedShift, setSelectedShift] = useState(mockLibrary.shifts[0]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [seats] = useState(() => generateSeats(mockLibrary.rowCount, mockLibrary.seatsPerRow));

  const handleSeatClick = (seatId: string, status: string) => {
    if (status === "booked" || status === "prebooked" || status === "disabled") return;
    
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    );
  };

  const calculateTotal = () => {
    const basePrice = selectedShift.price * selectedSeats.length;
    const discount = (selectedShift.discount / 100) * basePrice;
    return basePrice - discount;
  };

  const getHours = () => {
    const [startH] = selectedShift.startTime.split(":").map(Number);
    const [endH] = selectedShift.endTime.split(":").map(Number);
    const hours = endH > startH ? endH - startH : 24 - startH + endH;
    return hours;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied!", description: "Share it with your friends." });
    setShowShareMenu(false);
  };

  const shareUrl = encodeURIComponent(window.location.href);
  const shareText = encodeURIComponent(`Check out ${mockLibrary.name} on LibraryBook!`);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16 md:pt-20">
        {/* Banner */}
        <div className="relative h-64 md:h-96">
          <img
            src={mockLibrary.bannerImage}
            alt={mockLibrary.name}
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
                src={mockLibrary.profileImage}
                alt={mockLibrary.ownerName}
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
                  <span className={`badge-${mockLibrary.isOpen ? "success" : "warning"}`}>
                    {mockLibrary.isOpen ? "Open Now" : "Closed"}
                  </span>
                  <span className="badge-primary">{mockLibrary.totalSeats} Seats</span>
                </div>
                <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">
                  {mockLibrary.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-warning fill-warning" />
                    <span className="font-semibold text-foreground">{mockLibrary.rating}</span>
                    <span>({mockLibrary.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-5 h-5" />
                    <span>{mockLibrary.city}, {mockLibrary.state}</span>
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                <img
                  src={mockLibrary.profileImage}
                  alt={mockLibrary.ownerName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold">{mockLibrary.ownerName}</p>
                  <p className="text-sm text-muted-foreground">Library Owner</p>
                </div>
                <a
                  href={`https://wa.me/${mockLibrary.phone.replace(/\s/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary px-4 py-2 text-sm"
                >
                  <FaWhatsapp className="w-4 h-4" />
                  Chat
                </a>
              </div>

              {/* Description */}
              <div>
                <h2 className="font-heading text-xl font-semibold mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed">{mockLibrary.description}</p>
              </div>

              {/* Facilities */}
              <div>
                <h2 className="font-heading text-xl font-semibold mb-4">Facilities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {mockLibrary.facilities.map((facility) => (
                    <div
                      key={facility.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {facilityIcons[facility.icon]}
                      </div>
                      <span className="font-medium text-sm">{facility.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timing */}
              <div>
                <h2 className="font-heading text-xl font-semibold mb-4">Operating Hours</h2>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                  <Clock className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-semibold">{mockLibrary.openingTime} - {mockLibrary.closingTime}</p>
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
                        <p className="font-medium">{mockLibrary.address}</p>
                        <a
                          href={`https://maps.google.com/?q=${mockLibrary.mapCoords.lat},${mockLibrary.mapCoords.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Get Directions →
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="h-48 bg-muted flex items-center justify-center text-muted-foreground">
                    <p>Map will be displayed here</p>
                  </div>
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
                      {Array.from({ length: mockLibrary.rowCount }).map((_, rowIndex) => {
                        const rowLabel = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[rowIndex];
                        const rowSeats = seats.filter((s) => s.row === rowLabel);
                        
                        return (
                          <div key={rowLabel} className="flex items-center gap-2">
                            <span className="w-6 text-center font-semibold text-sm text-muted-foreground">
                              {rowLabel}
                            </span>
                            <div className="flex gap-1.5 flex-1 justify-center">
                              {rowSeats.map((seat) => {
                                const isSelected = selectedSeats.includes(seat.id);
                                const seatStatus = isSelected ? "selected" : seat.status;
                                
                                return (
                                  <motion.button
                                    key={seat.id}
                                    whileHover={seat.status === "available" ? { scale: 1.1 } : {}}
                                    whileTap={seat.status === "available" ? { scale: 0.95 } : {}}
                                    onClick={() => handleSeatClick(seat.id, seat.status)}
                                    className={`seat seat-${seatStatus}`}
                                    title={seat.id}
                                  >
                                    {seat.number}
                                  </motion.button>
                                );
                              })}
                            </div>
                            <span className="w-6 text-center font-semibold text-sm text-muted-foreground">
                              {rowLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-xl font-semibold">Reviews</h2>
                  <Button variant="ghost" className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Write a Review
                  </Button>
                </div>

                <div className="space-y-4">
                  {mockReviews.map((review) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="p-4 rounded-xl bg-card border border-border"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={review.userImage}
                          alt={review.userName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">{review.userName}</h4>
                            <span className="text-sm text-muted-foreground">{review.date}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="w-4 h-4 text-warning fill-warning" />
                            ))}
                          </div>
                          <p className="text-muted-foreground text-sm">{review.comment}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl bg-card border border-border shadow-lg"
                >
                  <h3 className="font-heading text-xl font-semibold mb-4">Book Your Seat</h3>

                  {/* Date */}
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block">Select Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary outline-none"
                      />
                    </div>
                  </div>

                  {/* Shift */}
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block">Select Shift</label>
                    <div className="space-y-2">
                      {mockLibrary.shifts.map((shift) => (
                        <button
                          key={shift.id}
                          onClick={() => setSelectedShift(shift)}
                          className={`w-full p-3 rounded-xl border text-left transition-all ${
                            selectedShift.id === shift.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{shift.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {shift.startTime} - {shift.endTime}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">₹{shift.price}/hr</p>
                              {shift.discount > 0 && (
                                <span className="text-xs text-success">{shift.discount}% off</span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>{shift.seatsAvailable} seats available</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Seats */}
                  {selectedSeats.length > 0 && (
                    <div className="mb-4 p-3 rounded-xl bg-muted/50">
                      <p className="text-sm font-medium mb-2">Selected Seats</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSeats.map((seat) => (
                          <span
                            key={seat}
                            className="px-2 py-1 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                          >
                            {seat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Breakdown */}
                  <div className="mb-6 space-y-2 pb-4 border-b border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        ₹{selectedShift.price} × {selectedSeats.length} seats × {getHours()} hrs
                      </span>
                      <span>₹{selectedShift.price * selectedSeats.length * getHours()}</span>
                    </div>
                    {selectedShift.discount > 0 && selectedSeats.length > 0 && (
                      <div className="flex items-center justify-between text-sm text-success">
                        <span>Discount ({selectedShift.discount}%)</span>
                        <span>-₹{((selectedShift.discount / 100) * selectedShift.price * selectedSeats.length * getHours()).toFixed(0)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between font-semibold text-lg pt-2">
                      <span>Total</span>
                      <span className="text-primary">₹{calculateTotal() * getHours()}</span>
                    </div>
                  </div>

                  {/* Book Button */}
                  <Button
                    className="w-full btn-primary h-12 text-base"
                    disabled={selectedSeats.length === 0}
                  >
                    {selectedSeats.length === 0
                      ? "Select Seats to Book"
                      : `Book ${selectedSeats.length} Seat${selectedSeats.length > 1 ? "s" : ""}`}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Payment via UPI to library owner
                  </p>
                </motion.div>

                {/* Contact */}
                <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border">
                  <h4 className="font-medium mb-2">Need Help?</h4>
                  <a
                    href={`tel:${mockLibrary.phone}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Phone className="w-4 h-4" />
                    {mockLibrary.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LibraryPage;
