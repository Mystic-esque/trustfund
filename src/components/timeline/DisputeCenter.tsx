import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface DisputeCenterProps {
  order: any;
  currentUser: any;
}

const DisputeCenter: React.FC<DisputeCenterProps> = ({ order, currentUser }) => {
  const navigate = useNavigate();
  const [systemMessages, setSystemMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchSystemMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('order_id', order.id)
          .eq('sender_type', 'system')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setSystemMessages(data || []);
      } catch (err) {
        console.error("Failed to load case activity:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemMessages();
  }, [order.id]);

  const handleCancelDispute = async () => {
    if (!window.confirm("Are you sure you want to withdraw this dispute?")) return;
    setCancelling(true);
    try {
      const { error } = await supabase.rpc('cancel_dispute', {
        p_order_id: order.id
      });
      if (error) throw error;
      
      // Navigate or reload to reflect the restored status
      window.location.reload();
    } catch (err: any) {
      console.error("Cancel failed:", err);
      alert(err.message || 'Failed to cancel dispute');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen w-full text-[#e5e2e1] bg-background font-body-md antialiased pb-32">
      {/* Top App Bar */}
      <header className="w-full top-0 sticky z-50 bg-background/80 backdrop-blur-md flex items-center justify-between px-5 h-16 border-b border-white/5 max-w-[600px] mx-auto">
        <button 
          onClick={() => navigate('/home')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors -ml-2"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-[20px] font-bold text-on-surface">Dispute Center</h1>
        <div className="w-10 h-10"></div> {/* Spacer for centering */}
      </header>

      <main className="max-w-[600px] mx-auto px-5 pt-6 space-y-6">
        
        {/* Status Banner */}
        <section className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-[#93000a] to-[#4a0005] text-[#ffdad6] shadow-lg">
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-lg tracking-widest bg-black/20 px-3 py-1 rounded-full border border-white/10 text-xs">CASE STATUS</span>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
            </div>
            <h2 className="font-display-lg text-[32px] leading-tight font-bold">UNDER REVIEW</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <p className="font-body-md opacity-90">Awaiting TrustFund Mediation</p>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        </section>

        {/* Details Card */}
        <section className="bg-[#201f1f]/60 backdrop-blur-md border border-[#4a4455]/30 rounded-xl p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-surface-container-high">
                <img 
                  className="w-full h-full object-cover" 
                  alt={order.item_name}
                  src={order.item_image_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAn5qFjUGn4Vig4jLu0qNzVtLARjasvu_JvDtt3MO5DHwfSM6GhTfGch3CzbHtP8nEwoRc9TEe9qxEsMCyx8s02g6e9kKBBlB3WZty7TZHJA8zA4Zkgmm_2uGw4NTd_AEdIfA5n072ieORhSzzoOFcUs5TPfsEBfYIKznCRnaiZEX3TdkTeQdfRzPROe9acL73qpsu7nTWRCOY246oISruRJ0x8mHfB-KtV9eRYBQnYhvAO7jN7CXCNs-zX5196UJ61qyfZHhdp1B8m"}
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <span className="font-label-sm text-primary mb-1 uppercase text-[10px]">#{order.reference_id}</span>
                </div>
                <h3 className="font-body-lg font-semibold text-white">{order.item_name}</h3>
                <p className="font-label-sm text-on-surface-variant mt-1">Transaction value: ₦{order.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Reason for Dispute */}
        {order.dispute_reason && (
          <section className="bg-[#201f1f]/60 backdrop-blur-md border border-[#4a4455]/30 rounded-xl p-5">
            <div>
              <label className="font-label-sm text-on-surface-variant block mb-1 uppercase tracking-wider text-[10px]">Reason for Dispute</label>
              <h3 className="font-body-md font-semibold text-white mb-1">{order.dispute_reason}</h3>
              <p className="font-body-md text-on-surface text-sm opacity-90">{order.dispute_description}</p>
            </div>
          </section>
        )}

        {/* Case Activity Timeline */}
        <section className="space-y-4">
          <h4 className="font-label-lg text-on-surface-variant uppercase tracking-wider px-1 text-xs">Case Activity</h4>
          <div className="bg-[#201f1f]/60 backdrop-blur-md border border-[#4a4455]/30 rounded-xl p-5 relative min-h-[150px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* Vertical Line */}
                <div className="absolute left-[39px] top-8 bottom-8 w-[2px] bg-white/10"></div>
                <div className="space-y-8 relative z-10">
                  {systemMessages.map((msg, idx) => {
                    const isLast = idx === systemMessages.length - 1;
                    return (
                      <div key={msg.id} className={`flex gap-6 relative z-10 ${isLast ? 'opacity-100' : 'opacity-60'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${isLast ? 'bg-[#93000a]/20 border-[#93000a] text-[#ffb4ab]' : 'bg-surface-container-high border-white/10 text-white'}`}>
                          <span className="material-symbols-outlined text-[20px]">{isLast ? 'warning' : 'check_circle'}</span>
                        </div>
                        <div>
                          <p className={`font-body-md font-bold ${isLast ? 'text-white' : 'text-on-surface'}`}>{msg.content}</p>
                          <p className="font-label-sm text-on-surface-variant mt-0.5">
                            {new Date(msg.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

      </main>

      {/* Bottom Action Area */}
      <footer className="fixed bottom-0 left-0 w-full z-50 p-5 bg-background/80 backdrop-blur-md border-t border-white/5">
        <div className="max-w-[600px] mx-auto flex flex-col gap-3">
          <button 
            onClick={() => navigate(`/orders/${order.id}/chat`)}
            className="w-full bg-white text-[#101415] font-bold py-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
          >
            <span>View Deal Chat</span>
            <span className="material-symbols-outlined text-lg">chat</span>
          </button>
          
          {currentUser?.id === order.buyer_id && (
            <button 
              onClick={handleCancelDispute}
              disabled={cancelling}
              className="w-full bg-transparent border border-[#ccc3d8]/30 text-[#ccc3d8] font-bold py-4 rounded-xl active:scale-[0.98] hover:bg-white/5 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {cancelling ? 'Withdrawing...' : 'Withdraw Dispute'}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default DisputeCenter;
