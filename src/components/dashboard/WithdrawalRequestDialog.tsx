import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Wallet } from "lucide-react";
import { z } from "zod";

const withdrawalSchema = z.object({
  amount: z.number().min(100, "Minimum withdrawal is 100 PKR"),
  bank_name: z.string().trim().min(1, "Bank name is required").max(100, "Bank name must be less than 100 characters"),
  account_title: z.string().trim().min(1, "Account title is required").max(100, "Account title must be less than 100 characters"),
  account_number: z.string().trim().min(1, "Account number is required").max(50, "Account number must be less than 50 characters"),
});

interface WithdrawalRequestDialogProps {
  userId: string;
  walletBalance: number;
  onSuccess: () => void;
}

export const WithdrawalRequestDialog = ({
  userId,
  walletBalance,
  onSuccess,
}: WithdrawalRequestDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    amount: "",
    bank_name: "",
    account_title: "",
    account_number: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const amount = parseFloat(formData.amount);
    
    if (isNaN(amount)) {
      setErrors({ amount: "Please enter a valid amount" });
      return;
    }

    if (amount > walletBalance) {
      setErrors({ amount: "Amount exceeds your wallet balance" });
      return;
    }

    const result = withdrawalSchema.safeParse({
      amount,
      bank_name: formData.bank_name,
      account_title: formData.account_title,
      account_number: formData.account_number,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from("withdrawals").insert({
        user_id: userId,
        amount: result.data.amount,
        bank_name: result.data.bank_name,
        account_title: result.data.account_title,
        account_number: result.data.account_number,
      });

      if (error) throw error;

      toast({
        title: "Withdrawal requested",
        description: "Your withdrawal request has been submitted for review.",
      });

      setFormData({
        amount: "",
        bank_name: "",
        account_title: "",
        account_number: "",
      });
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      toast({
        title: "Error",
        description: "Failed to submit withdrawal request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-auto flex-col py-4 gap-2">
          <Wallet className="w-5 h-5" />
          <span className="text-xs">Withdraw</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
          <DialogDescription>
            Enter your bank details and amount to withdraw. Available balance:{" "}
            <span className="font-semibold">{walletBalance.toLocaleString()} PKR</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (PKR) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                min="100"
                max={walletBalance}
                className={errors.amount ? "border-destructive" : ""}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name *</Label>
              <Input
                id="bank_name"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                placeholder="e.g. JazzCash, Easypaisa, HBL"
                className={errors.bank_name ? "border-destructive" : ""}
              />
              {errors.bank_name && (
                <p className="text-sm text-destructive">{errors.bank_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_title">Account Title *</Label>
              <Input
                id="account_title"
                name="account_title"
                value={formData.account_title}
                onChange={handleChange}
                placeholder="Enter account holder name"
                className={errors.account_title ? "border-destructive" : ""}
              />
              {errors.account_title && (
                <p className="text-sm text-destructive">{errors.account_title}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number *</Label>
              <Input
                id="account_number"
                name="account_number"
                value={formData.account_number}
                onChange={handleChange}
                placeholder="Enter account/phone number"
                className={errors.account_number ? "border-destructive" : ""}
              />
              {errors.account_number && (
                <p className="text-sm text-destructive">{errors.account_number}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || walletBalance < 100}>
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
