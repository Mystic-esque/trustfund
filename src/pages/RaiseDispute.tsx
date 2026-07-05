import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

const REASONS = [
  "Item not received",
  "Significant damage",
  "Wrong item",
  "Quality issue",
];

export default function RaiseDispute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REASONS[2]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!description.trim()) {
      toast.error("Please provide a detailed description");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Update order status
      const { error: updateError } = await supabase
        .from("orders")
        .update({ 
          status: "DISPUTED",
          dispute_reason: selectedReason,
          dispute_description: description
        })
        .eq("id", order.id);

      if (updateError) throw updateError;

      // Drop system messages
      await supabase.from("messages").insert([
        {
          order_id: order.id,
          sender_type: "system",
          content: "⚠️ A dispute has been raised. Funds are frozen until resolved.",
          message_type: "status_update"
        },
        {
          order_id: order.id,
          sender_type: "system",
          content: "👤 TrustFund Support has joined this chat. Please share evidence of the issue.",
          message_type: "status_update"
        }
      ]);

      toast.success("Dispute raised successfully");
      navigate(`/orders/${order.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to raise dispute");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen selection:bg-[#7c3aed] selection:text-white pb-32">
      <header className="w-full sticky top-0 z-50 bg-[#131313] border-b border-[#4a4455]">
        <div className="flex items-center justify-between px-5 h-16 max-w-[600px] mx-auto">
          <button 
            onClick={() => navigate(-1)}
            type="button"
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#2a2a2a] transition-colors active:scale-95 duration-150"
          >
            <span className="material-symbols-outlined text-[#e5e2e1]">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-[24px] font-semibold text-[#e5e2e1]">Raise Dispute</h1>
          <button type="button" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#2a2a2a] transition-colors active:scale-95 duration-150">
            <span className="material-symbols-outlined text-[#e5e2e1]">more_vert</span>
          </button>
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-5 pt-4">
        {/* Deal Context Card */}
        <section className="mb-8 animate-[fadeInUp_0.7s_ease-out]">
          <h2 className="font-label-sm text-[12px] font-medium text-[#ccc3d8] uppercase tracking-widest mb-3 px-1">Deal Context</h2>
          <div className="bg-[#201f1f] border border-[#4a4455] rounded-xl p-5 flex items-center gap-4 relative overflow-hidden group transition-all duration-300 hover:border-[#d2bbff]/50">
            <div className="absolute inset-0 bg-gradient-to-r from-[#d2bbff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#353534] shrink-0 border border-[#4a4455]">
              {order.item_image_url ? (
                <img src={order.item_image_url} alt="Item" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#ccc3d8]">image</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-label-lg text-[14px] font-semibold text-[#e5e2e1]">{order.item_name}</p>
              <p className="font-body-md text-[16px] text-[#ccc3d8]">ID: #{order.link_slug}</p>
            </div>
            <div className="text-right">
              <p className="font-headline-md text-[24px] font-semibold text-[#d2bbff]">₦{Number(order.amount).toLocaleString()}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-black uppercase tracking-tighter">Locked</span>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-8 animate-[fadeInUp_0.7s_ease-out_0.1s]">
          {/* Reason for Dispute */}
          <div className="space-y-4">
            <label className="font-label-sm text-[12px] font-medium text-[#ccc3d8] uppercase tracking-widest px-1">Reason for Dispute</label>
            <div className="grid grid-cols-2 gap-3">
              {REASONS.map((reason) => (
                <button 
                  key={reason}
                  type="button"
                  onClick={() => setSelectedReason(reason)}
                  className={`px-4 py-3 rounded-xl border text-[14px] font-semibold transition-all hover:bg-[#2a2a2a] text-left flex items-center justify-between group ${
                    selectedReason === reason 
                      ? 'active border-[#d2bbff] bg-[#6f00be]/20 text-[#d6a9ff]' 
                      : 'border-[#4a4455] bg-[#201f1f] text-[#ccc3d8]'
                  }`}
                >
                  <span>{reason}</span>
                  <span className={`material-symbols-outlined scale-75 ${selectedReason === reason ? 'opacity-100 text-[#4edea3]' : 'opacity-0'}`}>check_circle</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Description */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label htmlFor="description" className="font-label-sm text-[12px] font-medium text-[#ccc3d8] uppercase tracking-widest">Detailed Description</label>
              <span className="text-[10px] text-[#958da1]">{description.length} / 500</span>
            </div>
            <div className="relative">
              <textarea 
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                className="w-full bg-[#201f1f] border border-[#4a4455] rounded-xl p-4 font-body-md text-[16px] text-[#e5e2e1] focus:border-[#d2bbff] focus:ring-1 focus:ring-[#d2bbff] transition-all resize-none outline-none"
                placeholder="Describe the issue in detail to help our arbitrators resolve this quickly..." 
                rows={5}
              ></textarea>
            </div>
          </div>

          {/* Evidence Upload */}
          <div className="space-y-4">
            <label className="font-label-sm text-[12px] font-medium text-[#ccc3d8] uppercase tracking-widest px-1">Evidence Upload</label>
            <div className="flex gap-3 overflow-x-auto pb-2">
              <label className="w-24 h-24 shrink-0 rounded-xl border-2 border-dashed border-[#4a4455] flex flex-col items-center justify-center cursor-pointer hover:bg-[#2a2a2a] transition-colors hover:border-[#d2bbff] group">
                <span className="material-symbols-outlined text-[#958da1] group-hover:text-[#d2bbff] transition-colors">add_a_photo</span>
                <span className="text-[10px] font-bold text-[#958da1] mt-1 group-hover:text-[#d2bbff] uppercase tracking-tighter">Add Photo</span>
                <input type="file" accept="image/*" multiple className="hidden" />
              </label>
            </div>
            <p className="text-[10px] text-[#958da1] italic px-1">You can upload up to 5 clear images of the item and its packaging.</p>
          </div>
        </form>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-[600px] mx-auto px-5 pb-8 pt-4 pointer-events-auto">
          <div className="bg-[#131313]/80 backdrop-blur-xl border border-[#4a4455]/30 rounded-2xl p-2 shadow-2xl">
            <button 
              onClick={handleSubmit}
              type="button"
              disabled={isSubmitting}
              className="w-full bg-[#7c3aed] text-white h-14 rounded-xl font-headline-md text-[24px] font-semibold flex items-center justify-center gap-2 hover:bg-[#6f00be] transition-all active:scale-95 duration-150 shadow-[0_8px_32px_rgba(124,58,237,0.3)] disabled:opacity-50"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
              {isSubmitting ? 'Submitting...' : 'Raise Dispute'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Security Overlay Hint */}
      <div className="fixed top-24 -right-12 rotate-90 pointer-events-none opacity-10 select-none">
        <p className="font-display-lg text-[40px] font-bold tracking-[1rem] uppercase">SECURE ESCROW</p>
      </div>
    </div>
  );
}
