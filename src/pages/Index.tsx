import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mountain, Users, TrendingUp, Award, Star, CheckCircle } from "lucide-react";

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Mountain Silhouette */}
        <div className="absolute bottom-0 left-0 right-0 h-48 opacity-30">
          <svg viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="none">
            <path fill="hsl(25 30% 15%)" d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,208C840,213,960,203,1080,186.7C1200,171,1320,149,1380,138.7L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
          </svg>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <Mountain className="w-5 h-5 text-accent" />
              <span className="text-primary-foreground text-sm font-medium">Founded May 4th, 2025</span>
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground mb-6 tracking-tight">
              Mountain Dweller
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-foreground/80 font-medium mb-4 tracking-widest uppercase">
              Business • Marketing • Freedom
            </p>
            
            <p className="max-w-2xl mx-auto text-primary-foreground/70 text-lg mb-10">
              Discover your path to financial independence with Pakistan's premier direct sales opportunity. 
              Join thousands who are building their future with Mountain Dweller.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold text-lg px-8 font-semibold">
                  Join the Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/business-plan">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-lg px-8">
                  Explore Opportunity
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-primary-foreground/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block text-accent font-semibold uppercase tracking-wider text-sm mb-4">
              Our Vision
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Building Leaders, Creating Legacy
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              At Mountain Dweller, we believe in the power of individual potential. Our vision is to create a 
              community of empowered entrepreneurs who support each other, grow together, and achieve 
              extraordinary success through dedication, teamwork, and unwavering commitment to excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: "Strong Community",
                description: "Join a network of driven individuals committed to mutual success and growth.",
              },
              {
                icon: TrendingUp,
                title: "Proven Growth",
                description: "Our structured business model ensures consistent progress and earnings.",
              },
              {
                icon: Award,
                title: "Recognition",
                description: "Achieve ranks and rewards that celebrate your dedication and achievements.",
              },
              {
                icon: Star,
                title: "Premium Products",
                description: "Market high-quality products that customers love and trust.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-elegant transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "55%", label: "Max Direct Bonus" },
              { value: "5%", label: "Passive Income" },
              { value: "5,000", label: "Starting Investment (PKR)" },
              { value: "∞", label: "Growth Potential" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-display text-4xl md:text-5xl font-bold text-accent mb-2">
                  {stat.value}
                </div>
                <div className="text-primary-foreground/70 text-sm uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-accent font-semibold uppercase tracking-wider text-sm mb-4">
                Why Mountain Dweller?
              </span>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
                Your Partner in <span className="text-primary">Success</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                We provide comprehensive training, ongoing support, and a clear path to success. 
                Whether you're looking for additional income or a complete career change, 
                Mountain Dweller offers the platform you need.
              </p>
              
              <div className="space-y-4">
                {[
                  "Comprehensive business training programs",
                  "Dedicated mentorship from top leaders",
                  "Premium quality product portfolio",
                  "Transparent and rewarding compensation plan",
                  "Digital tools for modern entrepreneurs",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
              
              <Link to="/business-plan" className="inline-block mt-8">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  View Business Plan
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-hero p-1">
                <div className="w-full h-full rounded-3xl bg-card flex items-center justify-center">
                  <div className="text-center p-8">
                    <Mountain className="w-24 h-24 text-primary mx-auto mb-6" />
                    <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                      Start Your Journey
                    </h3>
                    <p className="text-muted-foreground">
                      Join the Mountain Dweller family today
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-accent rounded-2xl flex items-center justify-center shadow-gold">
                <div className="text-center">
                  <div className="font-display text-3xl font-bold text-accent-foreground">1000+</div>
                  <div className="text-accent-foreground/70 text-xs uppercase">Members</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-mountain relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path fill="hsl(48 90% 50%)" d="M0,96L48,112C96,128,192,160,288,176C384,192,480,192,576,170.7C672,149,768,107,864,90.7C960,75,1056,85,1152,106.7C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-mountain-foreground mb-6">
            Ready to Transform Your Life?
          </h2>
          <p className="max-w-2xl mx-auto text-mountain-foreground/70 text-lg mb-10">
            Take the first step towards financial freedom. Join Mountain Dweller today and 
            become part of a community that's changing lives across Pakistan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold text-lg px-8 font-semibold">
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/packages">
              <Button size="lg" variant="outline" className="border-mountain-foreground/30 text-mountain-foreground hover:bg-mountain-foreground/10 text-lg px-8">
                View Packages
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
