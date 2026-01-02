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
    console.log("[UPLOAD] Request received, method:", req.method);
    console.log("[UPLOAD] Content-Type:", req.headers.get("content-type"));

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[UPLOAD] Missing authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase clients
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
      console.error("[UPLOAD] Auth error:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized - please log in again" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[UPLOAD] User authenticated:", user.id);

    // Check content type to determine how to parse
    const contentType = req.headers.get("content-type") || "";
    
    let fileBytes: Uint8Array;
    let fileName: string;
    let fileType: string;
    let amount: number;
    let bankReference: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData upload (most reliable for mobile)
      console.log("[UPLOAD] Parsing as FormData");
      const formData = await req.formData();
      
      const file = formData.get("file") as File | null;
      if (!file) {
        return new Response(
          JSON.stringify({ success: false, error: "No file provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      fileName = file.name;
      fileType = file.type;
      amount = parseInt(formData.get("amount") as string, 10);
      bankReference = (formData.get("bankReference") as string) || null;
      
      const arrayBuffer = await file.arrayBuffer();
      fileBytes = new Uint8Array(arrayBuffer);
      
      console.log("[UPLOAD] FormData file:", fileName, fileType, fileBytes.length, "bytes");
    } else {
      // Handle JSON with base64 (fallback)
      console.log("[UPLOAD] Parsing as JSON");
      const body = await req.json();
      const { file, fileName: fn, fileType: ft, amount: amt, bankReference: ref } = body;

      if (!file || !amt) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing file or amount" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      fileName = fn || "image.jpg";
      fileType = ft || "image/jpeg";
      amount = parseInt(amt, 10);
      bankReference = ref || null;

      // Decode base64
      try {
        const binaryString = atob(file);
        fileBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          fileBytes[i] = binaryString.charCodeAt(i);
        }
        console.log("[UPLOAD] Base64 decoded:", fileBytes.length, "bytes");
      } catch (decodeError) {
        console.error("[UPLOAD] Base64 decode error:", decodeError);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid file data" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate file type
    if (!fileType || !fileType.startsWith("image/")) {
      console.error("[UPLOAD] Invalid file type:", fileType);
      return new Response(
        JSON.stringify({ success: false, error: "Only images are allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check file size (max 10MB)
    if (fileBytes.length > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ success: false, error: "File too large. Maximum 10MB" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate amount
    if (isNaN(amount) || amount < 1000) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid amount. Minimum Rs. 1,000" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Service role client for storage (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique file path
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = fileName?.split(".").pop() || "jpg";
    const filePath = `${user.id}/${timestamp}_${randomStr}.${extension}`;

    console.log("[UPLOAD] Uploading to storage:", filePath);

    // Upload file
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("payment-proofs")
      .upload(filePath, fileBytes, {
        contentType: fileType,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("[UPLOAD] Storage error:", uploadError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to upload file: " + uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[UPLOAD] Storage upload successful:", uploadData.path);

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from("payment-proofs")
      .getPublicUrl(filePath);

    // Create deposit request
    const { error: insertError } = await adminClient.from("deposit_requests").insert({
      user_id: user.id,
      amount: amount,
      bank_reference: bankReference,
      payment_proof_url: urlData.publicUrl,
    });

    if (insertError) {
      console.error("[UPLOAD] Insert error:", insertError);
      // Clean up uploaded file
      await adminClient.storage.from("payment-proofs").remove([filePath]);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save deposit request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[UPLOAD] Deposit request created successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Deposit request submitted successfully",
        url: urlData.publicUrl
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[UPLOAD] Unexpected error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error: " + errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
