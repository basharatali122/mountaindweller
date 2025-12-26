import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import logo from "@/assets/logo.jpg";

export function Footer() {
  return (
    <footer className="bg-mountain text-mountain-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={logo} 
                alt="Mountain Dweller Logo" 
                className="h-16 w-auto object-contain"
              />
            </Link>
            <p className="text-mountain-foreground/70 text-sm leading-relaxed">
              Empowering individuals to achieve financial freedom through innovative business opportunities and premium products.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://www.tiktok.com/@mountain.deweller" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-mountain-foreground/10 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a 
                href="https://www.instagram.com/mountaindweller321" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-mountain-foreground/10 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://www.facebook.com/share/16qBF6cvPK/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-mountain-foreground/10 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://youtube.com/@mountaindweller321" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-mountain-foreground/10 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { href: "/about", label: "About Us" },
                { href: "/business-plan", label: "Business Plan" },
                { href: "/packages", label: "Packages" },
                { href: "/products", label: "Products" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-mountain-foreground/70 hover:text-accent transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Our Products</h4>
            <ul className="space-y-3">
              {[
                "MD Shampoo",
                "Sun Block SPF50",
                "Face Wash",
                "Serum Vitamin C",
                "Cream Nevolis",
              ].map((product) => (
                <li key={product}>
                  <Link
                    to="/products"
                    className="text-mountain-foreground/70 hover:text-accent transition-colors text-sm"
                  >
                    {product}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span className="text-mountain-foreground/70 text-sm">
                  Pakistan
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent shrink-0" />
                <span className="text-mountain-foreground/70 text-sm">
                  Contact via website
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <a 
                  href="mailto:officialmountaindweller@gmail.com" 
                  className="text-mountain-foreground/70 hover:text-accent transition-colors text-sm"
                >
                  officialmountaindweller@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-mountain-foreground/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-mountain-foreground/60 text-sm">
              © 2025 Mountain Dweller. All rights reserved.
            </p>
            <p className="text-mountain-foreground/60 text-sm">
              mountaindweller.online
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
