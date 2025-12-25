import { Layout } from "@/components/layout/Layout";
import { Mountain, Target, Lightbulb, Users, Award, TrendingUp, Heart } from "lucide-react";

const About = () => {
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
              <Mountain className="w-5 h-5 text-accent" />
              <span className="text-primary-foreground text-sm font-medium">About Us</span>
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              About Mountain Dweller
            </h1>
            <p className="text-primary-foreground/80 text-lg leading-relaxed">
              Empowering individuals across Pakistan to achieve financial independence through 
              innovative business opportunities and premium quality products.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-accent font-semibold uppercase tracking-wider text-sm mb-4">
                Our Story
              </span>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
                A Journey Begun with <span className="text-primary">Vision</span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Founded on <strong className="text-foreground">May 4th, 2025</strong>, Mountain Dweller emerged 
                  from a simple yet powerful belief: that every individual deserves the opportunity to 
                  build a prosperous future for themselves and their families.
                </p>
                <p>
                  Our name symbolizes the strength, resilience, and elevated perspective of those who 
                  dare to climb higher. Just as mountain dwellers thrive in challenging environments, 
                  our community members learn to overcome obstacles and reach new heights of success.
                </p>
                <p>
                  Today, Mountain Dweller stands as Pakistan's emerging leader in direct sales, 
                  offering a comprehensive business opportunity backed by premium products and 
                  unwavering support.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl bg-secondary/50 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
                    <Mountain className="w-10 h-10 text-primary" />
                  </div>
                  <div className="font-display text-5xl font-bold text-primary mb-2">2025</div>
                  <p className="text-muted-foreground">Year Founded</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-accent rounded-2xl p-6 shadow-gold">
                <div className="font-display text-2xl font-bold text-accent-foreground">May 4th</div>
                <div className="text-accent-foreground/70 text-sm">Launch Date</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card rounded-3xl p-8 md:p-12 border border-border">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-4">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                To provide a transparent, supportive, and rewarding platform that empowers 
                individuals to achieve financial independence through ethical business practices, 
                quality products, and continuous personal development.
              </p>
            </div>

            <div className="bg-card rounded-3xl p-8 md:p-12 border border-border">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <Lightbulb className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-4">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                To become Pakistan's most trusted direct sales company, recognized for 
                transforming lives, building leaders, and creating a legacy of success 
                that spans generations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block text-accent font-semibold uppercase tracking-wider text-sm mb-4">
              What We Stand For
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Our Core Values
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: "Community First",
                description: "We believe in the power of community support and collective growth.",
              },
              {
                icon: Award,
                title: "Excellence",
                description: "We strive for excellence in everything we do, from products to service.",
              },
              {
                icon: TrendingUp,
                title: "Growth Mindset",
                description: "We embrace challenges as opportunities for learning and improvement.",
              },
              {
                icon: Heart,
                title: "Integrity",
                description: "We conduct business with honesty, transparency, and ethical standards.",
              },
            ].map((value, index) => (
              <div
                key={index}
                className="group text-center p-8 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-elegant transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <value.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-24 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              What We Offer
            </h2>
            <p className="text-primary-foreground/70 text-lg">
              A comprehensive ecosystem designed for your success
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Business Training",
                description: "Comprehensive training programs designed to equip you with the skills needed for success in direct sales.",
              },
              {
                title: "Mentorship",
                description: "Access to experienced leaders who guide you through every step of your entrepreneurial journey.",
              },
              {
                title: "Premium Products",
                description: "High-quality skincare and personal care products that customers love and trust.",
              },
              {
                title: "Digital Tools",
                description: "Modern tools and platforms to manage your business efficiently in the digital age.",
              },
              {
                title: "Recognition & Rewards",
                description: "A rewarding system that celebrates your achievements and milestones.",
              },
              {
                title: "Community Support",
                description: "A supportive network of like-minded individuals committed to mutual success.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/10"
              >
                <h3 className="font-display text-xl font-semibold text-primary-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-primary-foreground/70 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
