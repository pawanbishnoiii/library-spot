import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

interface Seat {
  id: string;
  row_label: string;
  seat_number: number;
  is_disabled: boolean;
  status?: "available" | "booked" | "selected" | "prebooked";
}

interface SeatMapProps {
  seats: Seat[];
  bookedSeats?: string[];
  prebookedSeats?: string[];
  selectedSeats: string[];
  onSeatSelect: (seatId: string) => void;
  theme?: {
    seat_shape: string;
    available_color: string;
    booked_color: string;
    selected_color: string;
    prebooked_color: string;
    disabled_color: string;
    seat_spacing: number;
    row_spacing: number;
  };
  readonly?: boolean;
}

const SeatMap = ({
  seats,
  bookedSeats = [],
  prebookedSeats = [],
  selectedSeats,
  onSeatSelect,
  theme,
  readonly = false,
}: SeatMapProps) => {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  const groupedSeats = useMemo(() => {
    const grouped: Record<string, Seat[]> = {};
    seats.forEach((seat) => {
      if (!grouped[seat.row_label]) {
        grouped[seat.row_label] = [];
      }
      grouped[seat.row_label].push(seat);
    });
    
    // Sort seats within each row
    Object.keys(grouped).forEach((row) => {
      grouped[row].sort((a, b) => a.seat_number - b.seat_number);
    });
    
    return grouped;
  }, [seats]);

  const rows = Object.keys(groupedSeats).sort();

  const getSeatStatus = (seat: Seat): "available" | "booked" | "selected" | "prebooked" | "disabled" => {
    if (seat.is_disabled) return "disabled";
    if (selectedSeats.includes(seat.id)) return "selected";
    if (bookedSeats.includes(seat.id)) return "booked";
    if (prebookedSeats.includes(seat.id)) return "prebooked";
    return "available";
  };

  const getSeatStyle = (status: string) => {
    const baseStyle = "transition-all duration-200 font-medium text-xs flex items-center justify-center";
    const shape = theme?.seat_shape === "square" ? "rounded-md" : theme?.seat_shape === "pill" ? "rounded-full" : "rounded-lg";
    
    switch (status) {
      case "available":
        return `${baseStyle} ${shape} bg-success/20 border-2 border-success text-success hover:bg-success hover:text-white hover:scale-110 cursor-pointer`;
      case "selected":
        return `${baseStyle} ${shape} bg-primary border-2 border-primary text-primary-foreground scale-110 shadow-lg animate-pulse-glow cursor-pointer`;
      case "booked":
        return `${baseStyle} ${shape} bg-destructive/20 border-2 border-destructive text-destructive cursor-not-allowed opacity-70`;
      case "prebooked":
        return `${baseStyle} ${shape} bg-warning/20 border-2 border-warning text-warning cursor-not-allowed`;
      case "disabled":
        return `${baseStyle} ${shape} bg-muted border-2 border-muted-foreground/30 text-muted-foreground cursor-not-allowed opacity-50`;
      default:
        return baseStyle;
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (readonly) return;
    const status = getSeatStatus(seat);
    if (status === "available" || status === "selected") {
      onSeatSelect(seat.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-success/20 border-2 border-success" />
          <span className="text-sm">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary border-2 border-primary" />
          <span className="text-sm">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-destructive/20 border-2 border-destructive" />
          <span className="text-sm">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-warning/20 border-2 border-warning" />
          <span className="text-sm">Pre-booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-muted border-2 border-muted-foreground/30 opacity-50" />
          <span className="text-sm">Unavailable</span>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="p-6 rounded-xl bg-card border border-border overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Screen/Front */}
          <div className="text-center mb-8">
            <div className="inline-block px-12 py-3 rounded-lg bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-glow">
              📖 READING AREA / FRONT
            </div>
            <div className="mt-2 mx-auto w-3/4 h-1 bg-gradient-primary/30 rounded-full" />
          </div>

          {/* Seats */}
          <div className="space-y-3" style={{ gap: theme?.row_spacing || 8 }}>
            {rows.map((row) => (
              <motion.div
                key={row}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4"
              >
                {/* Row Label */}
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {row}
                </div>

                {/* Seats */}
                <div
                  className="flex gap-2 flex-wrap"
                  style={{ gap: theme?.seat_spacing || 4 }}
                >
                  {groupedSeats[row].map((seat) => {
                    const status = getSeatStatus(seat);
                    const seatLabel = `${seat.row_label}${seat.seat_number}`;
                    
                    return (
                      <motion.button
                        key={seat.id}
                        whileHover={status === "available" || status === "selected" ? { scale: 1.1 } : {}}
                        whileTap={status === "available" || status === "selected" ? { scale: 0.95 } : {}}
                        onClick={() => handleSeatClick(seat)}
                        onMouseEnter={() => setHoveredSeat(seat.id)}
                        onMouseLeave={() => setHoveredSeat(null)}
                        className={`w-9 h-9 ${getSeatStyle(status)}`}
                        disabled={readonly || status === "booked" || status === "prebooked" || status === "disabled"}
                      >
                        {seat.seat_number}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Row Label (right) */}
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {row}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Back */}
          <div className="text-center mt-8">
            <div className="inline-block px-8 py-2 rounded-full bg-muted text-sm font-medium text-muted-foreground">
              🚪 ENTRANCE / BACK
            </div>
          </div>
        </div>
      </div>

      {/* Selected Seats Info */}
      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/30"
          >
            <Info className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-sm">
                {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} selected
              </p>
              <p className="text-xs text-muted-foreground">
                Seats: {seats.filter(s => selectedSeats.includes(s.id)).map(s => `${s.row_label}${s.seat_number}`).join(", ")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SeatMap;
