import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Armchair,
  Plus,
  Trash2,
  Save,
  Loader2,
  Palette,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Seat {
  id: string;
  row_label: string;
  seat_number: number;
  is_disabled: boolean;
}

interface SeatTheme {
  id: string;
  name: string;
  available_color: string;
  booked_color: string;
  selected_color: string;
  prebooked_color: string;
  disabled_color: string;
  seat_shape: string;
}

const OwnerSeats = () => {
  const { user } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [themes, setThemes] = useState<SeatTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [rows, setRows] = useState(5);
  const [seatsPerRow, setSeatsPerRow] = useState(10);
  const [disabledSeats, setDisabledSeats] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch library
      const { data: libraryData } = await supabase
        .from("libraries")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (libraryData) {
        setLibrary(libraryData);
        setRows(libraryData.total_rows || 5);
        setSeatsPerRow(libraryData.seats_per_row || 10);
        setSelectedTheme(libraryData.theme_id || "");

        // Fetch seats
        const { data: seatsData } = await supabase
          .from("seats")
          .select("*")
          .eq("library_id", libraryData.id);

        if (seatsData) {
          setSeats(seatsData);
          const disabled = new Set(
            seatsData.filter((s) => s.is_disabled).map((s) => `${s.row_label}-${s.seat_number}`)
          );
          setDisabledSeats(disabled);
        }
      }

      // Fetch themes
      const { data: themesData } = await supabase.from("seat_themes").select("*");
      if (themesData) {
        setThemes(themesData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSeatDisabled = (rowLabel: string, seatNumber: number) => {
    const key = `${rowLabel}-${seatNumber}`;
    setDisabledSeats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const generateSeats = () => {
    const newSeats: { row_label: string; seat_number: number; is_disabled: boolean }[] = [];
    for (let r = 0; r < rows; r++) {
      const rowLabel = String.fromCharCode(65 + r);
      for (let s = 1; s <= seatsPerRow; s++) {
        newSeats.push({
          row_label: rowLabel,
          seat_number: s,
          is_disabled: disabledSeats.has(`${rowLabel}-${s}`),
        });
      }
    }
    return newSeats;
  };

  const handleSave = async () => {
    if (!library) return;

    setIsSaving(true);
    try {
      // Delete existing seats
      await supabase.from("seats").delete().eq("library_id", library.id);

      // Create new seats
      const newSeats = generateSeats().map((seat) => ({
        ...seat,
        library_id: library.id,
      }));

      const { error: seatsError } = await supabase.from("seats").insert(newSeats);
      if (seatsError) throw seatsError;

      // Update library
      const { error: libraryError } = await supabase
        .from("libraries")
        .update({
          total_rows: rows,
          seats_per_row: seatsPerRow,
          total_seats: rows * seatsPerRow,
          theme_id: selectedTheme || null,
        })
        .eq("id", library.id);

      if (libraryError) throw libraryError;

      toast({ title: "Seats configuration saved!" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentTheme = themes.find((t) => t.id === selectedTheme);

  if (isLoading) {
    return (
      <DashboardLayout title="Manage Seats">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!library) {
    return (
      <DashboardLayout title="Manage Seats">
        <div className="text-center py-16">
          <Armchair className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-xl font-semibold mb-2">No Library Found</h3>
          <p className="text-muted-foreground mb-6">
            Please register your library first.
          </p>
          <Button asChild>
            <a href="/owner/library">Register Library</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Manage Seats">
      <div className="space-y-8">
        {/* Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h3 className="font-heading text-lg font-semibold mb-6 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary" />
            Seat Configuration
          </h3>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label>Number of Rows</Label>
              <Input
                type="number"
                min="1"
                max="26"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Seats per Row</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={seatsPerRow}
                onChange={(e) => setSeatsPerRow(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Seats</Label>
              <div className="h-10 px-3 rounded-md border border-border bg-muted flex items-center font-semibold">
                {rows * seatsPerRow}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Seat Theme</Label>
              <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Theme Preview */}
        {currentTheme && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Theme Preview: {currentTheme.name}
            </h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg"
                  style={{ backgroundColor: currentTheme.available_color }}
                />
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg"
                  style={{ backgroundColor: currentTheme.booked_color }}
                />
                <span className="text-sm">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg"
                  style={{ backgroundColor: currentTheme.selected_color }}
                />
                <span className="text-sm">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg"
                  style={{ backgroundColor: currentTheme.prebooked_color }}
                />
                <span className="text-sm">Pre-booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg"
                  style={{ backgroundColor: currentTheme.disabled_color }}
                />
                <span className="text-sm">Disabled</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Seat Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
              <Armchair className="w-5 h-5 text-primary" />
              Seat Layout
            </h3>
            <p className="text-sm text-muted-foreground">
              Click on a seat to enable/disable it
            </p>
          </div>

          {/* Screen */}
          <div className="mb-8">
            <div className="w-full max-w-lg mx-auto h-2 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
            <p className="text-center text-sm text-muted-foreground mt-2">ENTRANCE</p>
          </div>

          {/* Seats Grid */}
          <div className="overflow-x-auto">
            <div className="flex flex-col items-center gap-2 min-w-fit">
              {Array.from({ length: rows }).map((_, rowIndex) => {
                const rowLabel = String.fromCharCode(65 + rowIndex);
                return (
                  <div key={rowLabel} className="flex items-center gap-2">
                    <span className="w-8 text-center font-semibold text-muted-foreground">
                      {rowLabel}
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: seatsPerRow }).map((_, seatIndex) => {
                        const seatNumber = seatIndex + 1;
                        const isDisabled = disabledSeats.has(`${rowLabel}-${seatNumber}`);
                        return (
                          <button
                            key={seatNumber}
                            onClick={() => toggleSeatDisabled(rowLabel, seatNumber)}
                            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all hover:scale-110 ${
                              isDisabled
                                ? "bg-muted text-muted-foreground"
                                : "bg-success text-success-foreground"
                            }`}
                            title={`${rowLabel}${seatNumber} - ${isDisabled ? "Disabled" : "Available"}`}
                          >
                            {seatNumber}
                          </button>
                        );
                      })}
                    </div>
                    <span className="w-8 text-center font-semibold text-muted-foreground">
                      {rowLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-center">
            <Button onClick={handleSave} disabled={isSaving} size="lg">
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default OwnerSeats;
