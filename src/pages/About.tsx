import { Layout } from "@/components/layout/Layout";
import { Mountain, Target, Lightbulb, Users, Award, TrendingUp, Heart } from "lucide-react";
import { FadeIn, Stagger, StaggerItem, AuroraBackground, Tilt3D } from "@/components/anim/Primitives";

const About = () => {
  return (
    <Layout>
      <section className="relative pt-36 pb-24 overflow-hidden bg-gradient-hero">
        <AuroraBackground />
        <div className="container mx-auto px-4 relative z-10">
          <FadeIn className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 text-sm">
              <Mountain className="w-4 h-4 text-primary" /> About Us
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Empowering <span className="text-gradient">ambition.</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Helping individuals across Pakistan achieve financial independence through innovation, integrity, and premium products.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <FadeIn>
              <span className="text-primary font-semibold uppercase tracking-wider text-xs mb-4 block">— Our Story</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
                A journey begun with <span className="text-gradient">vision.</span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>Founded on <strong className="text-foreground">May 4th, 2025</strong>, Mountain Dweller emerged from a powerful belief — every individual deserves the opportunity to build a prosperous future.</p>
                <p>Our name symbolizes strength, resilience, and elevated perspective. Just as mountain dwellers thrive in challenging environments, our community learns to overcome obstacles and reach new heights.</p>
                <p>Today, Mountain Dweller stands as Pakistan's emerging leader in direct sales — backed by premium products and unwavering support.</p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <Tilt3D>
                <div className="relative aspect-[4/3] rounded-3xl bg-gradient-primary p-1 shadow-glow overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-aurora opacity-30 animate-aurora" />
                  <div className="relative h-full rounded-[1.4rem] bg-card flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-primary mb-6 shadow-glow animate-float">
                        <Mountain className="w-12 h-12 text-white" />
                      </div>
                      <div className="font-display text-6xl font-bold text-gradient mb-2">2025</div>
                      <p className="text-muted-foreground">Year Founded</p>
                      <div className="mt-6 inline-block bg-gradient-gold rounded-2xl px-6 py-3 shadow-gold">
                        <div className="font-display font-bold text-gold-foreground">May 4th — Launch Date</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Tilt3D>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="py-32 bg-secondary/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
        <div className="container mx-auto px-4 relative">
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Target, title: "Our Mission", desc: "To provide a transparent, supportive, and rewarding platform that empowers individuals to achieve financial independence through ethical business practices.", grad: "from-primary to-primary-glow" },
              { icon: Lightbulb, title: "Our Vision", desc: "To become Pakistan's most trusted direct sales company — recognized for transforming lives and creating a legacy that spans generations.", grad: "from-accent to-primary-glow" },
            ].map((c, i) => (
              <FadeIn key={c.title} delay={i * 0.15}>
                <Tilt3D>
                  <div className="bg-card rounded-3xl p-10 border border-border h-full hover-lift">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${c.grad} flex items-center justify-center mb-6 shadow-glow`}>
                      <c.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-display text-2xl font-bold mb-4">{c.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{c.desc}</p>
                  </div>
                </Tilt3D>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32">
        <div className="container mx-auto px-4">
          <FadeIn className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-primary font-semibold uppercase tracking-wider text-xs mb-4 block">— What we stand for</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Our core values</h2>
          </FadeIn>

          <Stagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Users, title: "Community First", description: "The power of collective growth and mutual support." },
              { icon: Award, title: "Excellence", description: "Mastery in everything we do — products, service, people." },
              { icon: TrendingUp, title: "Growth Mindset", description: "Embracing challenges as opportunities to evolve." },
              { icon: Heart, title: "Integrity", description: "Honesty, transparency and ethics at our core." },
            ].map((value) => (
              <StaggerItem key={value.title}>
                <Tilt3D>
                  <div className="group text-center p-8 rounded-3xl bg-card border border-border hover-lift h-full">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow group-hover:scale-110 transition-transform">
                      <value.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-display text-lg font-bold mb-3">{value.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
                  </div>
                </Tilt3D>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="relative max-w-6xl mx-auto rounded-[2.5rem] overflow-hidden bg-mountain text-mountain-foreground p-12 md:p-20">
            <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
            <FadeIn className="relative max-w-3xl mx-auto text-center mb-16">
              <h2 className="font-display text-4xl md:text-6xl font-bold mb-6 tracking-tight">What we offer</h2>
              <p className="text-mountain-foreground/70 text-lg">A comprehensive ecosystem designed for your success.</p>
            </FadeIn>
            <Stagger className="relative grid md:grid-cols-3 gap-6">
              {[
                { title: "Business Training", description: "Comprehensive programs to equip you with skills for success." },
                { title: "Mentorship", description: "Access experienced leaders who guide you every step." },
                { title: "Premium Products", description: "High-quality skincare and personal care products you can trust." },
                { title: "Digital Tools", description: "Modern platforms to manage your business in the digital age." },
                { title: "Recognition & Rewards", description: "A system that celebrates your achievements." },
                { title: "Community Support", description: "A network of like-minded individuals committed to mutual success." },
              ].map((item) => (
                <StaggerItem key={item.title}>
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 h-full hover:bg-white/10 transition-colors">
                    <h3 className="font-display text-lg font-semibold mb-3">{item.title}</h3>
                    <p className="text-mountain-foreground/70 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
