import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Save,
  Loader2,
  IndianRupee,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  max_seats: number | null;
  features: string[] | null;
  is_active: boolean;
}

const AdminMemberships = () => {
  const { isAdmin } = useAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 999,
    duration_days: 30,
    max_seats: 50,
    features: "",
    is_active: true,
  });

  useEffect(() => {
    if (isAdmin) {
      fetchPlans();
    }
  }, [isAdmin]);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("membership_plans")
        .select("*")
        .order("price", { ascending: true });

      if (data) {
        setPlans(data as any);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const planData = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price,
        duration_days: formData.duration_days,
        max_seats: formData.max_seats,
        features: formData.features
          ? formData.features.split("\n").filter((f) => f.trim())
          : null,
        is_active: formData.is_active,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from("membership_plans")
          .update(planData)
          .eq("id", editingPlan.id);

        if (error) throw error;
        toast({ title: "Plan updated" });
      } else {
        const { error } = await supabase.from("membership_plans").insert(planData);
        if (error) throw error;
        toast({ title: "Plan created" });
      }

      setIsDialogOpen(false);
      setEditingPlan(null);
      resetForm();
      fetchPlans();
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
      description: "",
      price: 999,
      duration_days: 30,
      max_seats: 50,
      features: "",
      is_active: true,
    });
  };

  const handleDelete = async (planId: string) => {
    try {
      const { error } = await supabase
        .from("membership_plans")
        .delete()
        .eq("id", planId);
      if (error) throw error;
      toast({ title: "Plan deleted" });
      fetchPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: plan.price,
      duration_days: plan.duration_days,
      max_seats: plan.max_seats || 50,
      features: plan.features?.join("\n") || "",
      is_active: plan.is_active,
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingPlan(null);
    resetForm();
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Membership Plans">
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Membership Plans">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h2 className="font-heading text-xl font-semibold">Owner Membership Plans</h2>
            <p className="text-muted-foreground">
              Manage subscription plans for library owners
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? "Edit Plan" : "Create New Plan"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Pro Plan"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Plan description..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration_days">Duration (days)</Label>
                    <Input
                      id="duration_days"
                      type="number"
                      min="1"
                      value={formData.duration_days}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_days: parseInt(e.target.value) || 30,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_seats">Max Seats</Label>
                  <Input
                    id="max_seats"
                    type="number"
                    min="1"
                    value={formData.max_seats}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_seats: parseInt(e.target.value) || 50,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="features">Features (one per line)</Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={(e) =>
                      setFormData({ ...formData, features: e.target.value })
                    }
                    placeholder="Priority support&#10;Analytics dashboard&#10;Custom branding"
                    rows={4}
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
                        {editingPlan ? "Update" : "Create"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Plans Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-3 gap-6"
        >
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`bg-card rounded-2xl border-2 p-6 relative ${
                index === 1 ? "border-primary" : "border-border"
              } ${!plan.is_active ? "opacity-60" : ""}`}
            >
              {index === 1 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                  Popular
                </span>
              )}
              <div className="text-center mb-6">
                <h3 className="font-heading text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {plan.description || "Perfect for growing libraries"}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <IndianRupee className="w-5 h-5" />
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.duration_days} days</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features?.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-sm">Up to {plan.max_seats} seats</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditDialog(plan)}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(plan.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AdminMemberships;
