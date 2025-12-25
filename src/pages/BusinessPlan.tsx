import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mountain, ArrowRight, TrendingUp, Users, Award, Zap } from "lucide-react";

const ranks = [
  { rank: "Rank 1", members: 0, title: "Member" },
  { rank: "Supervisor", members: 10, title: "Supervisor" },
  { rank: "Assistant Manager", members: 15, title: "Assistant Manager" },
  { rank: "Manager", members: 20, title: "Manager" },
  { rank: "Senior Manager", members: 30, title: "Senior Manager" },
];

const earnings = [
  { rank: "Assistant Manager", directBonus: "45%", passiveIncome: "2%" },
  { rank: "Manager", directBonus: "50%", passiveIncome: "4%" },
  { rank: "Senior Manager", directBonus: "55%", passiveIncome: "5%" },
];

const BusinessPlan = () => {
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
              <TrendingUp className="w-5 h-5 text-accent" />
              <span className="text-primary-foreground text-sm font-medium">Business Plan</span>
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Ranking & Earnings
            </h1>
            <p className="text-primary-foreground/80 text-lg leading-relaxed">
              Our transparent business plan ensures you know exactly what it takes to 
              climb the ranks and maximize your earnings potential.
            </p>
          </div>
        </div>
      </section>

      {/* Ranking Structure */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block text-accent font-semibold uppercase tracking-wider text-sm mb-4">
              Levels & Ranks
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Your Path to Leadership
            </h2>
            <p className="text-muted-foreground text-lg">
              Progress through our ranking system by building your team. Each rank brings 
              new benefits and earning potential.
            </p>
          </div>

          {/* Rank Steps */}
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Connecting Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 hidden md:block" />

              {ranks.map((item, index) => (
                <div
                  key={index}
                  className={`relative flex items-center gap-8 mb-8 ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Content */}
                  <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                    <div className="bg-card rounded-2xl p-6 border border-border shadow-elegant inline-block">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          {index === 0 ? (
                            <Users className="w-6 h-6 text-primary" />
                          ) : index === ranks.length - 1 ? (
                            <Award className="w-6 h-6 text-accent" />
                          ) : (
                            <TrendingUp className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-display text-xl font-bold text-foreground">
                            {item.title}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {item.members === 0
                              ? "Starting rank"
                              : `${item.members} team members required`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center Dot */}
                  <div className="hidden md:flex w-8 h-8 rounded-full bg-primary items-center justify-center shrink-0 z-10">
                    <span className="text-primary-foreground text-sm font-bold">{index + 1}</span>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1 hidden md:block" />
                </div>
              ))}
            </div>
          </div>

          {/* Ranking Table (Mobile Friendly) */}
          <div className="max-w-2xl mx-auto mt-16 bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="px-6 py-4 text-left font-display font-semibold">Rank</th>
                    <th className="px-6 py-4 text-center font-display font-semibold">Members Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ranks.map((item, index) => (
                    <tr key={index} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{item.title}</td>
                      <td className="px-6 py-4 text-center text-muted-foreground">{item.members}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Earning Structure */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block text-accent font-semibold uppercase tracking-wider text-sm mb-4">
              Earning Structure
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Multiple Income Streams
            </h2>
            <p className="text-muted-foreground text-lg">
              Earn from direct sales and build passive income as you grow your team.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-card rounded-2xl p-8 border border-border">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-4">Direct Bonus</h3>
              <p className="text-muted-foreground mb-4">
                Earn a percentage on every sale you make directly. Higher ranks mean higher bonuses!
              </p>
              <div className="text-4xl font-display font-bold text-primary">Up to 55%</div>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-4">Passive Income</h3>
              <p className="text-muted-foreground mb-4">
                Build your team and earn passive income from their sales. True residual earnings!
              </p>
              <div className="text-4xl font-display font-bold text-accent">Up to 5%</div>
            </div>
          </div>

          {/* Earnings Table */}
          <div className="max-w-3xl mx-auto bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-mountain text-mountain-foreground">
                  <tr>
                    <th className="px-6 py-4 text-left font-display font-semibold">Rank</th>
                    <th className="px-6 py-4 text-center font-display font-semibold">Direct Bonus</th>
                    <th className="px-6 py-4 text-center font-display font-semibold">Passive Income</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {earnings.map((item, index) => (
                    <tr key={index} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{item.rank}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full text-sm">
                          {item.directBonus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block bg-accent/10 text-accent font-semibold px-3 py-1 rounded-full text-sm">
                          {item.passiveIncome}
                        </span>
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
      <section className="py-24 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <Mountain className="w-16 h-16 text-accent mx-auto mb-6" />
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-primary-foreground/70 text-lg mb-10">
              Choose a starter package that fits your goals and begin your journey to financial freedom.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/packages">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold text-lg px-8 font-semibold">
                  View Packages
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-lg px-8">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BusinessPlan;
