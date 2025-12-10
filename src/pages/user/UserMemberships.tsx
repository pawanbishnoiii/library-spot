import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";

interface Membership {
  id: string;
  start_date: string;
  end_date: string;
  monthly_price: number;
  payment_status: string;
  is_active: boolean;
  libraries: {
    name: string;
    city: string;
    profile_url: string;
  };
  shifts: {
    name: string;
    start_time: string;
    end_time: string;
  };
  seats: {
    row_label: string;
    seat_number: number;
  } | null;
}

const UserMemberships = () => {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMemberships();
    }
  }, [user]);

  const fetchMemberships = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("user_memberships")
      .select(`
        *,
        libraries(name, city, profile_url),
        shifts(name, start_time, end_time),
        seats(row_label, seat_number)
      `)
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (data) {
      setMemberships(data as any);
    }
    setIsLoading(false);
  };

  const getDaysRemaining = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  const getStatusColor = (daysRemaining: number, isActive: boolean) => {
    if (!isActive) return 'bg-muted text-muted-foreground';
    if (daysRemaining <= 3) return 'bg-destructive/10 text-destructive';
    if (daysRemaining <= 7) return 'bg-warning/10 text-warning';
    return 'bg-success/10 text-success';
  };

  return (
    <DashboardLayout title="My Memberships">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">My Library Memberships</h2>
          <p className="text-muted-foreground">Manage your monthly library subscriptions</p>
        </div>

        {/* Memberships List */}
        {isLoading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : memberships.length > 0 ? (
          <div className="grid gap-6">
            {memberships.map((membership, index) => {
              const daysRemaining = getDaysRemaining(membership.end_date);
              const statusColor = getStatusColor(daysRemaining, membership.is_active);
              
              return (
                <motion.div
                  key={membership.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl border border-border p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Library Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={membership.libraries?.profile_url || 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=200'}
                        alt={membership.libraries?.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{membership.libraries?.name}</h3>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <MapPin className="w-3 h-3" />
                          <span>{membership.libraries?.city}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {membership.shifts?.name}
                          </span>
                          {membership.seats && (
                            <span>
                              Seat: {membership.seats.row_label}{membership.seats.seat_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Membership Details */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="text-center px-4">
                        <p className="text-2xl font-bold text-primary">₹{membership.monthly_price}</p>
                        <p className="text-xs text-muted-foreground">per month</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {format(new Date(membership.start_date), 'MMM d')} - {format(new Date(membership.end_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={statusColor}>
                            {!membership.is_active 
                              ? 'Expired'
                              : daysRemaining <= 0 
                                ? 'Expiring Today'
                                : `${daysRemaining} days remaining`
                            }
                          </Badge>
                          
                          <Badge variant={membership.payment_status === 'completed' ? 'default' : 'secondary'}>
                            {membership.payment_status === 'completed' ? (
                              <><CheckCircle className="w-3 h-3 mr-1" /> Paid</>
                            ) : (
                              <><CreditCard className="w-3 h-3 mr-1" /> {membership.payment_status}</>
                            )}
                          </Badge>
                        </div>
                      </div>

                      {membership.is_active && daysRemaining <= 7 && (
                        <Button size="sm">Renew Now</Button>
                      )}
                    </div>
                  </div>

                  {daysRemaining <= 3 && daysRemaining > 0 && membership.is_active && (
                    <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Your membership is expiring soon. Renew to continue access.</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No active memberships</p>
            <p className="text-muted-foreground mb-4">Book a library seat to get started</p>
            <Button>Find Libraries</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserMemberships;
