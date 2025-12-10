import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, CreditCard, AlertCircle, Bell, Search, Filter,
  Download, ChevronDown, Calendar, IndianRupee, CheckCircle, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format, differenceInDays, addDays } from "date-fns";

interface StudentMembership {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  monthly_price: number;
  payment_status: string;
  is_active: boolean;
  profiles: {
    full_name: string;
    email: string;
    phone: string;
  };
  shifts: {
    name: string;
  };
  seats: {
    row_label: string;
    seat_number: number;
  } | null;
}

const OwnerAccounts = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [library, setLibrary] = useState<any>(null);
  const [memberships, setMemberships] = useState<StudentMembership[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    pendingPayments: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch library
    const { data: libraryData } = await supabase
      .from("libraries")
      .select("*")
      .eq("owner_id", user!.id)
      .single();

    if (libraryData) {
      setLibrary(libraryData);

      // Fetch student memberships
      const { data: membershipsData } = await supabase
        .from("user_memberships")
        .select(`
          *,
          profiles:user_id(full_name, email, phone),
          shifts(name),
          seats(row_label, seat_number)
        `)
        .eq("library_id", libraryData.id)
        .order("end_date", { ascending: true });

      if (membershipsData) {
        setMemberships(membershipsData as any);
        
        // Calculate stats
        const active = membershipsData.filter((m: any) => m.is_active);
        const pending = membershipsData.filter((m: any) => m.payment_status === 'pending');
        const totalRev = membershipsData
          .filter((m: any) => m.payment_status === 'completed')
          .reduce((sum: number, m: any) => sum + m.monthly_price, 0);

        setStats({
          totalStudents: membershipsData.length,
          activeStudents: active.length,
          pendingPayments: pending.reduce((sum: number, m: any) => sum + m.monthly_price, 0),
          totalRevenue: totalRev,
        });
      }
    }
    
    setIsLoading(false);
  };

  const markPaymentReceived = async (membershipId: string) => {
    const { error } = await supabase
      .from("user_memberships")
      .update({ payment_status: 'completed' })
      .eq("id", membershipId);

    if (error) {
      toast({ title: "Error updating payment", variant: "destructive" });
    } else {
      toast({ title: "Payment marked as received" });
      fetchData();
    }
  };

  const sendReminder = async (membership: StudentMembership) => {
    // Create notification
    await supabase.from("notifications").insert({
      user_id: membership.user_id,
      title: "Payment Reminder",
      body: `Your membership at ${library?.name} needs payment. Please complete your payment.`,
      type: "payment",
    });

    toast({ title: "Reminder sent to student" });
  };

  const getDaysRemaining = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  const filteredMemberships = memberships.filter(m => {
    const matchesSearch = m.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && m.is_active) ||
      (filterStatus === 'expired' && !m.is_active) ||
      (filterStatus === 'pending' && m.payment_status === 'pending');

    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Accounts">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Accounts">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Student Accounts</h2>
          <p className="text-muted-foreground">Manage student fees and memberships</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={<Users className="w-6 h-6" />}
            color="primary"
          />
          <StatCard
            title="Active Memberships"
            value={stats.activeStudents}
            icon={<CheckCircle className="w-6 h-6" />}
            color="success"
          />
          <StatCard
            title="Pending Payments"
            value={`₹${stats.pendingPayments}`}
            icon={<Clock className="w-6 h-6" />}
            color="warning"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue}`}
            icon={<IndianRupee className="w-6 h-6" />}
            color="info"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="pending">Pending Payment</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Shift / Seat</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMemberships.length > 0 ? (
                filteredMemberships.map((membership) => {
                  const daysLeft = getDaysRemaining(membership.end_date);
                  
                  return (
                    <TableRow key={membership.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{membership.profiles?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{membership.profiles?.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{membership.shifts?.name}</p>
                          {membership.seats && (
                            <p className="text-muted-foreground">
                              {membership.seats.row_label}{membership.seats.seat_number}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(membership.start_date), 'MMM d')}</p>
                          <p className="text-muted-foreground">
                            to {format(new Date(membership.end_date), 'MMM d')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{membership.monthly_price}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          membership.payment_status === 'completed' ? 'default' :
                          membership.payment_status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {membership.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          !membership.is_active ? 'destructive' :
                          daysLeft <= 3 ? 'destructive' :
                          daysLeft <= 7 ? 'secondary' : 'outline'
                        }>
                          {!membership.is_active ? 'Expired' : `${daysLeft} days`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {membership.payment_status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markPaymentReceived(membership.id)}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Paid
                            </Button>
                          )}
                          {(daysLeft <= 7 && membership.is_active) || membership.payment_status === 'pending' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => sendReminder(membership)}
                            >
                              <Bell className="w-3 h-3 mr-1" />
                              Remind
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">No students found</p>
                    <p className="text-muted-foreground">Students who book will appear here</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Expiring Soon Alert */}
        {memberships.some(m => getDaysRemaining(m.end_date) <= 3 && m.is_active) && (
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning">Memberships Expiring Soon</p>
              <p className="text-sm text-muted-foreground">
                {memberships.filter(m => getDaysRemaining(m.end_date) <= 3 && m.is_active).length} student(s) have memberships expiring within 3 days.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OwnerAccounts;
