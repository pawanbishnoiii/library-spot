import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Compass,
  Map as MapIcon,
  CalendarCheck,
  User,
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const BottomNav = () => {
  const routerLocation = useLocation();
  const { user, role } = useAuth();

  const isBusiness = role === "owner" || role === "vendor";

  const userItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Compass, label: "Explore", path: "/search" },
    { icon: MapIcon, label: "Map", path: "/search?view=map" },
    { icon: CalendarCheck, label: "Activity", path: user ? "/user/bookings" : "/auth/login" },
    { icon: User, label: "Profile", path: user ? "/user/profile" : "/auth/login" },
  ];

  const businessItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/owner/dashboard" },
    { icon: Building2, label: "Listings", path: "/owner/library" },
    { icon: Users, label: "Customers", path: "/owner/bookings" },
    { icon: Wallet, label: "Finance", path: "/owner/payments" },
    { icon: User, label: "Profile", path: "/owner/settings" },
  ];

  const navItems = isBusiness ? businessItems : userItems;

  const isActive = (path: string) => {
    const base = path.split("?")[0];
    if (base === "/") return routerLocation.pathname === "/" || routerLocation.pathname === "/home";
    return routerLocation.pathname.startsWith(base);
  };

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl md:hidden safe-area-bottom"
    >
      <div className="flex items-stretch justify-around">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              aria-current={active ? "page" : undefined}
              className="relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-transform active:scale-95"
            >
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon
                className={`h-5 w-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
