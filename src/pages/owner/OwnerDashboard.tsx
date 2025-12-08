import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  Clock,
  Armchair,
  Bell,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const mockChartData = [
  { name: "Mon", bookings: 12 },
  { name: "Tue", bookings: 19 },
  { name: "Wed", bookings: 15 },
  { name: "Thu", bookings: 22 },
  { name: "Fri", bookings: 28 },
  { name: "Sat", bookings: 35 },
  { name: "Sun", bookings: 30 },
];

const OwnerDashboard = () => {
  const { user, profile } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSeats: 0,
    bookedSeats: 0,
    todayBookings: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch owner's library
      const { data: libraryData } = await supabase
        .from("libraries")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (libraryData) {
        setLibrary(libraryData);

        // Fetch today's bookings
        const today = new Date().toISOString().split("T")[0];
        const { data: todayBookings } = await supabase
          .from("bookings")
          .select("*, profiles(full_name, phone)")
          .eq("library_id", libraryData.id)
          .eq("booking_date", today);

        if (todayBookings) {
          setBookings(todayBookings);
          setStats((prev) => ({
            ...prev,
            todayBookings: todayBookings.length,
          }));
        }

        // Fetch all bookings for revenue
        const { data: allBookings } = await supabase
          .from("bookings")
          .select("final_amount, payment_status")
          .eq("library_id", libraryData.id);

        if (allBookings) {
          const totalRevenue = allBookings
            .filter((b) => b.payment_status === "completed")
            .reduce((sum, b) => sum + (b.final_amount || 0), 0);
          const pendingPayments = allBookings
            .filter((b) => b.payment_status === "pending")
            .reduce((sum, b) => sum + (b.final_amount || 0), 0);

          setStats((prev) => ({
            ...prev,
            totalRevenue,
            pendingPayments,
            totalSeats: libraryData.total_seats || 0,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!library) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-xl font-semibold mb-2">No Library Found</h3>
          <p className="text-muted-foreground mb-6">
            You haven't registered a library yet.
          </p>
          <Button asChild>
            <a href="/owner/library">Register Your Library</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* Library Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-card border border-border"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold">{library.name}</h2>
                <p className="text-muted-foreground">
                  {library.city}, {library.state}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  library.status === "approved"
                    ? "bg-success/10 text-success"
                    : library.status === "pending"
                    ? "bg-warning/10 text-warning"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {library.status}
              </span>
              <Button variant="outline" size="sm" asChild>
                <a href={`/library/${library.slug}`}>View Public Page</a>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Bookings"
            value={stats.todayBookings}
            icon={<Calendar className="w-6 h-6" />}
            color="primary"
          />
          <StatCard
            title="Total Seats"
            value={stats.totalSeats}
            icon={<Armchair className="w-6 h-6" />}
            color="info"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            icon={<CreditCard className="w-6 h-6" />}
            color="success"
          />
          <StatCard
            title="Pending Payments"
            value={`₹${stats.pendingPayments.toLocaleString()}`}
            icon={<Clock className="w-6 h-6" />}
            color="warning"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Bookings Chart */}
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold">Weekly Bookings</h3>
              <Button variant="ghost" size="sm">
                View Details <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(234 89% 54%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(234 89% 54%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke="hsl(234 89% 54%)"
                    fillOpacity={1}
                    fill="url(#colorBookings)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today's Bookings */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold">Today's Bookings</h3>
              <Button variant="ghost" size="sm" asChild>
                <a href="/owner/bookings">View All</a>
              </Button>
            </div>

            {bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {booking.profiles?.full_name?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {booking.profiles?.full_name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">₹{booking.final_amount}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        booking.payment_status === "completed"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {booking.payment_status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No bookings today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OwnerDashboard;
