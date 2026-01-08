import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is admin
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id } = await req.json();
    
    if (!user_id) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent self-deletion
    if (user_id === caller.id) {
      return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete all related records first (in correct order due to foreign keys)
    // 1. Delete transactions
    await supabaseAdmin.from("transactions").delete().eq("user_id", user_id);
    
    // 2. Delete order_items (via orders)
    const { data: orders } = await supabaseAdmin.from("orders").select("id").eq("user_id", user_id);
    if (orders && orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      await supabaseAdmin.from("order_items").delete().in("order_id", orderIds);
    }
    
    // 3. Delete orders
    await supabaseAdmin.from("orders").delete().eq("user_id", user_id);
    
    // 4. Delete deposit_requests
    await supabaseAdmin.from("deposit_requests").delete().eq("user_id", user_id);
    
    // 5. Delete withdrawals
    await supabaseAdmin.from("withdrawals").delete().eq("user_id", user_id);
    
    // 6. Delete referrals (both as referrer and referred)
    await supabaseAdmin.from("referrals").delete().eq("referrer_id", user_id);
    await supabaseAdmin.from("referrals").delete().eq("referred_id", user_id);
    
    // 7. Delete user_roles
    await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
    
    // 8. Delete wallet
    await supabaseAdmin.from("wallets").delete().eq("user_id", user_id);
    
    // 9. Update profiles that were referred by this user (set referred_by to null)
    await supabaseAdmin.from("profiles").update({ referred_by: null }).eq("referred_by", user_id);
    
    // 10. Delete profile
    await supabaseAdmin.from("profiles").delete().eq("id", user_id);
    
    // 11. Finally delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete user: " + deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Delete user error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
