import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: users, error } = await supabase
    .from("users")
    .select("id, nomba_virtual_account_number")
    .eq("account_provisioning_status", "active")
    .not("nomba_virtual_account_number", "is", null);

  if (error) return new Response("Failed to fetch users", { status: 500 });

  const token = await getNombaToken();
  const baseUrl = Deno.env.get("NOMBA_BASE_URL") || "https://sandbox.nomba.com/v1";
  const parentAccountId = Deno.env.get("NOMBA_PARENT_ACCOUNT_ID")!;

  // yesterday and today
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const dateTo = today.toISOString().split('T')[0];
  const dateFrom = yesterday.toISOString().split('T')[0];

  let reconciledCount = 0;

  for (const user of users) {
    if (!user.nomba_virtual_account_number) continue;

    try {
      const url = `${baseUrl}/transactions/virtual?virtual_account=${user.nomba_virtual_account_number}&dateFrom=${dateFrom}&dateTo=${dateTo}`;
      const txRes = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "accountId": parentAccountId
        }
      });

      if (!txRes.ok) continue;

      const txData = await txRes.json();
      const results = txData.data?.results || [];

      for (const tx of results) {
        if (tx.entryType !== "CREDIT") continue;

        const txId = tx.id || tx.transactionId;
        
        // Check if already processed
        const { data: existing } = await supabase
          .from("webhook_events")
          .select("id")
          .eq("request_id", txId)
          .single();

        if (existing) continue;

        // Process reconciliation
        const amount = parseFloat(tx.amount);
        
        const { data: u } = await supabase.from("users").select("available_balance").eq("id", user.id).single();
        if (u) {
          const newBalance = Number(u.available_balance) + amount;
          await supabase.from("users").update({ available_balance: newBalance }).eq("id", user.id);
          
          await supabase.from("ledger_entries").insert({
            user_id: user.id,
            entry_type: "TOP_UP",
            amount: amount,
            balance_effect: "available",
            direction: "credit",
            nomba_transaction_id: txId,
            sender_name: tx.senderName || "Unknown",
            narration: "Reconciled Top-up"
          });

          await supabase.from("webhook_events").insert({
            request_id: txId,
            event_type: "reconciliation_credit",
            payload: tx,
            received_at: new Date().toISOString()
          });

          reconciledCount++;
        }
      }
    } catch (e) {
      console.error(`Error reconciling user ${user.id}:`, e);
    }
  }

  return new Response(`Reconciliation complete. Reconciled ${reconciledCount} transactions.`, { status: 200 });
});
