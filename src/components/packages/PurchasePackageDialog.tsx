import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

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
  const { addToCart, items } = useCart();

  const isInCart = items.some(item => item.product_id === packageId);

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      toast({
        title: "Login required",
        description: "Please login to purchase a package.",
        variant: "destructive",
      });
      window.location.href = "/auth";
      return;
    }

    addToCart({
      product_id: packageId,
      product_name: `${packageName} Package`,
      price: investmentAmount,
      image: undefined,
    });

    toast({
      title: "Added to cart!",
      description: `${packageName} package has been added to your cart. Proceed to checkout to complete your order.`,
    });
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

  if (isInCart) {
    return (
      <Button
        className="w-full bg-green-600 text-white cursor-default"
        size="lg"
        disabled
      >
        <Check className="mr-2 w-5 h-5" />
        Added to Cart
      </Button>
    );
  }

  return (
    <Button
      className={`w-full ${
        variant === "popular"
          ? "bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      }`}
      size="lg"
      onClick={handleAddToCart}
    >
      <ShoppingCart className="mr-2 w-5 h-5" />
      Add to Cart
    </Button>
  );
};
