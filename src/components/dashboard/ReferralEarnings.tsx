import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Users, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ReferralEarningsProps {
  userId: string;
}

interface LevelEarnings {
  level1: number;
  level2: number;
  level3: number;
  total: number;
}

export const ReferralEarnings = ({ userId }: ReferralEarningsProps) => {
  const [earnings, setEarnings] = useState<LevelEarnings>({ level1: 0, level2: 0, level3: 0, total: 0 });
  const [referralCounts, setReferralCounts] = useState({ paid: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchReferralStats();

      const channel = supabase
        .channel('referral-earnings')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${userId}`
          },
          () => {
            fetchReferralStats();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  const fetchReferralStats = async () => {
    try {
      // Fetch referral bonus transactions to calculate earnings by level
      const { data: transactions, error: txError } = await supabase
        .from("transactions")
        .select("amount, description")
        .eq("user_id", userId)
        .eq("type", "referral_bonus");

      if (txError) throw txError;

      let level1 = 0, level2 = 0, level3 = 0;
      
      transactions?.forEach(tx => {
        const desc = tx.description || "";
        if (desc.includes("Level 1")) {
          level1 += tx.amount;
        } else if (desc.includes("Level 2")) {
          level2 += tx.amount;
        } else if (desc.includes("Level 3")) {
          level3 += tx.amount;
        } else {
          // Legacy transactions without level info count as level 1
          level1 += tx.amount;
        }
      });

      setEarnings({
        level1,
        level2,
        level3,
        total: level1 + level2 + level3
      });

      // Fetch referral counts
      const { data: referrals, error: refError } = await supabase
        .from("referrals")
        .select("is_paid")
        .eq("referrer_id", userId);

      if (refError) throw refError;

      setReferralCounts({
        paid: referrals?.filter(r => r.is_paid).length || 0,
        pending: referrals?.filter(r => !r.is_paid).length || 0
      });
    } catch (error) {
      console.error("Error fetching referral stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Gift className="w-5 h-5 text-accent" />
        Referral Earnings
      </h2>
      
      <div className="space-y-4">
        <div className="bg-accent/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="font-display text-2xl font-bold text-accent">
                {earnings.total.toLocaleString()} <span className="text-sm">PKR</span>
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-accent/50" />
          </div>
        </div>

        {/* Earnings by Level */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">By Level</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-primary/10 rounded-lg px-3 py-2">
              <span className="text-sm text-foreground">Level 1 <span className="text-muted-foreground">(10%)</span></span>
              <span className="font-medium text-primary">{earnings.level1.toLocaleString()} PKR</span>
            </div>
            <div className="flex items-center justify-between bg-sky/10 rounded-lg px-3 py-2">
              <span className="text-sm text-foreground">Level 2 <span className="text-muted-foreground">(5%)</span></span>
              <span className="font-medium text-sky">{earnings.level2.toLocaleString()} PKR</span>
            </div>
            <div className="flex items-center justify-between bg-gold/10 rounded-lg px-3 py-2">
              <span className="text-sm text-foreground">Level 3 <span className="text-muted-foreground">(2%)</span></span>
              <span className="font-medium text-gold">{earnings.level3.toLocaleString()} PKR</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/5 rounded-xl p-3 text-center">
            <Users className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="font-display text-lg font-bold text-foreground">{referralCounts.paid}</p>
            <p className="text-xs text-muted-foreground">Paid</p>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="font-display text-lg font-bold text-foreground">{referralCounts.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>
      </div>
    </div>
  );
};
