import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Calendar,
  IndianRupee,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
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

const COLORS = ["hsl(234 89% 54%)", "hsl(142 76% 36%)", "hsl(38 92% 50%)", "hsl(0 84% 60%)"];

const AdminAnalytics = () => {
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLibraries: 0,
    totalBookings: 0,
    totalRevenue: 0,
    userGrowth: 0,
    bookingGrowth: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [libraryStats, setLibraryStats] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Libraries count by status
      const { data: librariesData } = await supabase
        .from("libraries")
        .select("status");

      const statusCounts: Record<string, number> = {};
      librariesData?.forEach((lib) => {
        const status = lib.status || "pending";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      setLibraryStats([
        { name: "Approved", value: statusCounts["approved"] || 0 },
        { name: "Pending", value: statusCounts["pending"] || 0 },
        { name: "Suspended", value: statusCounts["suspended"] || 0 },
        { name: "Rejected", value: statusCounts["rejected"] || 0 },
      ]);

      // Bookings
      const { data: bookingsData, count: bookingsCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact" });

      const totalRevenue =
        bookingsData
          ?.filter((b) => b.payment_status === "completed")
          .reduce((sum, b) => sum + (b.final_amount || 0), 0) || 0;

      // Monthly data for charts
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      const mockChartData = months.map((month, i) => ({
        name: month,
        bookings: Math.floor(Math.random() * 100) + 50 + i * 10,
        revenue: Math.floor(Math.random() * 50000) + 20000 + i * 5000,
      }));
      setChartData(mockChartData);

      setStats({
        totalUsers: usersCount || 0,
        totalLibraries: librariesData?.length || 0,
        totalBookings: bookingsCount || 0,
        totalRevenue,
        userGrowth: 12,
        bookingGrowth: 8,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Analytics">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Analytics">
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users className="w-6 h-6" />}
            color="primary"
          />
          <StatCard
            title="Total Libraries"
            value={stats.totalLibraries}
            icon={<Building2 className="w-6 h-6" />}
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
            icon={<IndianRupee className="w-6 h-6" />}
            color="warning"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-card rounded-2xl border border-border p-6"
          >
            <h3 className="font-heading text-lg font-semibold mb-6">Revenue Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
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
                    formatter={(value) => [`₹${value}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(142 76% 36%)"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Library Status Pie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <h3 className="font-heading text-lg font-semibold mb-6">Libraries by Status</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={libraryStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {libraryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {libraryStats.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bookings Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h3 className="font-heading text-lg font-semibold mb-6">Monthly Bookings</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
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
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
