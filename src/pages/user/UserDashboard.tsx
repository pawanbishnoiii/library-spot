import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  BookOpen,
  Clock,
  Star,
  MapPin,
  ChevronRight,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const UserDashboard = () => {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    hoursSpent: 0,
    reviewsGiven: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select(`
          *,
          libraries(name, city, profile_url),
          shifts(name, start_time, end_time)
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (bookingsData) {
        setBookings(bookingsData);
        setStats(prev => ({
          ...prev,
          totalBookings: bookingsData.length,
          activeBookings: bookingsData.filter(b => b.booking_status === "confirmed").length,
        }));
      }

      // Fetch notifications
      const { data: notificationsData } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (notificationsData) {
        setNotifications(notificationsData);
      }

      // Fetch reviews count
      const { count: reviewsCount } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);

      setStats(prev => ({
        ...prev,
        reviewsGiven: reviewsCount || 0,
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-primary text-primary-foreground"
        >
          <h2 className="font-heading text-2xl font-bold mb-2">
            {getGreeting()}, {profile?.full_name?.split(" ")[0] || "User"}! 👋
          </h2>
          <p className="opacity-90">
            Ready to find your perfect study spot today?
          </p>
          <Link to="/search">
            <Button variant="secondary" className="mt-4">
              Find Libraries
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={<Calendar className="w-6 h-6" />}
            color="primary"
          />
          <StatCard
            title="Active Bookings"
            value={stats.activeBookings}
            icon={<BookOpen className="w-6 h-6" />}
            color="success"
          />
          <StatCard
            title="Hours Studied"
            value={`${stats.hoursSpent}h`}
            icon={<Clock className="w-6 h-6" />}
            color="info"
          />
          <StatCard
            title="Reviews Given"
            value={stats.reviewsGiven}
            icon={<Star className="w-6 h-6" />}
            color="warning"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading text-lg font-semibold">Recent Bookings</h3>
                <Link to="/user/bookings" className="text-sm text-primary hover:underline">
                  View All
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{booking.libraries?.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{booking.libraries?.city}</span>
                          <span>•</span>
                          <span>{booking.shifts?.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{booking.final_amount}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          booking.booking_status === "confirmed" 
                            ? "bg-success/10 text-success" 
                            : booking.booking_status === "pending"
                            ? "bg-warning/10 text-warning"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {booking.booking_status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No bookings yet</p>
                  <Link to="/search">
                    <Button>Find Libraries</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold">Notifications</h3>
              <Link to="/user/notifications" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notification.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No new notifications</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
