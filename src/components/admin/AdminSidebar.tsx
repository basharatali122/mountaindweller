import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingBag, 
  Wallet, 
  Link2, 
  Mountain,
  ChevronLeft,
  LogOut,
  ArrowDownToLine,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Packages", url: "/admin/packages", icon: Package },
  { title: "Products", url: "/admin/products", icon: ShoppingBag },
  { title: "Orders", url: "/admin/orders", icon: ClipboardList },
  { title: "Deposits", url: "/admin/deposits", icon: ArrowDownToLine },
  { title: "Withdrawals", url: "/admin/withdrawals", icon: Wallet },
  { title: "Referrals", url: "/admin/referrals", icon: Link2 },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
              <Mountain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">Admin</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "p-2 rounded-lg hover:bg-secondary transition-colors",
            collapsed && "mx-auto"
          )}
        >
          <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.url;
          
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                collapsed && "justify-center"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="font-medium">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        <Link to="/dashboard">
          <Button
            variant="ghost"
            className={cn("w-full justify-start gap-3", collapsed && "justify-center")}
          >
            <Users className="w-5 h-5" />
            {!collapsed && <span>User Dashboard</span>}
          </Button>
        </Link>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn("w-full justify-start gap-3 text-muted-foreground", collapsed && "justify-center")}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
