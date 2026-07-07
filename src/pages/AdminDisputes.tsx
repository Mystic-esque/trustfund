import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';

export default function AdminDisputes() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDisputes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      const adminEmails = ['mysticx404@gmail.com', 'admin@trustfund.com'];
      if (!adminEmails.includes(user.email || '')) {
        navigate('/home');
        return;
      }

      const { data, error } = await supabase
        .from('order_details_view')
        .select('*')
        .eq('status', 'DISPUTED')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDisputes(data);
      }
      setLoading(false);
    };

    fetchDisputes();
  }, [navigate]);

  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen flex flex-col font-body-md pb-[84px]">
      <header className="w-full sticky top-0 z-40 bg-[#131313]/80 backdrop-blur-xl border-b border-[#4a4455]/30 flex items-center px-5 h-16">
        <button 
          onClick={() => navigate('/home')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#353534] transition-colors active:scale-95 -ml-2 mr-2"
        >
          <span className="material-symbols-outlined text-[#ccc3d8]">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-xl font-bold text-[#e5e2e1]">Admin Panel</h1>
      </header>

      <main className="flex-1 px-5 py-6 flex flex-col max-w-[600px] mx-auto w-full gap-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-error">gavel</span>
          <h2 className="text-xl font-bold">Active Disputes</h2>
        </div>

        {loading ? (
          <div className="flex justify-center mt-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : disputes.length === 0 ? (
          <div className="bg-[#1c1b1b] rounded-2xl p-6 text-center border border-[#4a4455]/30 mt-4">
            <span className="material-symbols-outlined text-4xl text-[#ccc3d8]/50 mb-2">verified</span>
            <p className="text-[#ccc3d8]">No active disputes.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {disputes.map(dispute => (
              <div 
                key={dispute.id}
                onClick={() => navigate(`/orders/${dispute.id}/chat`)}
                className="bg-[#1c1b1b] rounded-2xl p-4 border border-[#4a4455]/30 cursor-pointer hover:border-primary transition-all active:scale-[0.98]"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{dispute.item_name}</h3>
                  <span className="bg-error/20 text-error px-2 py-0.5 rounded text-xs font-bold">DISPUTED</span>
                </div>
                <p className="text-sm text-[#ccc3d8] mb-2">
                  <span className="font-semibold">Reason:</span> {dispute.dispute_reason}
                </p>
                <div className="flex items-center justify-between text-xs text-[#ccc3d8]/70">
                  <span>Vendor: {dispute.vendor?.full_name}</span>
                  <span>Buyer: {dispute.buyer?.full_name}</span>
                </div>
                <div className="mt-3 text-primary text-sm font-bold flex items-center gap-1">
                  <span>Open Chat to Resolve</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
