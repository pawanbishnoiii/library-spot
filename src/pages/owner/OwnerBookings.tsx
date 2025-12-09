import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Calendar,
  Search,
  Filter,
  Check,
  X,
  Eye,
  Phone,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Booking {
  id: string;
  booking_date: string;
  start_date: string;
  end_date: string | null;
  final_amount: number;
  payment_status: string;
  booking_status: string;
  is_monthly: boolean;
  profiles: {
    full_name: string;
    phone: string;
    email: string;
  };
  shifts: {
    name: string;
  };
}

const OwnerBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [library, setLibrary] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // First get library
      const { data: libraryData } = await supabase
        .from("libraries")
        .select("id")
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (libraryData) {
        setLibrary(libraryData);

        // Then get bookings
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select(`
            *,
            profiles!bookings_user_id_fkey(full_name, phone, email),
            shifts(name)
          `)
          .eq("library_id", libraryData.id)
          .order("created_at", { ascending: false });

        if (bookingsData) {
          setBookings(bookingsData as any);
        }
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: "pending" | "confirmed" | "cancelled" | "completed") => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ booking_status: status })
        .eq("id", bookingId);

      if (error) throw error;
      toast({ title: `Booking ${status}` });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updatePaymentStatus = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ payment_status: "completed" })
        .eq("id", bookingId);

      if (error) throw error;
      toast({ title: "Payment marked as received" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.profiles?.phone?.includes(searchTerm);
    const matchesStatus =
      statusFilter === "all" || booking.booking_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Bookings">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Bookings">
      <div className="space-y-6">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Bookings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.profiles?.full_name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.profiles?.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(booking.start_date), "MMM d, yyyy")}</p>
                          {booking.end_date && (
                            <p className="text-muted-foreground">
                              to {format(new Date(booking.end_date), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{booking.shifts?.name}</TableCell>
                      <TableCell>
                        <Badge variant={booking.is_monthly ? "default" : "secondary"}>
                          {booking.is_monthly ? "Monthly" : "Daily"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold flex items-center">
                          <IndianRupee className="w-4 h-4" />
                          {booking.final_amount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            booking.payment_status === "completed"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            booking.payment_status === "completed"
                              ? "bg-success text-success-foreground"
                              : "bg-warning/10 text-warning"
                          }
                        >
                          {booking.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            booking.booking_status === "confirmed"
                              ? "default"
                              : booking.booking_status === "cancelled"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {booking.booking_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {booking.booking_status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-success hover:text-success"
                                onClick={() => updateBookingStatus(booking.id, "confirmed")}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => updateBookingStatus(booking.id, "cancelled")}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {booking.payment_status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updatePaymentStatus(booking.id)}
                            >
                              <IndianRupee className="w-4 h-4 mr-1" />
                              Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No bookings found</p>
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

export default OwnerBookings;
