import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const EscrowReceipt = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLock = searchParams.get('type') === 'lock';
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!id) return;
        const { data, error } = await supabase
          .from('order_details_view')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load receipt');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleShare = async () => {
    const typeLabel = isLock ? 'Escrow Lock' : 'Escrow Release';
    const amountVal = isLock ? order?.amount : order?.net_payout;
    const receiptSummary = `TrustFund ${typeLabel} Receipt\nDeal: ${order?.item_name}\nAmount: ₦${amountVal}\nRef: ${order?.reference_id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TrustFund Receipt',
          text: receiptSummary,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      // Fallback
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Receipt link copied!');
    }
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#d2bbff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center text-white">
        <p>Receipt not found.</p>
      </div>
    );
  }

  return (
    <div className="text-[#e5e2e1] min-h-screen flex flex-col items-center bg-[#131313] font-body-md antialiased pb-40">
      <style>{`
        @media print {
          @page { margin: 0; }
          body { 
            background: #131313 !important; 
            -webkit-print-color-adjust: exact;
          }
          header, .action-buttons { display: none !important; }
          main { margin-top: 0 !important; padding-top: 2rem !important; }
        }
        .watermark {
          position: absolute;
          font-size: 80px;
          font-weight: 800;
          color: rgba(124, 58, 237, 0.04);
          transform: rotate(-30deg);
          pointer-events: none;
          user-select: none;
          z-index: 0;
          white-space: nowrap;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
        }
      `}</style>

      {/* Top AppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#131313]/95 backdrop-blur-md border-b border-[#4a4455]">
        <div className="flex justify-between items-center px-5 h-16 w-full max-w-[600px] mx-auto">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#353534] transition-colors active:scale-95 duration-100">
            <span className="material-symbols-outlined text-[#d2bbff]">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-[24px] font-semibold text-[#e5e2e1]">Receipt</h1>
          <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#353534] transition-colors active:scale-95 duration-100">
            <span className="material-symbols-outlined text-[#d2bbff]">share</span>
          </button>
        </div>
      </header>

      <main className="mt-16 w-full max-w-[600px] px-5 flex flex-col items-center py-8 relative">
        <div className="watermark">TRUSTFUND</div>

        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-10 space-y-4 relative z-10">
          <div className="w-20 h-20 rounded-full bg-[#4edea3]/10 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(78,222,163,0.3)]">
            <span className="material-symbols-outlined text-[48px] text-[#4edea3]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
              <p className="font-label-lg text-[14px] text-[#4edea3] uppercase tracking-widest font-bold">Success</p>
            </div>
            <h2 className="font-display-lg text-[40px] font-bold text-[#e5e2e1]">₦ {(isLock ? order.amount : order.net_payout)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>

        {/* Central Transaction Card */}
        <div className="w-full bg-[#1a1a1a]/60 backdrop-blur-md border border-[#958da1]/10 rounded-xl overflow-hidden relative z-10">
          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#7c3aed]/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="p-5 space-y-6 relative z-10">
            {/* Transaction Info Row */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="font-label-sm text-[12px] text-[#ccc3d8]">Transaction Type</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#6f00be] text-[#d6a9ff] font-label-lg text-[14px] font-bold">
                  {isLock ? 'Escrow Lock' : 'Escrow Release'}
                </span>
              </div>
              <div className="text-right space-y-1">
                <p className="font-label-sm text-[12px] text-[#ccc3d8]">Reference ID</p>
                <span className="font-label-lg text-[14px] text-[#d2bbff] font-mono font-bold uppercase">{order.reference_id}</span>
              </div>
            </div>
            
            <div className="h-px bg-[#4a4455]/30 w-full"></div>
            
            {/* General Details */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center">
                <span className="font-body-md text-[#ccc3d8]">Item</span>
                <span className="font-label-lg text-[14px] text-[#e5e2e1] font-semibold">{order.item_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body-md text-[#ccc3d8]">Date & Time</span>
                <span className="font-label-lg text-[14px] text-[#e5e2e1] font-semibold">
                  {new Date(order.settled_at || order.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Parties Section */}
            <div className="pt-2">
              <p className="font-label-sm text-[12px] text-[#ccc3d8] mb-3 uppercase tracking-wider opacity-60 font-semibold">Parties</p>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-body-md text-[#ccc3d8]">Buyer</span>
                  <span className="font-label-lg text-[14px] text-[#e5e2e1] font-semibold">{order.buyer?.full_name || 'Buyer'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-body-md text-[#ccc3d8]">Seller</span>
                  <span className="font-label-lg text-[14px] text-[#e5e2e1] font-semibold">{order.vendor?.full_name || 'Vendor'}</span>
                </div>
                {order.vendor?.bank_name && (
                  <div className="flex justify-between items-center">
                    <span className="font-body-md text-[#ccc3d8]">Seller Bank</span>
                    <span className="font-label-lg text-[14px] text-[#e5e2e1] font-semibold">
                      {order.vendor.bank_name} ···· {order.vendor.bank_account_number?.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-[#4a4455]/30 w-full"></div>

            {/* Amount Details Section */}
            <div className="pt-2 bg-[#1c1b1b]/30 -mx-5 px-5 py-4">
              <p className="font-label-sm text-[12px] text-[#ccc3d8] mb-4 uppercase tracking-wider opacity-60 font-semibold">Amount Details</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-body-md text-[#ccc3d8]">Deal Amount</span>
                  <span className="font-label-lg text-[14px] text-[#e5e2e1] font-semibold">₦ {order.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {!isLock && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="font-body-md text-[#ccc3d8] flex items-center gap-2">
                        Platform Fee <span className="text-[10px] bg-[#353534] px-1 rounded text-[#e5e2e1]">1.5%</span>
                      </span>
                      <span className="font-label-lg text-[14px] text-[#ccc3d8] font-semibold">- ₦ {order.platform_fee?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-body-md text-[#ccc3d8]">Transfer Fee</span>
                      <span className="font-label-lg text-[14px] text-[#ccc3d8] font-semibold">- ₦ 20.00</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-[#4a4455]/20">
                  <span className="font-label-lg text-[14px] text-[#e5e2e1] font-bold">{isLock ? 'Amount Locked' : 'Amount Transferred'}</span>
                  <span className="font-headline-md text-[24px] text-[#d2bbff] font-bold">₦ {(isLock ? order.amount : (order.net_payout - 20))?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Footer of card */}
            <div className="pt-4 border-t border-dashed border-[#4a4455]/50">
              <div className="flex items-center space-x-3 text-[#ccc3d8]">
                <span className="material-symbols-outlined text-[#4edea3]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                <p className="font-label-sm text-[12px] font-medium">Secured by TrustFund Smart Escrow</p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 flex items-center justify-center space-x-2 text-[#ccc3d8]/60 pb-10">
          <span className="material-symbols-outlined text-sm">help_outline</span>
          <p className="font-label-sm text-[12px] font-medium">Need help? Contact TrustFund Support</p>
        </div>
      </main>

      {/* Footer Action Buttons */}
      <div className="action-buttons fixed bottom-0 left-0 w-full bg-[#131313]/80 backdrop-blur-xl border-t border-[#4a4455]/30 p-5 z-50">
        <div className="max-w-[600px] mx-auto flex flex-col space-y-3">
          <button 
            onClick={handleDownload}
            className="w-full h-14 bg-[#7c3aed] text-[#ede0ff] rounded-xl font-label-lg text-[14px] font-bold flex items-center justify-center space-x-2 active:scale-[0.98] transition-all hover:brightness-110 shadow-[0_4px_14px_rgba(124,58,237,0.2)]"
          >
            <span className="material-symbols-outlined">picture_as_pdf</span>
            <span>Download Receipt PDF</span>
          </button>
          <button 
            onClick={handleShare}
            className="w-full h-14 border border-[#4a4455] text-[#e5e2e1] rounded-xl font-label-lg text-[14px] font-semibold flex items-center justify-center space-x-2 active:scale-[0.98] transition-all hover:bg-[#353534]"
          >
            <span className="material-symbols-outlined">share</span>
            <span>Share Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EscrowReceipt;
