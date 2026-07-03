import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  // Simple check to ensure it's called with service role or internal cron
  if (!authHeader || authHeader !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id")
    .eq("status", "DELIVERED_PENDING_RELEASE")
    .lte("auto_release_at", new Date().toISOString())
    .lt("settlement_attempts", 3);

  if (error) {
    console.error("Failed to fetch pending orders", error);
    return new Response("Error fetching orders", { status: 500 });
  }

  let settledCount = 0;

  for (const order of orders) {
    try {
      // Call settle-order function via Edge Function URL to reuse logic
      const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/settle-order`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ orderId: order.id })
      });

      if (res.ok) settledCount++;
    } catch (e) {
      console.error(`Failed to settle order ${order.id}:`, e);
    }
  }

  return new Response(`Processed ${orders.length} orders. Initiated settlement for ${settledCount}.`, { status: 200 });
});
