import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mountain, ArrowRight, TrendingUp, Users, Award, Zap } from "lucide-react";
import { FadeIn, Stagger, StaggerItem, AuroraBackground, Tilt3D } from "@/components/anim/Primitives";

const ranks = [
  { rank: "Level 1", members: 1, title: "MD Starter" },
  { rank: "Level 2", members: 10, title: "MD Explorer" },
  { rank: "Level 3", members: 25, title: "MD Builder" },
  { rank: "Level 4", members: 50, title: "MD Leader" },
  { rank: "Level 5", members: 100, title: "MD Mentor" },
  { rank: "Level 6", members: 250, title: "MD Director" },
  { rank: "Level 7", members: 500, title: "MD Ambassador" },
];

const earnings = [
  { rank: "MD Starter (Lvl 1)", directBonus: "40%", passiveIncome: "—" },
  { rank: "MD Explorer (Lvl 2)", directBonus: "41%", passiveIncome: "—" },
  { rank: "MD Builder (Lvl 3)", directBonus: "45%", passiveIncome: "2%" },
  { rank: "MD Leader (Lvl 4)", directBonus: "50%", passiveIncome: "4%" },
  { rank: "MD Mentor (Lvl 5)", directBonus: "60%", passiveIncome: "5%" },
];

const BusinessPlan = () => {
  return (
    <Layout>
      <section className="relative pt-36 pb-24 overflow-hidden bg-gradient-hero">
        <AuroraBackground />
        <div className="container mx-auto px-4 relative z-10">
          <FadeIn className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 text-sm">
              <TrendingUp className="w-4 h-4 text-primary" /> Business Plan
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Ranking & <span className="text-gradient">earnings.</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              A transparent plan so you know exactly what it takes to climb the ranks and maximize your potential.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-32">
        <div className="container mx-auto px-4">
          <FadeIn className="max-w-3xl mx-auto text-center mb-20">
            <span className="text-primary font-semibold uppercase tracking-wider text-xs mb-4 block">— Levels & Ranks</span>
            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6">Your path to <span className="text-gradient">leadership.</span></h2>
            <p className="text-muted-foreground text-lg">Progress through our ranking system as you build your team.</p>
          </FadeIn>

          <Stagger className="max-w-4xl mx-auto space-y-6">
            {ranks.map((item, index) => (
              <StaggerItem key={index}>
                <div className={`group relative flex items-center gap-6 p-6 rounded-3xl bg-card border border-border hover-lift overflow-hidden ${index === ranks.length - 1 ? "bg-gradient-primary text-primary-foreground border-transparent shadow-glow" : ""}`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 font-display text-2xl font-bold ${index === ranks.length - 1 ? "bg-white/20 text-white" : "bg-gradient-primary text-white shadow-glow"}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-bold">{item.title}</h3>
                    <p className={`text-sm ${index === ranks.length - 1 ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {item.members} LC
                    </p>
                  </div>
                  {index === 0 ? <Users className="w-6 h-6 opacity-50" /> : index === ranks.length - 1 ? <Award className="w-6 h-6" /> : <TrendingUp className="w-6 h-6 opacity-50" />}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="py-32 bg-secondary/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
        <div className="container mx-auto px-4 relative">
          <FadeIn className="max-w-3xl mx-auto text-center mb-20">
            <span className="text-primary font-semibold uppercase tracking-wider text-xs mb-4 block">— Earning Structure</span>
            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6">Multiple <span className="text-gradient">income streams.</span></h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            {[
              { icon: Zap, title: "Direct Bonus", desc: "Earn a % on every direct sale or package purchase made by people you personally refer (Level 1).", value: "Up to 60%", grad: "from-primary to-primary-glow" },
              { icon: TrendingUp, title: "Passive Income", desc: "Once you reach MD Builder, earn a % on the sales of your indirect team (Level 2 and below) — true residual income.", value: "Up to 5%", grad: "from-accent to-primary-glow" },
            ].map((c, i) => (
              <FadeIn key={c.title} delay={i * 0.15}>
                <Tilt3D>
                  <div className="bg-card rounded-3xl p-10 border border-border h-full hover-lift">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${c.grad} flex items-center justify-center mb-6 shadow-glow`}>
                      <c.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-display text-2xl font-bold mb-3">{c.title}</h3>
                    <p className="text-muted-foreground mb-6">{c.desc}</p>
                    <div className="font-display text-5xl font-bold text-gradient">{c.value}</div>
                  </div>
                </Tilt3D>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="max-w-3xl mx-auto bg-card rounded-3xl border border-border overflow-hidden shadow-elegant">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-primary text-primary-foreground">
                  <tr>
                    <th className="px-6 py-4 text-left font-display font-semibold">Rank</th>
                    <th className="px-6 py-4 text-center font-display font-semibold">Direct Bonus</th>
                    <th className="px-6 py-4 text-center font-display font-semibold">Passive Income</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {earnings.map((item, index) => (
                    <tr key={index} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{item.rank}</td>
                      <td className="px-6 py-4 text-center"><span className="inline-block bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full text-sm">{item.directBonus}</span></td>
                      <td className="px-6 py-4 text-center"><span className="inline-block bg-accent/10 text-accent font-semibold px-3 py-1 rounded-full text-sm">{item.passiveIncome}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="relative max-w-5xl mx-auto rounded-[2.5rem] overflow-hidden bg-mountain text-mountain-foreground p-12 md:p-20 text-center">
              <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
              <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-primary/30 blur-3xl animate-blob" />
              <div className="relative">
                <Mountain className="w-12 h-12 text-primary-glow mx-auto mb-6 animate-float" />
                <h2 className="font-display text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                  Ready to start <span className="text-gradient">earning?</span>
                </h2>
                <p className="text-mountain-foreground/70 text-lg mb-10 max-w-xl mx-auto">Pick a starter package that fits your goals and begin your journey today.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg" className="rounded-full bg-gradient-primary text-primary-foreground shadow-glow h-14 px-8 group">
                    <Link to="/packages">View Packages <ArrowRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-8 bg-white/5 border-white/20 text-mountain-foreground hover:bg-white/10">
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

export default BusinessPlan;
