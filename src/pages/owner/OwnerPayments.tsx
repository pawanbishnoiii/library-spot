import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  CreditCard,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Download,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
} from "recharts";

const OwnerPayments = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [library, setLibrary] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    totalStudents: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: libraryData } = await supabase
        .from("libraries")
        .select("id")
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (libraryData) {
        setLibrary(libraryData);

        const { data: bookingsData } = await supabase
          .from("bookings")
          .select(`
            *,
            profiles!bookings_user_id_fkey(full_name, phone, email)
          `)
          .eq("library_id", libraryData.id)
          .order("created_at", { ascending: false });

        if (bookingsData) {
          setPayments(bookingsData);

          const completed = bookingsData.filter((b) => b.payment_status === "completed");
          const pending = bookingsData.filter((b) => b.payment_status === "pending");

          const uniqueUsers = new Set(bookingsData.map((b) => b.user_id));

          setStats({
            totalRevenue: completed.reduce((sum, b) => sum + (b.final_amount || 0), 0),
            pendingPayments: pending.reduce((sum, b) => sum + (b.final_amount || 0), 0),
            completedPayments: completed.length,
            totalStudents: uniqueUsers.size,
          });

          // Generate chart data for last 7 days
          const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return format(date, "MMM d");
          });

          const chartDataMap = last7Days.map((day) => ({
            name: day,
            revenue: bookingsData
              .filter(
                (b) =>
                  b.payment_status === "completed" &&
                  format(new Date(b.created_at), "MMM d") === day
              )
              .reduce((sum, b) => sum + (b.final_amount || 0), 0),
          }));

          setChartData(chartDataMap);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    if (filter === "all") return true;
    return payment.payment_status === filter;
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Payments & Accounts">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Payments & Accounts">
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="success"
          />
          <StatCard
            title="Pending Payments"
            value={`₹${stats.pendingPayments.toLocaleString()}`}
            icon={<TrendingDown className="w-6 h-6" />}
            color="warning"
          />
          <StatCard
            title="Completed Payments"
            value={stats.completedPayments}
            icon={<CreditCard className="w-6 h-6" />}
            color="primary"
          />
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={<Users className="w-6 h-6" />}
            color="info"
          />
        </div>

        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h3 className="font-heading text-lg font-semibold mb-6">Revenue (Last 7 Days)</h3>
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
                  formatter={(value) => [`₹${value}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Payments Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between gap-4">
            <h3 className="font-heading text-lg font-semibold">Payment History</h3>
            <div className="flex gap-3">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.profiles?.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.profiles?.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(payment.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={payment.is_monthly ? "default" : "secondary"}>
                          {payment.is_monthly ? "Monthly" : "Daily"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold flex items-center">
                          <IndianRupee className="w-4 h-4" />
                          {payment.final_amount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            payment.payment_status === "completed"
                              ? "bg-success text-success-foreground"
                              : "bg-warning/10 text-warning"
                          }
                        >
                          {payment.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.payment_reference || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No payments found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default OwnerPayments;
