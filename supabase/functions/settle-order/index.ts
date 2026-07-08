import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getNombaToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }
  
  const authUrl = Deno.env.get("NOMBA_AUTH_URL") || "https://sandbox.nomba.com/v1/auth/token/issue";
  
  const res = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "accountId": Deno.env.get("NOMBA_PARENT_ACCOUNT_ID")!
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: Deno.env.get("NOMBA_CLIENT_ID")!,
      client_secret: Deno.env.get("NOMBA_CLIENT_SECRET")!
    })
  });
  
  if (!res.ok) throw new Error("Failed to obtain Nomba access token");
  
  const json = await res.json();
  cachedToken = json.data.access_token;
  tokenExpiresAt = new Date(json.data.expiresAt).getTime() - (30 * 60 * 1000);
  return cachedToken!;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing orderId" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (order.status !== "DELIVERED_PENDING_RELEASE") return new Response(JSON.stringify({ error: "Order not pending release" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (order.settlement_attempts >= 3) return new Response(JSON.stringify({ error: "Max settlement attempts reached" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: vendor, error: vendorErr } = await supabase
      .from("users")
      .select("bank_account_number, bank_account_name, bank_code, pending_balance, available_balance, completed_deals_count, auto_payout_enabled")
      .eq("id", order.vendor_id)
      .single();

    if (vendorErr || !vendor) {
      return new Response(JSON.stringify({ error: "Vendor missing" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const platform_fee = Number(order.amount) * 0.015;
    const net_payout = Number(order.amount) - platform_fee;
    const payoutFee = 20;
    const final_payout = net_payout - payoutFee;

    // Check if we should do auto-payout
    let shouldAutoPayout = vendor.auto_payout_enabled !== false && vendor.bank_account_number && vendor.bank_code;
    
    if (shouldAutoPayout && final_payout <= 0) {
      console.warn(`Net payout ${net_payout} too small for ${payoutFee} NGN fee. Forcing internal settlement.`);
      shouldAutoPayout = false;
    }

    if (!shouldAutoPayout) {
      // INTERNAL SETTLEMENT (Credit internal available_balance)
      const { data: buyer } = await supabase
        .from("users")
        .select("id, escrow_balance, completed_deals_count")
        .eq("id", order.buyer_id)
        .single();

      if (buyer) {
        await supabase.from("users").update({
          escrow_balance: Number(buyer.escrow_balance) - Number(order.amount),
          completed_deals_count: Number(buyer.completed_deals_count) + 1,
        }).eq("id", buyer.id);
      }

      await supabase.from("users").update({
        pending_balance: Number(vendor.pending_balance) - net_payout,
        available_balance: Number(vendor.available_balance || 0) + net_payout,
        completed_deals_count: Number(vendor.completed_deals_count) + 1,
      }).eq("id", order.vendor_id);

      await supabase.from("orders").update({
        status: "SETTLED",
        settled_at: new Date().toISOString(),
        platform_fee,
        net_payout
      }).eq("id", orderId);

      await supabase.from("ledger_entries").insert([
        {
          user_id: order.vendor_id,
          order_id: orderId,
          entry_type: "SETTLEMENT_INTERNAL",
          amount: net_payout,
          balance_effect: "available",
          direction: "credit",
          narration: `Internal settlement for ${order.item_name}`
        },
        {
          user_id: order.buyer_id,
          order_id: orderId,
          entry_type: "ESCROW_UNLOCK",
          amount: Number(order.amount),
          balance_effect: "escrow",
          direction: "debit",
          narration: `Funds released for ${order.item_name}`
        }
      ]);

      return new Response(JSON.stringify({ success: true, method: 'internal', message: "Settled internally" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const merchantTxRef = `TF-STL-${orderId.substring(0,8)}-${Date.now()}`;

    // Update order state to SETTLING to prevent double disbursement
    await supabase.from("orders").update({
      status: "SETTLING",
      settlement_tx_ref: merchantTxRef,
      settlement_attempts: order.settlement_attempts + 1,
      platform_fee,
      net_payout
    }).eq("id", orderId);

    const token = await getNombaToken();
    const baseUrl = Deno.env.get("NOMBA_BASE_URL") || "https://sandbox.nomba.com/v1";
    const subAccountId = Deno.env.get("NOMBA_SUB_ACCOUNT_ID")!;
    const parentAccountId = Deno.env.get("NOMBA_PARENT_ACCOUNT_ID")!;

    const idempotencyKey = crypto.randomUUID();

    const transferRes = await fetch(`${baseUrl.replace('/v1', '/v2')}/transfers/bank/${subAccountId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "accountId": parentAccountId,
        "X-Idempotent-key": idempotencyKey
      },
      body: JSON.stringify({
        amount: final_payout,
        accountNumber: vendor.bank_account_number,
        accountName: vendor.bank_account_name || "TrustFund Vendor",
        bankCode: vendor.bank_code,
        merchantTxRef: merchantTxRef,
        senderName: "TrustFund",
        narration: `Payment for ${order.item_name} · ${order.reference_id}`
      })
    });

    if (!transferRes.ok) {
      // API call failed entirely (e.g. 400 Bad Request)
      await supabase.from("orders").update({ status: "DELIVERED_PENDING_RELEASE" }).eq("id", orderId);
      const errorText = await transferRes.text();
      return new Response(JSON.stringify({ error: `Nomba API Error: ${errorText}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const transferData = await transferRes.json();
    console.log("Nomba Transfer Response:", JSON.stringify(transferData));
    
    const txStatus = transferData?.data?.status || "PENDING_BILLING";
    const sessionId = transferData?.data?.sessionId || transferData?.data?.session_id || transferData?.data?.id;

    if (sessionId) {
      await supabase.from("orders").update({ nomba_session_id: sessionId }).eq("id", orderId);
    }

    if (txStatus === "SUCCESS") {
      // Settle immediately
      const { data: buyer } = await supabase
        .from("users")
        .select("id, escrow_balance, completed_deals_count")
        .eq("id", order.buyer_id)
        .single();

      if (buyer) {
        await supabase.from("users").update({
          escrow_balance: Number(buyer.escrow_balance) - Number(order.amount),
          completed_deals_count: Number(buyer.completed_deals_count) + 1,
        }).eq("id", buyer.id);
      }

      await supabase.from("users").update({
        pending_balance: Number(vendor.pending_balance) - net_payout,
        completed_deals_count: Number(vendor.completed_deals_count) + 1,
      }).eq("id", order.vendor_id);

      await supabase.from("orders").update({
        status: "SETTLED",
        settled_at: new Date().toISOString(),
      }).eq("id", orderId);

      await supabase.from("ledger_entries").insert([
        {
          user_id: order.vendor_id,
          order_id: orderId,
          entry_type: "SETTLEMENT_OUT",
          amount: final_payout,
          balance_effect: "pending",
          direction: "debit",
          narration: `Payout for ${order.item_name}`
        },
        {
          user_id: order.vendor_id,
          order_id: orderId,
          entry_type: "PAYOUT_FEE",
          amount: payoutFee,
          balance_effect: "pending",
          direction: "debit",
          narration: `TrustFund / Nomba settlement fee`
        },
        {
          user_id: order.buyer_id,
          order_id: orderId,
          entry_type: "ESCROW_UNLOCK",
          amount: Number(order.amount),
          balance_effect: "escrow",
          direction: "debit",
          narration: `Funds released for ${order.item_name}`
        }
      ]);

      await supabase.from("messages").insert({
        order_id: orderId,
        sender_type: "system",
        message_type: "status_update",
        content: `✅ Deal complete. ₦${final_payout} has been sent to the seller's bank account (after ₦${payoutFee} fee). Ref: ${order.reference_id}`,
      });

    } else if (txStatus === "REFUND") {
      // Revert status for retry
      await supabase.from("orders").update({ status: "DELIVERED_PENDING_RELEASE" }).eq("id", orderId);
      return new Response(JSON.stringify({ error: "Payout failed (REFUND). Order reverted for retry." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } else {
      // PENDING_BILLING or NEW - leave as SETTLING, webhook will handle
    }

    return new Response(JSON.stringify({ success: true, status: txStatus }), {
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
