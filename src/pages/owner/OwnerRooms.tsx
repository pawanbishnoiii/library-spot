import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Bed,
  Users,
  Trash2,
  Edit,
  Snowflake,
  Wifi,
  Bath,
  X,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Room {
  id: string;
  name: string;
  room_type: string;
  max_persons: number;
  current_occupancy: number;
  price_per_bed: number;
  monthly_price: number;
  floor_number: number;
  has_attached_bath: boolean;
  has_ac: boolean;
  has_wifi: boolean;
  has_balcony: boolean;
  has_wardrobe: boolean;
  has_study_table: boolean;
  extra_requirements: string | null;
  permissions: string | null;
  policies: string | null;
  is_available: boolean;
  is_disabled: boolean;
  beds?: any[];
}

const roomTypes = [
  { value: "single", label: "Single" },
  { value: "shared", label: "Shared" },
  { value: "double", label: "Double" },
  { value: "triple", label: "Triple" },
  { value: "dormitory", label: "Dormitory" },
];

const OwnerRooms = () => {
  const { user } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    room_type: "shared",
    max_persons: 2,
    price_per_bed: 0,
    monthly_price: 0,
    floor_number: 0,
    has_attached_bath: false,
    has_ac: false,
    has_wifi: true,
    has_balcony: false,
    has_wardrobe: true,
    has_study_table: true,
    extra_requirements: "",
    permissions: "",
    policies: "",
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: lib } = await supabase
      .from("libraries")
      .select("*")
      .eq("owner_id", user!.id)
      .maybeSingle();

    if (lib) {
      setLibrary(lib);
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("*, beds(*)")
        .eq("library_id", lib.id)
        .order("floor_number", { ascending: true });

      if (roomsData) setRooms(roomsData);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "", room_type: "shared", max_persons: 2, price_per_bed: 0,
      monthly_price: 0, floor_number: 0, has_attached_bath: false,
      has_ac: false, has_wifi: true, has_balcony: false,
      has_wardrobe: true, has_study_table: true,
      extra_requirements: "", permissions: "", policies: "",
    });
    setEditingRoom(null);
    setShowAddRoom(false);
  };

  const handleSaveRoom = async () => {
    if (!library) return;
    if (!formData.name) {
      toast({ title: "Room name is required", variant: "destructive" });
      return;
    }

    if (editingRoom) {
      const { error } = await supabase
        .from("rooms")
        .update({ ...formData })
        .eq("id", editingRoom.id);

      if (error) {
        toast({ title: "Error updating room", variant: "destructive" });
        return;
      }
      toast({ title: "Room updated successfully" });
    } else {
      const { data: newRoom, error } = await supabase
        .from("rooms")
        .insert({ ...formData, library_id: library.id })
        .select()
        .single();

      if (error) {
        toast({ title: "Error adding room", variant: "destructive" });
        return;
      }

      // Auto-create beds
      if (newRoom) {
        const beds = Array.from({ length: formData.max_persons }, (_, i) => ({
          room_id: newRoom.id,
          library_id: library.id,
          bed_number: i + 1,
          bed_type: "single",
        }));
        await supabase.from("beds").insert(beds);
      }
      toast({ title: "Room added with beds!" });
    }

    resetForm();
    fetchData();
  };

  const handleDeleteRoom = async (roomId: string) => {
    await supabase.from("rooms").delete().eq("id", roomId);
    toast({ title: "Room deleted" });
    fetchData();
  };

  const handleEditRoom = (room: Room) => {
    setFormData({
      name: room.name,
      room_type: room.room_type,
      max_persons: room.max_persons,
      price_per_bed: room.price_per_bed,
      monthly_price: room.monthly_price,
      floor_number: room.floor_number,
      has_attached_bath: room.has_attached_bath,
      has_ac: room.has_ac,
      has_wifi: room.has_wifi,
      has_balcony: room.has_balcony,
      has_wardrobe: room.has_wardrobe,
      has_study_table: room.has_study_table,
      extra_requirements: room.extra_requirements || "",
      permissions: room.permissions || "",
      policies: room.policies || "",
    });
    setEditingRoom(room);
    setShowAddRoom(true);
  };

  const toggleBedStatus = async (bedId: string, isDisabled: boolean) => {
    await supabase.from("beds").update({ is_disabled: !isDisabled }).eq("id", bedId);
    fetchData();
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Rooms & Beds">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (!library) {
    return (
      <DashboardLayout title="Rooms & Beds">
        <div className="text-center py-16">
          <Bed className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading text-xl font-semibold mb-2">No Property Found</h3>
          <p className="text-muted-foreground">Register your property first.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Rooms & Beds">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-primary">{rooms.length}</p>
            <p className="text-sm text-muted-foreground">Total Rooms</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-info">
              {rooms.reduce((s, r) => s + (r.beds?.length || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Beds</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-success">
              {rooms.reduce((s, r) => s + (r.beds?.filter((b: any) => !b.is_occupied && !b.is_disabled).length || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground">Available Beds</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-warning">
              {rooms.reduce((s, r) => s + (r.beds?.filter((b: any) => b.is_occupied).length || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground">Occupied Beds</p>
          </div>
        </div>

        {/* Add Room Button */}
        <Button onClick={() => setShowAddRoom(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Add Room
        </Button>

        {/* Add/Edit Room Form */}
        <AnimatePresence>
          {showAddRoom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-semibold">
                    {editingRoom ? "Edit Room" : "Add New Room"}
                  </h3>
                  <button onClick={resetForm}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Room Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Room 101"
                    />
                  </div>
                  <div>
                    <Label>Room Type</Label>
                    <select
                      value={formData.room_type}
                      onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                    >
                      {roomTypes.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Max Persons</Label>
                    <Input
                      type="number"
                      value={formData.max_persons}
                      onChange={(e) => setFormData({ ...formData, max_persons: parseInt(e.target.value) || 1 })}
                      min={1}
                    />
                  </div>
                  <div>
                    <Label>Price per Bed (₹/day)</Label>
                    <Input
                      type="number"
                      value={formData.price_per_bed}
                      onChange={(e) => setFormData({ ...formData, price_per_bed: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Monthly Price (₹)</Label>
                    <Input
                      type="number"
                      value={formData.monthly_price}
                      onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Floor Number</Label>
                    <Input
                      type="number"
                      value={formData.floor_number}
                      onChange={(e) => setFormData({ ...formData, floor_number: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <Label className="mb-3 block">Amenities</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { key: "has_ac", label: "AC", icon: Snowflake },
                      { key: "has_wifi", label: "WiFi", icon: Wifi },
                      { key: "has_attached_bath", label: "Attached Bath", icon: Bath },
                      { key: "has_balcony", label: "Balcony", icon: Bed },
                      { key: "has_wardrobe", label: "Wardrobe", icon: Bed },
                      { key: "has_study_table", label: "Study Table", icon: Bed },
                    ].map((amenity) => (
                      <div key={amenity.key} className="flex items-center gap-2">
                        <Switch
                          checked={(formData as any)[amenity.key]}
                          onCheckedChange={(v) => setFormData({ ...formData, [amenity.key]: v })}
                        />
                        <Label className="cursor-pointer">{amenity.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Policies & Requirements */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Extra Requirements</Label>
                    <Textarea
                      value={formData.extra_requirements}
                      onChange={(e) => setFormData({ ...formData, extra_requirements: e.target.value })}
                      placeholder="ID proof required, etc."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Permissions</Label>
                    <Textarea
                      value={formData.permissions}
                      onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                      placeholder="Visitors allowed till 9PM, etc."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Policies</Label>
                    <Textarea
                      value={formData.policies}
                      onChange={(e) => setFormData({ ...formData, policies: e.target.value })}
                      placeholder="No smoking, no pets, etc."
                      rows={3}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveRoom} className="btn-primary gap-2">
                  <Save className="w-4 h-4" />
                  {editingRoom ? "Update Room" : "Add Room"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rooms List */}
        <div className="space-y-4">
          {rooms.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <Bed className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No rooms added yet</p>
            </div>
          ) : (
            rooms.map((room) => (
              <motion.div
                key={room.id}
                layout
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                {/* Room Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedRoom(expandedRoom === room.id ? null : room.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Bed className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{room.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">{room.room_type}</Badge>
                        <span>Floor {room.floor_number}</span>
                        <span>·</span>
                        <Users className="w-3 h-3" />
                        <span>{room.beds?.filter((b: any) => b.is_occupied).length || 0}/{room.max_persons}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="font-semibold text-primary">₹{room.monthly_price}/mo</p>
                      <p className="text-xs text-muted-foreground">₹{room.price_per_bed}/day</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {room.has_ac && <Snowflake className="w-4 h-4 text-info" />}
                      {room.has_wifi && <Wifi className="w-4 h-4 text-primary" />}
                      {room.has_attached_bath && <Bath className="w-4 h-4 text-success" />}
                    </div>
                    {expandedRoom === room.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedRoom === room.id && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                        {/* Beds Grid */}
                        <div>
                          <h5 className="text-sm font-semibold mb-3">Beds</h5>
                          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                            {room.beds?.map((bed: any) => (
                              <button
                                key={bed.id}
                                onClick={() => toggleBedStatus(bed.id, bed.is_disabled)}
                                className={`p-2 rounded-lg text-center text-xs font-medium transition-all ${
                                  bed.is_disabled
                                    ? "bg-muted text-muted-foreground"
                                    : bed.is_occupied
                                    ? "bg-destructive/10 text-destructive border border-destructive/30"
                                    : "bg-success/10 text-success border border-success/30 hover:bg-success/20"
                                }`}
                              >
                                <Bed className="w-4 h-4 mx-auto mb-1" />
                                B{bed.bed_number}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-3 rounded bg-success/20 border border-success/30" /> Available
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-3 rounded bg-destructive/10 border border-destructive/30" /> Occupied
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-3 rounded bg-muted" /> Disabled
                            </span>
                          </div>
                        </div>

                        {/* Policies */}
                        {(room.extra_requirements || room.permissions || room.policies) && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            {room.extra_requirements && (
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="font-medium text-xs mb-1">Requirements</p>
                                <p className="text-muted-foreground text-xs">{room.extra_requirements}</p>
                              </div>
                            )}
                            {room.permissions && (
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="font-medium text-xs mb-1">Permissions</p>
                                <p className="text-muted-foreground text-xs">{room.permissions}</p>
                              </div>
                            )}
                            {room.policies && (
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="font-medium text-xs mb-1">Policies</p>
                                <p className="text-muted-foreground text-xs">{room.policies}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditRoom(room)}>
                            <Edit className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDeleteRoom(room.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OwnerRooms;
