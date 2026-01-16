import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Phone, Building2, FileText, Package } from "lucide-react";

interface PackageOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
  packageName: string;
  packageAmount: number;
  onSuccess: () => void;
}

export const PackageOrderDialog = ({
  open,
  onOpenChange,
  packageId,
  packageName,
  packageAmount,
  onSuccess,
}: PackageOrderDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    address: "",
    phone: "",
    city: "",
    notes: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.address.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter your delivery address.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.city.trim()) {
      toast({
        title: "City Required",
        description: "Please enter your city.",
        variant: "destructive",
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      toast({
        title: "Login Required",
        description: "Please login to complete your purchase.",
        variant: "destructive",
      });
      onOpenChange(false);
      navigate("/auth");
      return;
    }

    setIsProcessing(true);

    try {
      // Create cart item for the package
      const cartItems = [{
        product_id: packageId,
        product_name: `${packageName} Package`,
        quantity: 1,
      }];

      const { data, error } = await supabase.rpc("purchase_products", {
        p_user_id: session.user.id,
        p_items: cartItems,
        p_delivery_address: formData.address.trim(),
        p_delivery_phone: formData.phone.trim(),
        p_delivery_city: formData.city.trim(),
        p_delivery_notes: formData.notes.trim() || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; order_id?: string };

      if (!result.success) {
        throw new Error(result.error || "Purchase failed");
      }

      toast({
        title: "Package Order Placed!",
        description: `Your ${packageName} package order of ${packageAmount.toLocaleString()} PKR has been placed successfully.`,
      });

      setFormData({ address: "", phone: "", city: "", notes: "" });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Package order error:", error);
      toast({
        title: "Order Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Order {packageName} Package
          </DialogTitle>
          <DialogDescription>
            Please provide your delivery information to complete your package order.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Package Summary */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{packageName} Package</p>
                <p className="text-sm text-muted-foreground">Investment Package</p>
              </div>
              <p className="text-xl font-bold text-primary">{packageAmount.toLocaleString()} PKR</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Delivery Address *
            </Label>
            <Input
              id="address"
              name="address"
              placeholder="Enter your full delivery address"
              value={formData.address}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number *
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              City *
            </Label>
            <Input
              id="city"
              name="city"
              placeholder="Enter your city"
              value={formData.city}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Delivery Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any special instructions for delivery..."
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm Order • ${packageAmount.toLocaleString()} PKR`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
