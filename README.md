# TrustFund 

**DevCareer x Nomba Hackathon 2026 • Virtual Accounts as Infrastructure Track**

> [!IMPORTANT]
> **📱 MOBILE-FIRST WEB APPLICATION**
> TrustFund is built as a **mobile-first web application**. It features a responsive, centered mobile-width column (max-width 430px) when viewed on desktop browsers. 
> **For Hackathon Judges:** You can access the live URL on any browser. For the best immersive experience on desktop, you can use your browser's Developer Tools to toggle the Mobile Device Viewport Simulator.

---

## 🛡️ The Problem: The Trust Deadlock
Social commerce in Nigeria is paralyzed by a trust deadlock. Buyers transacting through Instagram, WhatsApp, and Twitter DMs refuse to pay before delivery because scams are rampant. Sellers refuse to ship before payment because buyers flake. This deadlock costs legitimate vendors sales daily and exposes buyers to constant fraud.

## 💡 The Solution
**TrustFund** solves this by acting as a neutral, automated escrow layer powered directly by Nomba's infrastructure. 
Instead of forcing users onto a clunky third-party app, TrustFund integrates perfectly into existing platforms. Sellers generate a simple, shareable deal link and drop it right into the DM. Buyers tap the link, top up their wallet via a dedicated Nomba Virtual Account, and instantly lock funds into escrow.

The seller ships knowing the funds are 100% guaranteed. The buyer pays knowing their money won't be released to the seller until delivery is confirmed.

---

## ✨ Key Features

- **Automated Virtual Accounts (NUBANs)**: Every user is automatically assigned a dedicated Nigerian bank account (powered by Nomba Virtual Accounts API) immediately upon signing up.
- **Link-Based Escrow Checkout**: Sellers generate a deal slug. Buyers paste the link, and our system atomically validates their balance and locks the funds into escrow without breaking the conversational flow.
- **Real-Time Ledger & Balance Tracking**: Powered by an idempotent `nomba-webhook` Edge Function, bank transfers instantly credit the user's available balance. Supabase Realtime updates the UI dashboard the exact second the funds clear.
- **Automated Deal Chat**: As the order moves through its State Machine (e.g., `PENDING_PAYMENT` → `ESCROW_LOCKED`), the system automatically injects verified status updates into a centralized deal chat.
- **Premium Fintech UI/UX**: A sleek, dark-themed "aetheric vault" aesthetic built with React and TailwindCSS, utilizing fluid micro-interactions, glassmorphism, and dynamic fallback UIs.

---

## 🚀 Tech Stack & Infrastructure

### Frontend
- **Framework**: React 18 + Vite (TypeScript)
- **Styling**: Tailwind CSS v3 (Custom glassmorphism & gradients)
- **State Management**: Zustand + React Query
- **Routing**: React Router v6
- **Hosting**: Vercel

### Backend & Payments
- **Database**: PostgreSQL (Supabase) with strict Row Level Security (RLS) on all tables.
- **Serverless Logic**: Supabase Edge Functions (Deno runtime) for secure execution of all Nomba API calls and database transactions.
- **Authentication**: Supabase Auth
- **Payment Infrastructure**: Nomba API (Virtual Accounts, Webhooks, Transfers)
- **Realtime**: Supabase Realtime subscriptions (for Wallet updates and Chat)

---

## 🛠️ Local Development

To run the TrustFund MVP locally:

```bash
# 1. Clone the repository
git clone https://github.com/Mystic-esque/trustfund.git

# 2. Install dependencies
npm install

# 3. Setup Environment Variables
# Create a .env file and add your Supabase connection strings
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# 4. Start the development server
npm run dev
```

*Note: All sensitive Nomba API credentials (Client ID, Secret, Webhook Secret) and the Supabase Service Role Key are securely stored as Edge Function Secrets in the Supabase Dashboard, completely hidden from the client.*
