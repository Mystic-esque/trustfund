import crypto from 'crypto';

const WEBHOOK_SECRET = "NombaHackathon2026";
const WEBHOOK_URL = "https://blmacssyvbzingptjmew.supabase.co/functions/v1/nomba-webhook";

// We use the user ID extracted from your console logs earlier
const ACCOUNT_REF = "8e369bef-66a1-40d3-877c-bcc5a2af832d"; 

const eventType = "payment_success";
const requestId = crypto.randomUUID();
const userId = "merchant-123";
const walletId = "wallet-123";
const transactionId = crypto.randomUUID();
const type = "credit";
const time = new Date().toISOString();
const responseCode = "00";
const nombaTimestamp = new Date().toISOString();

const payload = {
  event_type: eventType,
  requestId: requestId,
  data: {
    merchant: {
      userId: userId,
      walletId: walletId
    },
    transaction: {
      transactionId: transactionId,
      type: type,
      time: time,
      responseCode: responseCode,
      transactionAmount: "100.00",
      aliasAccountReference: ACCOUNT_REF,
      senderName: "Niel Hackathon Tester"
    }
  }
};

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

const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(hashingPayload)
  .digest('base64');

async function runTest() {
  console.log("Sending simulated Nomba webhook to:", WEBHOOK_URL);
  console.log("Account Ref:", ACCOUNT_REF);
  console.log("Amount: 100.00");
  
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "nomba-signature": signature,
      "nomba-timestamp": nombaTimestamp
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  console.log("Webhook Response Status:", res.status);
  console.log("Webhook Response Body:", text);
}

runTest();
