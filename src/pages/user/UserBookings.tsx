import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Calendar,
  BookOpen,
  MapPin,
  Clock,
  CreditCard,
  Filter,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const UserBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("bookings")
        .select(`
          *,
          libraries(name, city, state, profile_url, address),
          shifts(name, start_time, end_time)
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (data) {
        setBookings(data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    return booking.booking_status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-success/10 text-success border-success/30";
      case "pending":
        return "bg-warning/10 text-warning border-warning/30";
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/30";
      case "completed":
        return "bg-info/10 text-info border-info/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DashboardLayout title="My Bookings">
      <div className="space-y-6">
        {/* Filter Tabs */}
        <Tabs defaultValue="all" onValueChange={setFilter}>
          <TabsList className="grid w-full grid-cols-5 max-w-lg">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Bookings List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl border border-border p-6 hover:shadow-card-hover transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Library Image */}
                  <div className="w-full md:w-40 h-32 md:h-24 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                    {booking.libraries?.profile_url ? (
                      <img
                        src={booking.libraries.profile_url}
                        alt={booking.libraries.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Booking Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-heading text-lg font-semibold">
                          {booking.libraries?.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{booking.libraries?.city}, {booking.libraries?.state}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.booking_status)}`}>
                        {booking.booking_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">{format(new Date(booking.booking_date), "MMM dd, yyyy")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Shift</p>
                          <p className="font-medium">{booking.shifts?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">₹{booking.final_amount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          booking.payment_status === "completed" ? "bg-success" : "bg-warning"
                        }`} />
                        <div>
                          <p className="text-muted-foreground">Payment</p>
                          <p className="font-medium capitalize">{booking.payment_status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold mb-2">No bookings found</h3>
            <p className="text-muted-foreground mb-6">
              {filter === "all"
                ? "You haven't made any bookings yet"
                : `No ${filter} bookings`}
            </p>
            <Button asChild>
              <a href="/search">Find Libraries</a>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserBookings;
