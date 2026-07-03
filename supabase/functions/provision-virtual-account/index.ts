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
  
  if (!res.ok) {
    const err = await res.text();
    console.error("Nomba Auth Error:", err);
    throw new Error("Failed to obtain Nomba access token");
  }
  
  const json = await res.json();
  cachedToken = json.data.access_token;
  // Refresh 30 minutes before expiry
  tokenExpiresAt = new Date(json.data.expiresAt).getTime() - (30 * 60 * 1000);
  return cachedToken!;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, userFullName } = await req.json();

    if (!userId || !userFullName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = await getNombaToken();
    const baseUrl = Deno.env.get("NOMBA_BASE_URL") || "https://sandbox.nomba.com/v1";
    const subAccountId = Deno.env.get("NOMBA_SUB_ACCOUNT_ID")!;
    const parentAccountId = Deno.env.get("NOMBA_PARENT_ACCOUNT_ID")!;

    // 1. Call Nomba API to create virtual account
    const nombaRes = await fetch(`${baseUrl}/accounts/virtual`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "accountId": parentAccountId
      },
      body: JSON.stringify({
        accountRef: userId,
        accountName: userFullName,
        currency: "NGN"
      })
    });

    if (!nombaRes.ok) {
      const errText = await nombaRes.text();
      console.error("Failed to provision account on Nomba:", errText);
      
      // Update user provisioning status to failed
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase.from("users").update({ account_provisioning_status: "failed" }).eq("id", userId);
      
      return new Response(JSON.stringify({ error: "Failed to provision account on Nomba" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nombaData = await nombaRes.json();
    const { bankAccountNumber, bankName, accountRef } = nombaData.data;

    // 2. Update users table in Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: updateErr } = await supabase
      .from("users")
      .update({
        nomba_virtual_account_number: bankAccountNumber,
        nomba_account_ref: accountRef, // Should equal userId
        nomba_bank_name: bankName,
        account_provisioning_status: "active"
      })
      .eq("id", userId);

    if (updateErr) {
      console.error("Failed to update user record in DB:", updateErr);
      return new Response(JSON.stringify({ error: "Failed to update user database record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      account: { bankAccountNumber, bankName }
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
