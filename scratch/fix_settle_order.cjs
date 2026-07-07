const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'supabase/functions/settle-order/index.ts');
let content = fs.readFileSync(file, 'utf8');

const internalSettlementCode = `
      // Fallback to INTERNAL SETTLEMENT
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
          narration: \`Internal settlement for \${order.item_name} (Auto-payout failed)\`
        },
        {
          user_id: order.buyer_id,
          order_id: orderId,
          entry_type: "ESCROW_UNLOCK",
          amount: Number(order.amount),
          balance_effect: "escrow",
          direction: "debit",
          narration: \`Funds released for \${order.item_name}\`
        }
      ]);

      return new Response(JSON.stringify({ success: true, method: 'internal', message: \`Auto-payout failed, funds settled to TrustFund wallet: \${errorText}\` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
`;

content = content.replace(
  /if \(\!transferRes\.ok\) \{[\s\S]*?return new Response.*?\}\n/m,
  `if (!transferRes.ok) {
      const errorText = await transferRes.text();
      console.error("Nomba API Error:", errorText);
${internalSettlementCode}
    }\n`
);

fs.writeFileSync(file, content);
console.log('settle-order updated to fallback to internal wallet on Nomba failure');
