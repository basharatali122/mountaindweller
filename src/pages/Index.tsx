import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Users, TrendingUp, Award, Shield, Sparkles, Package, ArrowUpRight, Zap, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { FadeIn, Stagger, StaggerItem, Tilt3D, AuroraBackground } from "@/components/anim/Primitives";
import logoImg from "@/assets/logo.jpg";

const stats = [
  { value: "55%", label: "Direct Bonus" },
  { value: "5%", label: "Passive Income" },
  { value: "9+", label: "Products" },
  { value: "24/7", label: "Support" },
];

const features = [
  { icon: ShoppingBag, title: "Premium Products", desc: "High-quality skincare crafted with care and trusted by customers across Pakistan.", color: "from-primary to-primary-glow" },
  { icon: TrendingUp, title: "Transparent Earnings", desc: "Clear compensation plan with up to 55% direct bonus and 5% passive income.", color: "from-accent to-primary" },
  { icon: Users, title: "Strong Community", desc: "Join a thriving network of entrepreneurs all building toward the same vision.", color: "from-sky to-primary-glow" },
  { icon: Award, title: "Recognition System", desc: "Climb through ranks from Member to Senior Manager with exclusive benefits.", color: "from-gold to-accent" },
  { icon: Shield, title: "Secure Platform", desc: "Bank-grade infrastructure protecting your business and your earnings.", color: "from-primary-glow to-sky" },
  { icon: Sparkles, title: "Training & Support", desc: "World-class onboarding, mentorship and continuous learning resources.", color: "from-accent to-gold" },
];

const Index = () => {
  return (
    <Layout>
      {/* HERO */}
      <section className="relative pt-32 md:pt-44 pb-24 md:pb-32 overflow-hidden bg-gradient-hero">
        <AuroraBackground />
        <div className="absolute inset-0 grid-bg opacity-40" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center mb-8"
            >
              <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-primary" /></span>
                <span className="text-foreground/80">Pakistan's fastest growing network</span>
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[1.05]"
            >
              Build your future.
              <br />
              <span className="text-gradient animate-gradient bg-gradient-primary inline-block">One step at a time.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
            >
              Premium skincare, a transparent business plan, and unlimited earning potential — all in one beautifully designed platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 justify-center mb-16"
            >
              <Button asChild size="lg" className="rounded-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow group h-14 px-8 text-base">
                <Link to="/auth">Get Started <ArrowRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-8 text-base glass">
                <Link to="/business-plan">View Business Plan <ArrowUpRight className="ml-1 w-5 h-5" /></Link>
              </Button>
            </motion.div>

            {/* 3D floating hero card */}
            <motion.div
              initial={{ opacity: 0, y: 60, rotateX: 20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl mx-auto perspective-1000"
            >
              <Tilt3D className="relative rounded-3xl overflow-hidden glass-strong shadow-deep p-1">
                <div className="absolute inset-0 bg-gradient-aurora opacity-30 animate-aurora" />
                <div className="relative rounded-[1.4rem] bg-card/90 backdrop-blur-xl p-8 md:p-12">
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-primary blur-2xl opacity-60 animate-pulse" />
                      <img src={logoImg} alt="Mountain Dweller" className="relative w-20 h-20 rounded-2xl ring-4 ring-background/50 animate-float" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.map((s, i) => (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        className="text-center"
                      >
                        <div className="font-display text-3xl md:text-4xl font-bold text-gradient">{s.value}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{s.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Tilt3D>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative py-32">
        <div className="container mx-auto px-4">
          <FadeIn className="max-w-3xl mx-auto text-center mb-20">
            <span className="inline-block text-primary font-semibold uppercase tracking-wider text-xs mb-4">— Why Choose Us</span>
            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Your success, <span className="text-gradient">our mission.</span>
            </h2>
            <p className="text-muted-foreground text-lg">Everything you need to build a successful business from home, in one elegant ecosystem.</p>
          </FadeIn>

          <Stagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <StaggerItem key={f.title}>
                <Tilt3D className="group h-full">
                  <div className="relative h-full rounded-3xl p-8 bg-card border border-border hover-lift overflow-hidden">
                    <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-br ${f.color} opacity-10 blur-3xl group-hover:opacity-30 transition-opacity`} />
                    <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 shadow-glow`}>
                      <f.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-3">{f.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </Tilt3D>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* PACKAGES PREVIEW */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
        <div className="container mx-auto px-4 relative">
          <FadeIn className="max-w-3xl mx-auto text-center mb-20">
            <span className="inline-block text-primary font-semibold uppercase tracking-wider text-xs mb-4">— Packages</span>
            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Start your <span className="text-gradient">journey today.</span>
            </h2>
            <p className="text-muted-foreground text-lg">Pick a package that fits your goals — earn instantly from day one.</p>
          </FadeIn>

          <Stagger className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: "Starter", amount: "Rs. 5,000", bonus: "Rs. 1,500", icon: Package },
              { name: "Growth", amount: "Rs. 10,000", bonus: "Rs. 3,500", icon: Zap, popular: true },
              { name: "Premium", amount: "Rs. 15,000", bonus: "Rs. 6,700", icon: Award },
            ].map((pkg) => (
              <StaggerItem key={pkg.name}>
                <div className={`relative h-full rounded-3xl p-8 transition-all hover-lift ${
                  pkg.popular ? "bg-gradient-primary text-primary-foreground shadow-glow scale-105" : "bg-card border border-border"
                }`}>
                  {pkg.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-gold-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-gold">
                      Most Popular
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${pkg.popular ? "bg-white/20" : "bg-primary/10"}`}>
                    <pkg.icon className={`w-6 h-6 ${pkg.popular ? "text-white" : "text-primary"}`} />
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2">{pkg.name}</h3>
                  <div className="font-display text-3xl font-bold mb-1">{pkg.amount}</div>
                  <p className={`text-sm mb-6 ${pkg.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>Instant Bonus: {pkg.bonus}</p>
                  <Button asChild variant={pkg.popular ? "secondary" : "outline"} className="w-full rounded-full">
                    <Link to="/packages">Learn More <ArrowRight className="ml-1 w-4 h-4" /></Link>
                  </Button>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="text-center mt-12">
            <Button asChild variant="ghost" size="lg" className="rounded-full">
              <Link to="/packages" className="group">View all packages <ArrowRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* GLOBAL CTA */}
      <section className="relative py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="relative max-w-5xl mx-auto rounded-[2.5rem] overflow-hidden bg-mountain text-mountain-foreground p-12 md:p-20 text-center">
              <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
              <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-primary/30 blur-3xl animate-blob" />
              <div className="relative">
                <Globe className="w-12 h-12 text-primary-glow mx-auto mb-6 animate-spin-slow" />
                <h2 className="font-display text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                  Ready to start <br className="hidden md:block" /><span className="text-gradient">your journey?</span>
                </h2>
                <p className="text-mountain-foreground/70 text-lg mb-10 max-w-xl mx-auto">
                  Join thousands of successful entrepreneurs already building their future with Mountain Dweller.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg" className="rounded-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow h-14 px-8 text-base group">
                    <Link to="/auth">Create Free Account <ArrowRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-8 text-base bg-white/5 border-white/20 text-mountain-foreground hover:bg-white/10">
                    <Link to="/contact">Contact us</Link>
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

export default Index;
