import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DepositNotificationRequest {
  userEmail: string;
  userName: string;
  amount: number;
  status: "approved" | "rejected";
  adminNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, amount, status, adminNotes }: DepositNotificationRequest = await req.json();

    console.log(`Sending deposit ${status} notification to ${userEmail}`);

    const isApproved = status === "approved";
    const subject = isApproved
      ? `Deposit Approved - Rs. ${amount.toLocaleString()}`
      : `Deposit Request Update`;

    const html = isApproved
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1B4D3E, #2D7A5F); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Mountain Dweller</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #1B4D3E;">Deposit Approved! ✓</h2>
            <p>Dear ${userName || "Valued Member"},</p>
            <p>Great news! Your deposit request has been approved and credited to your wallet.</p>
            <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #2D7A5F;">
              <p style="margin: 0; font-size: 14px; color: #666;">Amount Credited</p>
              <p style="margin: 5px 0 0; font-size: 28px; font-weight: bold; color: #1B4D3E;">Rs. ${amount.toLocaleString()}</p>
            </div>
            <p>You can now use these funds to purchase packages or invest in our products.</p>
            <a href="https://mountaindweller.lovable.app/dashboard" style="display: inline-block; background: #1B4D3E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Go to Dashboard</a>
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
            <h2 style="color: #d97706;">Deposit Request Update</h2>
            <p>Dear ${userName || "Valued Member"},</p>
            <p>We regret to inform you that your deposit request could not be approved at this time.</p>
            <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #d97706;">
              <p style="margin: 0; font-size: 14px; color: #666;">Requested Amount</p>
              <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #333;">Rs. ${amount.toLocaleString()}</p>
              ${adminNotes ? `<p style="margin: 15px 0 0; font-size: 14px; color: #666;"><strong>Reason:</strong> ${adminNotes}</p>` : ""}
            </div>
            <p>If you believe this is an error or need assistance, please contact our support team.</p>
            <a href="https://mountaindweller.lovable.app/contact" style="display: inline-block; background: #1B4D3E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Contact Support</a>
          </div>
          <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Mountain Dweller. All rights reserved.</p>
          </div>
        </div>
      `;

    const emailResponse = await resend.emails.send({
      from: "Mountain Dweller <onboarding@resend.dev>",
      to: [userEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending deposit notification:", error);
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
