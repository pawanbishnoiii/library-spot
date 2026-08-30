// Category-driven configuration for dashboards, filters and terminology.

export type CategoryKind = "property" | "service";

export interface DashboardModule {
  label: string;
  to: string;
  icon: string;
}

const CORE: DashboardModule[] = [
  { label: "Overview", to: "/dashboard", icon: "LayoutDashboard" },
  { label: "Listings", to: "/dashboard/listings", icon: "Store" },
  { label: "Bookings", to: "/dashboard/bookings", icon: "CalendarCheck" },
  { label: "Customers", to: "/dashboard/customers", icon: "Users" },
  { label: "Finance", to: "/dashboard/finance", icon: "Wallet" },
  { label: "Expenses", to: "/dashboard/expenses", icon: "Receipt" },
  { label: "Reviews", to: "/dashboard/reviews", icon: "Star" },
  { label: "Offers", to: "/dashboard/offers", icon: "Tag" },
  { label: "Analytics", to: "/dashboard/analytics", icon: "BarChart3" },
  { label: "Settings", to: "/dashboard/settings", icon: "Settings" },
];

const EXTRAS: Record<string, DashboardModule[]> = {
  library: [
    { label: "Members", to: "/dashboard/customers", icon: "UserCheck" },
    { label: "Plans & Shifts", to: "/dashboard/plans", icon: "Clock" },
    { label: "Seats", to: "/dashboard/seats", icon: "Grid3x3" },
  ],
  gym: [
    { label: "Members", to: "/dashboard/customers", icon: "UserCheck" },
    { label: "Plans & Shifts", to: "/dashboard/plans", icon: "Clock" },
  ],
  pg: [
    { label: "Rooms & Beds", to: "/dashboard/rooms", icon: "BedDouble" },
    { label: "Tenants", to: "/dashboard/customers", icon: "UserCheck" },
  ],
  hostel: [
    { label: "Rooms & Beds", to: "/dashboard/rooms", icon: "BedDouble" },
    { label: "Tenants", to: "/dashboard/customers", icon: "UserCheck" },
  ],
  rooms: [{ label: "Tenants", to: "/dashboard/customers", icon: "UserCheck" }],
  tiffin: [
    { label: "Menu & Meals", to: "/dashboard/services", icon: "UtensilsCrossed" },
    { label: "Subscribers", to: "/dashboard/customers", icon: "UserCheck" },
    { label: "Delivery Areas", to: "/dashboard/delivery", icon: "MapPin" },
  ],
  laundry: [
    { label: "Services & Rates", to: "/dashboard/services", icon: "Shirt" },
    { label: "Pickup Areas", to: "/dashboard/delivery", icon: "MapPin" },
  ],
  electrician: [{ label: "Services & Rates", to: "/dashboard/services", icon: "Zap" }],
  cleaning: [{ label: "Services & Rates", to: "/dashboard/services", icon: "Sparkles" }],
  food: [{ label: "Menu", to: "/dashboard/services", icon: "Pizza" }],
};

export function modulesFor(categorySlug?: string | null): DashboardModule[] {
  const extras = (categorySlug && EXTRAS[categorySlug]) || [];
  const merged = [...CORE.slice(0, 2), ...extras, ...CORE.slice(2)];
  const seen = new Set<string>();
  return merged.filter((m) => {
    const key = m.label;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const PRICE_UNITS = ["month", "day", "visit", "hour", "kg", "item", "meal", "week"] as const;

export const PLAN_PERIODS = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "half_yearly",
  "yearly",
] as const;

export const SHIFTS = ["Morning", "Afternoon", "Evening", "Night", "Custom"] as const;

export const ORDER_FLOW = [
  "new",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "completed",
] as const;

export const ORDER_LABELS: Record<string, string> = {
  new: "New",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function isServiceCategory(slug?: string | null) {
  return ["tiffin", "laundry", "electrician", "cleaning", "food"].includes(slug ?? "");
}

export function needsPickup(slug?: string | null) {
  return ["laundry", "tiffin", "food"].includes(slug ?? "");
}

export function formatMoney(value?: number | null) {
  if (value == null) return "—";
  return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
