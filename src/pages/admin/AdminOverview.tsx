import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Users, Package, ShoppingBag, Wallet, TrendingUp, Clock } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalPackages: number;
  totalProducts: number;
  pendingWithdrawals: number;
  totalEarnings: number;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPackages: 0,
    totalProducts: 0,
    pendingWithdrawals: 0,
    totalEarnings: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch counts
      const [usersRes, packagesRes, productsRes, withdrawalsRes, walletsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("packages").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("wallets").select("total_earned"),
      ]);

      const totalEarnings = walletsRes.data?.reduce((sum, w) => sum + (w.total_earned || 0), 0) || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalPackages: packagesRes.count || 0,
        totalProducts: productsRes.count || 0,
        pendingWithdrawals: withdrawalsRes.count || 0,
        totalEarnings,
      });

      // Fetch recent users
      const { data: users } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentUsers(users || []);

      // Fetch pending withdrawals
      const { data: withdrawals } = await supabase
        .from("withdrawals")
        .select("*, profiles:user_id(full_name, email)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      setPendingWithdrawals(withdrawals || []);

    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout title="Dashboard Overview" description="Welcome to the admin panel">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "primary" },
          { label: "Packages", value: stats.totalPackages, icon: Package, color: "accent" },
          { label: "Products", value: stats.totalProducts, icon: ShoppingBag, color: "sky" },
          { label: "Pending Withdrawals", value: stats.pendingWithdrawals, icon: Clock, color: "gold" },
          { label: "Total Earnings", value: `${stats.totalEarnings.toLocaleString()} PKR`, icon: TrendingUp, color: "primary" },
        ].map((stat, index) => (
          <div key={index} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Recent Users</h2>
          {recentUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No users yet</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{user.full_name || "Unnamed"}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Withdrawals */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Pending Withdrawals</h2>
          {pendingWithdrawals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending withdrawals</p>
          ) : (
            <div className="space-y-3">
              {pendingWithdrawals.map((withdrawal: any) => (
                <div key={withdrawal.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-foreground">
                      {withdrawal.profiles?.full_name || "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {withdrawal.amount.toLocaleString()} PKR
                    </p>
                  </div>
                  <span className="text-xs bg-gold/10 text-gold px-2 py-1 rounded-full">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
