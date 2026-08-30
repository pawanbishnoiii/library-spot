import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, MapPin, Search } from "lucide-react";
import { useUserLocation } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";

const DiscoverHeader = () => {
  const { location, openSheet } = useUserLocation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const label =
    location.locality || location.city || (location.source === "none" ? "Set your location" : "Nearby");
  const sub =
    location.source === "gps" ? "Discovering around you" : location.city ? "Tap to change" : "Explore near you";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="section-container flex items-center gap-3 py-3">
        <button
          onClick={openSheet}
          aria-label="Change location"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-4 w-4 text-primary" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-sm font-bold">
              <span className="truncate max-w-[45vw] sm:max-w-none">{label}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">{sub}</span>
          </span>
        </button>

        <button
          onClick={() => navigate("/search")}
          aria-label="Search"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition-transform active:scale-95 md:hidden"
        >
          <Search className="h-4 w-4" />
        </button>

        <Link
          to={user ? "/user/notifications" : "/auth/login"}
          aria-label="Notifications"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition-transform active:scale-95"
        >
          <Bell className="h-4 w-4" />
        </Link>

        <Link
          to={user ? "/user/profile" : "/auth/login"}
          aria-label="Profile"
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Your profile" className="h-full w-full object-cover" />
          ) : (
            (profile?.full_name?.charAt(0) ?? "G").toUpperCase()
          )}
        </Link>
      </div>
    </header>
  );
};

export default DiscoverHeader;
