import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  bonus_amount: number;
  is_paid: boolean;
  created_at: string;
}

const AdminReferrals = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReferrals(data || []);
    } catch (error) {
      console.error("Error fetching referrals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const paidCount = referrals.filter(r => r.is_paid).length;
  const totalBonus = referrals.reduce((sum, r) => sum + (r.bonus_amount || 0), 0);

  return (
    <AdminLayout title="Referrals" description="View referral network and bonuses">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground">Total Referrals</p>
          <p className="font-display text-2xl font-bold">{referrals.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground">Bonuses Paid</p>
          <p className="font-display text-2xl font-bold">{paidCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground">Total Bonus Amount</p>
          <p className="font-display text-2xl font-bold text-accent">{totalBonus.toLocaleString()} PKR</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referrer ID</TableHead>
              <TableHead>Referred ID</TableHead>
              <TableHead>Bonus</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals.map((referral) => (
              <TableRow key={referral.id}>
                <TableCell>
                  <code className="text-sm">{referral.referrer_id.slice(0, 8)}...</code>
                </TableCell>
                <TableCell>
                  <code className="text-sm">{referral.referred_id.slice(0, 8)}...</code>
                </TableCell>
                <TableCell>
                  {referral.bonus_amount > 0 ? (
                    <span className="font-medium text-accent">{referral.bonus_amount.toLocaleString()} PKR</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {referral.is_paid ? (
                    <Badge className="bg-primary/10 text-primary">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Paid
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(referral.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {referrals.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No referrals found
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReferrals;
