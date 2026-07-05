import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export default function BuyerConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checklist, setChecklist] = useState({
    description: false,
    condition: false,
    authenticity: false,
  });

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*, vendor:users!orders_vendor_id_fkey(full_name, avatar_url)")
          .eq("id", id)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load deal");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleReleaseFunds = async () => {
    if (!checklist.description || !checklist.condition || !checklist.authenticity) {
      toast.error("Please complete the checklist to proceed");
      return;
    }
    if (!order) return;
    
    setIsSubmitting(true);
    try {
      // Call the unified settle-order edge function which handles auto-payout vs internal wallet
      const { data, error } = await supabase.functions.invoke('settle-order', {
        body: { orderId: order.id }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (error) throw error;

      toast.success("Funds released successfully!");
      navigate(`/orders/${order.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to release funds");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#101415] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ddb7ff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) return null;

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = checklist.description && checklist.condition && checklist.authenticity;

  return (
    <div className="bg-[#101415] text-[#e0e3e5] min-h-screen font-body-md overflow-x-hidden selection:bg-[#b76dff] selection:text-white">
      {/* Aurora Background */}
      <div 
        className="fixed inset-0 z-[-1]" 
        style={{
          background: 'radial-gradient(circle at 20% 30%, #2c0051 0%, transparent 40%), radial-gradient(circle at 80% 70%, #100563 0%, transparent 40%), linear-gradient(180deg, #0b0f10 0%, #101415 100%)'
        }}
      ></div>
      
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-[40px] bg-white/5 border-b border-white/5">
        <div className="flex justify-between items-center px-5 h-16 w-full max-w-[600px] mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="material-symbols-outlined text-[#cfc2d6] hover:bg-[#323537] transition-colors p-2 rounded-full active:scale-95 duration-100"
          >
            arrow_back
          </button>
          <h1 className="font-headline-md text-[24px] font-semibold text-[#e0e3e5]">Receipt</h1>
          <button className="material-symbols-outlined text-[#cfc2d6] hover:bg-[#323537] transition-colors p-2 rounded-full active:scale-95 duration-100">
            share
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[600px] mx-auto px-5 pt-24 pb-32 space-y-[32px] gap-8">
        {/* Transaction Header */}
        <section className="text-center space-y-4">
          <div className="mb-8 animate-[fadeInUp_0.7s_ease-out]">
            <div className="backdrop-blur-[40px] bg-[#101415]/5 rounded-[32px] p-6 flex flex-col items-center border border-white/10">
              <div className="w-full h-48 rounded-2xl overflow-hidden border border-white/10 bg-[#1d2022]">
                {order.item_image_url ? (
                  <img src={order.item_image_url} alt="Item" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#cfc2d6]">image</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-[#ddb7ff]/5 border border-white/10 backdrop-blur-md">
            <span className="text-[#ddb7ff] font-label-sm text-[12px] uppercase tracking-widest font-semibold">ESCROW LOCKED</span>
          </div>
          
          <div className="space-y-1">
            <h2 className="font-display-lg text-[40px] md:text-[64px] font-bold text-[#e0e3e5]">₦{Number(order.amount).toLocaleString()}</h2>
            <h2 className="font-headline-lg-mobile text-[32px] font-semibold text-[#e0e3e5] mt-2">{order.item_name}</h2>
          </div>
          
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-[#1d2022]">
              {order.vendor?.avatar_url ? (
                <img src={order.vendor.avatar_url} alt="Vendor" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-xs">person</span>
                </div>
              )}
            </div>
            <div className="text-left">
              <p className="font-label-sm text-[12px] text-[#e0e3e5] font-bold">{order.vendor?.full_name || 'Vendor'}</p>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px] text-[#ddb7ff]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="font-label-sm text-[10px] text-[#ddb7ff] uppercase tracking-tighter">Verified Merchant</span>
              </div>
            </div>
          </div>
        </section>

        {/* Proof of Delivery Checklist */}
        <section className="space-y-4">
          <h3 className="font-title-md text-[20px] font-medium text-[#e0e3e5] px-1">Confirmation Checklist</h3>
          <div className="space-y-2">
            {[
              { key: 'description', label: 'Item matches product description' },
              { key: 'condition', label: 'Condition is as stated in listing' },
              { key: 'authenticity', label: 'Authenticity verified by tags' },
            ].map((item) => {
              const isChecked = checklist[item.key as keyof typeof checklist];
              return (
                <div 
                  key={item.key}
                  onClick={() => toggleChecklist(item.key as keyof typeof checklist)}
                  className="backdrop-blur-[40px] border border-white/10 bg-white/5 p-6 rounded-2xl flex items-center gap-4 transition-all hover:bg-white/10 cursor-pointer active:scale-[0.98]"
                >
                  <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${isChecked ? 'bg-[#ddb7ff]/10 border-[#ddb7ff]/40' : 'border-[#4d4354]'}`}>
                    {isChecked && <span className="material-symbols-outlined text-[#ddb7ff] text-xl">check</span>}
                  </div>
                  <p className="font-body-md text-[16px] text-[#e0e3e5] flex-1">{item.label}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Legal Disclosure */}
        <section className="backdrop-blur-[40px] bg-white/5 border border-white/10 p-6 rounded-2xl space-y-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[#ddb7ff] mt-0.5">info</span>
            <p className="font-body-md text-[13px] leading-relaxed text-[#cfc2d6] opacity-80 italic">
              By clicking release funds, you acknowledge that you have received and inspected the item. This action is irreversible and funds will be immediately transferred to the merchant.
            </p>
          </div>
        </section>
      </main>

      {/* Bottom Action Area */}
      <footer className="fixed bottom-0 left-0 w-full z-50 backdrop-blur-[40px] bg-white/5 border-t border-white/5 pb-safe max-w-[600px] left-1/2 -translate-x-1/2">
        <div className="p-5">
          <button 
            onClick={handleReleaseFunds}
            disabled={!allChecked || isSubmitting}
            className="w-full bg-[#ddb7ff] text-[#490080] font-bold py-4 rounded-full text-lg transition-all active:scale-95 flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(221,183,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? 'Releasing...' : 'Release Funds'}</span>
            {!isSubmitting && <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lock_open</span>}
          </button>
        </div>
      </footer>
    </div>
  );
}
