import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  Save,
  Loader2,
  IndianRupee,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  price_per_seat: number;
  monthly_price: number | null;
  discount_percent: number | null;
  is_active: boolean;
}

const OwnerShifts = () => {
  const { user } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    start_time: "06:00",
    end_time: "12:00",
    price_per_seat: 50,
    monthly_price: 1500,
    discount_percent: 0,
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: libraryData } = await supabase
        .from("libraries")
        .select("id")
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (libraryData) {
        setLibrary(libraryData);

        const { data: shiftsData } = await supabase
          .from("shifts")
          .select("*")
          .eq("library_id", libraryData.id)
          .order("start_time", { ascending: true });

        if (shiftsData) {
          setShifts(shiftsData);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!library) return;

    setIsSaving(true);
    try {
      const shiftData = {
        name: formData.name,
        start_time: formData.start_time,
        end_time: formData.end_time,
        price_per_seat: formData.price_per_seat,
        monthly_price: formData.monthly_price,
        discount_percent: formData.discount_percent,
        is_active: formData.is_active,
      };

      if (editingShift) {
        const { error } = await supabase
          .from("shifts")
          .update(shiftData)
          .eq("id", editingShift.id);

        if (error) throw error;
        toast({ title: "Shift updated" });
      } else {
        const { error } = await supabase.from("shifts").insert({
          ...shiftData,
          library_id: library.id,
        });

        if (error) throw error;
        toast({ title: "Shift added" });
      }

      setIsDialogOpen(false);
      setEditingShift(null);
      resetForm();
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

  const resetForm = () => {
    setFormData({
      name: "",
      start_time: "06:00",
      end_time: "12:00",
      price_per_seat: 50,
      monthly_price: 1500,
      discount_percent: 0,
      is_active: true,
    });
  };

  const handleDelete = async (shiftId: string) => {
    try {
      const { error } = await supabase.from("shifts").delete().eq("id", shiftId);
      if (error) throw error;
      toast({ title: "Shift removed" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      price_per_seat: shift.price_per_seat,
      monthly_price: shift.monthly_price || 0,
      discount_percent: shift.discount_percent || 0,
      is_active: shift.is_active,
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingShift(null);
    resetForm();
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Manage Shifts">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (!library) {
    return (
      <DashboardLayout title="Manage Shifts">
        <div className="text-center py-16">
          <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
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
    <DashboardLayout title="Manage Shifts">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h2 className="font-heading text-xl font-semibold">Library Shifts</h2>
            <p className="text-muted-foreground">
              Set up shifts with pricing for your library
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Shift
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingShift ? "Edit Shift" : "Add New Shift"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Shift Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Morning Shift"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_per_seat">Daily Price (₹)</Label>
                    <Input
                      id="price_per_seat"
                      type="number"
                      min="0"
                      value={formData.price_per_seat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price_per_seat: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly_price">Monthly Price (₹)</Label>
                    <Input
                      id="monthly_price"
                      type="number"
                      min="0"
                      value={formData.monthly_price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthly_price: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_percent">Discount (%)</Label>
                  <Input
                    id="discount_percent"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_percent: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {editingShift ? "Update" : "Add"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Shifts List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4"
        >
          {shifts.length > 0 ? (
            shifts.map((shift) => (
              <div
                key={shift.id}
                className={`bg-card rounded-xl border border-border p-6 ${
                  !shift.is_active ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{shift.name}</h3>
                      {!shift.is_active && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {shift.start_time} - {shift.end_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{shift.price_per_seat}</span>
                        <span className="text-muted-foreground text-sm">/day</span>
                      </div>
                      {shift.monthly_price && (
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-4 h-4 text-success" />
                          <span className="font-semibold">{shift.monthly_price}</span>
                          <span className="text-muted-foreground text-sm">/month</span>
                        </div>
                      )}
                      {shift.discount_percent && shift.discount_percent > 0 && (
                        <div className="flex items-center gap-1 text-warning">
                          <Percent className="w-4 h-4" />
                          <span className="font-semibold">{shift.discount_percent}% off</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(shift)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(shift.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No shifts yet</h3>
              <p className="text-muted-foreground mb-4">
                Add shifts to set operating hours and pricing
              </p>
              <Button onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Shift
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default OwnerShifts;
