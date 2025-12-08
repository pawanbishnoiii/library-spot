import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Wifi,
  Snowflake,
  Car,
  Shield,
  Users,
  Clock,
  Save,
  Loader2,
  Plus,
  X,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const facilitiesOptions = [
  { id: "wifi", label: "High-Speed WiFi", icon: Wifi },
  { id: "ac", label: "AC Rooms", icon: Snowflake },
  { id: "parking", label: "Free Parking", icon: Car },
  { id: "silent_zone", label: "Silent Zone", icon: Users },
  { id: "power_backup", label: "Power Backup", icon: Shield },
  { id: "cctv", label: "CCTV Security", icon: Shield },
];

const OwnerLibrary = () => {
  const { user } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    contact_phone: "",
    contact_email: "",
    whatsapp_number: "",
    upi_id: "",
    map_lat: "",
    map_lng: "",
    facilities: [] as string[],
    total_rows: 5,
    seats_per_row: 10,
  });

  useEffect(() => {
    if (user) {
      fetchLibrary();
    }
  }, [user]);

  const fetchLibrary = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("libraries")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (data) {
        setLibrary(data);
        setFormData({
          name: data.name || "",
          description: data.description || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
          contact_phone: data.contact_phone || "",
          contact_email: data.contact_email || "",
          whatsapp_number: data.whatsapp_number || "",
          upi_id: data.upi_id || "",
          map_lat: data.map_lat?.toString() || "",
          map_lng: data.map_lng?.toString() || "",
          facilities: (data.facilities as string[]) || [],
          total_rows: data.total_rows || 5,
          seats_per_row: data.seats_per_row || 10,
        });
      }
    } catch (error) {
      console.error("Error fetching library:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleFacility = (facilityId: string) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(facilityId)
        ? prev.facilities.filter((f) => f !== facilityId)
        : [...prev.facilities, facilityId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const libraryData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        whatsapp_number: formData.whatsapp_number,
        upi_id: formData.upi_id,
        map_lat: formData.map_lat ? parseFloat(formData.map_lat) : null,
        map_lng: formData.map_lng ? parseFloat(formData.map_lng) : null,
        facilities: formData.facilities,
        total_rows: formData.total_rows,
        seats_per_row: formData.seats_per_row,
        total_seats: formData.total_rows * formData.seats_per_row,
        owner_id: user.id,
      };

      if (library) {
        const { error } = await supabase
          .from("libraries")
          .update(libraryData)
          .eq("id", library.id);

        if (error) throw error;
        toast({ title: "Library updated successfully" });
      } else {
        const { error } = await supabase.from("libraries").insert([libraryData]);

        if (error) throw error;
        toast({ title: "Library registered successfully" });
      }

      fetchLibrary();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save library",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="My Library">
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Library">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading text-lg font-semibold mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Basic Information
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="name">Library Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Knowledge Hub Library"
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="A premium study space with state-of-the-art facilities..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading text-lg font-semibold mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Location
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address">Full Address *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Study Lane, Sector 15"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="New Delhi"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Delhi"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="110001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="map_lat">Latitude</Label>
                <Input
                  id="map_lat"
                  name="map_lat"
                  value={formData.map_lat}
                  onChange={handleChange}
                  placeholder="28.6139"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="map_lng">Longitude</Label>
                <Input
                  id="map_lng"
                  name="map_lng"
                  value={formData.map_lng}
                  onChange={handleChange}
                  placeholder="77.2090"
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading text-lg font-semibold mb-6 flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Contact & Payments
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Phone Number</Label>
                <Input
                  id="contact_phone"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                <Input
                  id="whatsapp_number"
                  name="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  placeholder="library@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upi_id">UPI ID (for payments)</Label>
                <Input
                  id="upi_id"
                  name="upi_id"
                  value={formData.upi_id}
                  onChange={handleChange}
                  placeholder="yourname@upi"
                />
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading text-lg font-semibold mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Facilities
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {facilitiesOptions.map((facility) => (
                <label
                  key={facility.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    formData.facilities.includes(facility.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Checkbox
                    checked={formData.facilities.includes(facility.id)}
                    onCheckedChange={() => toggleFacility(facility.id)}
                  />
                  <facility.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{facility.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Seat Configuration */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading text-lg font-semibold mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Seat Configuration
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="total_rows">Number of Rows</Label>
                <Input
                  id="total_rows"
                  name="total_rows"
                  type="number"
                  min="1"
                  max="26"
                  value={formData.total_rows}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seats_per_row">Seats per Row</Label>
                <Input
                  id="seats_per_row"
                  name="seats_per_row"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.seats_per_row}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Seats</Label>
                <div className="h-10 px-3 rounded-md border border-border bg-muted flex items-center font-semibold">
                  {formData.total_rows * formData.seats_per_row}
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full h-12" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {library ? "Update Library" : "Register Library"}
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </DashboardLayout>
  );
};

export default OwnerLibrary;
