import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WEBHOOK_SECRET = Deno.env.get("NOMBA_WEBHOOK_SECRET")!;

async function verifySignature(
  payload: Record<string, unknown>,
  nombaSignature: string,
  nombaTimestamp: string,
  secret: string
): Promise<boolean> {
  const data = payload.data as Record<string, unknown>;
  const merchant = (data?.merchant || {}) as Record<string, unknown>;
  const transaction = (data?.transaction || {}) as Record<string, unknown>;

  const eventType = payload.event_type as string;
  const requestId = payload.requestId as string;
  const userId = merchant?.userId as string || "";
  const walletId = merchant?.walletId as string || "";
  const transactionId = transaction.transactionId as string;
  const type = transaction.type as string;
  const time = transaction.time as string;

  let responseCode = (transaction.responseCode as string) ?? "";
  if (responseCode === "null") responseCode = "";

  const hashingPayload = [
    eventType,
    requestId,
    userId,
    walletId,
    transactionId,
    type,
    time,
    responseCode,
    nombaTimestamp,
  ].join(":");

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(hashingPayload);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    messageData
  );

  const computedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signatureBuffer))
  );

  return computedSignature === nombaSignature;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();

  const nombaSignature = req.headers.get("nomba-signature") ?? "";
  const nombaTimestamp = req.headers.get("nomba-timestamp") ?? "";

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const isValid = await verifySignature(
    event,
    nombaSignature,
    nombaTimestamp,
    WEBHOOK_SECRET
  );

  if (!isValid) {
    console.error("Invalid webhook signature — rejected");
    return new Response("Unauthorized", { status: 401 });
  }

  const eventType = event.event_type as string;
  const requestId = event.requestId as string;

  console.log(`Verified event: ${eventType} | requestId: ${requestId}`);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("request_id", requestId)
    .single();

  if (existing) {
    console.log(`Duplicate event ${requestId} — skipping`);
    return new Response("OK", { status: 200 });
  }

  await supabase.from("webhook_events").insert({
    request_id: requestId,
    event_type: eventType,
    payload: event,
    received_at: new Date().toISOString(),
  });

  switch (eventType) {
    case "payment_success": {
      const data = event.data as Record<string, unknown>;
      const transaction = data.transaction as Record<string, unknown>;

      const accountRef = transaction.aliasAccountReference as string;
      const amount = parseFloat(transaction.transactionAmount as string);
      const transactionId = transaction.transactionId as string;
      const sessionId = transaction.sessionId as string;
      const senderName = (event.data as any)?.customer?.senderName as string;

      console.log(`Payment received — accountRef: ${accountRef}, amount: ${amount}`);

      if (!accountRef || !amount || amount <= 0) {
        console.error("Invalid payment_success payload — missing accountRef or amount");
        break;
      }

      // Find user by accountRef
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, available_balance")
        .eq("nomba_account_ref", accountRef)
        .single();

      if (userError || !userData) {
        console.error("User not found for accountRef:", accountRef, userError);
        break;
      }

      const userId = userData.id;
      const depositFee = 10;
      const netAmount = amount - depositFee;
      
      if (netAmount <= 0) {
        console.warn(`Deposit too small to cover fee: ${amount}`);
        break;
      }
      
      const newBalance = parseFloat(userData.available_balance) + netAmount;

      // Update available balance
      const { error: balanceError } = await supabase
        .from("users")
        .update({ available_balance: newBalance })
        .eq("id", userId);

      if (balanceError) {
        console.error("Failed to update balance:", balanceError);
        break;
      }

      // Insert ledger entry
      const { error: ledgerError } = await supabase
        .from("ledger_entries")
        .insert([
          {
            user_id: userId,
            entry_type: "TOP_UP",
            status: "SUCCESS",
            amount: amount,
            balance_effect: "available",
            direction: "credit",
            nomba_transaction_id: transactionId,
            nomba_session_id: sessionId,
            sender_name: senderName,
            narration: `Top up from ${senderName || "bank transfer"}`,
          },
          {
            user_id: userId,
            entry_type: "TOPUP_FEE",
            status: "SUCCESS",
            amount: depositFee,
            balance_effect: "available",
            direction: "debit",
            nomba_transaction_id: transactionId,
            nomba_session_id: sessionId,
            sender_name: "TrustFund",
            narration: `Virtual account deposit fee`,
          }
        ]);

      if (ledgerError) {
        console.error("Failed to insert ledger entry:", ledgerError);
        // Don't break — balance was already updated, ledger failure is non-critical
      }

      // Mark webhook as processed
      await supabase
        .from("webhook_events")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("request_id", requestId);

      // Create notification for deposit
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Deposit Received 📥",
        body: `Your TrustFund wallet has been credited with ₦${netAmount.toLocaleString()} (after ₦${depositFee} fee).`,
        type: "payment"
      });

      console.log(`Successfully credited ₦${netAmount} to user ${userId} after ₦${depositFee} fee. New balance: ₦${newBalance}`);
      break;
    }

    case "payout_success": {
      const data = event.data as Record<string, unknown>;
      const transaction = data.transaction as Record<string, unknown>;
      const merchantTxRef = transaction.merchantTxRef as string;

      console.log(`Payout success — merchantTxRef: ${merchantTxRef}`);

      if (merchantTxRef.startsWith("TF-WD-")) {
        // It's a manual withdrawal. We already deducted balance and recorded ledger on success.
        console.log(`Manual withdrawal successful for ${merchantTxRef}`);
        await supabase.from("webhook_events").update({ processed: true, processed_at: new Date().toISOString() }).eq("request_id", requestId);
        break;
      }

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .select("*")
        .eq("settlement_tx_ref", merchantTxRef)
        .single();

      if (orderErr || !order) {
        console.error("Order not found for merchantTxRef:", merchantTxRef);
        break;
      }

      const { data: vendor } = await supabase
        .from("users")
        .select("id, pending_balance, completed_deals_count")
        .eq("id", order.vendor_id)
        .single();

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
          amount: Number(order.amount),
          balance_effect: "escrow",
          direction: "debit",
          narration: `Funds released for ${order.item_name}`
        }
      ]);

      await supabase.from("messages").insert({
        order_id: order.id,
        sender_type: "system",
        message_type: "status_update",
        content: `✅ Deal complete. ₦${order.net_payout} has been sent to the seller's bank account. Ref: ${order.reference_id}`,
      });

      // Mark webhook as processed
      await supabase
        .from("webhook_events")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("request_id", requestId);

      break;
    }

    case "payout_failed":
    case "payout_refund": {
      const data = event.data as Record<string, unknown>;
      const transaction = data.transaction as Record<string, unknown>;
      const merchantTxRef = transaction.merchantTxRef as string;

      console.log(`Payout failed/refund — merchantTxRef: ${merchantTxRef}`);

      if (merchantTxRef.startsWith("TF-WD-")) {
        // Manual withdrawal failed/refunded
        // Find the ledger entry
        const { data: ledgerEntry } = await supabase
          .from("ledger_entries")
          .select("*")
          .eq("entry_type", "WITHDRAWAL")
          .eq("nomba_transaction_id", merchantTxRef)
          .single();
        
        if (ledgerEntry && ledgerEntry.status !== "FAILED") {
           // Refund user
           const { data: user } = await supabase.from("users").select("id, available_balance").eq("id", ledgerEntry.user_id).single();
           if (user) {
             await supabase.from("users").update({
               available_balance: Number(user.available_balance) + Number(ledgerEntry.amount)
             }).eq("id", user.id);
             
             await supabase.from("ledger_entries").insert({
               user_id: user.id,
               entry_type: "REFUND",
               amount: ledgerEntry.amount,
               balance_effect: "available",
               direction: "credit",
               narration: `Refund for failed withdrawal`
             });
             
             await supabase.from("ledger_entries").update({ status: "FAILED" }).eq("id", ledgerEntry.id);
             
             await supabase.from("notifications").insert({
               user_id: user.id,
               title: "Withdrawal Failed ❌",
               body: `Your withdrawal of ₦${ledgerEntry.amount} failed and has been refunded to your wallet.`,
               type: "payment"
             });
           }
        }
        await supabase.from("webhook_events").update({ processed: true, processed_at: new Date().toISOString() }).eq("request_id", requestId);
        break;
      }

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .select("*")
        .eq("settlement_tx_ref", merchantTxRef)
        .single();

      if (orderErr || !order) {
        console.error("Order not found for merchantTxRef:", merchantTxRef);
        break;
      }

      await supabase.from("orders").update({
        status: "DELIVERED_PENDING_RELEASE",
      }).eq("id", order.id);

      await supabase.from("messages").insert({
        order_id: order.id,
        sender_type: "system",
        message_type: "status_update",
        content: `⚠️ Settlement failed. Will retry shortly.`,
      });

      // Mark webhook as processed
      await supabase
        .from("webhook_events")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("request_id", requestId);

      break;
    }

    case "payment_failed": {
      console.log("Payment failed event received");
      break;
    }

    default:
      console.log(`Unhandled event type: ${eventType}`);
  }

  return new Response("OK", { status: 200 });
});
