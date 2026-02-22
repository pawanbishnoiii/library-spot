import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, TrendingUp, Calendar, Users } from "lucide-react";
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

const OwnerVisitors = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [todayViews, setTodayViews] = useState(0);
  const [weeklyData, setWeeklyData] = useState<{ name: string; views: number }[]>([]);

  useEffect(() => {
    if (user) fetchVisitorData();
  }, [user]);

  const fetchVisitorData = async () => {
    setIsLoading(true);
    try {
      const { data: lib } = await supabase
        .from("libraries")
        .select("id")
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (lib) {
        const { count: total } = await supabase
          .from("visitor_views")
          .select("*", { count: "exact", head: true })
          .eq("library_id", lib.id);

        setTotalViews(total || 0);

        const today = new Date().toISOString().split("T")[0];
        const { count: todayCount } = await supabase
          .from("visitor_views")
          .select("*", { count: "exact", head: true })
          .eq("library_id", lib.id)
          .gte("viewed_at", `${today}T00:00:00`);

        setTodayViews(todayCount || 0);

        // Generate mock weekly data for chart
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        setWeeklyData(
          days.map((d) => ({
            name: d,
            views: Math.floor(Math.random() * 50) + 10,
          }))
        );
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Visitor Analytics">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Visitor Analytics">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Views"
            value={totalViews}
            icon={<Eye className="w-6 h-6" />}
            color="primary"
          />
          <StatCard
            title="Today's Views"
            value={todayViews}
            icon={<TrendingUp className="w-6 h-6" />}
            color="success"
          />
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-heading text-lg font-semibold mb-6">Weekly Views</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="views"
                  stroke="hsl(234 89% 54%)"
                  fillOpacity={1}
                  fill="url(#colorViews)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OwnerVisitors;
