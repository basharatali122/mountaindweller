import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Package {
  id: string;
  name: string;
  investment_amount: number;
  bonus_amount: number;
  features: any;
  is_active: boolean;
  created_at: string;
}

const AdminPackages = () => {
  const { toast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    investment_amount: "",
    bonus_amount: "",
    features: "",
    is_active: true,
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .order("investment_amount", { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const packageData = {
      name: formData.name,
      investment_amount: parseInt(formData.investment_amount),
      bonus_amount: parseInt(formData.bonus_amount),
      features: formData.features.split("\n").filter(f => f.trim()),
      is_active: formData.is_active,
    };

    try {
      if (editingPackage) {
        const { error } = await supabase
          .from("packages")
          .update(packageData)
          .eq("id", editingPackage.id);
        
        if (error) throw error;
        toast({ title: "Package updated successfully" });
      } else {
        const { error } = await supabase
          .from("packages")
          .insert(packageData);
        
        if (error) throw error;
        toast({ title: "Package created successfully" });
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchPackages();
    } catch (error) {
      toast({ title: "Error saving package", variant: "destructive" });
    }
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      investment_amount: pkg.investment_amount.toString(),
      bonus_amount: pkg.bonus_amount.toString(),
      features: (pkg.features || []).join("\n"),
      is_active: pkg.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;
    
    try {
      const { error } = await supabase.from("packages").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Package deleted" });
      fetchPackages();
    } catch (error) {
      toast({ title: "Error deleting package", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEditingPackage(null);
    setFormData({
      name: "",
      investment_amount: "",
      bonus_amount: "",
      features: "",
      is_active: true,
    });
  };

  return (
    <AdminLayout title="Packages" description="Manage starter packages">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Badge variant="outline">{packages.length} packages</Badge>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Package
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPackage ? "Edit Package" : "Add New Package"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Package Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Starter"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Investment (PKR)</Label>
                  <Input
                    type="number"
                    value={formData.investment_amount}
                    onChange={(e) => setFormData({ ...formData, investment_amount: e.target.value })}
                    placeholder="5000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bonus (PKR)</Label>
                  <Input
                    type="number"
                    value={formData.bonus_amount}
                    onChange={(e) => setFormData({ ...formData, bonus_amount: e.target.value })}
                    placeholder="1500"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <Textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Access to all products&#10;Basic training materials"
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingPackage ? "Update Package" : "Create Package"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Investment</TableHead>
              <TableHead>Bonus</TableHead>
              <TableHead>Features</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell className="font-medium">{pkg.name}</TableCell>
                <TableCell>{pkg.investment_amount.toLocaleString()} PKR</TableCell>
                <TableCell className="text-accent font-medium">
                  {pkg.bonus_amount.toLocaleString()} PKR
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(pkg.features || []).slice(0, 2).map((f, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                    ))}
                    {(pkg.features || []).length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{(pkg.features || []).length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {pkg.is_active ? (
                    <Badge className="bg-primary">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(pkg)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(pkg.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {packages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No packages found
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPackages;
