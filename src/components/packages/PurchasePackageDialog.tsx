import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowRight, AlertCircle } from "lucide-react";

interface PurchasePackageDialogProps {
  packageId: string;
  packageName: string;
  investmentAmount: number;
  bonusAmount: number;
  walletBalance: number;
  isLoggedIn: boolean;
  hasPackage: boolean;
  onSuccess: () => void;
  variant?: "default" | "popular";
}

export const PurchasePackageDialog = ({
  packageId,
  packageName,
  investmentAmount,
  bonusAmount,
  walletBalance,
  isLoggedIn,
  hasPackage,
  onSuccess,
  variant = "default",
}: PurchasePackageDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const canAfford = walletBalance >= investmentAmount;

  const handlePurchase = async () => {
    if (!isLoggedIn) {
      toast({
        title: "Login required",
        description: "Please login to purchase a package.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc("purchase_package", {
        p_user_id: user.id,
        p_package_id: packageId,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string; bonus_amount?: number };

      if (!result.success) {
        throw new Error(result.error || "Purchase failed");
      }

      toast({
        title: "Package purchased!",
        description: `You've received ${result.bonus_amount?.toLocaleString()} PKR bonus!`,
      });

      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error purchasing package:", error);
      toast({
        title: "Purchase failed",
        description: error.message || "Failed to purchase package. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <Button
        className={`w-full ${
          variant === "popular"
            ? "bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
        size="lg"
        onClick={() => window.location.href = "/auth"}
      >
        Login to Purchase
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    );
  }

  if (hasPackage) {
    return (
      <Button
        className="w-full bg-muted text-muted-foreground cursor-not-allowed"
        size="lg"
        disabled
      >
        Already Purchased
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={`w-full ${
            variant === "popular"
              ? "bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
          size="lg"
        >
          Get Started
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Purchase</DialogTitle>
          <DialogDescription>
            You are about to purchase the {packageName} package.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Investment:</span>
              <span className="font-semibold text-foreground">{investmentAmount.toLocaleString()} PKR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Instant Bonus:</span>
              <span className="font-semibold text-accent">+{bonusAmount.toLocaleString()} PKR</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Balance:</span>
                <span className={`font-semibold ${canAfford ? "text-foreground" : "text-destructive"}`}>
                  {walletBalance.toLocaleString()} PKR
                </span>
              </div>
            </div>
          </div>

          {!canAfford && (
            <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>Insufficient balance. You need {(investmentAmount - walletBalance).toLocaleString()} PKR more.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePurchase} 
            disabled={isLoading || !canAfford}
          >
            {isLoading ? "Processing..." : "Confirm Purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
