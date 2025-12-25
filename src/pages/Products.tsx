import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowRight, Leaf, Shield, Sparkles, Droplets, Sun, Heart } from "lucide-react";

import shampooImg from "@/assets/products/shampoo.png";
import sunblockImg from "@/assets/products/sunblock.png";
import facewashImg from "@/assets/products/facewash.png";
import vitaminCSerumImg from "@/assets/products/vitamin-c-serum.png";
import nevolisImg from "@/assets/products/nevolis-cream.png";
import tuttiFruttiFacialImg from "@/assets/products/tutti-frutti-facial.png";
import alpineGlowImg from "@/assets/products/alpine-glow.png";

const products = [
  {
    name: "MD Shampoo",
    price: "3,000",
    image: shampooImg,
    icon: Leaf,
    features: ["Anti-Hair Fall", "Herbal Formula", "Strengthens Roots"],
    description: "Premium herbal shampoo formulated to reduce hair fall and strengthen hair from root to tip.",
  },
  {
    name: "Sun Block SPF50",
    price: "2,000",
    image: sunblockImg,
    icon: Sun,
    features: ["UV Protection", "Brightens Skin", "Non-Greasy"],
    description: "Advanced sun protection with SPF50 that shields and brightens your skin naturally.",
  },
  {
    name: "Face Wash",
    price: "TBD",
    image: facewashImg,
    icon: Droplets,
    features: ["Deep Cleansing", "Hydrating", "All Skin Types"],
    description: "Gentle yet effective face wash suitable for all skin types, leaving your skin fresh and hydrated.",
  },
  {
    name: "Serum Vitamin C",
    price: "4,000",
    image: vitaminCSerumImg,
    icon: Sparkles,
    features: ["Brightening", "Anti-Aging", "Cruelty-Free"],
    description: "Powerful Vitamin C serum that brightens skin tone and fights signs of aging naturally.",
  },
  {
    name: "Cream Nevolis",
    price: "2,000",
    image: nevolisImg,
    icon: Shield,
    features: ["Deep Moisturizing", "Visible Results", "Premium Formula"],
    description: "Luxurious whitening cream that provides glow boost with visible results from first use.",
  },
  {
    name: "Tutti Frutti Urgent Facial",
    price: "2,500",
    image: tuttiFruttiFacialImg,
    icon: Sparkles,
    features: ["Radiance Boost", "Instant Glow", "Premium Quality"],
    description: "Luxurious facial treatment that delivers radiance you can see, for an instant glow.",
  },
  {
    name: "Pure Alpine Glow",
    price: "3,500",
    image: alpineGlowImg,
    icon: Heart,
    features: ["Hydra Repair", "Moisture Cream", "Deep Nourishment"],
    description: "Premium moisture cream that repairs and hydrates skin for a natural alpine glow.",
  },
];

const Products = () => {
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <div
                key={index}
                className="group bg-card rounded-3xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-elegant transition-all duration-300"
              >
                {/* Product Image Area */}
                <div className="aspect-square bg-secondary/30 flex items-center justify-center relative overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4">
                    <div className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-elegant">
                      <product.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-6">
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    {product.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {product.features.map((feature, featureIndex) => (
                      <span
                        key={featureIndex}
                        className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">Price</span>
                      <div className="font-display text-2xl font-bold text-foreground">
                        {product.price === "TBD" ? (
                          <span className="text-muted-foreground text-lg">Coming Soon</span>
                        ) : (
                          <>
                            {product.price} <span className="text-sm">PKR</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Link to="/contact">
                      <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                        Learn More
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
