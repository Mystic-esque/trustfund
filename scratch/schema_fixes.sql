
-- FROM Fixes for AI Judge
-- 1. Create missing notifications table (to match Supabase schema)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) not null,
  title text not null,
  body text not null,
  type text not null,
  read boolean default false,
  created_at timestamptz default now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Create atomic decrement_available_balance for withdrawals
CREATE OR REPLACE FUNCTION decrement_available_balance(
  p_user_id UUID,
  p_amount NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  -- Perform an atomic update
  UPDATE public.users 
  SET available_balance = available_balance - p_amount
  WHERE id = p_user_id AND available_balance >= p_amount
  RETURNING available_balance INTO v_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance or user not found';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create confirm_delivery RPC (handles escrow_balance -> pending_balance transition)
CREATE OR REPLACE FUNCTION confirm_delivery(
  p_order_id UUID,
  p_buyer_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
  v_net_payout NUMERIC;
BEGIN
  -- Validate
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id AND buyer_id = p_buyer_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found or unauthorized'; END IF;
  
  IF v_order.status != 'IN_TRANSIT' THEN
    RAISE EXCEPTION 'Order is not IN_TRANSIT';
  END IF;

  v_net_payout := v_order.amount - (v_order.amount * 0.015);

  -- Update order status
  UPDATE public.orders 
  SET 
    status = 'DELIVERED_PENDING_RELEASE'::order_status,
    delivered_at = NOW(),
    auto_release_at = NOW() + INTERVAL '48 hours',
    platform_fee = (v_order.amount * 0.015),
    net_payout = v_net_payout
  WHERE id = p_order_id;

  -- Crucial Accounting Transition: buyer.escrow_balance -> vendor.pending_balance
  -- Remove from buyer's escrow
  UPDATE public.users SET escrow_balance = escrow_balance - v_order.amount
  WHERE id = p_buyer_id;

  -- Add to vendor's pending
  UPDATE public.users SET pending_balance = COALESCE(pending_balance, 0) + v_net_payout
  WHERE id = v_order.vendor_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Secure Public Order View
CREATE OR REPLACE FUNCTION get_public_order_by_slug(p_slug TEXT)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_vendor RECORD;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE link_slug = p_slug;
  IF NOT FOUND THEN RETURN NULL; END IF;
  
  -- Only return public fields from users table
  SELECT id, full_name, username, avatar_url, created_at, completed_deals_count 
  INTO v_vendor FROM public.users WHERE id = v_order.vendor_id;
  
  RETURN json_build_object(
    'order', row_to_json(v_order),
    'vendor', row_to_json(v_vendor)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
