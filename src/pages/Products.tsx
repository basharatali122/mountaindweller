import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, ArrowRight, Leaf, Shield, Sparkles, Sun, Loader2 } from "lucide-react";
import { FadeIn, Stagger, StaggerItem, AuroraBackground, Tilt3D } from "@/components/anim/Primitives";

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

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: true });
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally { setIsLoading(false); }
  };

  const getProductImage = (product: Product) => {
    if (product.image_url) return product.image_url;
    const fallback = defaultImages[product.name.toLowerCase()];
    return fallback || shampooImg;
  };

  return (
    <Layout>
      <section className="relative pt-36 pb-24 overflow-hidden bg-gradient-hero">
        <AuroraBackground />
        <div className="container mx-auto px-4 relative z-10">
          <FadeIn className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 text-sm">
              <ShoppingBag className="w-4 h-4 text-primary" /> Our Products
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Premium <span className="text-gradient">product range.</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover our carefully curated collection of skincare and personal care. Quality you can trust, results you can see.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Products Available</h3>
              <p className="text-muted-foreground">Check back soon for our catalog.</p>
            </div>
          ) : (
            <Stagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <StaggerItem key={product.id}>
                  <Tilt3D>
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={getProductImage(product)}
                      icon={Sparkles}
                      features={product.features || []}
                      description={product.description || ""}
                    />
                  </Tilt3D>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </section>

      <section className="py-32 bg-secondary/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
        <div className="container mx-auto px-4 relative">
          <FadeIn className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-primary font-semibold uppercase tracking-wider text-xs mb-4 block">— Quality Promise</span>
            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6">Why choose <span className="text-gradient">our products?</span></h2>
            <p className="text-muted-foreground text-lg">Every product is crafted with care, using premium ingredients for visible results.</p>
          </FadeIn>

          <Stagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Leaf, title: "Natural Ingredients", description: "Formulated with carefully selected natural and herbal ingredients." },
              { icon: Shield, title: "Quality Tested", description: "Every product undergoes rigorous quality testing." },
              { icon: Sparkles, title: "Visible Results", description: "Designed to deliver noticeable improvements." },
              { icon: Sun, title: "Suitable for All", description: "Formulated to work effectively for various skin types." },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <Tilt3D>
                  <div className="text-center p-8 rounded-3xl bg-card border border-border hover-lift h-full">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-display text-lg font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </div>
                </Tilt3D>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="relative max-w-5xl mx-auto rounded-[2.5rem] overflow-hidden bg-mountain text-mountain-foreground p-12 md:p-20 text-center">
              <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
              <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-primary/30 blur-3xl animate-blob" />
              <div className="relative">
                <h2 className="font-display text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                  Interested in <span className="text-gradient">our products?</span>
                </h2>
                <p className="text-mountain-foreground/70 text-lg mb-10 max-w-xl mx-auto">Connect with us or join as a distributor today.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg" className="rounded-full bg-gradient-primary text-primary-foreground shadow-glow h-14 px-8 group">
                    <Link to="/contact">Contact us <ArrowRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-8 bg-white/5 border-white/20 text-mountain-foreground hover:bg-white/10">
                    <Link to="/packages">Join as Distributor</Link>
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </Layout>
  );
};

export default Products;
