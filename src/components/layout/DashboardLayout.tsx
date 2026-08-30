import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Calendar,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
  CreditCard,
  Building2,
  BarChart3,
  MessageSquare,
  User,
  Armchair,
  Bed,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

const userMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/user/dashboard" },
  { icon: Calendar, label: "My Bookings", path: "/user/bookings" },
  { icon: BookOpen, label: "Find Libraries", path: "/search" },
  { icon: Bell, label: "Notifications", path: "/user/notifications" },
  { icon: User, label: "Profile", path: "/user/profile" },
];

const ownerMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/owner/dashboard" },
  { icon: Building2, label: "My Property", path: "/owner/library" },
  { icon: Armchair, label: "Manage Seats", path: "/owner/seats" },
  { icon: Bed, label: "Rooms & Beds", path: "/owner/rooms" },
  { icon: Calendar, label: "Bookings", path: "/owner/bookings" },
  { icon: CreditCard, label: "Payments", path: "/owner/payments" },
  { icon: Users, label: "Staff", path: "/owner/staff" },
  { icon: Eye, label: "Visitors", path: "/owner/visitors" },
  { icon: Bell, label: "Notifications", path: "/owner/notifications" },
  { icon: Settings, label: "Settings", path: "/owner/settings" },
];

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: Building2, label: "Libraries", path: "/admin/libraries" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: Calendar, label: "Bookings", path: "/admin/bookings" },
  { icon: CreditCard, label: "Memberships", path: "/admin/memberships" },
  { icon: Bell, label: "Push Notifications", path: "/admin/push" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },

  { icon: MessageSquare, label: "Support", path: "/admin/support" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, role, signOut } = useAuth();

  const getMenuItems = () => {
    if (role === "admin") return adminMenuItems;
    if (role === "owner") return ownerMenuItems;
    return userMenuItems;
  };

  const menuItems = getMenuItems();

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Logged out successfully" });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-xl">
                Library<span className="text-gradient">Book</span>
              </span>
            </Link>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                {profile?.full_name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground capitalize">{role || "user"}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="font-heading text-xl font-bold">{title}</h1>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
