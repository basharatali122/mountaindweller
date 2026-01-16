import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingCart, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PackageOrderDialog } from "./PackageOrderDialog";

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
  const [showOrderDialog, setShowOrderDialog] = useState(false);

  const handleBuyNow = () => {
    if (!isLoggedIn) {
      toast({
        title: "Login required",
        description: "Please login to purchase a package.",
        variant: "destructive",
      });
      window.location.href = "/auth";
      return;
    }

    if (walletBalance < investmentAmount) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${investmentAmount.toLocaleString()} PKR to purchase this package. Your current balance is ${walletBalance.toLocaleString()} PKR.`,
        variant: "destructive",
      });
      return;
    }

    setShowOrderDialog(true);
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
        <Check className="mr-2 w-5 h-5" />
        Already Purchased
      </Button>
    );
  }

  return (
    <>
      <Button
        className={`w-full ${
          variant === "popular"
            ? "bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
        size="lg"
        onClick={handleBuyNow}
      >
        <ShoppingCart className="mr-2 w-5 h-5" />
        Buy Now
      </Button>

      <PackageOrderDialog
        open={showOrderDialog}
        onOpenChange={setShowOrderDialog}
        packageId={packageId}
        packageName={packageName}
        packageAmount={investmentAmount}
        onSuccess={onSuccess}
      />
    </>
  );
};
