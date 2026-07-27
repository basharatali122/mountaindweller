import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard } from "lucide-react";

interface SafepayCheckoutDialogProps {
  userId: string;
}

export function SafepayCheckoutDialog({ userId }: SafepayCheckoutDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    const amt = parseInt(amount);
    if (!amt || amt < 100) {
      toast({
        title: "Invalid amount",
        description: "Minimum deposit is Rs. 100",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/safepay/return`;
      const { data, error } = await supabase.functions.invoke("safepay-create-checkout", {
        body: { amount: amt, redirect_url: redirectUrl },
      });

      if (error) throw error;
      const result = data as { url?: string; tracker?: string; error?: string };
      if (!result?.url) {
        throw new Error(result?.error || "Could not create checkout session");
      }

      // Remember tracker locally so return page can verify even without query param
      if (result.tracker) {
        sessionStorage.setItem("safepay_pending_tracker", result.tracker);
      }
      window.location.href = result.url;
    } catch (err) {
      console.error("Safepay checkout error:", err);
      toast({
        title: "Payment failed",
        description: err instanceof Error ? err.message : "Could not start payment",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  if (!userId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-auto flex-col py-4 gap-2">
          <CreditCard className="w-5 h-5" />
          <span className="text-xs">Pay Online</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Online with SafePay</DialogTitle>
          <DialogDescription>
            Add funds to your wallet instantly using debit/credit card or wallet via SafePay's secure checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="sp-amount">Amount (Rs.)</Label>
            <Input
              id="sp-amount"
              type="number"
              inputMode="numeric"
              placeholder="e.g. 5000"
              min={100}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Minimum Rs. 100. You will be redirected to SafePay to complete the payment. Your wallet will be credited automatically when the payment succeeds.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCheckout} disabled={isLoading || !amount}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Continue to SafePay
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
