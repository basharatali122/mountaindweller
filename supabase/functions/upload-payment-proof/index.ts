import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to verify authentication
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id);

    // Get form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const amount = formData.get("amount") as string;
    const bankReference = formData.get("bankReference") as string;

    if (!file || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing file or amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("File received:", file.name, file.size, "bytes");

    // Validate file
    if (!file.type.startsWith("image/")) {
      return new Response(
        JSON.stringify({ error: "Only images are allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "File too large. Maximum 10MB" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Service role client for storage (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique file path
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop() || "jpg";
    const filePath = `${user.id}/${timestamp}_${randomStr}.${extension}`;

    console.log("Uploading to:", filePath);

    // Upload file using service role (bypasses RLS)
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("payment-proofs")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload file: " + uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Upload successful:", uploadData);

    // Create deposit request using service role
    const depositAmount = parseInt(amount, 10);
    if (isNaN(depositAmount) || depositAmount < 1000) {
      return new Response(
        JSON.stringify({ error: "Invalid amount. Minimum Rs. 1,000" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: insertError } = await adminClient.from("deposit_requests").insert({
      user_id: user.id,
      amount: depositAmount,
      bank_reference: bankReference || null,
      payment_proof_url: filePath,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      // Try to clean up uploaded file
      await adminClient.storage.from("payment-proofs").remove([filePath]);
      return new Response(
        JSON.stringify({ error: "Failed to save deposit request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Deposit request created successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Deposit request submitted successfully",
        filePath 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
