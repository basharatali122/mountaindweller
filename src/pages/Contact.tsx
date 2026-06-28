import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send, Mountain, CheckCircle, Instagram, Facebook, Youtube } from "lucide-react";
import { FadeIn, AuroraBackground, Tilt3D } from "@/components/anim/Primitives";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(10, "Please enter a valid phone number").max(20),
  email: z.string().email("Please enter a valid email").max(255),
  city: z.string().min(2, "City must be at least 2 characters").max(100),
  interest: z.enum(["business", "products"], { required_error: "Please select your interest" }),
  message: z.string().max(1000).optional(),
});
type ContactFormData = z.infer<typeof contactSchema>;

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<Partial<ContactFormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      const validated = contactSchema.parse(formData);
      setIsSubmitting(true);
      const { error } = await supabase.from("contact_messages").insert({
        name: validated.name,
        phone: validated.phone,
        email: validated.email,
        city: validated.city,
        interest: validated.interest,
        message: validated.message || null,
      });
      if (error) throw error;
      setIsSubmitted(true);
      toast({ title: "Message Sent!", description: "We'll get back to you within 24 hours." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fe: Record<string, string> = {};
        error.errors.forEach((err) => { if (err.path[0]) fe[err.path[0].toString()] = err.message; });
        setErrors(fe);
      } else {
        toast({ title: "Failed to send", description: "Please try again in a moment.", variant: "destructive" });
      }
    } finally { setIsSubmitting(false); }
  };

  const updateField = (field: keyof ContactFormData, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => { const u = { ...p }; delete u[field]; return u; });
  };

  if (isSubmitted) {
    return (
      <Layout>
        <section className="pt-36 pb-24 min-h-[70vh] flex items-center bg-gradient-hero relative overflow-hidden">
          <AuroraBackground />
          <div className="container mx-auto px-4 relative">
            <FadeIn className="max-w-lg mx-auto text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow animate-float">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="font-display text-5xl font-bold tracking-tight mb-4">Thank you!</h1>
              <p className="text-muted-foreground text-lg mb-8">Your message has been received. We'll contact you within 24 hours.</p>
              <Button onClick={() => { setIsSubmitted(false); setFormData({}); }} variant="outline" className="rounded-full">Send another message</Button>
            </FadeIn>
          </div>
        </section>
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
              <Mail className="w-4 h-4 text-primary" /> Contact Us
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Start your <span className="text-gradient">journey today.</span>
            </h1>
            <p className="text-muted-foreground text-lg">Fill out the form and our team will reach out to guide you.</p>
          </FadeIn>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <FadeIn>
              <Tilt3D>
                <div className="bg-card rounded-3xl border border-border p-8 md:p-10 shadow-elegant">
                  <h2 className="font-display text-3xl font-bold tracking-tight mb-6">Get in touch</h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input id="name" placeholder="Your full name" value={formData.name || ""} onChange={(e) => updateField("name", e.target.value)} className={errors.name ? "border-destructive" : ""} />
                        {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input id="phone" placeholder="03XX-XXXXXXX" value={formData.phone || ""} onChange={(e) => updateField("phone", e.target.value)} className={errors.phone ? "border-destructive" : ""} />
                        {errors.phone && <p className="text-destructive text-sm">{errors.phone}</p>}
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" placeholder="your@email.com" value={formData.email || ""} onChange={(e) => updateField("email", e.target.value)} className={errors.email ? "border-destructive" : ""} />
                        {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input id="city" placeholder="Your city" value={formData.city || ""} onChange={(e) => updateField("city", e.target.value)} className={errors.city ? "border-destructive" : ""} />
                        {errors.city && <p className="text-destructive text-sm">{errors.city}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interest">I'm interested in *</Label>
                      <Select value={formData.interest} onValueChange={(v) => updateField("interest", v)}>
                        <SelectTrigger className={errors.interest ? "border-destructive" : ""}><SelectValue placeholder="Select your interest" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="business">Business Opportunity</SelectItem>
                          <SelectItem value="products">Product Inquiry</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.interest && <p className="text-destructive text-sm">{errors.interest}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message (Optional)</Label>
                      <Textarea id="message" placeholder="Tell us more..." rows={4} value={formData.message || ""} onChange={(e) => updateField("message", e.target.value)} />
                    </div>
                    <Button type="submit" size="lg" className="w-full rounded-full bg-gradient-primary text-primary-foreground shadow-glow h-12 font-semibold" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : <>Send Message <Send className="ml-1 w-5 h-5" /></>}
                    </Button>
                  </form>
                </div>
              </Tilt3D>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="sticky top-28">
                <span className="text-primary font-semibold uppercase tracking-wider text-xs mb-4 block">— Connect With Us</span>
                <h2 className="font-display text-4xl font-bold tracking-tight mb-6">We're here to <span className="text-gradient">help.</span></h2>
                <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                  Have questions about our business opportunity or products? Our team is ready to assist you.
                </p>

                <div className="space-y-4 mb-10">
                  {[
                    { icon: MapPin, label: "Location", value: "Kasur, Pakistan" },
                    { icon: Phone, label: "Phone", value: "0330-4260609", href: "tel:03304260609" },
                    { icon: Mail, label: "Email", value: "officialmountaidweller@gmail.com", href: "mailto:officialmountaidweller@gmail.com" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border hover-lift">
                      <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{item.label}</h3>
                        {item.href ? (
                          <a href={item.href} className="text-muted-foreground hover:text-primary transition-colors break-all">{item.value}</a>
                        ) : <p className="text-muted-foreground">{item.value}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-10">
                  <h3 className="font-semibold mb-4">Follow Us</h3>
                  <div className="flex gap-3">
                    {[
                      { href: "https://www.tiktok.com/@mountain.deweller", icon: () => (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>) },
                      { href: "https://www.instagram.com/mountaindweller321", icon: Instagram },
                      { href: "https://www.facebook.com/share/16qBF6cvPK/", icon: Facebook },
                      { href: "https://youtube.com/@mountaindweller321", icon: Youtube },
                    ].map((s, i) => (
                      <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-card border border-border hover:bg-gradient-primary hover:border-transparent flex items-center justify-center transition-all hover:-translate-y-0.5 hover:shadow-glow group">
                        <span className="text-primary group-hover:text-white transition-colors"><s.icon /></span>
                      </a>
                    ))}
                  </div>
                </div>

                <Tilt3D>
                  <div className="relative bg-mountain text-mountain-foreground rounded-3xl p-8 text-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
                    <Mountain className="relative w-12 h-12 text-primary-glow mx-auto mb-3 animate-float" />
                    <p className="relative text-mountain-foreground/70 text-sm mb-2">Official Website</p>
                    <p className="relative font-display text-2xl font-bold">mountaindweller.online</p>
                  </div>
                </Tilt3D>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
