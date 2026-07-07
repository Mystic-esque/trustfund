-- INITIAL SCHEMA DEFINITIONS

-- 4.1 Users Table

   
create table public.users (  
  id uuid primary key references auth.users(id) on delete cascade,  
  full_name text not null,  
  phone text unique not null,  
  username text unique,  
  avatar_url text,  
  -- Payout bank details (verified via Nomba bank lookup)  
  bank_name text,  
  bank_code text,  
  bank_account_number text,  
  bank_account_name text,  	-- verified name from Nomba lookup  
  -- Nomba virtual wallet account  
  nomba_virtual_account_number text unique,  -- the NUBAN  
  nomba_account_ref text unique,         	-- = user id (our join key)  
  nomba_bank_name text,                  	-- e.g. "Nomba MFB"  
  account_provisioning_status text default 'pending',  -- pending | active | failed  
  -- Three wallet balances  
  available_balance numeric(12,2) default 0.00,  
  escrow_balance	numeric(12,2) default 0.00,  
  pending_balance   numeric(12,2) default 0.00,  
  -- Stats  
  completed_deals_count integer default 0,  
  created_at timestamptz default now(),  
  updated_at timestamptz default now()  
);  
alter table public.users enable row level security;  
create policy "Users can view own profile" on public.users  
  for select using (auth.uid() = id);  
create policy "Users can update own profile" on public.users  
  for update using (auth.uid() = id);  
 

-- 4.2 Orders Table

   
create type order_status as enum (  
'PENDING_PAYMENT', 'ESCROW_LOCKED', 'IN_TRANSIT',  
'DELIVERED_PENDING_RELEASE', 'SETTLING', 'SETTLED',  
'DISPUTED', 'REFUNDED', 'EXPIRED'  
);  
create table public.orders (  
  id uuid primary key default gen_random_uuid(),  
  link_slug text unique not null,    	-- 6-char random slug for deal URL  
  reference_id text unique not null, 	-- TF-{year}-{slug} for receipts  
  -- Parties  
  vendor_id uuid references public.users(id) not null,  
  buyer_id  uuid references public.users(id),   -- null until fund lock  
  -- Deal details  
  item_name text not null,  
  item_description text,  
  amount numeric(12,2) not null,      	-- naira decimal  
  platform_fee numeric(12,2),         	-- amount \* 0.015  
  net_payout   numeric(12,2),	         -- amount \- platform_fee  
  delivery_window text,               	-- "24hrs" | "48hrs" | "3-5 days" | custom  
  -- Status  
  status order_status default 'PENDING_PAYMENT' not null,  
  -- State timestamps  
  escrow_locked_at timestamptz,  
  shipped_at timestamptz,  
  delivered_at timestamptz,  
  auto_release_at timestamptz,        	-- delivered_at \+ 48 hours  
  settled_at timestamptz,  
  disputed_at timestamptz,  
  -- Shipping  
  tracking_reference text,  
  -- Settlement tracking  
  settlement_tx_ref text,             	-- merchantTxRef for payout  
  settlement_nomba_id text,  
  settlement_attempts integer default 0,  
  -- Link expiry  
  expires_at timestamptz default now() \+ interval '72 hours',  
  created_at timestamptz default now(),  
  updated_at timestamptz default now()  
);  
alter table public.orders enable row level security;  
create policy "Vendor can view own orders" on public.orders  
  for select using (auth.uid() = vendor_id);  
create policy "Buyer can view own orders" on public.orders  
  for select using (auth.uid() = buyer_id);  
create policy "Authenticated users can create orders" on public.orders  
  for insert with check (auth.uid() = vendor_id);  
 

-- 4.3 Ledger Entries Table (Immutable Audit Log)

   
create type ledger_entry_type as enum (  
'TOP_UP', 'ESCROW_LOCK', 'ESCROW_UNLOCK',  
'SETTLEMENT_IN', 'SETTLEMENT_OUT',  
'WITHDRAWAL', 'REFUND', 'PLATFORM_FEE'  
);  
create type ledger_entry_status as enum ('SUCCESS', 'PENDING', 'FAILED');  
create table public.ledger_entries (  
  id uuid primary key default gen_random_uuid(),  
  user_id  uuid references public.users(id) not null,  
  order_id uuid references public.orders(id),  -- null for top-ups/withdrawals  
  entry_type ledger_entry_type not null,  
  status ledger_entry_status default 'SUCCESS',  
  amount numeric(12,2) not null,          	-- always positive  
  balance_effect text not null,           	-- 'available' | 'escrow' | 'pending'  
  direction text not null,                	-- 'credit' | 'debit'  
  nomba_transaction_id text,  
  nomba_session_id text,  
  merchant_tx_ref text,  
  sender_name text,  
  narration text,  
  reference_id text,  
  created_at timestamptz default now()  
);  
alter table public.ledger_entries enable row level security;  
create policy "Users can view own ledger" on public.ledger_entries  
  for select using (auth.uid() = user_id);  
 

-- 4.4 Webhook Events Table (Idempotency Store)

   
create table public.webhook_events (  
  id uuid primary key default gen_random_uuid(),  
  request_id text unique not null,	-- Nomba requestId — idempotency key  
  event_type text not null,  
  payload jsonb not null,  
  processed boolean default false,  
  received_at timestamptz not null,  
  processed_at timestamptz  
);  
alter table public.webhook_events enable row level security;  
-- No user-facing RLS policy — service role only  
 

-- 4.5 Messages Table (Deal Chat)

   
create type message_sender_type as enum ('user', 'system');  
create table public.messages (  
  id uuid primary key default gen_random_uuid(),  
  order_id uuid references public.orders(id) not null,  
  sender_id uuid references public.users(id),  -- null for system messages  
  sender_type message_sender_type default 'user',  
  content text not null,  
  message_type text default 'text',  -- 'text' | 'image' | 'status_update'  
  metadata jsonb,  
  created_at timestamptz default now()  
);  
alter table public.messages enable row level security;  
create policy "Order parties can view messages" on public.messages  
  for select using (  
	auth.uid() in (  
  	select vendor_id from public.orders where id = order_id  
  	union  
  	select buyer_id from public.orders where id = order_id  
	)  
  );  
create policy "Order parties can send messages" on public.messages  
  for insert with check (  
	auth.uid() in (  
  	select vendor_id from public.orders where id = order_id  
  	union  
  	select buyer_id from public.orders where id = order_id  
	)  
  );  
alter publication supabase_realtime add table public.messages;  
 

-- 4.6 Indexes

   
create index idx_orders_slug     on public.orders(link_slug);  
create index idx_orders_vendor   on public.orders(vendor_id);  
create index idx_orders_buyer    on public.orders(buyer_id);  
create index idx_orders_status   on public.orders(status);  
create index idx_orders_release  on public.orders(auto_release_at) where status = 'DELIVERED_PENDING_RELEASE';  
create index idx_ledger_user     on public.ledger_entries(user_id);  
create index idx_ledger_order    on public.ledger_entries(order_id);  
create index idx_messages_order  on public.messages(order_id, created_at);  
create index idx_webhook_req     on public.webhook_events(request_id);  
create index idx_users_nuban     on public.users(nomba_virtual_account_number);  
create index idx_users_acctref   on public.users(nomba_account_ref);  
 

-- 5. Order State Machine



-- ADDITIONAL RPCs AND FIXES

-- FROM admin_fixes.sql
-- 1. Create RLS Policy for Admins to Read Messages
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;

CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  USING (
    (auth.jwt() ->> 'email') IN ('mysticx404@gmail.com', 'admin@trustfund.com')
  );

-- 2. Fix type-casting bug in resolve_dispute
CREATE OR REPLACE FUNCTION resolve_dispute(
  p_order_id UUID,
  p_resolution TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
  v_user_email TEXT;
  v_buyer RECORD;
  v_vendor RECORD;
  v_net_payout NUMERIC;
BEGIN
  -- Get caller's email from JWT
  v_user_email := auth.jwt() ->> 'email';

  -- Hardcoded admin emails
  IF v_user_email NOT IN ('mysticx404@gmail.com', 'admin@trustfund.com') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can resolve disputes';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF v_order.status != 'DISPUTED' THEN
    RAISE EXCEPTION 'Order is not in DISPUTED status';
  END IF;

  -- Get buyer and vendor
  SELECT * INTO v_buyer FROM public.users WHERE id = v_order.buyer_id;
  SELECT * INTO v_vendor FROM public.users WHERE id = v_order.vendor_id;

  IF p_resolution = 'refund' THEN
    -- Update order to REFUNDED
    UPDATE public.orders SET status = 'REFUNDED'::order_status WHERE id = p_order_id;
    
    -- Refund buyer: remove from escrow_balance, add to available_balance
    UPDATE public.users 
    SET 
      escrow_balance = escrow_balance - v_order.amount,
      available_balance = available_balance + v_order.amount
    WHERE id = v_order.buyer_id;
    
    -- Create ledger entry for buyer
    INSERT INTO public.ledger_entries (user_id, amount, entry_type, description, reference_id)
    VALUES (v_order.buyer_id, v_order.amount, 'CREDIT', 'Dispute Resolved: Refunded for ' || v_order.item_name, v_order.id::text);

  ELSIF p_resolution = 'settle' THEN
    -- Update order to SETTLED
    UPDATE public.orders SET status = 'SETTLED'::order_status WHERE id = p_order_id;
    
    -- Calculate net payout (1.5% platform fee)
    v_net_payout := v_order.amount - (v_order.amount * 0.015);

    -- Remove from buyer's escrow balance and increment completed deals
    UPDATE public.users 
    SET 
      escrow_balance = escrow_balance - v_order.amount,
      completed_deals_count = completed_deals_count + 1
    WHERE id = v_order.buyer_id;

    -- Settle vendor: add to available_balance and increment completed deals
    UPDATE public.users 
    SET 
      available_balance = COALESCE(available_balance, 0) + v_net_payout,
      completed_deals_count = COALESCE(completed_deals_count, 0) + 1
    WHERE id = v_order.vendor_id;

    -- Create ledger entry for vendor
    INSERT INTO public.ledger_entries (user_id, amount, entry_type, description, reference_id)
    VALUES (v_order.vendor_id, v_net_payout, 'CREDIT', 'Dispute Resolved: Settled for ' || v_order.item_name, v_order.id::text);

  ELSE
    RAISE EXCEPTION 'Invalid resolution type. Must be refund or settle.';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- FROM admin_insert_message.sql
-- Allow admins to insert into messages table (system status updates during dispute resolution)
CREATE POLICY "Admins can insert messages" 
ON public.messages 
FOR INSERT 
WITH CHECK ( auth.jwt() ->> 'email' IN ('mysticx404@gmail.com', 'admin@trustfund.com') );


-- FROM chat_receipts.sql
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS vendor_last_read_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS buyer_last_read_at TIMESTAMPTZ DEFAULT NOW();


-- FROM cron_jobs.sql
-- ==========================================
-- Cron Jobs for TrustFund Automations
-- Replace <YOUR_PROJECT_REF> and <YOUR_SERVICE_ROLE_KEY> with your actual Supabase credentials.
-- ==========================================

-- Ensure required extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Auto-Release Cron (Runs every 5 minutes)
-- Scans for deals that have been in DELIVERED_PENDING_RELEASE for > 48 hours and auto-settles them.
SELECT cron.schedule(
  'invoke-auto-release-cron',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
      url:='https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/auto-release-cron',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>'
      )
  ) as request_id;
  $$
);

-- 2. Reconciliation Cron (Runs every hour)
-- Syncs Nomba virtual account transactions that may have missed webhooks.
SELECT cron.schedule(
  'invoke-reconciliation-cron',
  '0 * * * *',
  $$
  SELECT net.http_post(
      url:='https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/reconciliation-cron',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>'
      )
  ) as request_id;
  $$
);


-- FROM dispute_fixes.sql
-- 1. Add pre_dispute_status column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pre_dispute_status TEXT;

-- 2. Create raise_dispute RPC (bypasses RLS)
CREATE OR REPLACE FUNCTION raise_dispute(
  p_order_id UUID,
  p_reason TEXT,
  p_description TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  
  -- Only buyer or vendor can raise dispute
  IF v_order.buyer_id != v_user_id AND v_order.vendor_id != v_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_order.status = 'DISPUTED' THEN
    RAISE EXCEPTION 'Order is already disputed';
  END IF;

  UPDATE public.orders
  SET 
    pre_dispute_status = status::TEXT,
    status = 'DISPUTED'::order_status,
    dispute_reason = p_reason,
    dispute_description = p_description
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Create cancel_dispute RPC (bypasses RLS)
CREATE OR REPLACE FUNCTION cancel_dispute(
  p_order_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
  v_user_email TEXT;
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_restore_status TEXT;
BEGIN
  v_user_id := auth.uid();
  v_user_email := auth.jwt() ->> 'email';
  v_is_admin := v_user_email IN ('mysticx404@gmail.com', 'admin@trustfund.com');

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  
  -- Only buyer or admin can cancel dispute
  IF v_order.buyer_id != v_user_id AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only the buyer or an admin can withdraw this dispute.';
  END IF;

  IF v_order.status != 'DISPUTED' THEN
    RAISE EXCEPTION 'Order is not in DISPUTED status';
  END IF;

  -- Determine what status to restore to
  IF v_order.pre_dispute_status IS NOT NULL THEN
    v_restore_status := v_order.pre_dispute_status;
  ELSIF v_order.tracking_number IS NOT NULL THEN
    v_restore_status := 'IN_TRANSIT';
  ELSE
    v_restore_status := 'ESCROW_LOCKED';
  END IF;

  UPDATE public.orders
  SET 
    status = v_restore_status::order_status,
    pre_dispute_status = NULL,
    dispute_reason = NULL,
    dispute_description = NULL
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Create send_admin_message RPC (bypasses RLS)
CREATE OR REPLACE FUNCTION send_admin_message(
  p_order_id UUID,
  p_content TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_email TEXT;
  v_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  v_user_email := auth.jwt() ->> 'email';
  v_is_admin := v_user_email IN ('mysticx404@gmail.com', 'admin@trustfund.com');

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only an admin can send admin messages.';
  END IF;

  INSERT INTO public.messages (order_id, sender_id, sender_type, content, message_type)
  VALUES (p_order_id, v_user_id, 'user', p_content, 'admin_text');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- FROM ledger_fixes.sql
CREATE OR REPLACE FUNCTION resolve_dispute(
  p_order_id UUID,
  p_resolution TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
  v_user_email TEXT;
  v_buyer RECORD;
  v_vendor RECORD;
  v_net_payout NUMERIC;
BEGIN
  -- Get caller's email from JWT
  v_user_email := auth.jwt() ->> 'email';

  -- Hardcoded admin emails
  IF v_user_email NOT IN ('mysticx404@gmail.com', 'admin@trustfund.com') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can resolve disputes';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF v_order.status != 'DISPUTED' THEN
    RAISE EXCEPTION 'Order is not in DISPUTED status';
  END IF;

  -- Get buyer and vendor
  SELECT * INTO v_buyer FROM public.users WHERE id = v_order.buyer_id;
  SELECT * INTO v_vendor FROM public.users WHERE id = v_order.vendor_id;

  IF p_resolution = 'refund' THEN
    -- Update order to REFUNDED
    UPDATE public.orders SET status = 'REFUNDED'::order_status WHERE id = p_order_id;
    
    -- Refund buyer: remove from escrow_balance, add to available_balance
    UPDATE public.users 
    SET 
      escrow_balance = escrow_balance - v_order.amount,
      available_balance = available_balance + v_order.amount
    WHERE id = v_order.buyer_id;
    
    -- Create ledger entry for buyer
    INSERT INTO public.ledger_entries 
      (user_id, order_id, amount, entry_type, balance_effect, direction, narration, reference_id)
    VALUES 
      (v_order.buyer_id, p_order_id, v_order.amount, 'REFUND', 'available', 'credit', 
       'Dispute Resolved: Refunded for ' || v_order.item_name, v_order.reference_id);

  ELSIF p_resolution = 'settle' THEN
    -- Update order to SETTLED
    UPDATE public.orders SET status = 'SETTLED'::order_status WHERE id = p_order_id;
    
    -- Calculate net payout (1.5% platform fee)
    v_net_payout := v_order.amount - (v_order.amount * 0.015);

    -- Remove from buyer's escrow balance and increment completed deals
    UPDATE public.users 
    SET 
      escrow_balance = escrow_balance - v_order.amount,
      completed_deals_count = completed_deals_count + 1
    WHERE id = v_order.buyer_id;

    -- Settle vendor: add to available_balance, deduct from pending_balance if applicable, and increment completed deals
    UPDATE public.users 
    SET 
      available_balance = COALESCE(available_balance, 0) + v_net_payout,
      pending_balance = GREATEST(0, COALESCE(pending_balance, 0) - v_net_payout),
      completed_deals_count = COALESCE(completed_deals_count, 0) + 1
    WHERE id = v_order.vendor_id;

    -- Create ledger entry for vendor
    INSERT INTO public.ledger_entries 
      (user_id, order_id, amount, entry_type, balance_effect, direction, narration, reference_id)
    VALUES 
      (v_order.vendor_id, p_order_id, v_net_payout, 'SETTLEMENT_OUT', 'available', 'credit',
       'Dispute Resolved: Settled for ' || v_order.item_name, v_order.reference_id);

  ELSE
    RAISE EXCEPTION 'Invalid resolution type. Must be refund or settle.';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- FROM mark_shipped.sql
-- ==========================================
-- 4. Vendor Mark As Shipped & Proof Storage
-- ==========================================

-- 1. Add shipping_proof_url to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_proof_url TEXT;

-- 2. Create the storage bucket for order proofs if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-proofs', 'order-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies for 'order-proofs'
-- Allow public access to view proofs
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'order-proofs' );

-- Allow authenticated users to upload proofs
CREATE POLICY "Auth Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'order-proofs' AND auth.role() = 'authenticated' );

-- 4. RPC to safely mark an order as shipped (bypassing RLS safely)
CREATE OR REPLACE FUNCTION mark_order_shipped(
  p_order_id UUID,
  p_vendor_id UUID,
  p_tracking_number TEXT,
  p_shipping_courier TEXT,
  p_proof_url TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Verify the order belongs to this vendor and is ESCROW_LOCKED
  SELECT * INTO v_order FROM public.orders 
  WHERE id = p_order_id AND vendor_id = p_vendor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or unauthorized';
  END IF;

  IF v_order.status != 'ESCROW_LOCKED' THEN
    RAISE EXCEPTION 'Order is not in ESCROW_LOCKED state';
  END IF;

  -- Update the order
  UPDATE public.orders
  SET 
    status = 'IN_TRANSIT',
    tracking_number = COALESCE(p_tracking_number, tracking_number),
    shipping_courier = COALESCE(p_shipping_courier, shipping_courier),
    shipping_proof_url = p_proof_url
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- FROM resolve_dispute.sql
CREATE OR REPLACE FUNCTION resolve_dispute(
  p_order_id UUID,
  p_resolution TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
  v_user_email TEXT;
  v_buyer RECORD;
  v_vendor RECORD;
  v_net_payout NUMERIC;
BEGIN
  -- Get caller's email from JWT
  v_user_email := auth.jwt() ->> 'email';

  -- Hardcoded admin emails
  IF v_user_email NOT IN ('mysticx404@gmail.com', 'admin@trustfund.com') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can resolve disputes';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF v_order.status != 'DISPUTED' THEN
    RAISE EXCEPTION 'Order is not in DISPUTED status';
  END IF;

  -- Get buyer and vendor
  SELECT * INTO v_buyer FROM public.users WHERE id = v_order.buyer_id;
  SELECT * INTO v_vendor FROM public.users WHERE id = v_order.vendor_id;

  IF p_resolution = 'refund' THEN
    -- Update order to REFUNDED
    UPDATE public.orders SET status = 'REFUNDED' WHERE id = p_order_id;
    
    -- Refund buyer: remove from escrow_balance, add to available_balance
    UPDATE public.users 
    SET 
      escrow_balance = escrow_balance - v_order.amount,
      available_balance = available_balance + v_order.amount
    WHERE id = v_order.buyer_id;
    
    -- Create ledger entry for buyer
    INSERT INTO public.ledger_entries (user_id, amount, entry_type, description, reference_id)
    VALUES (v_order.buyer_id, v_order.amount, 'CREDIT', 'Dispute Resolved: Refunded for ' || v_order.item_name, v_order.id::text);

  ELSIF p_resolution = 'settle' THEN
    -- Update order to SETTLED
    UPDATE public.orders SET status = 'SETTLED' WHERE id = p_order_id;
    
    -- Calculate net payout (1.5% platform fee)
    v_net_payout := v_order.amount - (v_order.amount * 0.015);

    -- Remove from buyer's escrow balance and increment completed deals
    UPDATE public.users 
    SET 
      escrow_balance = escrow_balance - v_order.amount,
      completed_deals_count = completed_deals_count + 1
    WHERE id = v_order.buyer_id;

    -- Settle vendor: add to available_balance and increment completed deals
    UPDATE public.users 
    SET 
      available_balance = COALESCE(available_balance, 0) + v_net_payout,
      completed_deals_count = COALESCE(completed_deals_count, 0) + 1
    WHERE id = v_order.vendor_id;

    -- Create ledger entry for vendor
    INSERT INTO public.ledger_entries (user_id, amount, entry_type, description, reference_id)
    VALUES (v_order.vendor_id, v_net_payout, 'CREDIT', 'Dispute Resolved: Settled for ' || v_order.item_name, v_order.id::text);

  ELSE
    RAISE EXCEPTION 'Invalid resolution type. Must be refund or settle.';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



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
