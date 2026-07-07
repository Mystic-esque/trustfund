-- INITIAL SCHEMA DEFINITIONS

4.1 Users Table**

   
create table public.users (  
  id uuid primary key references auth.users(id) on delete cascade,  
  full\_name text not null,  
  phone text unique not null,  
  username text unique,  
  avatar\_url text,  
  \-- Payout bank details (verified via Nomba bank lookup)  
  bank\_name text,  
  bank\_code text,  
  bank\_account\_number text,  
  bank\_account\_name text,  	\-- verified name from Nomba lookup  
  \-- Nomba virtual wallet account  
  nomba\_virtual\_account\_number text unique,  \-- the NUBAN  
  nomba\_account\_ref text unique,         	\-- \= user id (our join key)  
  nomba\_bank\_name text,                  	\-- e.g. "Nomba MFB"  
  account\_provisioning\_status text default 'pending',  \-- pending | active | failed  
  \-- Three wallet balances  
  available\_balance numeric(12,2) default 0.00,  
  escrow\_balance	numeric(12,2) default 0.00,  
  pending\_balance   numeric(12,2) default 0.00,  
  \-- Stats  
  completed\_deals\_count integer default 0,  
  created\_at timestamptz default now(),  
  updated\_at timestamptz default now()  
);  
alter table public.users enable row level security;  
create policy "Users can view own profile" on public.users  
  for select using (auth.uid() \= id);  
create policy "Users can update own profile" on public.users  
  for update using (auth.uid() \= id);  
create policy "Public profile view for deal pages" on public.users  
  for select using (true);  
 

**4.2 Orders Table**

   
create type order\_status as enum (  
'PENDING\_PAYMENT', 'ESCROW\_LOCKED', 'IN\_TRANSIT',  
'DELIVERED\_PENDING\_RELEASE', 'SETTLING', 'SETTLED',  
'DISPUTED', 'REFUNDED', 'EXPIRED'  
);  
create table public.orders (  
  id uuid primary key default gen\_random\_uuid(),  
  link\_slug text unique not null,    	\-- 6-char random slug for deal URL  
  reference\_id text unique not null, 	\-- TF-{year}-{slug} for receipts  
  \-- Parties  
  vendor\_id uuid references public.users(id) not null,  
  buyer\_id  uuid references public.users(id),   \-- null until fund lock  
  \-- Deal details  
  item\_name text not null,  
  item\_description text,  
  amount numeric(12,2) not null,      	\-- naira decimal  
  platform\_fee numeric(12,2),         	\-- amount \* 0.015  
  net\_payout   numeric(12,2),	         \-- amount \- platform\_fee  
  delivery\_window text,               	\-- "24hrs" | "48hrs" | "3-5 days" | custom  
  \-- Status  
  status order\_status default 'PENDING\_PAYMENT' not null,  
  \-- State timestamps  
  escrow\_locked\_at timestamptz,  
  shipped\_at timestamptz,  
  delivered\_at timestamptz,  
  auto\_release\_at timestamptz,        	\-- delivered\_at \+ 48 hours  
  settled\_at timestamptz,  
  disputed\_at timestamptz,  
  \-- Shipping  
  tracking\_reference text,  
  \-- Settlement tracking  
  settlement\_tx\_ref text,             	\-- merchantTxRef for payout  
  settlement\_nomba\_id text,  
  settlement\_attempts integer default 0,  
  \-- Link expiry  
  expires\_at timestamptz default now() \+ interval '72 hours',  
  created\_at timestamptz default now(),  
  updated\_at timestamptz default now()  
);  
alter table public.orders enable row level security;  
create policy "Vendor can view own orders" on public.orders  
  for select using (auth.uid() \= vendor\_id);  
create policy "Buyer can view own orders" on public.orders  
  for select using (auth.uid() \= buyer\_id);  
create policy "Public order view by slug" on public.orders  
  for select using (true);  
create policy "Authenticated users can create orders" on public.orders  
  for insert with check (auth.uid() \= vendor\_id);  
 

**4.3 Ledger Entries Table (Immutable Audit Log)**

   
create type ledger\_entry\_type as enum (  
'TOP\_UP', 'ESCROW\_LOCK', 'ESCROW\_UNLOCK',  
'SETTLEMENT\_IN', 'SETTLEMENT\_OUT',  
'WITHDRAWAL', 'REFUND', 'PLATFORM\_FEE'  
);  
create type ledger\_entry\_status as enum ('SUCCESS', 'PENDING', 'FAILED');  
create table public.ledger\_entries (  
  id uuid primary key default gen\_random\_uuid(),  
  user\_id  uuid references public.users(id) not null,  
  order\_id uuid references public.orders(id),  \-- null for top-ups/withdrawals  
  entry\_type ledger\_entry\_type not null,  
  status ledger\_entry\_status default 'SUCCESS',  
  amount numeric(12,2) not null,          	\-- always positive  
  balance\_effect text not null,           	\-- 'available' | 'escrow' | 'pending'  
  direction text not null,                	\-- 'credit' | 'debit'  
  nomba\_transaction\_id text,  
  nomba\_session\_id text,  
  merchant\_tx\_ref text,  
  sender\_name text,  
  narration text,  
  reference\_id text,  
  created\_at timestamptz default now()  
);  
alter table public.ledger\_entries enable row level security;  
create policy "Users can view own ledger" on public.ledger\_entries  
  for select using (auth.uid() \= user\_id);  
 

**4.4 Webhook Events Table (Idempotency Store)**

   
create table public.webhook\_events (  
  id uuid primary key default gen\_random\_uuid(),  
  request\_id text unique not null,	\-- Nomba requestId — idempotency key  
  event\_type text not null,  
  payload jsonb not null,  
  processed boolean default false,  
  received\_at timestamptz not null,  
  processed\_at timestamptz  
);  
alter table public.webhook\_events enable row level security;  
\-- No user-facing RLS policy — service role only  
 

**4.5 Messages Table (Deal Chat)**

   
create type message\_sender\_type as enum ('user', 'system');  
create table public.messages (  
  id uuid primary key default gen\_random\_uuid(),  
  order\_id uuid references public.orders(id) not null,  
  sender\_id uuid references public.users(id),  \-- null for system messages  
  sender\_type message\_sender\_type default 'user',  
  content text not null,  
  message\_type text default 'text',  \-- 'text' | 'image' | 'status\_update'  
  metadata jsonb,  
  created\_at timestamptz default now()  
);  
alter table public.messages enable row level security;  
create policy "Order parties can view messages" on public.messages  
  for select using (  
	auth.uid() in (  
  	select vendor\_id from public.orders where id \= order\_id  
  	union  
  	select buyer\_id from public.orders where id \= order\_id  
	)  
  );  
create policy "Order parties can send messages" on public.messages  
  for insert with check (  
	auth.uid() in (  
  	select vendor\_id from public.orders where id \= order\_id  
  	union  
  	select buyer\_id from public.orders where id \= order\_id  
	)  
  );  
alter publication supabase\_realtime add table public.messages;  
 

**4.6 Indexes**

   
create index idx\_orders\_slug     on public.orders(link\_slug);  
create index idx\_orders\_vendor   on public.orders(vendor\_id);  
create index idx\_orders\_buyer    on public.orders(buyer\_id);  
create index idx\_orders\_status   on public.orders(status);  
create index idx\_orders\_release  on public.orders(auto\_release\_at) where status \= 'DELIVERED\_PENDING\_RELEASE';  
create index idx\_ledger\_user     on public.ledger\_entries(user\_id);  
create index idx\_ledger\_order    on public.ledger\_entries(order\_id);  
create index idx\_messages\_order  on public.messages(order\_id, created\_at);  
create index idx\_webhook\_req     on public.webhook\_events(request\_id);  
create index idx\_users\_nuban     on public.users(nomba\_virtual\_account\_number);  
create index idx\_users\_acctref   on public.users(nomba\_account\_ref);  
 

**5\. Order State Machine**

**

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


