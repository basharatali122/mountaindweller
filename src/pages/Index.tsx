import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mountain, ArrowRight, ShoppingBag, Users, TrendingUp, Award, Shield, Sparkles, Package } from "lucide-react";
import logoImg from "@/assets/logo.jpg";

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-24 md:py-32 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-foreground/20 shadow-lg">
                <img src={logoImg} alt="Mountain Dweller Logo" className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Mountain className="w-5 h-5 text-accent" />
              <span className="text-primary-foreground text-sm font-medium">Welcome to Mountain Dweller</span>
            </span>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6">
              Build Your Future,<br />
              <span className="text-accent">One Step at a Time</span>
            </h1>
            <p className="text-primary-foreground/80 text-lg md:text-xl leading-relaxed mb-8 max-w-2xl mx-auto">
              Join Pakistan's fastest-growing network marketing company. Premium skincare products, 
              transparent business plan, and unlimited earning potential.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="group">
                <Link to="/auth">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/business-plan">
                  View Business Plan
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block text-accent font-semibold uppercase tracking-wider text-sm mb-4">
              Why Choose Us
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Your Success is Our Mission
            </h2>
            <p className="text-muted-foreground text-lg">
              We provide everything you need to build a successful business from home.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-3xl p-8 border border-border hover:shadow-elegant transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <ShoppingBag className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">Premium Products</h3>
              <p className="text-muted-foreground">
                High-quality skincare products that customers love and repurchase regularly.
              </p>
            </div>

            <div className="bg-card rounded-3xl p-8 border border-border hover:shadow-elegant transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">Transparent Earnings</h3>
              <p className="text-muted-foreground">
                Clear compensation plan with up to 55% direct bonus and 5% passive income.
              </p>
            </div>

            <div className="bg-card rounded-3xl p-8 border border-border hover:shadow-elegant transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">Strong Community</h3>
              <p className="text-muted-foreground">
                Join a supportive network of entrepreneurs all working toward success.
              </p>
            </div>

            <div className="bg-card rounded-3xl p-8 border border-border hover:shadow-elegant transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">Recognition System</h3>
              <p className="text-muted-foreground">
                Climb through ranks from Member to Senior Manager with exclusive benefits.
              </p>
            </div>

            <div className="bg-card rounded-3xl p-8 border border-border hover:shadow-elegant transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">Secure Platform</h3>
              <p className="text-muted-foreground">
                Safe and secure digital platform for managing your business and earnings.
              </p>
            </div>

            <div className="bg-card rounded-3xl p-8 border border-border hover:shadow-elegant transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">Training & Support</h3>
              <p className="text-muted-foreground">
                Comprehensive training and ongoing support to help you succeed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Preview */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block text-accent font-semibold uppercase tracking-wider text-sm mb-4">
              Investment Packages
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Start Your Journey Today
            </h2>
            <p className="text-muted-foreground text-lg">
              Choose a package that fits your goals and start earning immediately.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Starter", amount: "Rs. 5,000", bonus: "Rs. 1,500" },
              { name: "Growth", amount: "Rs. 10,000", bonus: "Rs. 3,500", popular: true },
              { name: "Premium", amount: "Rs. 15,000", bonus: "Rs. 6,700" },
            ].map((pkg, index) => (
              <div
                key={index}
                className={`bg-card rounded-3xl p-8 border ${
                  pkg.popular ? "border-primary shadow-elegant" : "border-border"
                } relative`}
              >
                {pkg.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">{pkg.name}</h3>
                <div className="text-3xl font-bold text-primary mb-2">{pkg.amount}</div>
                <p className="text-muted-foreground text-sm mb-6">Instant Bonus: {pkg.bonus}</p>
                <Button asChild className="w-full" variant={pkg.popular ? "default" : "outline"}>
                  <Link to="/packages">Learn More</Link>
                </Button>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="ghost" size="lg">
              <Link to="/packages" className="group">
                View All Packages
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Join thousands of successful entrepreneurs who have transformed their lives with Mountain Dweller.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="group">
                <Link to="/auth">
                  Create Free Account
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
