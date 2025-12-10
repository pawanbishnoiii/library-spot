import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check, CheckCheck, Calendar, CreditCard, Users, AlertCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
  action_url: string | null;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'booking':
      return <Calendar className="w-5 h-5" />;
    case 'payment':
      return <CreditCard className="w-5 h-5" />;
    case 'membership_expiry':
      return <AlertCircle className="w-5 h-5" />;
    case 'approval':
      return <Check className="w-5 h-5" />;
    default:
      return <Bell className="w-5 h-5" />;
  }
};

const OwnerNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState({
    newBooking: true,
    paymentReceived: true,
    membershipExpiry: true,
    dailySummary: true,
  });

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (data) {
      setNotifications(data);
    }
    setIsLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user!.id);
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast({ title: "All notifications marked as read" });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <DashboardLayout title="Notifications">
      <div className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Notifications List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Notifications</h2>
                <p className="text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead} size="sm" className="gap-2">
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </Button>
              )}
            </div>

            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        !notification.is_read 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.body}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No notifications yet</p>
                  <p className="text-muted-foreground">We'll notify you about bookings and payments</p>
                </div>
              )}
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5" />
              <h3 className="font-semibold">Notification Settings</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>New Bookings</Label>
                  <p className="text-xs text-muted-foreground">Get notified when someone books</p>
                </div>
                <Switch
                  checked={notificationSettings.newBooking}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, newBooking: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Payment Received</Label>
                  <p className="text-xs text-muted-foreground">Get notified on payments</p>
                </div>
                <Switch
                  checked={notificationSettings.paymentReceived}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, paymentReceived: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Membership Expiry</Label>
                  <p className="text-xs text-muted-foreground">Alert before student expiry</p>
                </div>
                <Switch
                  checked={notificationSettings.membershipExpiry}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, membershipExpiry: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Daily Summary</Label>
                  <p className="text-xs text-muted-foreground">Daily booking summary</p>
                </div>
                <Switch
                  checked={notificationSettings.dailySummary}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, dailySummary: checked }))}
                />
              </div>

              <Button className="w-full" onClick={() => toast({ title: "Settings saved" })}>
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OwnerNotifications;
