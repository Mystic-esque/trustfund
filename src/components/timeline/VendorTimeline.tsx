import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface VendorTimelineProps {
  order: any;
  currentUser: any;
}

const VendorTimeline: React.FC<VendorTimelineProps> = ({ order, currentUser }) => {
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
  const [courier, setCourier] = useState(order.shipping_courier || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive step status from order.status
  const isShipped = order.status !== 'PENDING_PAYMENT' && order.status !== 'ESCROW_LOCKED';
  const isDelivered = order.status === 'DELIVERED_PENDING_RELEASE' || order.status === 'SETTLING' || order.status === 'SETTLED';

  const handleMarkAsShipped = async () => {
    setIsUpdating(true);
    try {
      let proofUrl = null;
      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${order.id}_${Date.now()}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('order-proofs')
          .upload(filePath, proofFile);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('order-proofs')
          .getPublicUrl(filePath);
          
        proofUrl = publicUrl;
      }

      const { error } = await supabase.rpc('mark_order_shipped', {
        p_order_id: order.id,
        p_vendor_id: currentUser.id,
        p_tracking_number: trackingNumber || null,
        p_shipping_courier: courier || null,
        p_proof_url: proofUrl
      });

      if (error) throw error;
      toast.success('Order marked as shipped!');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen w-full text-[#e5e2e1]" style={{ background: 'radial-gradient(circle at top right, #1a1a2e, #0a0a0c)' }}>
      <div className="w-full md:max-w-[600px] min-h-screen flex flex-col relative font-body-md antialiased mx-auto pb-32">
      {/* Top App Bar */}
      <header className="w-full top-0 sticky z-50 bg-background flex items-center justify-between px-5 h-16 border-b border-white/5">
        <button 
          onClick={() => navigate('/home')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-[20px] font-bold text-primary">Manage Deal</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/orders/${order.id}/chat`)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
          </button>
        </div>
      </header>

      {/* Content Canvas */}
      <div className="px-5 mt-4 space-y-6">
        
        {/* Deal Summary Header */}
        <section className="bg-gradient-to-br from-[#7c3aed] to-[#3f008e] p-5 rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          
          <div className="flex items-center space-x-4 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden bg-surface-container flex items-center justify-center">
              {order.buyer?.avatar_url ? (
                <img src={order.buyer.avatar_url} alt="Buyer Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-white">person</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-label-sm text-white/70 uppercase tracking-wider">Customer</p>
              <h2 className="font-body-lg text-white font-semibold">{order.buyer?.full_name || 'Buyer'}</h2>
            </div>
            <div className="w-16 h-16 rounded-xl bg-white/20 border border-white/10 shrink-0 overflow-hidden">
              <img 
                className="w-full h-full object-cover" 
                alt={order.item_name} 
                src={order.item_image_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAn5qFjUGn4Vig4jLu0qNzVtLARjasvu_JvDtt3MO5DHwfSM6GhTfGch3CzbHtP8nEwoRc9TEe9qxEsMCyx8s02g6e9kKBBlB3WZty7TZHJA8zA4Zkgmm_2uGw4NTd_AEdIfA5n072ieORhSzzoOFcUs5TPfsEBfYIKznCRnaiZEX3TdkTeQdfRzPROe9acL73qpsu7nTWRCOY246oISruRJ0x8mHfB-KtV9eRYBQnYhvAO7jN7CXCNs-zX5196UJ61qyfZHhdp1B8m"}
              />
            </div>
          </div>
          
          <div className="space-y-1 relative z-10">
            <p className="font-body-md text-white/80">{order.item_name}</p>
            <div className="flex items-baseline space-x-1">
              <span className="font-label-lg text-white/70">₦</span>
              <span className="font-display-lg text-[32px] font-bold text-white">
                {order.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </section>

        {/* Fulfillment Status Card */}
        <section className="bg-[#201f1f]/60 backdrop-blur-md border border-[#4a4455]/50 p-5 rounded-xl">
          <h3 className="font-label-lg text-primary mb-6">Fulfillment Status</h3>
          <div className="space-y-6 relative">
            
            {/* Step 1 */}
            <div className="relative flex items-start space-x-4">
              <div className={`absolute left-3 top-6 bottom-[-24px] w-0.5 ${isShipped ? 'bg-[#d2bbff]' : 'bg-[#4a4455]'}`}></div>
              <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center ${isShipped ? 'bg-[#4edea3]' : 'bg-primary-container border-4 border-background'}`}>
                {isShipped ? (
                  <span className="material-symbols-outlined text-[#003824] text-[16px]" style={{ fontWeight: 700 }}>check</span>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-body-md font-semibold ${isShipped ? 'text-on-background' : 'text-primary'}`}>Order Received</h4>
                <p className="font-label-sm text-on-surface-variant">Funds secured in escrow</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-start space-x-4">
              <div className={`absolute left-3 top-6 bottom-[-24px] w-0.5 ${isDelivered ? 'bg-[#d2bbff]' : 'bg-[#4a4455]'}`}></div>
              <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center ${isShipped ? (isDelivered ? 'bg-[#4edea3]' : 'bg-primary-container border-4 border-background') : 'bg-[#353534]'}`}>
                {isDelivered ? (
                  <span className="material-symbols-outlined text-[#003824] text-[16px]" style={{ fontWeight: 700 }}>check</span>
                ) : isShipped ? (
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                ) : null}
              </div>
              <div className="flex-1">
                <h4 className={`font-body-md font-semibold ${isDelivered ? 'text-on-background' : isShipped ? 'text-primary' : 'text-on-surface-variant'}`}>Shipped</h4>
                <p className="font-label-sm text-on-surface-variant">In transit to customer</p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="relative flex items-start space-x-4">
              <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center ${isDelivered ? 'bg-[#4edea3]' : 'bg-[#353534]'}`}>
                {isDelivered && (
                  <span className="material-symbols-outlined text-[#003824] text-[16px]" style={{ fontWeight: 700 }}>check</span>
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-body-md font-semibold ${isDelivered ? 'text-on-background' : 'text-on-surface-variant'}`}>Delivered</h4>
                <p className="font-label-sm text-on-surface-variant">Awaiting buyer confirmation</p>
              </div>
            </div>
            
          </div>
        </section>

        {/* Logistics Section */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col space-y-2">
              <label className="font-label-sm text-on-surface-variant px-1">Tracking Number (Optional)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  readOnly={isShipped}
                  placeholder="e.g. GIG-123456789"
                  className="w-full bg-[#2a2a2a] border border-[#4a4455] text-on-background rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                />
                <span className="material-symbols-outlined absolute right-4 top-3 text-on-surface-variant">qr_code_scanner</span>
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <label className="font-label-sm text-on-surface-variant px-1">Courier Service (Optional)</label>
              <select 
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                disabled={isShipped}
                className="w-full bg-[#2a2a2a] border border-[#4a4455] text-on-background rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="">Select Courier...</option>
                <option value="GIG Logistics">GIG Logistics</option>
                <option value="DHL Express">DHL Express</option>
                <option value="FedEx">FedEx</option>
                <option value="Terminal Africa">Terminal Africa</option>
              </select>
            </div>
          </div>
        </section>

        {/* Proof of Delivery */}
        {!isShipped && (
          <section className="bg-[#201f1f]/60 backdrop-blur-md p-5 rounded-xl border-dashed border-2 border-[#4a4455]">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setProofFile(e.target.files[0]);
                }
              }}
              className="hidden"
              accept="image/*"
            />
            {proofFile ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#4a4455] relative">
                  <img src={URL.createObjectURL(proofFile)} alt="Proof" className="w-full h-full object-cover" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setProofFile(null); }}
                    className="absolute top-1 right-1 bg-black/60 rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-500/80"
                  >
                    <span className="material-symbols-outlined text-[12px] text-white">close</span>
                  </button>
                </div>
                <p className="font-body-md text-sm text-on-background truncate max-w-[200px]">{proofFile.name}</p>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center py-4 space-y-3 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-[#353534] flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[32px]">add_a_photo</span>
                </div>
                <div className="text-center">
                  <p className="font-body-md font-semibold text-on-background">Proof of Shipment</p>
                  <p className="font-label-sm text-on-surface-variant">Upload waybill or item photo</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Escrow Safety Notice */}
        <section className="bg-[#1c1b1b] p-4 rounded-xl flex items-start space-x-3 border border-[#4a4455]/30">
          <span className="material-symbols-outlined text-[#4edea3] text-xl">verified_user</span>
          <p className="font-label-sm text-on-surface-variant leading-relaxed">
            TrustFund Safety: Your funds are protected. Payout is initiated to your Nomba virtual account immediately after the buyer confirms receipt of the item.
          </p>
        </section>

      </div>

      {/* Bottom Action Area */}
      {!isShipped && (
        <footer className="fixed bottom-0 left-0 md:absolute w-full z-50 p-5 bg-background/80 backdrop-blur-md border-t border-white/5">
          <button 
            onClick={handleMarkAsShipped}
            disabled={isUpdating || order.status === 'PENDING_PAYMENT'}
            className="w-full bg-gradient-to-br from-[#7c3aed] to-[#3f008e] text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>
              {isUpdating 
                ? 'Updating...' 
                : order.status === 'PENDING_PAYMENT' 
                  ? 'Awaiting Escrow Lock' 
                  : 'Mark as Shipped'}
            </span>
            {!isUpdating && order.status !== 'PENDING_PAYMENT' && <span className="material-symbols-outlined text-lg">local_shipping</span>}
            {order.status === 'PENDING_PAYMENT' && <span className="material-symbols-outlined text-lg">lock_clock</span>}
          </button>
        </footer>
      )}
    </div>
    </div>
  );
};

export default VendorTimeline;
