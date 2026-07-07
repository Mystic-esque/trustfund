# TrustFund — Official Documentation (v3.0)

*Nomba Hackathon 2026 · DevCareer x Nomba · Solo Submission*

*"Deal with trust."*

---

## 1. Product Overview

### 1.1 What TrustFund Solves
Social commerce in Nigeria runs on a broken trust system. Buyers transacting through Instagram, WhatsApp, and Twitter DMs refuse to pay before delivery because scams are rampant. Sellers refuse to ship before payment because buyers flake. This deadlock costs legitimate vendors sales daily and exposes buyers to constant fraud.

TrustFund resolves this by acting as a neutral automated escrow layer. Every user gets a personal wallet with a dedicated Nigerian bank account number (NUBAN). When a seller creates a deal, they generate a shareable link and paste it into the DM where they were already negotiating. The buyer taps the link, tops up their wallet, and locks the deal amount into escrow. The seller ships knowing funds are guaranteed. Funds release automatically 48 hours after delivery or immediately when the buyer confirms. If there is a problem, funds freeze and a mediator joins the deal chat.

### 1.2 Hackathon Track Focus
**Track:** Virtual Accounts as Infrastructure (Build Track — customer-facing)

**Core Integrations:** 
- Nomba Virtual Account API (Provisioning dynamic NUBANs per user)
- Nomba Webhooks (Realtime payment processing)
- Nomba Transactions API (Reconciliation)
- Nomba Transfers (Nigeria Payouts and Settlements)

### 1.3 Architectural Rules & Roles
* **Contextual Roles:** Roles are assigned by ACTION, not account type. A user who generates a deal link is the **Vendor**. The user who taps the link and locks funds is the **Buyer**.
* **Public Deal Links:** Deal links (`/o/:slug`) are PUBLIC routes. Authentication is only required to lock funds. Context is perfectly preserved through the Auth & Sign-Up flow.
* **Self-dealing Guard:** Vendors cannot lock funds on their own deals. This is guarded both in the UI and via secure backend RPCs.
* **Platform Economics:** TrustFund takes a transparent 1.5% platform fee on successful deals.

---

## 2. Tech Stack & Infrastructure

### 2.1 Frontend
* **Framework:** React 18 + Vite (Responsive, mobile-first design)
* **Styling:** Tailwind CSS v3 (Glassmorphism, custom micro-animations, premium dark-mode aesthetics)
* **Routing:** React Router v6
* **State Management:** Zustand (Global State) + React Query
* **Realtime:** Supabase Realtime (WebSockets for chat and live wallet balances)
* **Hosting:** Vercel

### 2.2 Backend (Supabase + PostgreSQL)
* **Authentication:** Supabase Auth (OTP / Password)
* **Database:** PostgreSQL with strict Row Level Security (RLS) on all tables.
* **Server Logic:** Supabase Edge Functions (Deno) and secure Postgres RPCs (PL/pgSQL).
* **Storage:** Supabase Storage Buckets (`order-proofs` for shipping validation).

---

## 3. Core Database Schema & Ledger Architecture

The database operates on a strict, double-entry style ledger system to ensure financial accuracy. 

### 3.1 Primary Tables
* **`users`**: Stores identity, banking details, and wallet states (`available_balance`, `escrow_balance`, `pending_balance`).
* **`orders`**: Tracks the deal lifecycle, parties, amounts, and shipping details.
* **`ledger_entries`**: An immutable audit log. Every financial movement (TOP_UP, ESCROW_LOCK, REFUND, SETTLEMENT_OUT) is recorded here with its precise `balance_effect` (available, escrow, pending) and `direction` (credit/debit).
* **`messages`**: Real-time chat table supporting user messages and automated system status updates.
* **`webhook_events`**: Idempotency store for Nomba webhooks to prevent duplicate transaction processing.

### 3.2 Wallet Balance System
1. **Available Balance:** Free, usable funds. Top-up credits here.
2. **Escrow Balance:** Funds actively locked in deals as a Buyer.
3. **Pending Balance:** Funds owed to a Vendor after delivery confirmation, awaiting final settlement or dispute resolution.

---

## 4. The Order State Machine

Orders follow a strict, uni-directional state machine guarded by Postgres `SECURITY DEFINER` RPCs.

1. `PENDING_PAYMENT` (Deal created by Vendor)
2. `ESCROW_LOCKED` (Buyer locks funds; money moves from Available to Escrow)
3. `IN_TRANSIT` (Vendor provides shipping proof and marks as shipped)
4. `DELIVERED_PENDING_RELEASE` (Buyer confirms receipt; 48hr auto-release countdown begins)
5. `SETTLING` -> `SETTLED` (Funds release to Vendor's bank or available balance)
6. **Exception Path:** `DISPUTED` (Dispute raised by buyer/vendor) -> `REFUNDED` or `SETTLED` via Admin Mediation.

---

## 5. Advanced Feature Implementations (Hackathon Additions)

While the core MVP focused on simple escrow, we successfully implemented several advanced features to make the application robust and production-ready:

### 5.1 Real-time Admin Dispute Mediation
Initially planned as a manual database update, the dispute flow was fully built out:
* **Admin Dashboard:** Admins have a dedicated view (`/admin/disputes`) to monitor flagged transactions.
* **Mediator Chat Injection:** Admins can join deal chats. Their messages are badged as "Admin", while participants are clearly tagged as "Vendor" or "Buyer".
* **Secure Resolutions:** Custom SQL functions (`resolve_dispute`, `cancel_dispute`) allow Admins to easily click "Refund Buyer", "Settle Vendor", or "Dismiss Dispute". These functions safely mutate the order state, distribute the escrow funds to the correct balances, and insert strict `ledger_entries` to maintain financial integrity.

### 5.2 Vendor Shipping Proof (Storage Buckets)
To protect buyers, vendors cannot simply tap "Shipped". They must provide tracking details, courier information, and upload photographic shipping proof.
* Implemented via Supabase Storage (`order-proofs` bucket).
* Secure RLS ensures only authenticated users can upload, and images are publicly viewable within the context of the deal.

### 5.3 Payment PIN Security
To secure user funds against unauthorized device access:
* Users must set up a 4-digit Payment PIN before linking a bank account or making withdrawals.
* The UI features a custom, auto-focusing 4-digit input interface for seamless UX.

### 5.4 Deal Chat & Automated System Messages
A fully-featured real-time chat interface embedded within every deal:
* **System Messages:** The timeline automatically updates with visually distinct system messages whenever the order state changes (e.g., "📦 Buyer confirmed delivery", "🔒 Funds locked").
* **Read Receipts:** Chat indicators notify users of unread messages and clear out instantly upon opening the thread.

### 5.5 UI Polish & "Coming Soon" Guards
* The application features a highly premium, dark-mode aesthetic with interactive hover effects and pulsing gradients.
* Incomplete or future features (like Social OAuth and Help & Support) are safely intercepted with non-disruptive `react-hot-toast` notifications, ensuring judges never encounter broken links or 404 pages.

---

## 6. Security Posture

* **Webhook Idempotency:** The `nomba-webhook` Edge Function rigorously checks signatures and logs request IDs to prevent duplicate top-ups.
* **Row Level Security (RLS):** Enabled universally. Users can only read their own ledger entries, messages, and profile data. Admins have explicit, isolated policies for mediation.
* **Server-Side Math:** Frontend clients never dictate wallet balances. The frontend simply calls `rpc('lock_funds')` or `rpc('resolve_dispute')`, and all calculations (including the 1.5% platform fee) are executed atomically in Postgres.

---
*TrustFund — Built for the DevCareer x Nomba Hackathon 2026*
