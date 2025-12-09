import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Trash2,
  Phone,
  Edit2,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Staff {
  id: string;
  name: string;
  phone: string | null;
  role: string | null;
}

const OwnerStaff = () => {
  const { user } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "Staff",
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

        const { data: staffData } = await supabase
          .from("staff")
          .select("*")
          .eq("library_id", libraryData.id)
          .order("created_at", { ascending: true });

        if (staffData) {
          setStaff(staffData);
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
      if (editingStaff) {
        const { error } = await supabase
          .from("staff")
          .update({
            name: formData.name,
            phone: formData.phone || null,
            role: formData.role,
          })
          .eq("id", editingStaff.id);

        if (error) throw error;
        toast({ title: "Staff member updated" });
      } else {
        const { error } = await supabase.from("staff").insert({
          library_id: library.id,
          name: formData.name,
          phone: formData.phone || null,
          role: formData.role,
        });

        if (error) throw error;
        toast({ title: "Staff member added" });
      }

      setIsDialogOpen(false);
      setEditingStaff(null);
      setFormData({ name: "", phone: "", role: "Staff" });
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

  const handleDelete = async (staffId: string) => {
    try {
      const { error } = await supabase.from("staff").delete().eq("id", staffId);
      if (error) throw error;
      toast({ title: "Staff member removed" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      phone: staffMember.phone || "",
      role: staffMember.role || "Staff",
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingStaff(null);
    setFormData({ name: "", phone: "", role: "Staff" });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Staff Management">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (!library) {
    return (
      <DashboardLayout title="Staff Management">
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
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
    <DashboardLayout title="Staff Management">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h2 className="font-heading text-xl font-semibold">Staff Members</h2>
            <p className="text-muted-foreground">
              Manage staff who work at your library
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingStaff ? "Edit Staff Member" : "Add Staff Member"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Staff member name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    placeholder="e.g., Manager, Assistant"
                  />
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
                        {editingStaff ? "Update" : "Add"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Staff List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4"
        >
          {staff.length > 0 ? (
            staff.map((member) => (
              <div
                key={member.id}
                className="bg-card rounded-xl border border-border p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{member.role || "Staff"}</span>
                      {member.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {member.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(member)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(member.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No staff members yet</h3>
              <p className="text-muted-foreground mb-4">
                Add staff members who work at your library
              </p>
              <Button onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Staff
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default OwnerStaff;
