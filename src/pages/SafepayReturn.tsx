import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

type State = "loading" | "success" | "pending" | "failed";

const SafepayReturn = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("Verifying your payment with SafePay...");

  useEffect(() => {
    const tracker =
      searchParams.get("tracker") ||
      sessionStorage.getItem("safepay_pending_tracker") ||
      "";

    if (!tracker) {
      setState("failed");
      setMessage("No payment reference found. If you completed a payment, please contact support.");
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("safepay-verify", {
          body: { tracker },
        });
        if (error) throw error;
        const result = data as { status?: string; state?: string; error?: string };

        if (result?.status === "paid") {
          setState("success");
          setMessage("Payment successful! Your wallet has been credited.");
          sessionStorage.removeItem("safepay_pending_tracker");
        } else if (result?.status === "failed" || result?.status === "cancelled") {
          setState("failed");
          setMessage("Payment was not completed. You have not been charged.");
          sessionStorage.removeItem("safepay_pending_tracker");
        } else {
          setState("pending");
          setMessage("Payment is still processing. It may take a moment to reflect in your wallet.");
        }
      } catch (err) {
        console.error("Verify failed:", err);
        setState("failed");
        setMessage(err instanceof Error ? err.message : "Could not verify payment.");
      }
    })();
  }, [searchParams]);

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          {state === "loading" && (
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
          )}
          {state === "success" && (
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-600" />
          )}
          {state === "pending" && (
            <Loader2 className="w-16 h-16 mx-auto text-yellow-600" />
          )}
          {state === "failed" && (
            <XCircle className="w-16 h-16 mx-auto text-red-600" />
          )}

          <h1 className="font-display text-2xl font-bold">
            {state === "loading" && "Verifying payment"}
            {state === "success" && "Payment successful"}
            {state === "pending" && "Payment processing"}
            {state === "failed" && "Payment not completed"}
          </h1>
          <p className="text-muted-foreground">{message}</p>

          <div className="pt-2">
            <Button asChild className="w-full">
              <Link to="/dashboard">
                Back to dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SafepayReturn;
