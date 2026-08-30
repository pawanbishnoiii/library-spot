import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send, Image as ImageIcon, Loader2, Bell, Smartphone, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Campaign {
  id: string;
  title: string;
  body: string;
  banner_url: string | null;
  tag: string | null;
  action_url: string | null;
  audience: string;
  source: string;
  status: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

const AdminPushNotifications = () => {
  const [form, setForm] = useState({
    title: "",
    body: "",
    tag: "",
    action_url: "",
    audience: "all",
    audience_city: "",
    radius_km: 30,
    audience_lat: "",
    audience_lng: "",
  });
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const [{ data: campaignData }, { count }] = await Promise.all([
      supabase.from("push_campaigns").select("*").order("created_at", { ascending: false }).limit(30),
      supabase.from("push_devices").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);
    setCampaigns((campaignData as Campaign[]) ?? []);
    setDeviceCount(count ?? 0);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBannerUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Image too large", description: "Max 5MB allowed." });
      return;
    }
    setIsUploading(true);
    const path = `push-banners/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;
    const { error } = await supabase.storage.from("library-images").upload(path, file, { upsert: true });
    if (error) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } else {
      const { data } = supabase.storage.from("library-images").getPublicUrl(path);
      setBannerUrl(data.publicUrl);
      toast({ title: "Banner uploaded" });
    }
    setIsUploading(false);
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast({ variant: "destructive", title: "Title and description are required" });
      return;
    }
    setIsSending(true);
    const { data, error } = await supabase.functions.invoke("send-push", {
      body: {
        title: form.title.trim(),
        body: form.body.trim(),
        banner_url: bannerUrl,
        tag: form.tag.trim() || null,
        action_url: form.action_url.trim() || null,
        audience: form.audience,
        audience_city: form.audience === "city" ? form.audience_city.trim() : null,
        audience_lat: form.audience === "nearby" ? Number(form.audience_lat) : null,
        audience_lng: form.audience === "nearby" ? Number(form.audience_lng) : null,
        radius_km: Number(form.radius_km) || 30,
      },
    });
    setIsSending(false);

    if (error) {
      toast({ variant: "destructive", title: "Push failed", description: error.message });
      return;
    }
    toast({
      title: "Notification sent",
      description: `${data?.sent ?? 0} devices reached${data?.failed ? `, ${data.failed} failed` : ""}.`,
    });
    setForm({ ...form, title: "", body: "", tag: "", action_url: "" });
    setBannerUrl(null);
    loadData();
  };

  return (
    <DashboardLayout title="Push Notifications">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Push Notifications</h2>
            <p className="text-muted-foreground">Broadcast updates to subscribed devices instantly</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2">
            <Smartphone className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {deviceCount === null ? "—" : deviceCount} subscribed device{deviceCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <Tabs defaultValue="compose">
          <TabsList>
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5 rounded-2xl border border-border bg-card p-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="push-title">Title</Label>
                  <Input
                    id="push-title"
                    maxLength={120}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="New hostel launched in Sri Ganganagar"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="push-body">Description</Label>
                  <Textarea
                    id="push-body"
                    rows={4}
                    maxLength={500}
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    placeholder="Book AC rooms starting at ₹4,500/month with free WiFi and meals."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="push-tag">Tag (optional)</Label>
                    <Input
                      id="push-tag"
                      maxLength={50}
                      value={form.tag}
                      onChange={(e) => setForm({ ...form, tag: e.target.value })}
                      placeholder="offer / launch / update"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="push-url">Action URL (optional)</Label>
                    <Input
                      id="push-url"
                      maxLength={1000}
                      value={form.action_url}
                      onChange={(e) => setForm({ ...form, action_url: e.target.value })}
                      placeholder="/search?city=Sri Ganganagar"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Banner image (optional)</Label>
                  <div className="flex items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {isUploading ? "Uploading..." : "Upload banner"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleBannerUpload(e.target.files[0])}
                      />
                    </label>
                    {bannerUrl && (
                      <div className="flex items-center gap-2">
                        <img src={bannerUrl} alt="Banner preview" loading="lazy" className="h-12 w-20 rounded-lg object-cover" />
                        <Button size="icon" variant="ghost" onClick={() => setBannerUrl(null)} aria-label="Remove banner">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Audience</Label>
                    <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="users">Signed-in users</SelectItem>
                        <SelectItem value="owners">Property owners</SelectItem>
                        <SelectItem value="city">By city</SelectItem>
                        <SelectItem value="nearby">Near a location</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {form.audience === "city" && (
                    <div className="space-y-2">
                      <Label htmlFor="push-city">City</Label>
                      <Input
                        id="push-city"
                        value={form.audience_city}
                        onChange={(e) => setForm({ ...form, audience_city: e.target.value })}
                        placeholder="Sri Ganganagar"
                      />
                    </div>
                  )}

                  {form.audience === "nearby" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="push-lat">Latitude</Label>
                        <Input
                          id="push-lat"
                          value={form.audience_lat}
                          onChange={(e) => setForm({ ...form, audience_lat: e.target.value })}
                          placeholder="29.5486"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="push-lng">Longitude</Label>
                        <Input
                          id="push-lng"
                          value={form.audience_lng}
                          onChange={(e) => setForm({ ...form, audience_lng: e.target.value })}
                          placeholder="73.8800"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="push-radius">Radius (km)</Label>
                        <Input
                          id="push-radius"
                          type="number"
                          value={form.radius_km}
                          onChange={(e) => setForm({ ...form, radius_km: Number(e.target.value) })}
                        />
                      </div>
                    </>
                  )}
                </div>

                <Button className="w-full gap-2" onClick={handleSend} disabled={isSending}>
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send push notification
                </Button>
              </motion.div>

              {/* Live preview */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-3 rounded-2xl border border-border bg-card p-6"
              >
                <p className="text-sm font-semibold text-muted-foreground">Live preview</p>
                <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
                  {bannerUrl ? (
                    <img src={bannerUrl} alt="Notification banner" loading="lazy" className="h-32 w-full object-cover" />
                  ) : (
                    <div className="flex h-32 w-full items-center justify-center bg-muted text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex gap-3 p-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{form.title || "Notification title"}</p>
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {form.body || "Your description will appear here."}
                      </p>
                      {form.tag && (
                        <Badge variant="secondary" className="mt-2">
                          {form.tag}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatic alerts also go out on their own whenever an approved property launches within 30 km of a
                  subscriber.
                </p>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {isLoading ? (
                <div className="space-y-4 p-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : campaigns.length ? (
                <div className="divide-y divide-border">
                  {campaigns.map((c) => (
                    <div key={c.id} className="flex flex-wrap items-start gap-4 p-4">
                      {c.banner_url && (
                        <img src={c.banner_url} alt="" loading="lazy" className="h-14 w-20 rounded-lg object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{c.title}</p>
                          <Badge variant={c.source === "automatic" ? "secondary" : "default"}>{c.source}</Badge>
                          <Badge variant="outline">{c.audience}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.body}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {format(new Date(c.created_at), "MMM d, yyyy h:mm a")} · {c.sent_count} sent
                          {c.failed_count ? ` · ${c.failed_count} failed` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">No push notifications yet</p>
                  <p className="text-muted-foreground">Compose your first broadcast above</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminPushNotifications;
