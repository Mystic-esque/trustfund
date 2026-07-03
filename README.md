# TrustFund | Secure Social Commerce

> [!IMPORTANT]
> **📱 MOBILE-FIRST EXPERIENCE**
> This MVP was designed and built strictly as a **mobile web application**. 
> **For Hackathon Judges:** Please view the live demo on a physical mobile device, or use your browser's Developer Tools (F12) to toggle the **Mobile Device Toolbar / Viewport Simulator** (e.g., iPhone 14 Pro Max) for the intended experience. Viewing it on a full desktop width will not reflect the designed UI/UX.

---

## 🛡️ What is TrustFund?
TrustFund eliminates the "trust deadlock" in DM-based social commerce (Twitter, Instagram, WhatsApp) by providing professional-grade escrow services for everyday buyers and sellers. 

When conducting business with strangers online, buyers are afraid to send money first, and sellers are afraid to ship goods without payment. TrustFund bridges this gap by holding the funds securely until both parties are satisfied.

## ✨ Key Features
- **Instant Deal Links**: Sellers can generate a secure payment link in seconds and drop it in their social media DMs.
- **Escrow Protection**: Funds are locked in a secure vault. Sellers are notified that funds are secured and can confidently ship the product.
- **Buyer Verification**: Buyers have an inspection window to verify the asset before digitally releasing the funds.
- **Premium UI/UX**: A sleek, cinematic, glassmorphic dark-mode interface built to feel like a high-end fintech application.

## 🚀 Tech Stack
- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS (with custom glassmorphism and ambient radial gradients)
- **Routing**: React Router DOM
- **Icons**: Google Material Symbols
- **Deployment**: Vercel

## 🛠️ Local Development
To run the TrustFund MVP locally:

```bash
# 1. Clone the repository
git clone https://github.com/Mystic-esque/trustfund.git

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

*Note: The application uses client-side routing. If deployed to Vercel, a `vercel.json` file handles SPA fallback routing.*
