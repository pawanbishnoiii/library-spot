import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Check,
  X,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "@/hooks/use-toast";

const mockBarData = [
  { name: "Jan", bookings: 65 },
  { name: "Feb", bookings: 80 },
  { name: "Mar", bookings: 90 },
  { name: "Apr", bookings: 120 },
  { name: "May", bookings: 150 },
  { name: "Jun", bookings: 180 },
];

const mockPieData = [
  { name: "Approved", value: 45, color: "hsl(142 76% 36%)" },
  { name: "Pending", value: 12, color: "hsl(38 92% 50%)" },
  { name: "Suspended", value: 3, color: "hsl(0 84% 60%)" },
];

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalLibraries: 0,
    pendingApprovals: 0,
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [pendingLibraries, setPendingLibraries] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch libraries count
      const { count: librariesCount } = await supabase
        .from("libraries")
        .select("*", { count: "exact", head: true });

      // Fetch pending libraries
      const { data: pending } = await supabase
        .from("libraries")
        .select("*, profiles!libraries_owner_id_fkey(full_name)")
        .eq("status", "pending")
        .limit(5);

      if (pending) {
        setPendingLibraries(pending);
      }

      // Fetch users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch bookings
      const { data: bookings, count: bookingsCount } = await supabase
        .from("bookings")
        .select("*, libraries(name), profiles!bookings_user_id_fkey(full_name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(5);

      if (bookings) {
        setRecentBookings(bookings);
      }

      // Calculate total revenue
      const { data: revenueData } = await supabase
        .from("bookings")
        .select("final_amount")
        .eq("payment_status", "completed");

      const totalRevenue = revenueData?.reduce((sum, b) => sum + (b.final_amount || 0), 0) || 0;

      setStats({
        totalLibraries: librariesCount || 0,
        pendingApprovals: pending?.length || 0,
        totalUsers: usersCount || 0,
        totalBookings: bookingsCount || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveLibrary = async (libraryId: string) => {
    try {
      const { error } = await supabase
        .from("libraries")
        .update({ status: "approved" })
        .eq("id", libraryId);

      if (error) throw error;

      toast({ title: "Library approved successfully" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRejectLibrary = async (libraryId: string) => {
    try {
      const { error } = await supabase
        .from("libraries")
        .update({ status: "rejected" })
        .eq("id", libraryId);

      if (error) throw error;

      toast({ title: "Library rejected" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h3 className="font-heading text-xl font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Libraries"
            value={stats.totalLibraries}
            icon={<Building2 className="w-6 h-6" />}
            color="primary"
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={<AlertCircle className="w-6 h-6" />}
            color="warning"
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users className="w-6 h-6" />}
            color="info"
          />
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={<Calendar className="w-6 h-6" />}
            color="success"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            icon={<CreditCard className="w-6 h-6" />}
            color="primary"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Bookings Chart */}
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading text-lg font-semibold mb-6">Monthly Bookings</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockBarData}>
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
                  <Bar dataKey="bookings" fill="hsl(234 89% 54%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Libraries Status Pie */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading text-lg font-semibold mb-6">Libraries Status</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {mockPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {mockPieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Approvals */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold">Pending Approvals</h3>
              <Button variant="ghost" size="sm" asChild>
                <a href="/admin/libraries">View All</a>
              </Button>
            </div>

            {pendingLibraries.length > 0 ? (
              <div className="space-y-4">
                {pendingLibraries.map((library) => (
                  <div
                    key={library.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                  >
                    <div>
                      <p className="font-semibold">{library.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {library.city}, {library.state}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-success hover:text-success hover:bg-success/10"
                        onClick={() => handleApproveLibrary(library.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRejectLibrary(library.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Check className="w-10 h-10 text-success mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No pending approvals</p>
              </div>
            )}
          </div>

          {/* Recent Bookings */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold">Recent Bookings</h3>
              <Button variant="ghost" size="sm" asChild>
                <a href="/admin/bookings">View All</a>
              </Button>
            </div>

            {recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                  >
                    <div>
                      <p className="font-semibold">{booking.libraries?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        by {booking.profiles?.full_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{booking.final_amount}</p>
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No bookings yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
