import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Globe, Bell, Shield, Mail, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { toast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const [isSaving, setIsSaving] = useState(false);
  
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'LibraryBook',
    siteDescription: 'Book your perfect study spot',
    adminEmail: 'admin@bnoy.in',
    supportEmail: 'support@bnoy.in',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    newLibrary: true,
    newUser: true,
    newBooking: false,
    dailyReport: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    requireEmailVerification: true,
    autoApproveLibraries: false,
    maxLoginAttempts: 5,
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: "Settings saved successfully" });
    setIsSaving(false);
  };

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Platform Settings</h2>
            <p className="text-muted-foreground">Configure platform-wide settings</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5" />
                <h3 className="font-semibold">General Settings</h3>
              </div>

              <div className="grid gap-4">
                <div>
                  <Label>Site Name</Label>
                  <Input
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Site Description</Label>
                  <Textarea
                    value={generalSettings.siteDescription}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Admin Email</Label>
                    <Input
                      type="email"
                      value={generalSettings.adminEmail}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, adminEmail: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Support Email</Label>
                    <Input
                      type="email"
                      value={generalSettings.supportEmail}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5" />
                <h3 className="font-semibold">Notification Settings</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Library Registration</Label>
                    <p className="text-xs text-muted-foreground">Get notified when a new library registers</p>
                  </div>
                  <Switch
                    checked={notificationSettings.newLibrary}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, newLibrary: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>New User Signup</Label>
                    <p className="text-xs text-muted-foreground">Get notified when a new user signs up</p>
                  </div>
                  <Switch
                    checked={notificationSettings.newUser}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, newUser: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Bookings</Label>
                    <p className="text-xs text-muted-foreground">Get notified for all new bookings</p>
                  </div>
                  <Switch
                    checked={notificationSettings.newBooking}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, newBooking: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Report</Label>
                    <p className="text-xs text-muted-foreground">Receive daily summary report</p>
                  </div>
                  <Switch
                    checked={notificationSettings.dailyReport}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, dailyReport: checked }))}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5" />
                <h3 className="font-semibold">Security Settings</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Email Verification</Label>
                    <p className="text-xs text-muted-foreground">Users must verify email before login</p>
                  </div>
                  <Switch
                    checked={securitySettings.requireEmailVerification}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, requireEmailVerification: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-approve Libraries</Label>
                    <p className="text-xs text-muted-foreground">Automatically approve new library registrations</p>
                  </div>
                  <Switch
                    checked={securitySettings.autoApproveLibraries}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, autoApproveLibraries: checked }))}
                  />
                </div>

                <div>
                  <Label>Max Login Attempts</Label>
                  <Input
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                    className="w-32"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Number of failed attempts before lockout</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5" />
                <h3 className="font-semibold">Email Templates</h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Welcome Email</p>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Sent to new users after signup</p>
                </div>

                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Booking Confirmation</p>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Sent after successful booking</p>
                </div>

                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Payment Receipt</p>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Sent after payment received</p>
                </div>

                <div className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Membership Expiry Reminder</p>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Sent before membership expires</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
