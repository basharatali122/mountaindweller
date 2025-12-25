import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Users, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ReferralEarningsProps {
  userId: string;
}

export const ReferralEarnings = ({ userId }: ReferralEarningsProps) => {
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [paidReferrals, setPaidReferrals] = useState(0);
  const [pendingReferrals, setPendingReferrals] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchReferralStats();

      // Real-time subscription for referral updates
      const channel = supabase
        .channel('referral-earnings')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'referrals',
            filter: `referrer_id=eq.${userId}`
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
      const { data, error } = await supabase
        .from("referrals")
        .select("bonus_amount, is_paid")
        .eq("referrer_id", userId);

      if (error) throw error;

      const paid = data?.filter(r => r.is_paid) || [];
      const pending = data?.filter(r => !r.is_paid) || [];
      const total = paid.reduce((sum, r) => sum + (r.bonus_amount || 0), 0);

      setTotalEarnings(total);
      setPaidReferrals(paid.length);
      setPendingReferrals(pending.length);
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
                {totalEarnings.toLocaleString()} <span className="text-sm">PKR</span>
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-accent/50" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/5 rounded-xl p-4 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="font-display text-xl font-bold text-foreground">{paidReferrals}</p>
            <p className="text-xs text-muted-foreground">Paid Referrals</p>
          </div>
          <div className="bg-muted rounded-xl p-4 text-center">
            <Users className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="font-display text-xl font-bold text-foreground">{pendingReferrals}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Earn 10% commission when your referrals purchase packages
        </p>
      </div>
    </div>
  );
};
