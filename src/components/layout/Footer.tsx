import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, Sparkles } from "lucide-react";
import logo from "@/assets/logo.jpg";

export function Footer() {
  return (
    <footer className="relative bg-mountain text-mountain-foreground overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh opacity-30 pointer-events-none" />
      <div className="absolute -top-20 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-3xl animate-blob pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-accent/20 blur-3xl animate-blob-delay pointer-events-none" />

      <div className="relative container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Mountain Dweller" className="h-12 w-12 rounded-full object-cover ring-2 ring-white/20" />
              <span className="font-display text-xl font-bold">MountainDweller</span>
            </Link>
            <p className="text-mountain-foreground/70 text-sm leading-relaxed">
              The next generation network. Premium products, transparent earnings, unlimited potential.
            </p>
            <div className="flex gap-2">
              {[
                { href: "https://www.tiktok.com/@mountain.deweller", icon: () => (<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>) },
                { href: "https://www.instagram.com/mountaindweller321", icon: Instagram },
                { href: "https://www.facebook.com/share/16qBF6cvPK/", icon: Facebook },
                { href: "https://youtube.com/@mountaindweller321", icon: Youtube },
              ].map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-gradient-primary hover:border-transparent flex items-center justify-center transition-all hover:-translate-y-0.5">
                  <s.icon />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm uppercase tracking-wider mb-5 text-mountain-foreground/60">Explore</h4>
            <ul className="space-y-3">
              {[
                { href: "/about", label: "About Us" },
                { href: "/business-plan", label: "Business Plan" },
                { href: "/packages", label: "Packages" },
                { href: "/products", label: "Products" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-mountain-foreground/70 hover:text-primary-glow transition-colors text-sm story-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm uppercase tracking-wider mb-5 text-mountain-foreground/60">Legal</h4>
            <ul className="space-y-3">
              {[
                { href: "/privacy-policy", label: "Privacy Policy" },
                { href: "/terms-and-conditions", label: "Terms and Conditions" },
                { href: "/refund-policy", label: "Cancellation & Refund Policy" },
                { href: "/ownership", label: "Ownership Statement" },
              ].map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-mountain-foreground/70 hover:text-primary-glow transition-colors text-sm story-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm uppercase tracking-wider mb-5 text-mountain-foreground/60">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3"><MapPin className="w-5 h-5 text-primary-glow shrink-0 mt-0.5" /><span className="text-mountain-foreground/70 text-sm">Kasur, Pakistan</span></li>
              <li className="flex items-center gap-3"><Phone className="w-5 h-5 text-primary-glow shrink-0" /><a href="tel:03304260609" className="text-mountain-foreground/70 hover:text-primary-glow text-sm">0330-4260609</a></li>
              <li className="flex items-center gap-3"><Mail className="w-5 h-5 text-primary-glow shrink-0" /><a href="mailto:officialmountaidweller@gmail.com" className="text-mountain-foreground/70 hover:text-primary-glow text-sm break-all">officialmountaidweller@gmail.com</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-16 pt-8 space-y-4">
          <p className="text-mountain-foreground/60 text-xs leading-relaxed max-w-3xl">
            MOUNTAINDWELLER (PRIVATE) LIMITED — a private limited company registered with the
            Securities and Exchange Commission of Pakistan (SECP). Incorporation / UIN:{" "}
            <strong>0346050</strong> · FBR NTN: <strong>J466026</strong> · Incorporated 17 July 2026 ·
            House No. 25, Street 11, Noor Shah Wali Road, Kasur, Punjab, Pakistan.{" "}
            <a
              href="https://leap.secp.gov.pk/#/verify-company-info/0346050"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-glow hover:underline"
            >
              Verify registration
            </a>
          </p>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-mountain-foreground/50 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-glow" />
              © 2026 MOUNTAINDWELLER (PRIVATE) LIMITED. All rights reserved.
            </p>
            <p className="text-mountain-foreground/50 text-sm">mountaindweller.online</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
