import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SAFEPAY_PUBLIC_KEY = Deno.env.get("SAFEPAY_PUBLIC_KEY")!;
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
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { amount, redirect_url } = await req.json();
    const amt = Number(amount);
    if (!amt || amt < 100 || amt > 10_000_000) {
      return json({ error: "Amount must be between 100 and 10,000,000 PKR" }, 400);
    }

    const orderId = `MD-${user.id.slice(0, 8)}-${Date.now()}`;

    // 1) Create payment session
    const sessionRes = await fetch(`${SAFEPAY_HOST}/order/payments/v3/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: SAFEPAY_SECRET_KEY,
      },
      body: JSON.stringify({
        merchant_api_key: SAFEPAY_PUBLIC_KEY,
        intent: "CYBERSOURCE",
        mode: "payment",
        entry_mode: "raw",
        currency: "PKR",
        amount: amt * 100, // paisa
        metadata: { order_id: orderId, user_id: user.id },
        include_fees: false,
      }),
    });

    const sessionText = await sessionRes.text();
    if (!sessionRes.ok) {
      console.error("Safepay session error:", sessionRes.status, sessionText);
      return json({ error: "Failed to create payment session", details: sessionText }, 502);
    }
    const sessionData = JSON.parse(sessionText);
    const tracker = sessionData?.data?.tracker?.token;
    if (!tracker) {
      return json({ error: "No tracker returned", details: sessionData }, 502);
    }

    // 2) Passport / auth token
    const passRes = await fetch(`${SAFEPAY_HOST}/client/passport/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: SAFEPAY_SECRET_KEY,
      },
      body: JSON.stringify({}),
    });
    const passText = await passRes.text();
    if (!passRes.ok) {
      console.error("Safepay passport error:", passRes.status, passText);
      return json({ error: "Failed to create auth token", details: passText }, 502);
    }
    const passData = JSON.parse(passText);
    const tbt = passData?.data;
    if (!tbt) return json({ error: "No auth token returned" }, 502);

    // 3) Persist pending transaction (service role bypasses RLS via SB)
    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    await service.from("safepay_transactions").insert({
      user_id: user.id,
      tracker,
      order_id: orderId,
      amount: amt,
      status: "pending",
      raw: sessionData,
    });

    // 4) Build hosted checkout URL
    const params = new URLSearchParams({
      tbt,
      tracker,
      env: SAFEPAY_ENV,
      source: "hosted",
      redirect_url: redirect_url || "",
      cancel_url: redirect_url || "",
    });
    const url = `${SAFEPAY_HOST}/embedded/?${params.toString()}`;

    return json({ url, tracker, order_id: orderId });
  } catch (err) {
    console.error("safepay-create-checkout error:", err);
    return json({ error: String(err?.message || err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
