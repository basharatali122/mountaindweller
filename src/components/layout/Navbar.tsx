import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { CartSheet } from "@/components/cart/CartSheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/business-plan", label: "Plan" },
  { href: "/packages", label: "Packages" },
  { href: "/products", label: "Products" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "glass-strong shadow-soft" : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 blur-xl group-hover:bg-primary/60 transition-all rounded-full" />
              <img src={logo} alt="Mountain Dweller" className="relative h-10 w-10 md:h-12 md:w-12 rounded-full object-cover ring-2 ring-border" />
            </div>
            <span className="hidden sm:block font-display text-lg font-bold tracking-tight">
              Mountain<span className="text-gradient">Dweller</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 glass rounded-full px-2 py-1.5 border border-border/60">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-full transition-colors",
                  location.pathname === link.href ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {location.pathname === link.href && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 bg-gradient-primary rounded-full shadow-glow"
                    transition={{ type: "spring", duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle />
            <CartSheet />
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="outline" className="gap-2 rounded-full"><User className="w-4 h-4" />Dashboard</Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full"><LogOut className="w-5 h-5" /></Button>
              </>
            ) : (
              <>
                <Link to="/auth"><Button variant="ghost" className="rounded-full">Login</Button></Link>
                <Link to="/auth">
                  <Button className="rounded-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow gap-2">
                    <Sparkles className="w-4 h-4" /> Join Now
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
            <button className="p-2 rounded-full glass" onClick={() => setIsOpen(!isOpen)} aria-label="Menu">
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden glass-strong border-t border-border/60 overflow-hidden"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "block px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                      location.pathname === link.href ? "bg-gradient-primary text-primary-foreground" : "hover:bg-secondary"
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                <span className="text-sm text-muted-foreground">Cart</span>
                <CartSheet />
              </div>
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full mt-2 gap-2 rounded-full"><User className="w-4 h-4" />Dashboard</Button>
                  </Link>
                  <Button variant="ghost" className="w-full mt-2 rounded-full" onClick={() => { handleLogout(); setIsOpen(false); }}>
                    <LogOut className="mr-2 w-4 h-4" />Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setIsOpen(false)}><Button variant="outline" className="w-full mt-2 rounded-full">Login</Button></Link>
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button className="w-full mt-2 rounded-full bg-gradient-primary text-primary-foreground shadow-glow">Join Now</Button>
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
