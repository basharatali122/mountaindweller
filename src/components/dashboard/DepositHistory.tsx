import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface DepositRequest {
  id: string;
  amount: number;
  status: string;
  bank_reference: string | null;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
}

interface DepositHistoryProps {
  userId: string;
}

export function DepositHistory({ userId }: DepositHistoryProps) {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    fetchDeposits();

    // Real-time subscription for deposit updates
    const channel = supabase
      .channel("deposit-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deposit_requests",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchDeposits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchDeposits = async () => {
    try {
      const { data, error } = await supabase
        .from("deposit_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setDeposits(data || []);
    } catch (error) {
      console.error("Error fetching deposits:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h2 className="font-display text-xl font-bold text-foreground mb-4">
        Deposit Requests
      </h2>

      {deposits.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">
          No deposit requests yet
        </p>
      ) : (
        <div className="space-y-3">
          {deposits.map((deposit) => (
            <div
              key={deposit.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">
                    Rs. {deposit.amount.toLocaleString()}
                  </span>
                  {getStatusBadge(deposit.status)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(deposit.created_at), "MMM d, yyyy h:mm a")}
                  {deposit.bank_reference && (
                    <span className="ml-2">• Ref: {deposit.bank_reference}</span>
                  )}
                </p>
                {deposit.status === "rejected" && deposit.admin_notes && (
                  <p className="text-xs text-red-500 mt-1">
                    Reason: {deposit.admin_notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
