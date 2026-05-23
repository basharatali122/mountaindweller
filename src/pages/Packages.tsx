import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { PurchasePackageDialog } from "@/components/packages/PurchasePackageDialog";
import { Package, CheckCircle, Star, Crown, Gem } from "lucide-react";
import { FadeIn, Stagger, StaggerItem, AuroraBackground, Tilt3D } from "@/components/anim/Primitives";
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
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { fetchPackages(); }, []);

  useEffect(() => {
    if (user) fetchUserData();
    else { setWalletBalance(0); setPurchasedPackageIds([]); }
  }, [user]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true)
        .order("investment_amount", { ascending: true });
      if (error) throw error;
      const mapped = data?.map(pkg => ({ ...pkg, features: Array.isArray(pkg.features) ? pkg.features as string[] : [] })) || [];
      setPackages(mapped);
    } catch (err) {
      console.error("Error fetching packages:", err);
    } finally { setIsLoading(false); }
  };

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const [walletRes, ordersRes] = await Promise.all([
        supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase.from("order_items").select("product_id, orders!inner(user_id)").eq("orders.user_id", user.id),
      ]);
      setWalletBalance(walletRes.data?.balance || 0);
      const ids = ordersRes.data?.map(i => i.product_id) || [];
      setPurchasedPackageIds([...new Set(ids)]);
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  const handlePurchaseSuccess = () => fetchUserData();

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
      <section className="relative pt-36 pb-24 overflow-hidden bg-gradient-hero">
        <AuroraBackground />
        <div className="container mx-auto px-4 relative z-10">
          <FadeIn className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 text-sm">
              <Gem className="w-4 h-4 text-primary" /> Starter Packages
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Choose your <span className="text-gradient">package.</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Select the investment level that matches your goals. Every package includes instant bonuses and full business access.
            </p>
            {user && (
              <div className="mt-8 inline-block glass rounded-2xl px-6 py-3">
                <span className="text-muted-foreground text-sm">Your Balance: </span>
                <span className="text-foreground font-bold text-lg">{walletBalance.toLocaleString()} PKR</span>
              </div>
            )}
          </FadeIn>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <Stagger className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {packages.map((pkg, index) => {
              const isPopular = index === 1;
              const IconComponent = packageIcons[pkg.name] || Package;
              return (
                <StaggerItem key={pkg.id}>
                  <Tilt3D>
                    <div className={`relative h-full rounded-3xl p-8 transition-all hover-lift ${
                      isPopular ? "bg-gradient-primary text-primary-foreground scale-105 shadow-glow" : "bg-card border border-border"
                    }`}>
                      {isPopular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                          <span className="bg-gradient-gold text-gold-foreground text-sm font-semibold px-4 py-1.5 rounded-full shadow-gold">Most Popular</span>
                        </div>
                      )}

                      <div className="text-center mb-8">
                        <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isPopular ? "bg-white/20" : "bg-gradient-primary shadow-glow"}`}>
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="font-display text-2xl font-bold mb-2">{pkg.name}</h3>
                      </div>

                      <div className="text-center mb-8">
                        <div className={`text-xs uppercase tracking-wider mb-2 ${isPopular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>Investment</div>
                        <div className="font-display text-5xl font-bold">
                          {pkg.investment_amount.toLocaleString()}<span className="text-lg ml-1">PKR</span>
                        </div>
                      </div>

                      <div className={`rounded-2xl p-6 mb-8 ${isPopular ? "bg-white/10" : "bg-secondary"}`}>
                        <div className={`text-xs uppercase tracking-wider mb-2 ${isPopular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>Referral Rewards</div>
                        <div className={`font-display text-xl font-bold ${isPopular ? "text-white" : "text-gradient"}`}>
                          Level 1: {pkg.bonus_amount >= 20000 ? '2,000' : pkg.bonus_amount >= 6000 ? '1,000' : '500'} <span className="text-sm font-medium">PKR</span>
                        </div>
                        <div className={`font-display text-lg font-medium mt-1 ${isPopular ? "text-white/70" : "text-muted-foreground"}`}>
                          Level 2: {pkg.bonus_amount >= 20000 ? '1,000' : pkg.bonus_amount >= 6000 ? '500' : '200'} <span className="text-sm">PKR</span>
                        </div>
                      </div>

                      {pkg.features && pkg.features.length > 0 && (
                        <ul className="space-y-3 mb-8">
                          {pkg.features.map((feature, fi) => (
                            <li key={fi} className="flex items-center gap-3">
                              <CheckCircle className={`w-5 h-5 shrink-0 ${isPopular ? "text-white" : "text-primary"}`} />
                              <span className={`text-sm ${isPopular ? "text-primary-foreground/90" : "text-muted-foreground"}`}>{feature}</span>
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
                  </Tilt3D>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {packages.length > 0 && (
        <section className="py-32 bg-secondary/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
          <div className="container mx-auto px-4 relative">
            <FadeIn className="max-w-3xl mx-auto text-center mb-16">
              <span className="text-primary font-semibold uppercase tracking-wider text-xs mb-4 block">— Quick Comparison</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Investment vs <span className="text-gradient">bonus</span></h2>
            </FadeIn>

            <FadeIn className="max-w-3xl mx-auto bg-card rounded-3xl border border-border overflow-hidden shadow-elegant">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-primary text-primary-foreground">
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
                          <td className="px-4 py-4 font-medium">{pkg.investment_amount.toLocaleString()} PKR</td>
                          <td className="px-4 py-4 text-center"><span className="inline-block bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full text-sm">{level1.toLocaleString()} PKR</span></td>
                          <td className="px-4 py-4 text-center"><span className="inline-block bg-accent/10 text-accent font-semibold px-3 py-1 rounded-full text-sm">{level2.toLocaleString()} PKR</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </FadeIn>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default Packages;
