import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Settings, Save, Upload, MapPin, Phone, Mail, 
  Clock, CreditCard, Building2, Globe, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const OwnerSettings = () => {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [library, setLibrary] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contact_phone: '',
    whatsapp_number: '',
    contact_email: '',
    upi_id: '',
    map_lat: '',
    map_lng: '',
  });

  const [openingHours, setOpeningHours] = useState<Record<string, { open: string; close: string }>>({
    monday: { open: '06:00', close: '22:00' },
    tuesday: { open: '06:00', close: '22:00' },
    wednesday: { open: '06:00', close: '22:00' },
    thursday: { open: '06:00', close: '22:00' },
    friday: { open: '06:00', close: '22:00' },
    saturday: { open: '06:00', close: '22:00' },
    sunday: { open: '07:00', close: '20:00' },
  });

  useEffect(() => {
    if (user) {
      fetchLibrary();
    }
  }, [user]);

  const fetchLibrary = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("libraries")
      .select("*")
      .eq("owner_id", user!.id)
      .single();

    if (data) {
      setLibrary(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        contact_phone: data.contact_phone || '',
        whatsapp_number: data.whatsapp_number || '',
        contact_email: data.contact_email || '',
        upi_id: data.upi_id || '',
        map_lat: data.map_lat?.toString() || '',
        map_lng: data.map_lng?.toString() || '',
      });
      if (data.opening_hours && typeof data.opening_hours === 'object') {
        setOpeningHours(data.opening_hours as any);
      }
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const { error } = await supabase
      .from("libraries")
      .update({
        name: formData.name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        contact_phone: formData.contact_phone,
        whatsapp_number: formData.whatsapp_number,
        contact_email: formData.contact_email,
        upi_id: formData.upi_id,
        map_lat: formData.map_lat ? parseFloat(formData.map_lat) : null,
        map_lng: formData.map_lng ? parseFloat(formData.map_lng) : null,
        opening_hours: openingHours,
      })
      .eq("id", library.id);

    if (error) {
      toast({ title: "Error saving settings", variant: "destructive" });
    } else {
      toast({ title: "Settings saved successfully" });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Settings">
        <div className="space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!library) {
    return (
      <DashboardLayout title="Settings">
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">No library registered</p>
          <p className="text-muted-foreground">Register your library first</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Library Settings</h2>
            <p className="text-muted-foreground">Manage your library configuration</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="hours">Hours</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label>Library Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your Library Name"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your library..."
                    rows={4}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>State</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <Input
                      value={formData.pincode}
                      onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                      placeholder="Pincode"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <Label>WhatsApp Number</Label>
                  <Input
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                    placeholder="WhatsApp number with country code (e.g., 918285896680)"
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="Email address"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Map Latitude</Label>
                    <Input
                      value={formData.map_lat}
                      onChange={(e) => setFormData(prev => ({ ...prev, map_lat: e.target.value }))}
                      placeholder="e.g., 28.8955"
                    />
                  </div>
                  <div>
                    <Label>Map Longitude</Label>
                    <Input
                      value={formData.map_lng}
                      onChange={(e) => setFormData(prev => ({ ...prev, map_lng: e.target.value }))}
                      placeholder="e.g., 74.3269"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hours" className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              {Object.entries(openingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4">
                  <span className="w-24 font-medium capitalize">{day}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={hours.open}
                      onChange={(e) => setOpeningHours(prev => ({
                        ...prev,
                        [day]: { ...prev[day], open: e.target.value }
                      }))}
                      className="w-32"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={hours.close}
                      onChange={(e) => setOpeningHours(prev => ({
                        ...prev,
                        [day]: { ...prev[day], close: e.target.value }
                      }))}
                      className="w-32"
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
              <div>
                <Label>UPI ID</Label>
                <Input
                  value={formData.upi_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, upi_id: e.target.value }))}
                  placeholder="yourname@upi"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Students will see this UPI ID for payments
                </p>
              </div>

              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Payment Notice</p>
                  <p className="text-sm text-muted-foreground">
                    Students pay directly to your UPI. Mark payments as received manually in the Payments section.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default OwnerSettings;
