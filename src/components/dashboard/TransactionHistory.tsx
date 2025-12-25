import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock,
  Gift,
  ShoppingBag,
  Wallet
} from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
}

interface TransactionHistoryProps {
  userId: string;
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case "deposit":
      return <ArrowDownLeft className="w-4 h-4" />;
    case "withdrawal":
      return <ArrowUpRight className="w-4 h-4" />;
    case "referral_bonus":
      return <Gift className="w-4 h-4" />;
    case "package_purchase":
      return <ShoppingBag className="w-4 h-4" />;
    default:
      return <Wallet className="w-4 h-4" />;
  }
};

const getTransactionColor = (type: string) => {
  switch (type) {
    case "deposit":
    case "referral_bonus":
      return "text-green-600 bg-green-100 dark:bg-green-900/30";
    case "withdrawal":
    case "package_purchase":
      return "text-red-600 bg-red-100 dark:bg-red-900/30";
    default:
      return "text-primary bg-primary/10";
  }
};

const formatTransactionType = (type: string) => {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const TransactionHistory = ({ userId }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();

    // Real-time subscription for new transactions
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New transaction:', payload);
          setTransactions((prev) => [payload.new as Transaction, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-display text-xl font-bold text-foreground mb-4">
          Transaction History
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
              <div className="h-5 bg-muted rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h2 className="font-display text-xl font-bold text-foreground mb-4">
        Transaction History
      </h2>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No transactions yet</p>
          <p className="text-sm">Your transaction history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(
                  transaction.type
                )}`}
              >
                {getTransactionIcon(transaction.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">
                  {formatTransactionType(transaction.type)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(transaction.created_at), "MMM d, yyyy • h:mm a")}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`font-bold ${
                    ["deposit", "referral_bonus"].includes(transaction.type)
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {["deposit", "referral_bonus"].includes(transaction.type)
                    ? "+"
                    : "-"}
                  {transaction.amount.toLocaleString()} PKR
                </p>
                {transaction.description && (
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {transaction.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
