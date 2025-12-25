import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WithdrawalNotificationRequest {
  userEmail: string;
  userName: string;
  amount: number;
  status: "approved" | "rejected";
  bankName?: string;
  accountNumber?: string;
  adminNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication - only admins can send notifications
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized - No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with the user's JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify the user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user has admin role using the has_role function
    const { data: isAdmin, error: roleError } = await supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (roleError || !isAdmin) {
      console.error("Role check error:", roleError, "isAdmin:", isAdmin);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { userEmail, userName, amount, status, bankName, accountNumber, adminNotes }: WithdrawalNotificationRequest = await req.json();

    // Validate required fields
    if (!userEmail || !amount || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Admin ${user.email} sending withdrawal ${status} notification to ${userEmail}`);

    const isApproved = status === "approved";
    const subject = isApproved
      ? `Withdrawal Processed - Rs. ${amount.toLocaleString()}`
      : `Withdrawal Request Update`;

    const maskedAccount = accountNumber ? `****${accountNumber.slice(-4)}` : "N/A";

    const html = isApproved
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1B4D3E, #2D7A5F); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Mountain Dweller</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #1B4D3E;">Withdrawal Processed! ✓</h2>
            <p>Dear ${userName || "Valued Member"},</p>
            <p>Your withdrawal request has been approved and processed successfully.</p>
            <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #2D7A5F;">
              <p style="margin: 0; font-size: 14px; color: #666;">Amount Transferred</p>
              <p style="margin: 5px 0 0; font-size: 28px; font-weight: bold; color: #1B4D3E;">Rs. ${amount.toLocaleString()}</p>
              <p style="margin: 15px 0 0; font-size: 14px; color: #666;">
                <strong>Bank:</strong> ${bankName || "N/A"}<br/>
                <strong>Account:</strong> ${maskedAccount}
              </p>
            </div>
            <p>The funds should reflect in your bank account within 1-3 business days.</p>
            <a href="https://mountaindweller.lovable.app/dashboard" style="display: inline-block; background: #1B4D3E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">View Dashboard</a>
          </div>
          <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Mountain Dweller. All rights reserved.</p>
          </div>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1B4D3E, #2D7A5F); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Mountain Dweller</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #d97706;">Withdrawal Request Update</h2>
            <p>Dear ${userName || "Valued Member"},</p>
            <p>We regret to inform you that your withdrawal request could not be processed at this time.</p>
            <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #d97706;">
              <p style="margin: 0; font-size: 14px; color: #666;">Requested Amount</p>
              <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #333;">Rs. ${amount.toLocaleString()}</p>
              ${adminNotes ? `<p style="margin: 15px 0 0; font-size: 14px; color: #666;"><strong>Reason:</strong> ${adminNotes}</p>` : ""}
            </div>
            <p>Your funds have been returned to your wallet. If you believe this is an error, please contact our support team.</p>
            <a href="https://mountaindweller.lovable.app/contact" style="display: inline-block; background: #1B4D3E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Contact Support</a>
          </div>
          <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Mountain Dweller. All rights reserved.</p>
          </div>
        </div>
      `;

    const emailResponse = await resend.emails.send({
      from: "Mountain Dweller <noreply@mountaindweller.online>",
      to: [userEmail],
      reply_to: "officialmountaindweller@gmail.com",
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending withdrawal notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
