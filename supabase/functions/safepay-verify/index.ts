import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SAFEPAY_SECRET_KEY = Deno.env.get("SAFEPAY_SECRET_KEY")!;
const SAFEPAY_ENV = (Deno.env.get("SAFEPAY_ENV") || "sandbox").toLowerCase();
const SAFEPAY_HOST =
  SAFEPAY_ENV === "production"
    ? "https://api.getsafepay.com"
    : "https://sandbox.api.getsafepay.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { tracker } = await req.json();
    if (!tracker || typeof tracker !== "string") {
      return json({ error: "tracker required" }, 400);
    }

    // Fetch tracker state from Safepay
    const res = await fetch(
      `${SAFEPAY_HOST}/reporter/api/v1/payments/${encodeURIComponent(tracker)}`,
      { headers: { Authorization: SAFEPAY_SECRET_KEY } }
    );
    const text = await res.text();
    if (!res.ok) {
      console.error("Safepay fetch tracker error:", res.status, text);
      return json({ error: "Failed to fetch tracker", details: text }, 502);
    }
    const data = JSON.parse(text);
    const state = data?.data?.tracker?.state as string | undefined;

    let dbStatus = "pending";
    if (state === "TRACKER_ENDED") dbStatus = "paid";
    else if (state && state.includes("FAIL")) dbStatus = "failed";
    else if (state && state.includes("CANCEL")) dbStatus = "cancelled";

    // Credit the wallet atomically (idempotent via credited flag)
    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: creditResult, error: creditErr } = await service.rpc("credit_safepay_payment", {
      p_tracker: tracker,
      p_status: dbStatus,
      p_raw: data,
    });
    if (creditErr) {
      console.error("credit_safepay_payment error:", creditErr);
    }

    return json({ state, status: dbStatus, credited: creditResult });
  } catch (err) {
    console.error("safepay-verify error:", err);
    return json({ error: String(err?.message || err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
