import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, ArrowRight, Leaf, Shield, Sparkles, Sun, Loader2 } from "lucide-react";

// Static product images for fallback
import shampooImg from "@/assets/products/shampoo.png";
import sunblockImg from "@/assets/products/sunblock.png";
import facewashImg from "@/assets/products/facewash.png";
import vitaminCSerumImg from "@/assets/products/vitamin-c-serum.png";
import nevolisImg from "@/assets/products/nevolis-cream.png";
import tuttiFruttiFacialImg from "@/assets/products/tutti-frutti-facial.png";
import alpineGlowImg from "@/assets/products/alpine-glow.png";
import hairConditionerImg from "@/assets/products/hair-conditioner.png";
import urgentFacialImg from "@/assets/products/urgent-facial.png";

const defaultImages: Record<string, string> = {
  "md shampoo": shampooImg,
  "sun block spf50": sunblockImg,
  "face wash": facewashImg,
  "serum vitamin c": vitaminCSerumImg,
  "cream nevolis": nevolisImg,
  "tutti frutti urgent facial": tuttiFruttiFacialImg,
  "pure alpine glow": alpineGlowImg,
  "hair conditioner": hairConditionerImg,
  "urgent facial": urgentFacialImg,
};

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  features: string[] | null;
  image_url: string | null;
  is_active: boolean | null;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProductImage = (product: Product) => {
    if (product.image_url) return product.image_url;
    const fallback = defaultImages[product.name.toLowerCase()];
    return fallback || shampooImg;
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-24 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <ShoppingBag className="w-5 h-5 text-accent" />
              <span className="text-primary-foreground text-sm font-medium">Our Products</span>
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Premium Product Range
            </h1>
            <p className="text-primary-foreground/80 text-lg leading-relaxed">
              Discover our carefully curated collection of premium skincare and personal care products. 
              Quality you can trust, results you can see.
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Products Available</h3>
              <p className="text-muted-foreground">Check back soon for our product catalog.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={getProductImage(product)}
                  icon={Sparkles}
                  features={product.features || []}
                  description={product.description || ""}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Our Products */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block text-accent font-semibold uppercase tracking-wider text-sm mb-4">
              Quality Promise
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Why Choose Our Products?
            </h2>
            <p className="text-muted-foreground text-lg">
              Every product in our range is crafted with care, using premium ingredients 
              to deliver visible results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Leaf,
                title: "Natural Ingredients",
                description: "Formulated with carefully selected natural and herbal ingredients.",
              },
              {
                icon: Shield,
                title: "Quality Tested",
                description: "Every product undergoes rigorous quality testing before reaching you.",
              },
              {
                icon: Sparkles,
                title: "Visible Results",
                description: "Designed to deliver noticeable improvements in skin and hair health.",
              },
              {
                icon: Sun,
                title: "Suitable for All",
                description: "Products formulated to work effectively for various skin types.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl bg-card border border-border"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Interested in Our Products?
            </h2>
            <p className="text-primary-foreground/70 text-lg mb-10">
              Connect with us to learn more about our products or become a distributor. 
              Join the Mountain Dweller family today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold text-lg px-8 font-semibold">
                  Contact Us
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/packages">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-lg px-8">
                  Join as Distributor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Products;
