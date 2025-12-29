import { useState, memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, ShoppingCart, Check } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface ProductCardProps {
  id: string;
  name: string;
  price: number | null;
  image: string;
  icon: LucideIcon;
  features: string[];
  description: string;
}

export const ProductCard = memo(function ProductCard({
  id,
  name,
  price,
  image,
  icon: Icon,
  features,
  description,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const isPriceAvailable = price !== null && price > 0;

  const handleAddToCart = useCallback(() => {
    if (!isPriceAvailable || !price) return;

    addToCart(
      {
        product_id: id,
        product_name: name,
        price: price,
        image,
      },
      quantity
    );

    toast({
      title: "Added to Cart",
      description: `${quantity}x ${name} added to your cart.`,
    });

    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      setQuantity(1);
    }, 1500);
  }, [isPriceAvailable, price, addToCart, id, name, image, quantity, toast]);

  const decrementQuantity = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1));
  }, []);

  const incrementQuantity = useCallback(() => {
    setQuantity((q) => q + 1);
  }, []);

  return (
    <div className="group bg-card rounded-3xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-elegant transition-all duration-300">
      {/* Product Image Area */}
      <div className="aspect-square bg-secondary/30 flex items-center justify-center relative overflow-hidden">
        <OptimizedImage
          src={image}
          alt={name}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          wrapperClassName="w-full h-full"
        />
        <div className="absolute top-4 right-4">
          <div className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-elegant">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-6">
        <h3 className="font-display text-xl font-bold text-foreground mb-2">
          {name}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
          {description}
        </p>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-6">
          {features.map((feature, featureIndex) => (
            <span
              key={featureIndex}
              className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Price & CTA */}
        <div className="space-y-4">
          <div>
            <span className="text-sm text-muted-foreground">Price</span>
            <div className="font-display text-2xl font-bold text-foreground">
              {isPriceAvailable ? (
                <>
                  {price.toLocaleString()} <span className="text-sm">PKR</span>
                </>
              ) : (
                <span className="text-muted-foreground text-lg">Coming Soon</span>
              )}
            </div>
          </div>

          {isPriceAvailable && (
            <div className="space-y-3">
              {/* Quantity Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Qty:</span>
                <div className="flex items-center gap-2 border border-border rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={incrementQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                className="w-full"
                onClick={handleAddToCart}
                disabled={justAdded}
              >
                {justAdded ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Added!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
