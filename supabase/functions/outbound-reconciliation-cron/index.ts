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

  const token = await getNombaToken();
  const baseUrl = Deno.env.get("NOMBA_BASE_URL") || "https://sandbox.nomba.com/v1";
  const parentAccountId = Deno.env.get("NOMBA_PARENT_ACCOUNT_ID")!;

  const sixtyMinsAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  let reconciledCount = 0;

  // 1. Reconcile stuck SETTLING orders
  const { data: stuckOrders } = await supabase
    .from("orders")
    .select("*")
    .eq("status", "SETTLING")
    .lt("updated_at", sixtyMinsAgo)
    .not("nomba_session_id", "is", null);

  if (stuckOrders && stuckOrders.length > 0) {
    for (const order of stuckOrders) {
      try {
        if (order.requery_attempts >= 5) {
          // Flag for manual review
          await supabase.from("orders").update({ status: "SETTLING_FAILED" }).eq("id", order.id);
          
          // Notify admin (assuming first user or a specific role, here we just insert a message)
          await supabase.from("messages").insert({
            order_id: order.id,
            sender_type: "system",
            message_type: "status_update",
            content: `⚠️ Settlement is taking longer than expected. TrustFund Support has been notified and is investigating.`,
          });
          continue;
        }

        // Increment attempts
        await supabase.from("orders").update({ requery_attempts: order.requery_attempts + 1 }).eq("id", order.id);

        const requeryRes = await fetch(`${baseUrl}/transactions/requery/${order.nomba_session_id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "accountId": parentAccountId
          }
        });

        if (!requeryRes.ok) continue;
        const requeryData = await requeryRes.json();
        const txStatus = requeryData.data?.status;

        if (txStatus === "SUCCESS") {
          // Finalize settlement
          const { data: buyer } = await supabase.from("users").select("id, escrow_balance, completed_deals_count").eq("id", order.buyer_id).single();
          if (buyer) {
            await supabase.from("users").update({
              escrow_balance: Number(buyer.escrow_balance) - Number(order.amount),
              completed_deals_count: Number(buyer.completed_deals_count) + 1,
            }).eq("id", buyer.id);
          }

          const { data: vendor } = await supabase.from("users").select("id, pending_balance, completed_deals_count").eq("id", order.vendor_id).single();
          if (vendor) {
            await supabase.from("users").update({
              pending_balance: Number(vendor.pending_balance) - Number(order.net_payout),
              completed_deals_count: Number(vendor.completed_deals_count) + 1,
            }).eq("id", vendor.id);
          }

          await supabase.from("orders").update({
            status: "SETTLED",
            settled_at: new Date().toISOString(),
          }).eq("id", order.id);

          const payoutFee = 20;
          const final_payout = Number(order.net_payout) - payoutFee;

          await supabase.from("ledger_entries").insert([
            {
              user_id: order.vendor_id,
              order_id: order.id,
              entry_type: "SETTLEMENT_OUT",
              amount: final_payout,
              balance_effect: "pending",
              direction: "debit",
              narration: `Payout for ${order.item_name}`
            },
            {
              user_id: order.vendor_id,
              order_id: order.id,
              entry_type: "PAYOUT_FEE",
              amount: payoutFee,
              balance_effect: "pending",
              direction: "debit",
              narration: `TrustFund / Nomba settlement fee`
            },
            {
              user_id: order.buyer_id,
              order_id: order.id,
              entry_type: "ESCROW_UNLOCK",
              amount: order.amount,
              balance_effect: "escrow",
              direction: "debit",
              narration: `Funds released for ${order.item_name}`
            }
          ]);

          await supabase.from("messages").insert({
            order_id: order.id,
            sender_type: "system",
            message_type: "status_update",
            content: `✅ Deal complete. ₦${final_payout} has been sent to the seller's bank account (after ₦${payoutFee} fee). Ref: ${order.reference_id}`,
          });

          reconciledCount++;
        } else if (txStatus === "FAILED" || txStatus === "REFUND") {
          await supabase.from("orders").update({ status: "DELIVERED_PENDING_RELEASE" }).eq("id", order.id);
          reconciledCount++;
        }
      } catch (e) {
        console.error(`Error reconciling order ${order.id}:`, e);
      }
    }
  }

  // 2. Reconcile stuck WITHDRAWALS
  // For withdrawals, we look for WITHDRAWAL ledger entries that don't have a corresponding SUCCESS/FAILED mark
  // Since we don't have a status column yet, we rely on requery_attempts < 5 and check if they haven't been refunded.
  const { data: stuckWithdrawals } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("entry_type", "WITHDRAWAL")
    .lt("created_at", sixtyMinsAgo)
    .not("nomba_session_id", "is", null)
    .lt("requery_attempts", 5);

  if (stuckWithdrawals && stuckWithdrawals.length > 0) {
    for (const wd of stuckWithdrawals) {
      try {
        // Check if there is already a REFUND entry for this transaction
        const { data: existingRefund } = await supabase
          .from("ledger_entries")
          .select("id")
          .eq("nomba_transaction_id", wd.nomba_transaction_id)
          .in("entry_type", ["WITHDRAWAL_REFUND"])
          .single();

        if (existingRefund) {
          // Already refunded, just stop checking
          await supabase.from("ledger_entries").update({ requery_attempts: 5 }).eq("id", wd.id);
          continue;
        }

        // Increment attempts
        const newAttempts = wd.requery_attempts + 1;
        await supabase.from("ledger_entries").update({ requery_attempts: newAttempts }).eq("id", wd.id);

        if (newAttempts >= 5) {
          // Leave it alone, but notify admin (if we had a global notification system)
          continue;
        }

        const requeryRes = await fetch(`${baseUrl}/transactions/requery/${wd.nomba_session_id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "accountId": parentAccountId
          }
        });

        if (!requeryRes.ok) continue;
        const requeryData = await requeryRes.json();
        const txStatus = requeryData.data?.status;

        if (txStatus === "SUCCESS") {
          // Withdrawal was successful, we just stop checking
          await supabase.from("ledger_entries").update({ requery_attempts: 5 }).eq("id", wd.id);
          reconciledCount++;
        } else if (txStatus === "FAILED" || txStatus === "REFUND") {
          // Issue refund
          const payoutFee = 20;
          const totalRefund = Number(wd.amount) + payoutFee;
          
          const { data: user } = await supabase.from("users").select("available_balance").eq("id", wd.user_id).single();
          if (user) {
            await supabase.from("users").update({
              available_balance: Number(user.available_balance) + totalRefund
            }).eq("id", wd.user_id);

            await supabase.from("ledger_entries").insert([
              {
                user_id: wd.user_id,
                entry_type: "WITHDRAWAL_REFUND",
                amount: wd.amount,
                balance_effect: "available",
                direction: "credit",
                nomba_transaction_id: wd.nomba_transaction_id,
                narration: "Refund for failed withdrawal"
              },
              {
                user_id: wd.user_id,
                entry_type: "WITHDRAWAL_REFUND",
                amount: payoutFee,
                balance_effect: "available",
                direction: "credit",
                nomba_transaction_id: wd.nomba_transaction_id,
                narration: "Refund for withdrawal fee"
              }
            ]);

            await supabase.from("notifications").insert({
              user_id: wd.user_id,
              title: "Withdrawal Failed ❌",
              body: `Your withdrawal of ₦${wd.amount} failed and ₦${totalRefund} (including fee) has been refunded.`,
              type: "payment"
            });
            
            // stop checking
            await supabase.from("ledger_entries").update({ requery_attempts: 5 }).eq("id", wd.id);
            reconciledCount++;
          }
        }
      } catch (e) {
        console.error(`Error reconciling withdrawal ${wd.id}:`, e);
      }
    }
  }

  return new Response(`Outbound reconciliation complete. Reconciled ${reconciledCount} transactions.`, { status: 200 });
});
