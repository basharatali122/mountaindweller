import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight, CheckCircle, Star, Crown, Gem } from "lucide-react";

const packages = [
  {
    investment: "5,000",
    bonus: "1,500",
    icon: Package,
    title: "Starter",
    popular: false,
    features: [
      "Access to all products",
      "Basic training materials",
      "Referral bonus eligibility",
      "Wallet access",
    ],
  },
  {
    investment: "10,000",
    bonus: "3,000",
    icon: Star,
    title: "Growth",
    popular: true,
    features: [
      "Everything in Starter",
      "Advanced training modules",
      "Priority support",
      "Higher earning potential",
    ],
  },
  {
    investment: "15,000",
    bonus: "6,000",
    icon: Crown,
    title: "Premium",
    popular: false,
    features: [
      "Everything in Growth",
      "VIP mentorship access",
      "Exclusive product bundles",
      "Maximum earning potential",
    ],
  },
];

const Packages = () => {
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
              <Gem className="w-5 h-5 text-accent" />
              <span className="text-primary-foreground text-sm font-medium">Starter Packages</span>
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Choose Your Package
            </h1>
            <p className="text-primary-foreground/80 text-lg leading-relaxed">
              Select the investment level that matches your goals. Every package comes with 
              instant bonuses and full access to our business opportunity.
            </p>
          </div>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {packages.map((pkg, index) => (
              <div
                key={index}
                className={`relative rounded-3xl p-8 transition-all duration-300 ${
                  pkg.popular
                    ? "bg-primary text-primary-foreground scale-105 shadow-lg"
                    : "bg-card border border-border hover:border-primary/30 hover:shadow-elegant"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-accent-foreground text-sm font-semibold px-4 py-1 rounded-full shadow-gold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div
                    className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                      pkg.popular ? "bg-primary-foreground/20" : "bg-primary/10"
                    }`}
                  >
                    <pkg.icon
                      className={`w-8 h-8 ${pkg.popular ? "text-primary-foreground" : "text-primary"}`}
                    />
                  </div>
                  <h3
                    className={`font-display text-2xl font-bold mb-2 ${
                      pkg.popular ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {pkg.title}
                  </h3>
                </div>

                <div className="text-center mb-8">
                  <div className="mb-2">
                    <span
                      className={`text-sm uppercase tracking-wider ${
                        pkg.popular ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      Investment
                    </span>
                  </div>
                  <div
                    className={`font-display text-5xl font-bold ${
                      pkg.popular ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {pkg.investment}
                    <span className="text-lg ml-1">PKR</span>
                  </div>
                </div>

                <div
                  className={`rounded-2xl p-6 mb-8 ${
                    pkg.popular ? "bg-primary-foreground/10" : "bg-accent/10"
                  }`}
                >
                  <div
                    className={`text-sm uppercase tracking-wider mb-1 ${
                      pkg.popular ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    Instant Bonus
                  </div>
                  <div
                    className={`font-display text-3xl font-bold ${
                      pkg.popular ? "text-accent" : "text-accent"
                    }`}
                  >
                    {pkg.bonus} <span className="text-base">PKR</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle
                        className={`w-5 h-5 shrink-0 ${
                          pkg.popular ? "text-accent" : "text-primary"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          pkg.popular ? "text-primary-foreground/90" : "text-muted-foreground"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link to="/contact">
                  <Button
                    className={`w-full ${
                      pkg.popular
                        ? "bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                    size="lg"
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Package Comparison Table */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block text-accent font-semibold uppercase tracking-wider text-sm mb-4">
              Quick Comparison
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Investment vs Bonus
            </h2>
          </div>

          <div className="max-w-2xl mx-auto bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="px-6 py-4 text-left font-display font-semibold">Investment (PKR)</th>
                    <th className="px-6 py-4 text-center font-display font-semibold">Bonus (PKR)</th>
                    <th className="px-6 py-4 text-center font-display font-semibold">Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {packages.map((pkg, index) => (
                    <tr key={index} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{pkg.investment}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block bg-accent/10 text-accent font-semibold px-3 py-1 rounded-full text-sm">
                          {pkg.bonus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-muted-foreground">
                        {((parseInt(pkg.bonus.replace(",", "")) / parseInt(pkg.investment.replace(",", ""))) * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-mountain">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-mountain-foreground mb-6">
              Questions About Packages?
            </h2>
            <p className="text-mountain-foreground/70 text-lg mb-10">
              Our team is here to help you choose the right package for your goals. 
              Reach out and let's discuss your journey to success.
            </p>
            <Link to="/contact">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold text-lg px-8 font-semibold">
                Contact Us
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Packages;
