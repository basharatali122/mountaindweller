import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  bank_name: string | null;
  account_number: string | null;
  account_title: string | null;
  admin_notes: string | null;
  processed_at: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

const AdminWithdrawals = () => {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const processWithdrawal = async (status: "approved" | "rejected") => {
    if (!selectedWithdrawal) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from("withdrawals")
        .update({
          status,
          admin_notes: adminNotes || null,
          processed_at: new Date().toISOString(),
        })
        .eq("id", selectedWithdrawal.id);

      if (error) throw error;

      // If approved, deduct from wallet
      if (status === "approved") {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance, total_withdrawn")
          .eq("user_id", selectedWithdrawal.user_id)
          .single();

        if (wallet) {
          await supabase
            .from("wallets")
            .update({
              balance: wallet.balance - selectedWithdrawal.amount,
              total_withdrawn: wallet.total_withdrawn + selectedWithdrawal.amount,
            })
            .eq("user_id", selectedWithdrawal.user_id);

          // Add transaction record
          await supabase.from("transactions").insert({
            user_id: selectedWithdrawal.user_id,
            type: "withdrawal",
            amount: -selectedWithdrawal.amount,
            description: "Withdrawal processed",
            reference_id: selectedWithdrawal.id,
          });
        }
      }

      // Send email notification
      try {
        await supabase.functions.invoke("send-withdrawal-notification", {
          body: {
            userEmail: selectedWithdrawal.profiles?.email,
            userName: selectedWithdrawal.profiles?.full_name,
            amount: selectedWithdrawal.amount,
            status,
            bankName: selectedWithdrawal.bank_name,
            accountNumber: selectedWithdrawal.account_number,
            adminNotes: adminNotes || undefined,
          },
        });
        console.log("Withdrawal email notification sent");
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }

      toast({
        title: `Withdrawal ${status}`,
        description: status === "approved" 
          ? "Funds have been deducted from user wallet" 
          : "User has been notified",
      });

      setSelectedWithdrawal(null);
      setAdminNotes("");
      fetchWithdrawals();
    } catch (error) {
      toast({ title: "Error processing withdrawal", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-gold/10 text-gold border-gold/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge className="bg-primary/10 text-primary border-primary/30"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = withdrawals.filter(w => w.status === "pending").length;

  return (
    <AdminLayout title="Withdrawals" description="Process user withdrawal requests">
      {/* Stats */}
      <div className="flex items-center gap-4 mb-6">
        <Badge variant="outline">{withdrawals.length} total</Badge>
        {pendingCount > 0 && (
          <Badge className="bg-gold/10 text-gold">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Bank Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.map((withdrawal) => (
              <TableRow key={withdrawal.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{withdrawal.profiles?.full_name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{withdrawal.profiles?.email}</p>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-lg">
                  {withdrawal.amount.toLocaleString()} PKR
                </TableCell>
                <TableCell>
                  {withdrawal.bank_name ? (
                    <div className="text-sm">
                      <p>{withdrawal.bank_name}</p>
                      <p className="text-muted-foreground">{withdrawal.account_number}</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(withdrawal.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedWithdrawal(withdrawal);
                      setAdminNotes(withdrawal.admin_notes || "");
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {withdrawal.status === "pending" ? "Process" : "View"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {withdrawals.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No withdrawal requests
          </div>
        )}
      </div>

      {/* Process Dialog */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedWithdrawal?.status === "pending" ? "Process Withdrawal" : "Withdrawal Details"}
            </DialogTitle>
          </DialogHeader>
          
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{selectedWithdrawal.profiles?.full_name}</p>
                  <p className="text-muted-foreground">{selectedWithdrawal.profiles?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-bold text-xl">{selectedWithdrawal.amount.toLocaleString()} PKR</p>
                </div>
              </div>

              <div className="bg-secondary rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">Bank Details</p>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Bank:</span> {selectedWithdrawal.bank_name || "N/A"}</p>
                  <p><span className="text-muted-foreground">Account:</span> {selectedWithdrawal.account_number || "N/A"}</p>
                  <p><span className="text-muted-foreground">Title:</span> {selectedWithdrawal.account_title || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Admin Notes</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes (optional)..."
                  disabled={selectedWithdrawal.status !== "pending"}
                />
              </div>

              {selectedWithdrawal.status === "pending" && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={() => processWithdrawal("approved")}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => processWithdrawal("rejected")}
                    disabled={isProcessing}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}

              {selectedWithdrawal.status !== "pending" && (
                <div className="text-center py-2">
                  {getStatusBadge(selectedWithdrawal.status)}
                  {selectedWithdrawal.processed_at && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Processed on {new Date(selectedWithdrawal.processed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminWithdrawals;
