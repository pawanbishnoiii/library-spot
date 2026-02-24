import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2, MapPin, Phone, Mail, Wifi, Snowflake, Car, Shield, Users, Save, Loader2, Upload, X, Image as ImageIcon,
  BookOpen, Home, BedDouble, Utensils, Droplets, Dumbbell, Tv, Fan, Zap, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const facilitiesOptions = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "ac", label: "AC", icon: Snowflake },
  { id: "parking", label: "Parking", icon: Car },
  { id: "silent_zone", label: "Silent Zone", icon: Users },
  { id: "power_backup", label: "Power Backup", icon: Zap },
  { id: "cctv", label: "CCTV", icon: Shield },
  { id: "food", label: "Food", icon: Utensils },
  { id: "laundry", label: "Laundry", icon: Droplets },
  { id: "gym", label: "Gym", icon: Dumbbell },
  { id: "tv", label: "TV/Common Area", icon: Tv },
  { id: "fan", label: "Fan", icon: Fan },
  { id: "attached_bath", label: "Attached Bath", icon: Droplets },
];

const propertyTypeOptions = [
  { id: "library", label: "Library / Study Space", icon: BookOpen },
  { id: "pg", label: "PG / Hostel", icon: Home },
  { id: "hotel", label: "Hotel / Rooms", icon: BedDouble },
];

const genderOptions = [
  { id: "co-ed", label: "Co-Ed (All)" },
  { id: "boys", label: "Boys Only" },
  { id: "girls", label: "Girls Only" },
];

const OwnerLibrary = () => {
  const { user } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [images, setImages] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState({
    name: "", description: "", address: "", city: "", state: "", pincode: "",
    contact_phone: "", contact_email: "", whatsapp_number: "", upi_id: "",
    map_lat: "", map_lng: "",
    facilities: [] as string[],
    property_type: "library",
    gender_preference: "co-ed",
    total_rows: 5, seats_per_row: 10,
  });

  useEffect(() => { if (user) fetchLibrary(); }, [user]);

  const fetchLibrary = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.from("libraries").select("*").eq("owner_id", user!.id).maybeSingle();
      if (data) {
        setLibrary(data);
        setFormData({
          name: data.name || "", description: data.description || "",
          address: data.address || "", city: data.city || "", state: data.state || "", pincode: data.pincode || "",
          contact_phone: data.contact_phone || "", contact_email: data.contact_email || "",
          whatsapp_number: data.whatsapp_number || "", upi_id: data.upi_id || "",
          map_lat: data.map_lat?.toString() || "", map_lng: data.map_lng?.toString() || "",
          facilities: (data.facilities as string[]) || [],
          property_type: data.property_type || "library",
          gender_preference: data.gender_preference || "co-ed",
          total_rows: data.total_rows || 5, seats_per_row: data.seats_per_row || 10,
        });
        // Fetch images
        const { data: imgs } = await supabase.from("library_images").select("*").eq("library_id", data.id).order("display_order");
        if (imgs) setImages(imgs);
      }
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleFacility = (id: string) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(id) ? prev.facilities.filter(f => f !== id) : [...prev.facilities, id],
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !library) return;
    setUploadingImage(true);
    try {
      for (const file of Array.from(e.target.files)) {
        const ext = file.name.split(".").pop();
        const path = `${library.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("library-images").upload(path, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("library-images").getPublicUrl(path);
        await supabase.from("library_images").insert({ library_id: library.id, image_url: publicUrl, display_order: images.length });
      }
      toast({ title: "Images uploaded!" });
      fetchLibrary();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally { setUploadingImage(false); }
  };

  const handleDeleteImage = async (imageId: string) => {
    await supabase.from("library_images").delete().eq("id", imageId);
    setImages(prev => prev.filter(i => i.id !== imageId));
    toast({ title: "Image removed" });
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !library) return;
    setUploadingImage(true);
    try {
      const file = e.target.files[0];
      const ext = file.name.split(".").pop();
      const path = `${library.id}/banner.${ext}`;
      await supabase.storage.from("library-images").upload(path, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("library-images").getPublicUrl(path);
      await supabase.from("libraries").update({ banner_url: publicUrl }).eq("id", library.id);
      toast({ title: "Banner updated!" });
      fetchLibrary();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setUploadingImage(false); }
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !library) return;
    setUploadingImage(true);
    try {
      const file = e.target.files[0];
      const ext = file.name.split(".").pop();
      const path = `${library.id}/profile.${ext}`;
      await supabase.storage.from("library-images").upload(path, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("library-images").getPublicUrl(path);
      await supabase.from("libraries").update({ profile_url: publicUrl }).eq("id", library.id);
      toast({ title: "Profile image updated!" });
      fetchLibrary();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setUploadingImage(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const rows = Math.min(Math.max(parseInt(String(formData.total_rows)) || 1, 1), 26);
      const perRow = Math.min(Math.max(parseInt(String(formData.seats_per_row)) || 1, 1), 50);
      
      const libraryData: any = {
        name: formData.name, description: formData.description,
        address: formData.address, city: formData.city, state: formData.state, pincode: formData.pincode,
        contact_phone: formData.contact_phone, contact_email: formData.contact_email,
        whatsapp_number: formData.whatsapp_number, upi_id: formData.upi_id,
        map_lat: formData.map_lat ? parseFloat(formData.map_lat) : null,
        map_lng: formData.map_lng ? parseFloat(formData.map_lng) : null,
        facilities: formData.facilities,
        property_type: formData.property_type,
        gender_preference: formData.gender_preference,
        owner_id: user.id, slug,
      };

      if (formData.property_type === "library") {
        libraryData.total_rows = rows;
        libraryData.seats_per_row = perRow;
        libraryData.total_seats = rows * perRow;
      }

      if (library) {
        const { error } = await supabase.from("libraries").update(libraryData).eq("id", library.id);
        if (error) throw error;
        toast({ title: "Property updated!" });
      } else {
        const { error } = await supabase.from("libraries").insert([libraryData]);
        if (error) throw error;
        toast({ title: "Property registered!" });
      }
      fetchLibrary();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  if (isLoading) {
    return <DashboardLayout title="My Property"><div className="space-y-6"><Skeleton className="h-64 w-full rounded-2xl" /><Skeleton className="h-96 w-full rounded-2xl" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout title="My Property">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4 mb-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="facilities">Facilities</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              {/* Property Type */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" />Property Type</h3>
                <div className="grid grid-cols-3 gap-3">
                  {propertyTypeOptions.map(type => (
                    <button key={type.id} type="button" onClick={() => setFormData(prev => ({ ...prev, property_type: type.id }))}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${formData.property_type === type.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <type.icon className={`w-8 h-8 mx-auto mb-2 ${formData.property_type === type.id ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="text-sm font-medium">{type.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Info */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-heading text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="name">Property Name *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Knowledge Hub Library" required />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe your property..." rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender Preference</Label>
                    <Select value={formData.gender_preference} onValueChange={v => setFormData(prev => ({ ...prev, gender_preference: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{genderOptions.map(g => <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact & Payment */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2"><Phone className="w-5 h-5 text-primary" />Contact & Payment</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Phone</Label><Input name="contact_phone" value={formData.contact_phone} onChange={handleChange} placeholder="+91 98765 43210" /></div>
                  <div className="space-y-2"><Label>WhatsApp</Label><Input name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} placeholder="+91 98765 43210" /></div>
                  <div className="space-y-2"><Label>Email</Label><Input name="contact_email" type="email" value={formData.contact_email} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label>UPI ID</Label><Input name="upi_id" value={formData.upi_id} onChange={handleChange} placeholder="name@upi" /></div>
                </div>
              </div>

              {/* Seat Config - only for library */}
              {formData.property_type === "library" && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Seat Configuration</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Rows (1-26)</Label><Input name="total_rows" type="number" min="1" max="26" value={formData.total_rows} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Seats per Row (1-50)</Label><Input name="seats_per_row" type="number" min="1" max="50" value={formData.seats_per_row} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label>Total Seats</Label><div className="h-10 px-3 rounded-md border border-border bg-muted flex items-center font-semibold">{(parseInt(String(formData.total_rows)) || 0) * (parseInt(String(formData.seats_per_row)) || 0)}</div></div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="location" className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" />Location</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2"><Label>Full Address *</Label><Input name="address" value={formData.address} onChange={handleChange} required /></div>
                  <div className="space-y-2"><Label>City *</Label><Input name="city" value={formData.city} onChange={handleChange} required /></div>
                  <div className="space-y-2"><Label>State *</Label><Input name="state" value={formData.state} onChange={handleChange} required /></div>
                  <div className="space-y-2"><Label>Pincode *</Label><Input name="pincode" value={formData.pincode} onChange={handleChange} required /></div>
                  <div className="space-y-2"><Label>Latitude</Label><Input name="map_lat" value={formData.map_lat} onChange={handleChange} placeholder="28.6139" /></div>
                  <div className="space-y-2"><Label>Longitude</Label><Input name="map_lng" value={formData.map_lng} onChange={handleChange} placeholder="77.2090" /></div>
                </div>
                {formData.map_lat && formData.map_lng && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-border h-48">
                    <iframe
                      width="100%" height="100%" style={{ border: 0 }} loading="lazy"
                      src={`https://maps.google.com/maps?q=${formData.map_lat},${formData.map_lng}&z=15&output=embed`}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="facilities" className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Facilities & Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {facilitiesOptions.map(f => (
                    <label key={f.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.facilities.includes(f.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <Checkbox checked={formData.facilities.includes(f.id)} onCheckedChange={() => toggleFacility(f.id)} />
                      <f.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-6">
              {library ? (
                <>
                  {/* Banner */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2"><Camera className="w-5 h-5 text-primary" />Banner Image</h3>
                    {library.banner_url && <img src={library.banner_url} alt="Banner" className="w-full h-40 object-cover rounded-xl mb-4" />}
                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border cursor-pointer hover:border-primary transition-colors">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{uploadingImage ? "Uploading..." : "Upload Banner"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={uploadingImage} />
                    </label>
                  </div>

                  {/* Profile Image */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-heading text-lg font-semibold mb-4">Profile Image</h3>
                    <div className="flex items-center gap-4">
                      {library.profile_url ? (
                        <img src={library.profile_url} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center"><ImageIcon className="w-8 h-8 text-muted-foreground" /></div>
                      )}
                      <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border cursor-pointer hover:border-primary transition-colors">
                        <Upload className="w-4 h-4" /><span className="text-sm">{uploadingImage ? "Uploading..." : "Change"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleProfileUpload} disabled={uploadingImage} />
                      </label>
                    </div>
                  </div>

                  {/* Gallery */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-heading text-lg font-semibold mb-4">Gallery Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {images.map(img => (
                        <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-square">
                          <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => handleDeleteImage(img.id)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className="flex items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{uploadingImage ? "Uploading..." : "Add Photos"}</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                  </div>
                </>
              ) : (
                <div className="bg-card rounded-2xl border border-border p-12 text-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Save your property first, then upload images.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Button type="submit" className="w-full h-12" disabled={isSaving}>
            {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />{library ? "Update Property" : "Register Property"}</>}
          </Button>
        </form>
      </motion.div>
    </DashboardLayout>
  );
};

export default OwnerLibrary;
