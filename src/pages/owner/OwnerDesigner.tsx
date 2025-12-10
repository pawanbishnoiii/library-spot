import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Palette, Save, Upload, Image, Trash2, GripVertical,
  Plus, Eye, Wand2, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const seatShapes = [
  { id: 'rounded', name: 'Rounded', preview: 'rounded-lg' },
  { id: 'square', name: 'Square', preview: 'rounded-none' },
  { id: 'pill', name: 'Pill', preview: 'rounded-full' },
  { id: 'circle', name: 'Circle', preview: 'rounded-full aspect-square' },
];

const colorPresets = [
  { name: 'Default', available: '#22c55e', booked: '#ef4444', selected: '#3b82f6', prebooked: '#eab308' },
  { name: 'Ocean', available: '#06b6d4', booked: '#f43f5e', selected: '#8b5cf6', prebooked: '#f59e0b' },
  { name: 'Forest', available: '#10b981', booked: '#dc2626', selected: '#0ea5e9', prebooked: '#fbbf24' },
  { name: 'Sunset', available: '#84cc16', booked: '#e11d48', selected: '#6366f1', prebooked: '#fb923c' },
];

const OwnerDesigner = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [library, setLibrary] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  
  const [seatTheme, setSeatTheme] = useState({
    seat_shape: 'rounded',
    seat_spacing: 4,
    row_spacing: 8,
    available_color: '#22c55e',
    booked_color: '#ef4444',
    selected_color: '#3b82f6',
    prebooked_color: '#eab308',
    disabled_color: '#6b7280',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch library
    const { data: libraryData } = await supabase
      .from("libraries")
      .select("*, seat_themes(*)")
      .eq("owner_id", user!.id)
      .single();

    if (libraryData) {
      setLibrary(libraryData);
      if (libraryData.seat_themes) {
        setSeatTheme({
          seat_shape: libraryData.seat_themes.seat_shape || 'rounded',
          seat_spacing: libraryData.seat_themes.seat_spacing || 4,
          row_spacing: libraryData.seat_themes.row_spacing || 8,
          available_color: libraryData.seat_themes.available_color || '#22c55e',
          booked_color: libraryData.seat_themes.booked_color || '#ef4444',
          selected_color: libraryData.seat_themes.selected_color || '#3b82f6',
          prebooked_color: libraryData.seat_themes.prebooked_color || '#eab308',
          disabled_color: libraryData.seat_themes.disabled_color || '#6b7280',
        });
      }

      // Fetch images
      const { data: imagesData } = await supabase
        .from("library_images")
        .select("*")
        .eq("library_id", libraryData.id)
        .order("display_order");

      if (imagesData) {
        setImages(imagesData);
      }
    }
    
    setIsLoading(false);
  };

  const handleSaveTheme = async () => {
    setIsSaving(true);
    
    // Update or create seat theme
    const { data: themeData, error: themeError } = await supabase
      .from("seat_themes")
      .upsert({
        id: library.theme_id || undefined,
        name: `${library.name} Theme`,
        ...seatTheme,
      })
      .select()
      .single();

    if (themeError) {
      toast({ title: "Error saving theme", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    // Update library with theme
    if (themeData && !library.theme_id) {
      await supabase
        .from("libraries")
        .update({ theme_id: themeData.id })
        .eq("id", library.id);
    }

    toast({ title: "Design saved successfully" });
    setIsSaving(false);
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setSeatTheme(prev => ({
      ...prev,
      available_color: preset.available,
      booked_color: preset.booked,
      selected_color: preset.selected,
      prebooked_color: preset.prebooked,
    }));
    toast({ title: `Applied ${preset.name} theme` });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !library) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${library.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('library-images')
      .upload(fileName, file);

    if (uploadError) {
      toast({ title: "Error uploading image", variant: "destructive" });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('library-images')
      .getPublicUrl(fileName);

    await supabase.from("library_images").insert({
      library_id: library.id,
      image_url: publicUrl,
      display_order: images.length,
    });

    toast({ title: "Image uploaded successfully" });
    fetchData();
  };

  const deleteImage = async (imageId: string) => {
    await supabase.from("library_images").delete().eq("id", imageId);
    setImages(prev => prev.filter(img => img.id !== imageId));
    toast({ title: "Image deleted" });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Library Designer">
        <div className="space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Library Designer">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Library Designer
            </h2>
            <p className="text-muted-foreground">Customize your library's appearance</p>
          </div>
          <Button onClick={handleSaveTheme} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Design'}
          </Button>
        </div>

        <Tabs defaultValue="seats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="seats">Seat Design</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="images">Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="seats" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Seat Shape */}
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <h3 className="font-semibold">Seat Shape</h3>
                <RadioGroup
                  value={seatTheme.seat_shape}
                  onValueChange={(value) => setSeatTheme(prev => ({ ...prev, seat_shape: value }))}
                  className="grid grid-cols-2 gap-4"
                >
                  {seatShapes.map((shape) => (
                    <Label
                      key={shape.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        seatTheme.seat_shape === shape.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value={shape.id} className="sr-only" />
                      <div 
                        className={`w-8 h-8 bg-success ${shape.preview}`}
                      />
                      <span>{shape.name}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Spacing */}
              <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
                <h3 className="font-semibold">Spacing</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Seat Spacing</Label>
                      <span className="text-sm text-muted-foreground">{seatTheme.seat_spacing}px</span>
                    </div>
                    <Slider
                      value={[seatTheme.seat_spacing]}
                      onValueChange={([value]) => setSeatTheme(prev => ({ ...prev, seat_spacing: value }))}
                      min={2}
                      max={12}
                      step={1}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Row Spacing</Label>
                      <span className="text-sm text-muted-foreground">{seatTheme.row_spacing}px</span>
                    </div>
                    <Slider
                      value={[seatTheme.row_spacing]}
                      onValueChange={([value]) => setSeatTheme(prev => ({ ...prev, row_spacing: value }))}
                      min={4}
                      max={20}
                      step={1}
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
                <h3 className="font-semibold mb-4">Preview</h3>
                <div className="flex flex-wrap justify-center p-8 bg-muted/50 rounded-xl">
                  {['A', 'B', 'C'].map((row) => (
                    <div 
                      key={row} 
                      className="flex items-center gap-2" 
                      style={{ marginBottom: `${seatTheme.row_spacing}px` }}
                    >
                      <span className="w-6 text-sm font-medium text-muted-foreground">{row}</span>
                      {[1, 2, 3, 4, 5].map((seat) => (
                        <motion.div
                          key={`${row}${seat}`}
                          whileHover={{ scale: 1.1 }}
                          className={`w-8 h-8 flex items-center justify-center text-xs font-medium text-white cursor-pointer ${
                            seatShapes.find(s => s.id === seatTheme.seat_shape)?.preview
                          }`}
                          style={{ 
                            backgroundColor: seat === 2 ? seatTheme.booked_color 
                              : seat === 3 ? seatTheme.selected_color 
                              : seat === 4 ? seatTheme.prebooked_color 
                              : seatTheme.available_color,
                            marginRight: `${seatTheme.seat_spacing}px`,
                          }}
                        >
                          {seat}
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: seatTheme.available_color }} />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: seatTheme.booked_color }} />
                    <span>Booked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: seatTheme.selected_color }} />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: seatTheme.prebooked_color }} />
                    <span>Pre-booked</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="colors" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Color Presets */}
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Quick Presets
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {colorPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      onClick={() => applyPreset(preset)}
                      className="h-auto p-3 flex-col gap-2"
                    >
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.available }} />
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.booked }} />
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.selected }} />
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.prebooked }} />
                      </div>
                      <span className="text-xs">{preset.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Custom Colors
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'available_color', label: 'Available' },
                    { key: 'booked_color', label: 'Booked' },
                    { key: 'selected_color', label: 'Selected' },
                    { key: 'prebooked_color', label: 'Pre-booked' },
                    { key: 'disabled_color', label: 'Disabled' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-4">
                      <Label className="w-24">{label}</Label>
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="color"
                          value={seatTheme[key as keyof typeof seatTheme] as string}
                          onChange={(e) => setSeatTheme(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-10 h-10 rounded cursor-pointer border-0"
                        />
                        <Input
                          value={seatTheme[key as keyof typeof seatTheme] as string}
                          onChange={(e) => setSeatTheme(prev => ({ ...prev, [key]: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Library Gallery</h3>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button variant="outline" className="gap-2 cursor-pointer" asChild>
                    <span>
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </span>
                  </Button>
                </label>
              </div>

              {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group aspect-video rounded-xl overflow-hidden"
                    >
                      <img
                        src={image.image_url}
                        alt={`Library image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => deleteImage(image.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {image.is_primary && (
                        <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          Primary
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                  <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No images yet. Upload your first image.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default OwnerDesigner;
