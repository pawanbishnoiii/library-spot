import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Dumbbell,
  Home,
  Building2,
  BedDouble,
  UtensilsCrossed,
  WashingMachine,
  Zap,
  Sparkles,
  LayoutGrid,
} from "lucide-react";

export const CATEGORIES = [
  { key: "library", label: "Library", icon: BookOpen, to: "/search?type=library", tint: "bg-violet-100 text-violet-600" },
  { key: "gym", label: "Gym", icon: Dumbbell, to: "/search?type=gym", tint: "bg-rose-100 text-rose-600" },
  { key: "pg", label: "PG", icon: Home, to: "/search?type=pg", tint: "bg-emerald-100 text-emerald-600" },
  { key: "hostel", label: "Hostel", icon: Building2, to: "/search?type=hostel", tint: "bg-amber-100 text-amber-600" },
  { key: "room", label: "Rooms", icon: BedDouble, to: "/search?type=room", tint: "bg-sky-100 text-sky-600" },
  { key: "tiffin", label: "Tiffin", icon: UtensilsCrossed, to: "/search?service=tiffin", tint: "bg-orange-100 text-orange-600" },
  { key: "laundry", label: "Washing", icon: WashingMachine, to: "/search?service=laundry", tint: "bg-cyan-100 text-cyan-600" },
  { key: "electrician", label: "Electrician", icon: Zap, to: "/search?service=electrician", tint: "bg-indigo-100 text-indigo-600" },
  { key: "cleaning", label: "Cleaning", icon: Sparkles, to: "/search?service=cleaning", tint: "bg-teal-100 text-teal-600" },
  { key: "more", label: "More", icon: LayoutGrid, to: "/search", tint: "bg-muted text-muted-foreground" },
];

const CategoryGrid = () => (
  <section aria-label="Browse categories" className="section-container py-4">
    <div className="grid grid-cols-5 gap-2 sm:gap-4 md:grid-cols-10">
      {CATEGORIES.map((cat, i) => (
        <motion.div
          key={cat.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03, duration: 0.25 }}
        >
          <Link
            to={cat.to}
            className="flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-transform active:scale-95"
          >
            <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${cat.tint}`}>
              <cat.icon className="h-6 w-6" />
            </span>
            <span className="text-center text-[11px] font-medium leading-tight">{cat.label}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  </section>
);

export default CategoryGrid;
