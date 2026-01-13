import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Banknote, CheckCircle, TrendingUp, AlertCircle } from "lucide-react";

interface DirectInvestmentDialogProps {
  userId: string;
  walletBalance: number;
  hasPackage: boolean;
  hasInvestment: boolean;
  onSuccess: () => void;
}

const INVESTMENT_OPTIONS = [
  { 
    amount: 5000, 
    bonus: 1500, 
    percentage: 30,
    label: "PKR 5,000",
    description: "30% Return = PKR 1,500 Bonus"
  },
  { 
    amount: 10000, 
    bonus: 3000, 
    percentage: 30,
    label: "PKR 10,000",
    description: "30% Return = PKR 3,000 Bonus"
  },
  { 
    amount: 15000, 
    bonus: 6000, 
    percentage: 40,
    label: "PKR 15,000",
    description: "40% Return = PKR 6,000 Bonus"
  },
];

export const DirectInvestmentDialog = ({ 
  userId, 
  walletBalance, 
  hasPackage,
  hasInvestment,
  onSuccess 
}: DirectInvestmentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(5000);
  const { toast } = useToast();

  const selectedOption = INVESTMENT_OPTIONS.find(o => o.amount === selectedAmount);
  const canAfford = walletBalance >= selectedAmount;

  const handleInvest = async () => {
    if (!userId || !selectedAmount) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("make_direct_investment", {
        p_user_id: userId,
        p_amount: selectedAmount,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; message?: string; error?: string };
      
      if (!result.success) {
        throw new Error(result.error || "Investment failed");
      }

      toast({
        title: "Investment Successful!",
        description: `You've invested ${selectedAmount.toLocaleString()} PKR and received ${selectedOption?.bonus.toLocaleString()} PKR bonus.`,
      });
      
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error("Investment error:", error);
      toast({
        title: "Investment Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (hasPackage) {
    return (
      <Button variant="outline" className="w-full h-auto flex-col py-4 gap-2" disabled>
        <Banknote className="w-5 h-5" />
        <span className="text-xs">Already Have Package</span>
      </Button>
    );
  }

  if (hasInvestment) {
    return (
      <Button variant="outline" className="w-full h-auto flex-col py-4 gap-2" disabled>
        <CheckCircle className="w-5 h-5 text-primary" />
        <span className="text-xs">Investment Active</span>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-auto flex-col py-4 gap-2">
          <Banknote className="w-5 h-5" />
          <span className="text-xs">Direct Invest</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary" />
            Direct Investment
          </DialogTitle>
          <DialogDescription>
            Invest without buying a package and earn instant bonus!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Balance:</span>
              <span className="font-medium">{walletBalance.toLocaleString()} PKR</span>
            </div>
          </div>

          <RadioGroup
            value={selectedAmount.toString()}
            onValueChange={(val) => setSelectedAmount(parseInt(val))}
            className="space-y-3"
          >
            {INVESTMENT_OPTIONS.map((option) => {
              const isAffordable = walletBalance >= option.amount;
              return (
                <div 
                  key={option.amount}
                  className={`flex items-center space-x-3 border rounded-lg p-4 transition-colors ${
                    selectedAmount === option.amount 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  } ${!isAffordable ? 'opacity-50' : ''}`}
                >
                  <RadioGroupItem 
                    value={option.amount.toString()} 
                    id={`invest-${option.amount}`}
                    disabled={!isAffordable}
                  />
                  <Label 
                    htmlFor={`invest-${option.amount}`} 
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-accent">+{option.bonus.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{option.percentage}% Return</p>
                      </div>
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          {!canAfford && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Insufficient balance. You need {selectedAmount.toLocaleString()} PKR to invest.
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-accent/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="font-medium text-accent">Referral Bonuses</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Level 1 referrer gets <strong>10%</strong> of your investment</p>
              <p>• Level 2 referrer gets <strong>5%</strong> of your investment</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleInvest} 
            disabled={isLoading || !canAfford}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Invest {selectedAmount.toLocaleString()} PKR
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};