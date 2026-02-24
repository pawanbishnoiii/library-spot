import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
  Eye,
  Heart,
  Bed,
  Star,
  ArrowUpRight,
  BookOpen,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const OwnerDashboard = () => {
  const { user, profile } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSeats: 0,
    totalRooms: 0,
    totalBeds: 0,
    bookedToday: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    totalViews: 0,
    totalWishlists: 0,
    avgRating: 0,
    totalReviews: 0,
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: libraryData } = await supabase
        .from("libraries")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (!libraryData) { setIsLoading(false); return; }
      setLibrary(libraryData);

      const today = new Date().toISOString().split("T")[0];

      // Parallel fetches
      const [
        { data: todayBookings },
        { data: allBookings },
        { data: viewsData },
        { data: wishlistData },
        { data: roomsData },
      ] = await Promise.all([
        supabase.from("bookings").select("*, profiles!bookings_user_id_fkey(full_name, phone)").eq("library_id", libraryData.id).eq("booking_date", today),
        supabase.from("bookings").select("final_amount, payment_status, created_at, booking_date").eq("library_id", libraryData.id),
        supabase.from("visitor_views").select("id").eq("library_id", libraryData.id),
        supabase.from("wishlists").select("id").eq("library_id", libraryData.id),
        supabase.from("rooms").select("id").eq("library_id", libraryData.id),
      ]);

      setRecentBookings(todayBookings || []);

      const completed = (allBookings || []).filter(b => b.payment_status === "completed");
      const pending = (allBookings || []).filter(b => b.payment_status === "pending");

      // Chart data - last 7 days
      const last7 = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split("T")[0];
        const dayBookings = (allBookings || []).filter(b => b.booking_date === dateStr);
        return {
          name: format(d, "EEE"),
          bookings: dayBookings.length,
          revenue: dayBookings.filter(b => b.payment_status === "completed").reduce((s, b) => s + (b.final_amount || 0), 0),
        };
      });
      setChartData(last7);

      setStats({
        totalSeats: libraryData.total_seats || 0,
        totalRooms: libraryData.total_rooms || 0,
        totalBeds: libraryData.total_beds || 0,
        bookedToday: (todayBookings || []).length,
        totalRevenue: completed.reduce((s, b) => s + (b.final_amount || 0), 0),
        pendingPayments: pending.reduce((s, b) => s + (b.final_amount || 0), 0),
        totalViews: (viewsData || []).length,
        totalWishlists: (wishlistData || []).length,
        avgRating: libraryData.average_rating || 0,
        totalReviews: libraryData.total_reviews || 0,
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAccommodation = library?.property_type === "pg" || library?.property_type === "hotel";

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!library) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-xl font-semibold mb-2">No Property Found</h3>
          <p className="text-muted-foreground mb-6">Register your property to get started.</p>
          <Button asChild><Link to="/owner/library">Register Property</Link></Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Property Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {library.profile_url ? (
                <img src={library.profile_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center">
                  {isAccommodation ? <Home className="w-7 h-7 text-primary-foreground" /> : <BookOpen className="w-7 h-7 text-primary-foreground" />}
                </div>
              )}
              <div>
                <h2 className="font-heading text-lg font-bold">{library.name}</h2>
                <p className="text-sm text-muted-foreground">{library.city}, {library.state}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs capitalize">{library.property_type || "library"}</Badge>
                  <Badge className={library.status === "approved" ? "bg-success/10 text-success border-0" : library.status === "pending" ? "bg-warning/10 text-warning border-0" : "bg-destructive/10 text-destructive border-0"}>
                    {library.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild><Link to={`/library/${library.slug}`}><Eye className="w-4 h-4 mr-1" />View Page</Link></Button>
              <Button size="sm" asChild><Link to="/owner/library">Edit</Link></Button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Today's Bookings" value={stats.bookedToday} icon={<Calendar className="w-5 h-5" />} color="primary" />
          {isAccommodation ? (
            <StatCard title="Rooms / Beds" value={`${stats.totalRooms} / ${stats.totalBeds}`} icon={<Bed className="w-5 h-5" />} color="info" />
          ) : (
            <StatCard title="Total Seats" value={stats.totalSeats} icon={<Armchair className="w-5 h-5" />} color="info" />
          )}
          <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} color="success" />
          <StatCard title="Pending" value={`₹${stats.pendingPayments.toLocaleString()}`} icon={<Clock className="w-5 h-5" />} color="warning" />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center"><Eye className="w-5 h-5 text-info" /></div>
            <div><p className="text-xs text-muted-foreground">Views</p><p className="font-semibold">{stats.totalViews}</p></div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><Heart className="w-5 h-5 text-destructive" /></div>
            <div><p className="text-xs text-muted-foreground">Wishlists</p><p className="font-semibold">{stats.totalWishlists}</p></div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><Star className="w-5 h-5 text-warning" /></div>
            <div><p className="text-xs text-muted-foreground">Rating</p><p className="font-semibold">{stats.avgRating.toFixed(1)} ({stats.totalReviews})</p></div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-success" /></div>
            <div><p className="text-xs text-muted-foreground">Occupancy</p><p className="font-semibold">{stats.bookedToday > 0 ? Math.round((stats.bookedToday / Math.max(stats.totalSeats, 1)) * 100) : 0}%</p></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-semibold">Weekly Overview</h3>
              <Button variant="ghost" size="sm" asChild><Link to="/owner/payments">Details <ChevronRight className="w-4 h-4" /></Link></Button>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem" }} formatter={(v: any) => [`₹${v}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(142 76% 36%)" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today's Bookings */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-semibold">Today</h3>
              <Button variant="ghost" size="sm" asChild><Link to="/owner/bookings">All</Link></Button>
            </div>
            {recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.slice(0, 6).map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {b.profiles?.full_name?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{b.profiles?.full_name || "User"}</p>
                      <p className="text-xs text-muted-foreground">₹{b.final_amount}</p>
                    </div>
                    <Badge variant="outline" className={b.payment_status === "completed" ? "bg-success/10 text-success border-0 text-xs" : "bg-warning/10 text-warning border-0 text-xs"}>
                      {b.payment_status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No bookings today</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: isAccommodation ? "Manage Rooms" : "Manage Seats", path: isAccommodation ? "/owner/rooms" : "/owner/seats", icon: isAccommodation ? Bed : Armchair },
            { label: "Shifts & Pricing", path: "/owner/shifts", icon: Clock },
            { label: "Staff", path: "/owner/staff", icon: Users },
            { label: "Payments", path: "/owner/payments", icon: CreditCard },
          ].map(action => (
            <Link key={action.path} to={action.path} className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 hover:shadow-md transition-all group">
              <action.icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-medium group-hover:text-primary transition-colors">{action.label}</p>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground mt-1" />
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OwnerDashboard;
