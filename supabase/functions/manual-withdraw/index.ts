import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "npm:bcryptjs";

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Auth Header" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { amount, pin } = await req.json();

    if (!amount || amount <= 0 || !pin) {
      return new Response(JSON.stringify({ error: "Invalid amount or PIN" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: vendor, error: vendorErr } = await adminClient
      .from("users")
      .select("payment_pin, available_balance, bank_account_number, bank_code, bank_account_name")
      .eq("id", user.id)
      .single();

    if (vendorErr || !vendor) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify PIN securely server-side
    if (!vendor.payment_pin) {
      return new Response(JSON.stringify({ error: "PIN not set up" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const isValid = await bcrypt.compare(pin, vendor.payment_pin);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Incorrect PIN" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!vendor.bank_account_number || !vendor.bank_code) {
      return new Response(JSON.stringify({ error: "No bank account linked" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (Number(vendor.available_balance) < Number(amount)) {
      return new Response(JSON.stringify({ error: "Insufficient available balance" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Execute Nomba Transfer
    const merchantTxRef = `TF-WD-${user.id.substring(0,6)}-${Date.now()}`;
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
        amount: Number(amount),
        accountNumber: vendor.bank_account_number,
        accountName: vendor.bank_account_name || "TrustFund Vendor",
        bankCode: vendor.bank_code,
        merchantTxRef: merchantTxRef,
        senderName: "TrustFund",
        narration: `TrustFund Withdrawal`
      })
    });

    if (!transferRes.ok) {
      const errorText = await transferRes.text();
      return new Response(JSON.stringify({ error: `Nomba API Error: ${errorText}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const transferData = await transferRes.json();
    console.log("Nomba Transfer Response:", JSON.stringify(transferData));
    const txStatus = transferData?.data?.status || "PENDING_BILLING";
    const sessionId = transferData?.data?.sessionId || transferData?.data?.session_id || transferData?.data?.id;

    if (txStatus === "SUCCESS" || txStatus === "PENDING_BILLING") {
      // Deduct available_balance
      await adminClient.from("users").update({
        available_balance: Number(vendor.available_balance) - Number(amount)
      }).eq("id", user.id);

      // Insert ledger entry for withdrawal
      await adminClient.from("ledger_entries").insert([
        {
          user_id: user.id,
          entry_type: "WITHDRAWAL",
          amount: Number(amount),
          balance_effect: "available",
          direction: "debit",
          nomba_transaction_id: merchantTxRef,
          nomba_session_id: sessionId,
          narration: `Withdrawal to ${vendor.bank_account_number}`
        }
      ]);

      return new Response(JSON.stringify({ success: true, reference: merchantTxRef }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } else {
      return new Response(JSON.stringify({ error: "Transfer failed at Nomba" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
