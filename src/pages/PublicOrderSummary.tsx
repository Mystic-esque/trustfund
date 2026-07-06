import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import './PublicOrderSummary.css';

interface OrderDetails {
  id: string;
  productImage: string;
  category: string;
  title: string;
  sellerAvatar: string;
  sellerUsername: string;
  sellerName: string;
  memberSince: string;
  trustRating: number;
  escrowDeals: number;
  disputes: number;
  price: number;
  vendorId: string;
  status: string;
  buyerId: string | null;
}

const PublicOrderSummary = () => {
  const navigate = useNavigate();
  const { slug } = useParams(); // Get order ID/slug from URL if available
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!slug) throw new Error("Invalid deal link.");

        // We can fetch by link_slug or id depending on how the URL is structured.
        // Assuming slug is the link_slug:
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*, vendor:users!vendor_id(*)')
          .eq('link_slug', slug)
          .single();

        // If it fails by link_slug, let's try by id in case the URL uses ID:
        let finalOrderData = orderData;
        if (orderError) {
          const { data: orderById, error: idError } = await supabase
            .from('orders')
            .select('*, vendor:users!vendor_id(*)')
            .eq('id', slug)
            .single();
          
          if (idError) throw new Error("Deal not found.");
          finalOrderData = orderById;
        }

        const vendor = finalOrderData.vendor;
        const joinedDate = new Date(vendor.created_at);
        const monthYear = joinedDate.toLocaleString('default', { month: 'short' }) + ' ' + joinedDate.getFullYear();

        setOrder({
          id: finalOrderData.id,
          productImage: finalOrderData.item_image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvGuQbympCFr2CNBpFf-DGzZRn_RTfqijPUnnF_YyDXj7ZrPGX-knXECKiHdihY7rG6GOmASUzwK1PeSp1Vkn5AQn_w7KtF8uoAD43Rd_MYBDYP5659nI7nGZ0XUr2ixm_Tdt1R_OWStGPllomBjLTcN9pAvxFV9bzmbCUB4Lf_PPvd8Hd8jns70K_Sx_LeKK11pCbHtv6EzNdO-if5ydyE1urtNDH69KyujDu5LoRLVSUB_k5gJUvvmUx6qXdAT75oC6Psf_s7UT_',
          category: 'Escrow Deal',
          title: finalOrderData.item_name,
          sellerAvatar: vendor.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtJwP6FIF9_sidy4-z7N7l5ziKtjq2oNPileWC--EV_y4zTaXJOVM8rjOTGQ-u__anNESwekiSQSD2T70u9w24fIIyF4mDjBb-oMWyyk-az1jI9cvjbMNLeboVny6JdURiO93J2Z6q201oKZ-s8jBqQcWkbUfHHX5DLf-XXhar36-AJGEu_wBVp1DCoGr6TFh0FqGCyFI-Dke06NNEk14FXrkZLRBf7zrcyav5WOZbHoWt_V_BbCl_RzyAI8U75SgmDgxJHXDqjgpk',
          sellerUsername: vendor.username || vendor.full_name.split(' ').join('_').toLowerCase(),
          sellerName: vendor.full_name,
          memberSince: monthYear,
          trustRating: 4.9, // mock
          escrowDeals: vendor.completed_deals_count || 0,
          disputes: 0, // mock
          price: finalOrderData.amount,
          vendorId: vendor.id,
          status: finalOrderData.status,
          buyerId: finalOrderData.buyer_id,
        });

        if (finalOrderData.status === 'PENDING_PAYMENT' && (!finalOrderData.buyer_id || finalOrderData.buyer_id === currentUserId)) {
          const pendingDeals = JSON.parse(localStorage.getItem('pending_deals') || '[]');
          const existing = pendingDeals.findIndex((d: any) => d.id === finalOrderData.id);
          if (existing >= 0) pendingDeals.splice(existing, 1);
          pendingDeals.unshift({ id: finalOrderData.id, item_name: finalOrderData.item_name, amount: finalOrderData.amount, timestamp: Date.now() });
          localStorage.setItem('pending_deals', JSON.stringify(pendingDeals.slice(0, 10)));
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white" style={{ background: '#101415' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white space-y-4" style={{ background: '#101415' }}>
        <span className="material-symbols-outlined text-6xl text-white/50">error</span>
        <h1 className="text-2xl font-bold">Deal Not Found</h1>
        <p className="text-white/60">{error}</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">Go Home</button>
      </div>
    );
  }

  if (order.status !== 'PENDING_PAYMENT' || (order.buyerId && order.buyerId !== currentUserId)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white space-y-4 px-5 text-center" style={{ background: '#101415' }}>
        <span className="material-symbols-outlined text-6xl text-error mb-2">cancel</span>
        <h1 className="text-2xl font-bold">Deal Unavailable</h1>
        <p className="text-white/60 max-w-xs">This deal has already been claimed, paid for, or is no longer available.</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 mt-4 bg-white/10 rounded-full hover:bg-white/20 transition-colors">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#e0e3e5] font-['Hanken_Grotesk'] overflow-x-hidden" style={{ background: 'radial-gradient(circle at 20% 30%, rgba(221, 183, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(62, 60, 143, 0.2) 0%, transparent 50%), #101415' }}>
      {/* TopAppBar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-[40px] border-b border-white/10 h-20 flex items-center justify-between px-5 md:px-16">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <img src="/images/logo.svg" alt="TrustFund Logo" className="h-8 w-8 object-contain" />
          <span className="font-headline-lg-mobile md:font-headline-lg tracking-tighter text-[#ddb7ff] uppercase">TRUSTFUND</span>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="pt-28 pb-32 px-5 md:px-16 max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="space-y-2">
          <h1 className="text-[32px] md:text-[40px] font-semibold text-[#e0e3e5]">Order Summary</h1>
          <p className="text-[16px] text-[#cfc2d6] opacity-70">Verify details before initiating secure escrow.</p>
        </header>

        {/* Product Glass Card */}
        <section className="animate-float">
          <div className="backdrop-blur-[40px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <div className="w-full md:w-48 h-48 rounded-2xl overflow-hidden border border-white/10">
              <img className="w-full h-full object-cover" alt={order.title} src={order.productImage}/>
            </div>
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <span className="text-[12px] font-semibold text-[#ddb7ff] uppercase tracking-widest bg-[#ddb7ff]/10 px-3 py-1 rounded-full">{order.category}</span>
                <h2 className="text-[32px] font-semibold text-[#e0e3e5] mt-4">{order.title}</h2>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                  <img className="w-full h-full object-cover" alt={order.sellerName} src={order.sellerAvatar}/>
                </div>
                <span className="text-[16px] text-[#cfc2d6]">@{order.sellerUsername}</span>
              </div>
              <p className="text-[36px] font-bold text-[#ddb7ff]">₦ {order.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </section>

        {/* Safe-Trade Protocol */}
        <section className="space-y-4">
          <h3 className="text-[20px] font-medium text-[#cfc2d6] opacity-80 px-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">verified_user</span>
            Safe-Trade Protocol
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="backdrop-blur-[40px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5 rounded-2xl space-y-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <div className="text-[#ddb7ff] text-xl font-bold">01</div>
              <p className="text-[16px] font-medium text-[#e0e3e5]">Payment Held in Escrow</p>
              <p className="text-[12px] text-[#cfc2d6] opacity-60">Funds are secured by TrustFund until you confirm receipt.</p>
            </div>
            <div className="backdrop-blur-[40px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5 rounded-2xl space-y-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <div className="text-[#ddb7ff] text-xl font-bold">02</div>
              <p className="text-[16px] font-medium text-[#e0e3e5]">Inspection Period</p>
              <p className="text-[12px] text-[#cfc2d6] opacity-60">24-hour window to verify asset quality after delivery.</p>
            </div>
            <div className="backdrop-blur-[40px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5 rounded-2xl space-y-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <div className="text-[#ddb7ff] text-xl font-bold">03</div>
              <p className="text-[16px] font-medium text-[#e0e3e5]">Automated Release</p>
              <p className="text-[12px] text-[#cfc2d6] opacity-60">Payment released to seller upon your digital signature.</p>
            </div>
          </div>
        </section>

        {/* Vendor Identity */}
        <section className="backdrop-blur-[40px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 rounded-[32px] p-6 md:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="text-[20px] font-medium text-[#e0e3e5]">{order.sellerName}</h3>
              <p className="text-[12px] text-[#cfc2d6] opacity-50 mt-1">Member since {order.memberSince}</p>
            </div>
            <div className="flex gap-8 w-full md:w-auto overflow-x-auto pb-2">
              <div className="text-center min-w-[100px]">
                <p className="text-[12px] text-[#cfc2d6] opacity-60 uppercase mb-1">Trust Rating</p>
                <p className="text-[20px] font-medium text-[#ddb7ff]">{order.trustRating.toFixed(1)} / 5.0</p>
              </div>
              <div className="text-center min-w-[100px]">
                <p className="text-[12px] text-[#cfc2d6] opacity-60 uppercase mb-1">Escrow Deals</p>
                <p className="text-[20px] font-medium text-[#e0e3e5]">{order.escrowDeals}</p>
              </div>
              <div className="text-center min-w-[100px]">
                <p className="text-[12px] text-[#cfc2d6] opacity-60 uppercase mb-1">Disputes</p>
                <p className="text-[20px] font-medium text-[#e0e3e5]">{order.disputes}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer / CTA */}
        <footer className="pt-8 space-y-8 flex flex-col items-center">
          {currentUserId !== order.vendorId ? (
            <button 
              onClick={() => navigate(currentUserId ? `/orders/${order.id}/lock` : `/orders/${order.id}/auth`)}
              className="w-full md:w-96 py-5 rounded-full bg-gradient-to-r from-[#b76dff] to-[#3e3c8f] text-white font-bold text-[20px] glow-violet hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(183,109,255,0.3)]"
            >
              Secure Deal
            </button>
          ) : (
            <div className="w-full md:w-96 py-5 rounded-full bg-white/5 border border-white/10 text-white/50 font-bold text-[20px] text-center">
              This is your deal
            </div>
          )}
          <div className="flex items-center gap-6 text-[#cfc2d6] opacity-40">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">lock</span>
              <span className="text-[12px] font-semibold">SSL Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span className="text-[12px] font-semibold">Identity Verified</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">security</span>
              <span className="text-[12px] font-semibold">Escrow Protected</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Bottom Navigation Shell */}
      <BottomNav />
    </div>
  );
};

export default PublicOrderSummary;
