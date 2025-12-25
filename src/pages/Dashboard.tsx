import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TeamMembersList } from "@/components/dashboard/TeamMembersList";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { RankProgress } from "@/components/dashboard/RankProgress";
import { EditProfileDialog } from "@/components/dashboard/EditProfileDialog";
import { WithdrawalRequestDialog } from "@/components/dashboard/WithdrawalRequestDialog";
import { 
  Wallet, 
  Users, 
  TrendingUp, 
  Copy, 
  CheckCircle, 
  LogOut, 
  ArrowUpRight,
  Award,
  Mountain
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  referral_code: string;
  rank: string | null;
  team_count: number;
}

interface WalletData {
  balance: number;
  total_earned: number;
  total_withdrawn: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchData();

      // Real-time subscription for wallet updates
      const walletChannel = supabase
        .channel('wallet-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Wallet updated:', payload);
            setWallet(payload.new as WalletData);
          }
        )
        .subscribe();

      // Real-time subscription for profile updates
      const profileChannel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            console.log('Profile updated:', payload);
            setProfile(payload.new as Profile);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(walletChannel);
        supabase.removeChannel(profileChannel);
      };
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (walletError) throw walletError;
      setWallet(walletData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You've been signed out successfully.",
    });
    navigate("/");
  };

  const copyReferralLink = () => {
    if (profile?.referral_code) {
      const link = `${window.location.origin}/auth?ref=${profile.referral_code}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Your referral link has been copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 bg-background min-h-screen">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Welcome, {profile?.full_name || "Member"}
              </h1>
              <p className="text-muted-foreground">
                Manage your Mountain Dweller account
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-fit"
            >
              <LogOut className="mr-2 w-4 h-4" />
              Logout
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {wallet?.balance?.toLocaleString() || 0} <span className="text-sm">PKR</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {wallet?.total_earned?.toLocaleString() || 0} <span className="text-sm">PKR</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-sky" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {profile?.team_count || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Rank</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {profile?.rank || "Member"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Referral Card */}
              <div className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-display text-xl font-bold mb-1">Your Referral Code</h2>
                    <p className="text-primary-foreground/70 text-sm">
                      Share this code to invite friends and earn bonuses
                    </p>
                  </div>
                  <Mountain className="w-10 h-10 text-accent" />
                </div>
                
                <div className="bg-primary-foreground/10 rounded-xl p-4 flex items-center justify-between">
                  <code className="font-mono text-2xl font-bold tracking-wider">
                    {profile?.referral_code || "------"}
                  </code>
                  <Button
                    size="sm"
                    onClick={copyReferralLink}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="mr-2 w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 w-4 h-4" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link to="/packages">
                    <Button variant="outline" className="w-full h-auto flex-col py-4 gap-2">
                      <ArrowUpRight className="w-5 h-5" />
                      <span className="text-xs">Buy Package</span>
                    </Button>
                  </Link>
                  <WithdrawalRequestDialog
                    userId={user?.id || ""}
                    walletBalance={wallet?.balance || 0}
                    onSuccess={fetchData}
                  />
                  <Link to="/products">
                    <Button variant="outline" className="w-full h-auto flex-col py-4 gap-2">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-xs">Products</span>
                    </Button>
                  </Link>
                  <Link to="/business-plan">
                    <Button variant="outline" className="w-full h-auto flex-col py-4 gap-2">
                      <Award className="w-5 h-5" />
                      <span className="text-xs">Ranks</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Team Members */}
              <TeamMembersList userId={user?.id || ""} />

              {/* Transaction History */}
              <TransactionHistory userId={user?.id || ""} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">
                  Profile Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</p>
                    <p className="text-foreground">{profile?.full_name || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
                    <p className="text-foreground">{profile?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Phone</p>
                    <p className="text-foreground">{profile?.phone || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">City</p>
                    <p className="text-foreground">{profile?.city || "Not set"}</p>
                  </div>
                </div>
                <div className="mt-4">
                  {profile && (
                    <EditProfileDialog
                      userId={user?.id || ""}
                      currentProfile={{
                        full_name: profile.full_name,
                        phone: profile.phone,
                        city: profile.city,
                      }}
                      onUpdate={fetchData}
                    />
                  )}
                </div>
              </div>

              {/* Rank Progress */}
              <RankProgress 
                currentRank={profile?.rank || "Member"} 
                teamCount={profile?.team_count || 0} 
              />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Dashboard;
