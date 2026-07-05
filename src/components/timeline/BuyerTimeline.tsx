import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface BuyerTimelineProps {
  order: any;
  currentUser: any;
}

const getDisplayStatus = (status: string) => {
  switch (status) {
    case 'PENDING_PAYMENT': return 'Pending Payment';
    case 'ESCROW_LOCKED': return 'Escrow Locked';
    case 'IN_TRANSIT': return 'In Transit';
    case 'DELIVERED_PENDING_RELEASE': return 'Pending Release';
    case 'SETTLING': return 'Settling';
    case 'DISPUTED': return 'Disputed';
    case 'SETTLED': return 'Settled';
    case 'REFUNDED': return 'Refunded';
    case 'EXPIRED': return 'Expired';
    default: return status;
  }
};

const BuyerTimeline: React.FC<BuyerTimelineProps> = ({ order, currentUser }) => {
  const navigate = useNavigate();


  const [isUpdating, setIsUpdating] = useState(false);

  const handleConfirmDelivery = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase.rpc('confirm_delivery', {
        p_order_id: order.id,
        p_buyer_id: order.buyer_id || currentUser?.id
      });
      if (error) throw error;
      toast.success('Delivery confirmed!');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm delivery');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen w-full text-on-background" style={{ background: 'radial-gradient(circle at top right, #1a1a2e, #0a0a0c)' }}>
      <div className="w-full md:max-w-[600px] min-h-screen flex flex-col relative font-body-md antialiased mx-auto pb-32">
      {/* Header */}
      <header className="flex items-center justify-between px-5 h-16 sticky top-0 bg-background/40 backdrop-blur-xl z-40 border-b border-white/5">
        <button 
          onClick={() => navigate('/home')} 
          className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-bold text-lg tracking-tight">Deal Details</h1>
        <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col px-5 pt-6 pb-48 gap-5 overflow-y-auto">
        {/* Status Card */}
        <div className="backdrop-blur-2xl rounded-2xl p-6 flex flex-col items-center gap-2 aetheric-glint relative overflow-hidden bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 bg-primary-container/20 px-4 py-1.5 rounded-full border border-primary-container/40">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
            <span className="text-primary-container font-bold text-sm tracking-widest uppercase">{getDisplayStatus(order.status)}</span>
          </div>
          <p className="text-on-surface-variant text-sm mt-1">Order #{order.link_slug?.toUpperCase()}</p>
          <p className="font-medium text-xs text-primary-fixed-dim/70">
            Created: {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Product Detail Card */}
        <div className="backdrop-blur-2xl p-5 rounded-2xl flex gap-3 items-center bg-white/5 border border-white/10 mt-4">
          <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-white/10 ring-1 ring-white/5 bg-white/10">
            <img 
              className="w-full h-full object-cover" 
              alt={order.item_name} 
              src={order.item_image_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAn5qFjUGn4Vig4jLu0qNzVtLARjasvu_JvDtt3MO5DHwfSM6GhTfGch3CzbHtP8nEwoRc9TEe9qxEsMCyx8s02g6e9kKBBlB3WZty7TZHJA8zA4Zkgmm_2uGw4NTd_AEdIfA5n072ieORhSzzoOFcUs5TPfsEBfYIKznCRnaiZEX3TdkTeQdfRzPROe9acL73qpsu7nTWRCOY246oISruRJ0x8mHfB-KtV9eRYBQnYhvAO7jN7CXCNs-zX5196UJ61qyfZHhdp1B8m"}
            />
          </div>
          <div className="flex flex-col flex-1">
            <h2 className="font-semibold text-lg text-on-surface leading-tight">{order.item_name}</h2>
            <div className="flex items-center gap-1.5 mt-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">inventory</span>
              <span className="text-xs">Authenticity Guaranteed</span>
            </div>
            <div className="font-bold text-2xl text-primary-container mt-2">
              ₦{order.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Escrow Timeline section */}
        <div className="backdrop-blur-2xl p-5 rounded-2xl flex flex-col gap-4 bg-white/5 border border-white/10 mt-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Escrow Timeline
          </h3>
          <div className="space-y-6 relative mt-2">
            
            {/* Step 1: Locked */}
            <div className="relative flex items-start space-x-4">
              <div className="absolute left-3 top-6 bottom-[-24px] w-0.5 bg-[#d2bbff]"></div>
              <div className="z-10 w-6 h-6 rounded-full flex items-center justify-center bg-[#4edea3]">
                <span className="material-symbols-outlined text-[#003824] text-[14px]" style={{ fontWeight: 700 }}>lock</span>
              </div>
              <div className="flex-1">
                <h4 className="font-body-md font-semibold text-on-background text-sm">Funds Locked In Escrow</h4>
                <p className="font-label-sm text-on-surface-variant text-[11px]">{new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
            </div>

            {/* Step 2: Shipped */}
            <div className="relative flex items-start space-x-4">
              <div className={`absolute left-3 top-6 bottom-[-24px] w-0.5 ${order.status === 'IN_TRANSIT' || order.status === 'DELIVERED_PENDING_RELEASE' || order.status === 'SETTLING' || order.status === 'SETTLED' ? 'bg-[#d2bbff]' : 'bg-[#4a4455]'}`}></div>
              <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center ${order.status === 'IN_TRANSIT' || order.status === 'DELIVERED_PENDING_RELEASE' || order.status === 'SETTLING' || order.status === 'SETTLED' ? 'bg-[#4edea3]' : 'bg-[#353534]'}`}>
                <span className={`material-symbols-outlined text-[14px] ${order.status === 'IN_TRANSIT' || order.status === 'DELIVERED_PENDING_RELEASE' || order.status === 'SETTLING' || order.status === 'SETTLED' ? 'text-[#003824]' : 'text-[#958da1]'}`} style={{ fontWeight: 700 }}>inventory_2</span>
              </div>
              <div className="flex-1">
                <h4 className={`font-body-md font-semibold text-sm ${order.status === 'IN_TRANSIT' || order.status === 'DELIVERED_PENDING_RELEASE' || order.status === 'SETTLING' || order.status === 'SETTLED' ? 'text-on-background' : 'text-on-surface-variant'}`}>Item Shipped by Vendor</h4>
                {order.status === 'IN_TRANSIT' && <p className="font-label-sm text-on-surface-variant text-[11px] mt-1">Currently with carrier</p>}
              </div>
            </div>
            
            {/* Step 3: Delivered */}
            <div className="relative flex items-start space-x-4">
              <div className={`absolute left-3 top-6 bottom-[-24px] w-0.5 ${order.status === 'DELIVERED_PENDING_RELEASE' || order.status === 'SETTLING' || order.status === 'SETTLED' ? 'bg-[#d2bbff]' : 'bg-[#4a4455]'}`}></div>
              <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center ${order.status === 'DELIVERED_PENDING_RELEASE' || order.status === 'SETTLING' || order.status === 'SETTLED' ? 'bg-primary-container' : 'bg-[#353534]'}`}>
                <span className={`material-symbols-outlined text-[14px] ${order.status === 'DELIVERED_PENDING_RELEASE' || order.status === 'SETTLING' || order.status === 'SETTLED' ? 'text-white' : 'text-[#958da1]'}`} style={{ fontWeight: 700 }}>location_on</span>
              </div>
              <div className="flex-1">
                <h4 className={`font-body-md font-semibold text-sm ${order.status === 'DELIVERED_PENDING_RELEASE' || order.status === 'SETTLING' || order.status === 'SETTLED' ? 'text-primary' : 'text-on-surface-variant'}`}>Delivered to Buyer</h4>
              </div>
            </div>

            {/* Step 4: Funds Released */}
            <div className="relative flex items-start space-x-4">
              <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center ${order.status === 'SETTLED' ? 'bg-[#4edea3]' : 'bg-[#353534]'}`}>
                <span className={`material-symbols-outlined text-[14px] ${order.status === 'SETTLED' ? 'text-[#003824]' : 'text-[#958da1]'}`} style={{ fontWeight: 700 }}>payments</span>
              </div>
              <div className="flex-1">
                <h4 className={`font-body-md font-semibold text-sm ${order.status === 'SETTLED' ? 'text-on-background' : 'text-on-surface-variant'}`}>Funds Released</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Vendor Verification section */}
        <div className="backdrop-blur-2xl p-5 rounded-2xl flex items-center justify-between bg-white/5 border border-white/10 mt-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container/30 p-0.5">
              <div className="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center bg-white/10 overflow-hidden">
                {order.vendor?.avatar_url ? (
                  <img src={order.vendor.avatar_url} alt="Vendor Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-primary-container">person</span>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-on-surface">{order.vendor?.full_name || 'Vendor'}</h3>
                <span className="material-symbols-outlined text-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant text-xs">
                <span className="material-symbols-outlined text-xs text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span>4.9 (Verified)</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => navigate(`/orders/${order.id}/chat`)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary-container hover:bg-primary-container hover:text-white transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
          </button>
        </div>

        {/* Transaction Details section */}
        <div className="backdrop-blur-2xl p-5 rounded-2xl flex flex-col gap-4 bg-white/5 border border-white/10 mt-4 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">receipt_long</span>
            Transaction Details
          </h3>
          <div className="flex justify-between items-center text-sm">
            <span className="text-on-surface-variant">Order ID</span>
            <span className="text-on-surface font-medium uppercase text-xs">
              #{order.link_slug}
            </span>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Action Area */}
      <div className="fixed bottom-0 left-0 md:absolute w-full p-5 bg-background/60 backdrop-blur-2xl border-t border-white/10 flex flex-col gap-4 z-50 rounded-t-3xl">
        
        {/* Actions based on state */}
        {order.status === 'DELIVERED_PENDING_RELEASE' ? (
          <>
            <button 
              onClick={() => navigate(`/orders/${order.id}/confirm`)}
              className="w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all bg-[#ddb7ff] text-[#490080] hover:shadow-[0_0_20px_rgba(221,183,255,0.4)] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lock_open</span>
              Release Funds
            </button>
            <button 
              onClick={() => navigate(`/orders/${order.id}/dispute`)}
              className="w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all border border-white/10 text-white/80 hover:bg-white/5 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[#ffb4ab]">report_problem</span>
              Report an Issue
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={handleConfirmDelivery}
              disabled={order.status !== 'IN_TRANSIT' || isUpdating}
              className={`w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${
                order.status === 'IN_TRANSIT' 
                ? 'bg-primary-container text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:brightness-110 active:scale-[0.98]' 
                : 'bg-white/10 text-white/50 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined">how_to_reg</span>
              {isUpdating ? 'Confirming...' : "I've received my order"}
            </button>
            <button 
              onClick={() => navigate(`/orders/${order.id}/dispute`)}
              className="w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all border border-white/10 text-white/80 hover:bg-white/5 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[#ffb4ab]">report_problem</span>
              Report an Issue
            </button>
            {order.status !== 'IN_TRANSIT' && order.status !== 'DELIVERED_PENDING_RELEASE' && (
              <div className="text-center w-full">
                <span className="text-xs text-on-surface-variant/60 font-medium italic">
                  Action unlocks when item is marked delivered by the vendor.
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </div>
  );
};

export default BuyerTimeline;
