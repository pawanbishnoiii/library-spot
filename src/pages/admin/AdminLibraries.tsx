import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Search,
  Filter,
  Check,
  X,
  Eye,
  MoreHorizontal,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const AdminLibraries = () => {
  const { isAdmin } = useAuth();
  const [libraries, setLibraries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isAdmin) {
      fetchLibraries();
    }
  }, [isAdmin]);

  const fetchLibraries = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("libraries")
        .select("*, profiles!libraries_owner_id_fkey(full_name, email)")
        .order("created_at", { ascending: false });

      if (data) {
        setLibraries(data);
      }
    } catch (error) {
      console.error("Error fetching libraries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (libraryId: string, status: "approved" | "pending" | "suspended" | "rejected") => {
    try {
      const { error } = await supabase
        .from("libraries")
        .update({ status })
        .eq("id", libraryId);

      if (error) throw error;

      toast({ title: `Library ${status}` });
      fetchLibraries();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredLibraries = libraries.filter((library) => {
    const matchesFilter = filter === "all" || library.status === filter;
    const matchesSearch =
      !searchQuery ||
      library.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      library.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success/10 text-success border-success/30";
      case "pending":
        return "bg-warning/10 text-warning border-warning/30";
      case "suspended":
        return "bg-destructive/10 text-destructive border-destructive/30";
      case "rejected":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DashboardLayout title="Manage Libraries">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search libraries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs defaultValue="all" onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="suspended">Suspended</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Libraries Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-semibold text-sm">Library</th>
                  <th className="text-left p-4 font-semibold text-sm">Owner</th>
                  <th className="text-left p-4 font-semibold text-sm">Location</th>
                  <th className="text-left p-4 font-semibold text-sm">Seats</th>
                  <th className="text-left p-4 font-semibold text-sm">Status</th>
                  <th className="text-right p-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td colSpan={6} className="p-4">
                        <Skeleton className="h-12 w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredLibraries.length > 0 ? (
                  filteredLibraries.map((library, index) => (
                    <motion.tr
                      key={library.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{library.name}</p>
                            <p className="text-xs text-muted-foreground">{library.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{library.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{library.profiles?.email}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{library.city}, {library.state}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold">{library.total_seats}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(library.status)}`}>
                          {library.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a href={`/library/${library.slug}`} target="_blank">
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </a>
                            </DropdownMenuItem>
                            {library.status !== "approved" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(library.id, "approved")}>
                                <Check className="w-4 h-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {library.status !== "suspended" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(library.id, "suspended")}
                                className="text-destructive"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No libraries found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminLibraries;
