import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Users, TrendingUp, Award, Shield, Sparkles, Package, ArrowUpRight, Zap, Globe, Star, CheckCircle2 } from "lucide-react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";
import { FadeIn, Stagger, StaggerItem, Tilt3D, AuroraBackground, Parallax } from "@/components/anim/Primitives";
import { Hero3D } from "@/components/anim/Hero3D";
import { Marquee } from "@/components/anim/Marquee";
import { Counter } from "@/components/anim/Counter";

const stats = [
  { value: 55, suffix: "%", label: "Direct Bonus" },
  { value: 5, suffix: "%", label: "Passive Income" },
  { value: 9, suffix: "+", label: "Products" },
  { value: 24, suffix: "/7", label: "Support" },
];

const features = [
  { icon: ShoppingBag, title: "Premium Products", desc: "High-quality skincare crafted with care and trusted by customers across Pakistan.", color: "from-primary to-primary-glow" },
  { icon: TrendingUp, title: "Transparent Earnings", desc: "Clear compensation plan with up to 55% direct bonus and 5% passive income.", color: "from-accent to-primary" },
  { icon: Users, title: "Strong Community", desc: "Join a thriving network of entrepreneurs all building toward the same vision.", color: "from-sky to-primary-glow" },
  { icon: Award, title: "Recognition System", desc: "Climb through ranks from Member to Senior Manager with exclusive benefits.", color: "from-gold to-accent" },
  { icon: Shield, title: "Secure Platform", desc: "Bank-grade infrastructure protecting your business and your earnings.", color: "from-primary-glow to-sky" },
  { icon: Sparkles, title: "Training & Support", desc: "World-class onboarding, mentorship and continuous learning resources.", color: "from-accent to-gold" },
];

const steps = [
  { n: "01", title: "Create account", desc: "Sign up in seconds with email and a referral code." },
  { n: "02", title: "Pick a package", desc: "Choose the plan that matches your ambition and budget." },
  { n: "03", title: "Earn instantly", desc: "Receive direct bonuses and passive income from day one." },
];

const Index = () => {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 200]), { stiffness: 80, damping: 20 });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);

  return (
    <Layout>
      {/* HERO with 3D scene */}
      <section ref={heroRef} className="relative min-h-screen pt-32 md:pt-40 pb-24 overflow-hidden bg-gradient-hero">
        <AuroraBackground />
        <div className="absolute inset-0 grid-bg opacity-40" />

        {/* 3D Canvas as ambient background */}
        <motion.div style={{ y: heroY, opacity: heroOpacity, scale: heroScale }} className="absolute inset-0 z-0">
          <Hero3D />
        </motion.div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container mx-auto px-4 relative z-10 pointer-events-none">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center mb-8 pointer-events-auto"
            >
              <span className="inline-flex items-center gap-2 glass-strong rounded-full px-4 py-2 text-sm shadow-soft">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-primary" /></span>
                <span className="text-foreground/80">Pakistan's fastest growing network</span>
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[1.02]"
            >
              <span className="block">Build your future.</span>
              <span className="block text-gradient animate-gradient bg-gradient-primary">Beautifully.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
            >
              Premium skincare, a transparent business plan, and unlimited earning potential — all in one beautifully crafted platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="flex flex-col sm:flex-row gap-3 justify-center mb-20 pointer-events-auto"
            >
              <Button asChild size="lg" className="rounded-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow group h-14 px-8 text-base">
                <Link to="/auth">Get Started <ArrowRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-8 text-base glass-strong">
                <Link to="/business-plan">View Business Plan <ArrowUpRight className="ml-1 w-5 h-5" /></Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="w-6 h-10 rounded-full border-2 border-foreground/30 flex items-start justify-center p-1.5">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-2 rounded-full bg-foreground/60"
            />
          </div>
        </motion.div>
      </section>

      {/* STATS BAR (floating glass) */}
      <section className="relative -mt-20 z-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <Tilt3D>
            <div className="relative rounded-3xl glass-strong shadow-deep p-1 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-aurora opacity-20 animate-aurora" />
              <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 p-8 md:p-10 rounded-[1.4rem] bg-card/80 backdrop-blur-2xl">
                {stats.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="text-center"
                  >
                    <div className="font-display text-4xl md:text-5xl font-bold text-gradient">
                      <Counter to={s.value} suffix={s.suffix} />
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-2">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Tilt3D>
        </div>
      </section>

      {/* MARQUEE strip */}
      <section className="relative py-16">
        <Marquee>
          {["Premium Skincare", "✦", "55% Direct Bonus", "✦", "Trusted Network", "✦", "Instant Earnings", "✦", "Pakistan-wide", "✦"].map((t, i) => (
            <span key={i} className="font-display text-3xl md:text-5xl font-bold text-foreground/20 hover:text-gradient transition-colors">
              {t}
            </span>
          ))}
        </Marquee>
      </section>

      {/* FEATURES with parallax */}
      <section className="relative py-32 overflow-hidden">
        <Parallax offset={80} className="absolute -top-40 right-0 w-[30rem] h-[30rem] rounded-full bg-primary/10 blur-3xl" >
          <div />
        </Parallax>
        <div className="container mx-auto px-4 relative">
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
                    <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-br ${f.color} opacity-10 blur-3xl group-hover:opacity-40 transition-opacity duration-500`} />
                    <motion.div
                      whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 shadow-glow`}
                    >
                      <f.icon className="w-7 h-7 text-white" />
                    </motion.div>
                    <h3 className="font-display text-xl font-bold mb-3">{f.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </Tilt3D>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* HOW IT WORKS - cinematic split */}
      <section className="relative py-32 overflow-hidden bg-gradient-mesh">
        <div className="container mx-auto px-4">
          <FadeIn className="max-w-3xl mx-auto text-center mb-20">
            <span className="inline-block text-primary font-semibold uppercase tracking-wider text-xs mb-4">— How It Works</span>
            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Three steps to <span className="text-gradient">freedom.</span>
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                <Tilt3D>
                  <div className="relative rounded-3xl p-10 glass-strong border border-border/60 h-full overflow-hidden">
                    <div className="absolute -top-10 -right-6 font-display text-[10rem] font-bold leading-none text-primary/5 select-none">{s.n}</div>
                    <div className="relative">
                      <div className="font-display text-sm font-bold text-primary mb-4">STEP {s.n}</div>
                      <h3 className="font-display text-2xl font-bold mb-3">{s.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </Tilt3D>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PACKAGES PREVIEW */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
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
                <Tilt3D className="h-full">
                  <div className={`relative h-full rounded-3xl p-8 transition-all hover-lift overflow-hidden ${
                    pkg.popular ? "bg-gradient-primary text-primary-foreground shadow-glow md:scale-105" : "bg-card border border-border"
                  }`}>
                    {pkg.popular && (
                      <>
                        <div className="absolute inset-0 bg-gradient-aurora opacity-20 animate-aurora" />
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-gold-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-gold">
                          Most Popular
                        </span>
                      </>
                    )}
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${pkg.popular ? "bg-white/20" : "bg-primary/10"}`}>
                        <pkg.icon className={`w-6 h-6 ${pkg.popular ? "text-white" : "text-primary"}`} />
                      </div>
                      <h3 className="font-display text-2xl font-bold mb-2">{pkg.name}</h3>
                      <div className="font-display text-3xl font-bold mb-1">{pkg.amount}</div>
                      <p className={`text-sm mb-6 ${pkg.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>Instant Bonus: {pkg.bonus}</p>
                      <ul className="space-y-2 mb-6 text-sm">
                        {["Direct bonus", "Passive income", "Team access"].map((b) => (
                          <li key={b} className="flex items-center gap-2">
                            <CheckCircle2 className={`w-4 h-4 ${pkg.popular ? "text-white" : "text-primary"}`} />
                            <span className={pkg.popular ? "text-primary-foreground/90" : "text-muted-foreground"}>{b}</span>
                          </li>
                        ))}
                      </ul>
                      <Button asChild variant={pkg.popular ? "secondary" : "outline"} className="w-full rounded-full">
                        <Link to="/packages">Learn More <ArrowRight className="ml-1 w-4 h-4" /></Link>
                      </Button>
                    </div>
                  </div>
                </Tilt3D>
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

      {/* TESTIMONIAL marquee */}
      <section className="relative py-24 overflow-hidden">
        <FadeIn className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
            Trusted by <span className="text-gradient">thousands.</span>
          </h2>
        </FadeIn>
        <Marquee>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="inline-block w-[340px] mx-3 p-6 rounded-3xl glass border border-border/60">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-gold text-gold" />)}
              </div>
              <p className="text-sm text-foreground/80 whitespace-normal mb-4 leading-relaxed">
                "Mountain Dweller changed my life. Transparent earnings, premium products, and an amazing community."
              </p>
              <div className="text-sm font-semibold">Member #{1000 + i}</div>
            </div>
          ))}
        </Marquee>
      </section>

      {/* GLOBAL CTA */}
      <section className="relative py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <FadeIn>
            <Tilt3D>
              <div className="relative max-w-5xl mx-auto rounded-[2.5rem] overflow-hidden bg-mountain text-mountain-foreground p-12 md:p-20 text-center">
                <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-primary/30 blur-3xl animate-blob" />
                <div className="absolute -bottom-32 right-0 w-[30rem] h-[30rem] rounded-full bg-accent/30 blur-3xl animate-blob-delay" />
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
            </Tilt3D>
          </FadeIn>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
