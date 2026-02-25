import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send, Mountain, CheckCircle, Instagram, Facebook, Youtube } from "lucide-react";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(10, "Please enter a valid phone number").max(20),
  email: z.string().email("Please enter a valid email address").max(255),
  city: z.string().min(2, "City must be at least 2 characters").max(100),
  interest: z.enum(["business", "products"], {
    required_error: "Please select your interest",
  }),
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
      const validatedData = contactSchema.parse(formData);
      setIsSubmitting(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsSubmitted(true);
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  if (isSubmitted) {
    return (
      <Layout>
        <section className="py-24 min-h-[70vh] flex items-center bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h1 className="font-display text-4xl font-bold text-foreground mb-4">
                Thank You!
              </h1>
              <p className="text-muted-foreground text-lg mb-8">
                Your message has been received. Our team will contact you within 24 hours 
                to discuss your inquiry.
              </p>
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({});
                }}
                variant="outline"
              >
                Send Another Message
              </Button>
            </div>
          </div>
        </section>
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
              <Mail className="w-5 h-5 text-accent" />
              <span className="text-primary-foreground text-sm font-medium">Contact Us</span>
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Start Your Journey Today
            </h1>
            <p className="text-primary-foreground/80 text-lg leading-relaxed">
              Ready to transform your life? Fill out the form below and our team will 
              reach out to guide you on your path to success.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="order-2 lg:order-1">
              <div className="bg-card rounded-3xl border border-border p-8 md:p-10">
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  Get in Touch
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Your full name"
                        value={formData.name || ""}
                        onChange={(e) => updateField("name", e.target.value)}
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && (
                        <p className="text-destructive text-sm">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        placeholder="03XX-XXXXXXX"
                        value={formData.phone || ""}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className={errors.phone ? "border-destructive" : ""}
                      />
                      {errors.phone && (
                        <p className="text-destructive text-sm">{errors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email || ""}
                        onChange={(e) => updateField("email", e.target.value)}
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && (
                        <p className="text-destructive text-sm">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="Your city"
                        value={formData.city || ""}
                        onChange={(e) => updateField("city", e.target.value)}
                        className={errors.city ? "border-destructive" : ""}
                      />
                      {errors.city && (
                        <p className="text-destructive text-sm">{errors.city}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interest">I'm Interested In *</Label>
                    <Select
                      value={formData.interest}
                      onValueChange={(value) => updateField("interest", value)}
                    >
                      <SelectTrigger className={errors.interest ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select your interest" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business">Business Opportunity</SelectItem>
                        <SelectItem value="products">Product Inquiry</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.interest && (
                      <p className="text-destructive text-sm">{errors.interest}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us more about what you're looking for..."
                      rows={4}
                      value={formData.message || ""}
                      onChange={(e) => updateField("message", e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>

            {/* Contact Info */}
            <div className="order-1 lg:order-2">
              <div className="sticky top-28">
                <span className="inline-block text-accent font-semibold uppercase tracking-wider text-sm mb-4">
                  Connect With Us
                </span>
                <h2 className="font-display text-4xl font-bold text-foreground mb-6">
                  We're Here to Help
                </h2>
                <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                  Have questions about our business opportunity or products? Our team is 
                  ready to assist you every step of the way.
                </p>

                <div className="space-y-6 mb-10">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Location</h3>
                      <p className="text-muted-foreground">Kasur, Pakistan</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                      <a href="tel:03304260609" className="text-muted-foreground hover:text-primary transition-colors">0330-4260609</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email</h3>
                      <a 
                        href="mailto:officialmountaidweller@gmail.com" 
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        officialmountaidweller@gmail.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="mb-10">
                  <h3 className="font-semibold text-foreground mb-4">Follow Us</h3>
                  <div className="flex gap-3">
                    <a
                      href="https://www.tiktok.com/@mountain.deweller"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors group"
                    >
                      <svg className="w-5 h-5 text-primary group-hover:text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </a>
                    <a
                      href="https://www.instagram.com/mountaindweller321"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors group"
                    >
                      <Instagram className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
                    </a>
                    <a
                      href="https://www.facebook.com/share/16qBF6cvPK/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors group"
                    >
                      <Facebook className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
                    </a>
                    <a
                      href="https://youtube.com/@mountaindweller321"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors group"
                    >
                      <Youtube className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
                    </a>
                  </div>
                </div>

                {/* Website URL Card */}
                <div className="bg-primary rounded-2xl p-6 text-center">
                  <Mountain className="w-10 h-10 text-accent mx-auto mb-3" />
                  <p className="text-primary-foreground/70 text-sm mb-2">Official Website</p>
                  <p className="text-primary-foreground font-display text-xl font-bold">
                    mountaindweller.online
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
