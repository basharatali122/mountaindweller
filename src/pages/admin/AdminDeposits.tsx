import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Eye, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  Wallet
} from "lucide-react";
import { format } from "date-fns";

interface DepositRequest {
  id: string;
  user_id: string;
  amount: number;
  bank_reference: string | null;
  payment_proof_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  user_email?: string;
  user_name?: string;
  signed_proof_url?: string;
}

const AdminDeposits = () => {
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      const { data, error } = await supabase
        .from("deposit_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user details and generate signed URLs for each deposit
      const depositsWithUsers = await Promise.all(
        (data || []).map(async (deposit) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", deposit.user_id)
            .single();

          // Generate signed URL for payment proof (1 hour expiry)
          let signedProofUrl: string | undefined;
          if (deposit.payment_proof_url) {
            const { data: signedData } = await supabase.storage
              .from("payment-proofs")
              .createSignedUrl(deposit.payment_proof_url, 3600);
            signedProofUrl = signedData?.signedUrl;
          }

          return {
            ...deposit,
            user_email: profile?.email || "Unknown",
            user_name: profile?.full_name || "Unknown",
            signed_proof_url: signedProofUrl,
          };
        })
      );

      setDeposits(depositsWithUsers);
    } catch (error) {
      console.error("Error fetching deposits:", error);
      toast({
        title: "Error",
        description: "Failed to load deposit requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processDeposit = async (approved: boolean) => {
    if (!selectedDeposit) return;

    setIsProcessing(true);
    try {
      // Update deposit request status
      const { error: updateError } = await supabase
        .from("deposit_requests")
        .update({
          status: approved ? "approved" : "rejected",
          admin_notes: adminNotes || null,
          processed_at: new Date().toISOString(),
        })
        .eq("id", selectedDeposit.id);

      if (updateError) throw updateError;

      if (approved) {
        // Get current wallet balance
        const { data: wallet, error: walletFetchError } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", selectedDeposit.user_id)
          .single();

        if (walletFetchError) throw walletFetchError;

        // Update wallet balance
        const { error: walletUpdateError } = await supabase
          .from("wallets")
          .update({
            balance: (wallet?.balance || 0) + selectedDeposit.amount,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", selectedDeposit.user_id);

        if (walletUpdateError) throw walletUpdateError;

        // Create transaction record
        const { error: txError } = await supabase.from("transactions").insert({
          user_id: selectedDeposit.user_id,
          type: "deposit" as const,
          amount: selectedDeposit.amount,
          description: `Bank transfer deposit${selectedDeposit.bank_reference ? ` (Ref: ${selectedDeposit.bank_reference})` : ""}`,
          reference_id: selectedDeposit.id,
        });

        if (txError) throw txError;
      }

      // Send email notification
      try {
        await supabase.functions.invoke("send-deposit-notification", {
          body: {
            userEmail: selectedDeposit.user_email,
            userName: selectedDeposit.user_name,
            amount: selectedDeposit.amount,
            status: approved ? "approved" : "rejected",
            adminNotes: adminNotes || undefined,
          },
        });
        console.log("Email notification sent");
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Don't fail the whole operation if email fails
      }

      toast({
        title: approved ? "Deposit Approved" : "Deposit Rejected",
        description: approved
          ? `Rs. ${selectedDeposit.amount.toLocaleString()} has been added to user's wallet`
          : "The deposit request has been rejected",
      });

      setSelectedDeposit(null);
      setAdminNotes("");
      fetchDeposits();
    } catch (error) {
      console.error("Process deposit error:", error);
      toast({
        title: "Error",
        description: "Failed to process deposit request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = deposits.filter((d) => d.status === "pending").length;
  const totalDeposits = deposits
    .filter((d) => d.status === "approved")
    .reduce((sum, d) => sum + d.amount, 0);

  if (isLoading) {
    return (
      <AdminLayout title="Deposit Requests" description="Manage user deposit requests">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Deposit Requests"
      description="Review and approve user deposit requests"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Approved</p>
              <p className="text-2xl font-bold">Rs. {totalDeposits.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold">{deposits.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-card rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deposits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No deposit requests yet
                </TableCell>
              </TableRow>
            ) : (
              deposits.map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{deposit.user_name}</p>
                      <p className="text-sm text-muted-foreground">{deposit.user_email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    Rs. {deposit.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {deposit.bank_reference || "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(deposit.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDeposit(deposit);
                        setAdminNotes(deposit.admin_notes || "");
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Deposit Details Dialog */}
      <Dialog open={!!selectedDeposit} onOpenChange={() => setSelectedDeposit(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Deposit Request Details</DialogTitle>
            <DialogDescription>
              Review the deposit request and payment proof
            </DialogDescription>
          </DialogHeader>

          {selectedDeposit && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{selectedDeposit.user_name}</p>
                  <p className="text-muted-foreground text-xs">{selectedDeposit.user_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg">Rs. {selectedDeposit.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reference</p>
                  <p className="font-medium">{selectedDeposit.bank_reference || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(selectedDeposit.status)}
                </div>
                <div>
                  <p className="text-muted-foreground">Requested</p>
                  <p className="font-medium">
                    {format(new Date(selectedDeposit.created_at), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
                {selectedDeposit.processed_at && (
                  <div>
                    <p className="text-muted-foreground">Processed</p>
                    <p className="font-medium">
                      {format(new Date(selectedDeposit.processed_at), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Proof */}
              {selectedDeposit.signed_proof_url && (
                <div className="space-y-2">
                  <Label>Payment Proof</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={selectedDeposit.signed_proof_url}
                      alt="Payment proof"
                      className="w-full max-h-64 object-contain bg-muted"
                    />
                  </div>
                  <a
                    href={selectedDeposit.signed_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Open in new tab <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Admin Notes */}
              {selectedDeposit.status === "pending" && (
                <div className="space-y-2">
                  <Label htmlFor="notes">Admin Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes about this deposit..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
              )}

              {selectedDeposit.admin_notes && selectedDeposit.status !== "pending" && (
                <div className="space-y-2">
                  <Label>Admin Notes</Label>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {selectedDeposit.admin_notes}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedDeposit?.status === "pending" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => processDeposit(false)}
                  disabled={isProcessing}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button
                  onClick={() => processDeposit(true)}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Approve & Credit
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setSelectedDeposit(null)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDeposits;
