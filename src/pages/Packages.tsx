import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { PurchasePackageDialog } from "@/components/packages/PurchasePackageDialog";
import { Package, CheckCircle, Star, Crown, Gem } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface PackageData {
  id: string;
  name: string;
  investment_amount: number;
  bonus_amount: number;
  features: string[] | null;
}

const packageIcons: Record<string, typeof Package> = {
  Starter: Package,
  Growth: Star,
  Premium: Crown,
};

const Packages = () => {
  const [user, setUser] = useState<User | null>(null);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [purchasedPackageIds, setPurchasedPackageIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setWalletBalance(0);
      setPurchasedPackageIds([]);
    }
  }, [user]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true)
        .order("investment_amount", { ascending: true });

      if (error) throw error;
      
      const mappedPackages = data?.map(pkg => ({
        ...pkg,
        features: Array.isArray(pkg.features) ? pkg.features as string[] : []
      })) || [];
      
      setPackages(mappedPackages);
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      // Fetch wallet balance and user's purchased packages from orders
      const [walletRes, ordersRes] = await Promise.all([
        supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("order_items")
          .select("product_id, orders!inner(user_id)")
          .eq("orders.user_id", user.id),
      ]);

      setWalletBalance(walletRes.data?.balance || 0);
      
      // Extract unique package IDs from order items (packages are stored as product_id)
      const purchasedIds = ordersRes.data?.map(item => item.product_id) || [];
      setPurchasedPackageIds([...new Set(purchasedIds)]);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handlePurchaseSuccess = () => {
    fetchUserData();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </Layout>
    );
  }

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
            {user && (
              <div className="mt-6 inline-block bg-primary-foreground/10 backdrop-blur-sm rounded-xl px-6 py-3">
                <span className="text-primary-foreground/70 text-sm">Your Balance: </span>
                <span className="text-primary-foreground font-bold text-lg">{walletBalance.toLocaleString()} PKR</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {packages.map((pkg, index) => {
              const isPopular = index === 1;
              const IconComponent = packageIcons[pkg.name] || Package;
              
              return (
                <div
                  key={pkg.id}
                  className={`relative rounded-3xl p-8 transition-all duration-300 ${
                    isPopular
                      ? "bg-primary text-primary-foreground scale-105 shadow-lg"
                      : "bg-card border border-border hover:border-primary/30 hover:shadow-elegant"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-accent text-accent-foreground text-sm font-semibold px-4 py-1 rounded-full shadow-gold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <div
                      className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                        isPopular ? "bg-primary-foreground/20" : "bg-primary/10"
                      }`}
                    >
                      <IconComponent
                        className={`w-8 h-8 ${isPopular ? "text-primary-foreground" : "text-primary"}`}
                      />
                    </div>
                    <h3
                      className={`font-display text-2xl font-bold mb-2 ${
                        isPopular ? "text-primary-foreground" : "text-foreground"
                      }`}
                    >
                      {pkg.name}
                    </h3>
                  </div>

                  <div className="text-center mb-8">
                    <div className="mb-2">
                      <span
                        className={`text-sm uppercase tracking-wider ${
                          isPopular ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        Investment
                      </span>
                    </div>
                    <div
                      className={`font-display text-5xl font-bold ${
                        isPopular ? "text-primary-foreground" : "text-foreground"
                      }`}
                    >
                      {pkg.investment_amount.toLocaleString()}
                      <span className="text-lg ml-1">PKR</span>
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl p-6 mb-8 ${
                      isPopular ? "bg-primary-foreground/10" : "bg-accent/10"
                    }`}
                  >
                    <div
                      className={`text-sm uppercase tracking-wider mb-1 ${
                        isPopular ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      Referral Rewards
                    </div>
                    <div className="font-display text-2xl font-bold text-accent">
                      Level 1: {pkg.bonus_amount >= 20000 ? '2,000' : pkg.bonus_amount >= 6000 ? '1,000' : '500'} <span className="text-sm">PKR</span>
                    </div>
                    <div className="font-display text-lg font-medium text-accent/70 mt-1">
                      Level 2: {pkg.bonus_amount >= 20000 ? '1,000' : pkg.bonus_amount >= 6000 ? '500' : '200'} <span className="text-sm">PKR</span>
                    </div>
                  </div>

                  {pkg.features && pkg.features.length > 0 && (
                    <ul className="space-y-3 mb-8">
                      {pkg.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3">
                          <CheckCircle
                            className={`w-5 h-5 shrink-0 ${
                              isPopular ? "text-accent" : "text-primary"
                            }`}
                          />
                          <span
                            className={`text-sm ${
                              isPopular ? "text-primary-foreground/90" : "text-muted-foreground"
                            }`}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <PurchasePackageDialog
                    packageId={pkg.id}
                    packageName={pkg.name}
                    investmentAmount={pkg.investment_amount}
                    bonusAmount={pkg.bonus_amount}
                    walletBalance={walletBalance}
                    isLoggedIn={!!user}
                    hasPackage={purchasedPackageIds.includes(pkg.id)}
                    onSuccess={handlePurchaseSuccess}
                    variant={isPopular ? "popular" : "default"}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Package Comparison Table */}
      {packages.length > 0 && (
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

            <div className="max-w-3xl mx-auto bg-card rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary text-primary-foreground">
                    <tr>
                      <th className="px-4 py-4 text-left font-display font-semibold">Investment</th>
                      <th className="px-4 py-4 text-center font-display font-semibold">Level 1 Bonus</th>
                      <th className="px-4 py-4 text-center font-display font-semibold">Level 2 Bonus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {packages.map((pkg) => {
                      const level1 = pkg.bonus_amount >= 20000 ? 2000 : pkg.bonus_amount >= 6000 ? 1000 : 500;
                      const level2 = pkg.bonus_amount >= 20000 ? 1000 : pkg.bonus_amount >= 6000 ? 500 : 200;
                      return (
                        <tr key={pkg.id} className="hover:bg-secondary/50 transition-colors">
                          <td className="px-4 py-4 font-medium text-foreground">{pkg.investment_amount.toLocaleString()} PKR</td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-block bg-accent/10 text-accent font-semibold px-3 py-1 rounded-full text-sm">
                              {level1.toLocaleString()} PKR
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-block bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full text-sm">
                              {level2.toLocaleString()} PKR
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default Packages;
