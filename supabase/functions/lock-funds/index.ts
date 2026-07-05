import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "npm:bcryptjs";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId, buyerId, pin } = await req.json();

    if (!orderId || !buyerId || !pin) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Since we're doing auth verification, let's verify the user token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // Using service role to bypass RLS for transactions
    );

    const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    
    if (authErr || !authUser || authUser.id !== buyerId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. Guards
    if (order.status !== 'PENDING_PAYMENT') return new Response(JSON.stringify({ error: "Order is not pending payment" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (buyerId === order.vendor_id) return new Response(JSON.stringify({ error: "self_dealing" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (order.buyer_id !== null) return new Response(JSON.stringify({ error: "order_claimed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (new Date(order.expires_at) < new Date()) return new Response(JSON.stringify({ error: "order_expired" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // 3. Fetch buyer balance
    const { data: buyer, error: buyerErr } = await supabase
      .from("users")
      .select("available_balance, escrow_balance, payment_pin")
      .eq("id", buyerId)
      .single();

    if (buyerErr || !buyer) {
      return new Response(JSON.stringify({ error: "Buyer not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify PIN
    if (!buyer.payment_pin) {
      return new Response(JSON.stringify({ error: "pin_not_set" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const isValid = await bcrypt.compare(pin, buyer.payment_pin);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "incorrect_pin" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (Number(buyer.available_balance) < Number(order.amount)) {
      return new Response(JSON.stringify({ 
        error: "insufficient_balance", 
        available: buyer.available_balance, 
        needed: order.amount 
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 4. Run updates (In lieu of RPC, running sequentially carefully)
    // First, claim the order to prevent race conditions
    const { data: updatedOrder, error: claimErr } = await supabase
      .from("orders")
      .update({ 
        buyer_id: buyerId, 
        status: "ESCROW_LOCKED", 
        escrow_locked_at: new Date().toISOString() 
      })
      .eq("id", orderId)
      .eq("status", "PENDING_PAYMENT")
      .is("buyer_id", null)
      .select()
      .single();

    if (claimErr || !updatedOrder) {
      return new Response(JSON.stringify({ error: "Order already claimed or modified" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Deduct balance
    const newAvailable = Number(buyer.available_balance) - Number(order.amount);
    const newEscrow = Number(buyer.escrow_balance) + Number(order.amount);

    await supabase
      .from("users")
      .update({
        available_balance: newAvailable,
        escrow_balance: newEscrow
      })
      .eq("id", buyerId);

    // Insert ledgers
    await supabase.from("ledger_entries").insert([
      {
        user_id: buyerId,
        order_id: orderId,
        entry_type: "ESCROW_LOCK",
        amount: Number(order.amount),
        balance_effect: "available",
        direction: "debit",
        narration: `Locked funds for ${order.item_name}`
      },
      {
        user_id: buyerId,
        order_id: orderId,
        entry_type: "ESCROW_LOCK",
        amount: Number(order.amount),
        balance_effect: "escrow",
        direction: "credit",
        narration: `Funds in escrow for ${order.item_name}`
      }
    ]);

    // Insert system message
    await supabase.from("messages").insert({
      order_id: orderId,
      sender_type: "system",
      message_type: "status_update",
      content: `🔒 Funds locked. ₦${order.amount} is secured in escrow. You can now ship the item.`
    });

    return new Response(JSON.stringify({ 
      success: true, 
      order: updatedOrder, 
      newBalances: { available: newAvailable, escrow: newEscrow } 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Internal Server Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
