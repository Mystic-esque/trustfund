import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const SimpleReceipt = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        if (!id) return;
        const { data, error } = await supabase
          .from('ledger_entries')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setEntry(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load receipt');
      } finally {
        setLoading(false);
      }
    };
    fetchEntry();
  }, [id]);

  const handleShare = async () => {
    const receiptSummary = `TrustFund Transaction\nType: ${entry?.entry_type}\nAmount: ₦${entry?.amount}`;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#d2bbff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center text-white">
        <p>Receipt not found.</p>
      </div>
    );
  }

  return (
    <div className="text-[#e5e2e1] min-h-screen flex flex-col items-center bg-[#131313] font-body-md antialiased overflow-x-hidden">
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
      `}</style>

      {/* Top App Bar */}
      <header className="w-full sticky top-0 z-50 bg-[#131313]/95 backdrop-blur-md border-b border-[#4a4455]/30 flex items-center justify-between px-5 h-16 max-w-[600px] mx-auto">
        <div className="flex items-center gap-2">
          <span className="font-headline-md text-[24px] text-[#d2bbff] font-bold tracking-tight">TrustFund</span>
        </div>
        <div 
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#353534] transition-colors cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-[#d2bbff]">close</span>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="w-full max-w-[600px] flex-1 px-5 pt-12 pb-32 flex flex-col items-center">
        
        {/* Success Animation & Header */}
        <div className="flex flex-col items-center text-center mb-10 relative">
          <div className="w-24 h-24 mb-6 relative">
            <div className="absolute inset-0 bg-[#4edea3]/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative w-full h-full bg-[#2a2a2a] rounded-full flex items-center justify-center shadow-[0_0_40px_-10px_rgba(78,222,163,0.3)] border border-[#4edea3]/30">
              <span className="material-symbols-outlined text-[48px] text-[#4edea3]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </div>
          
          <h1 className="font-headline-lg text-[32px] font-bold mb-2 text-[#e5e2e1]">Transfer Successful</h1>
          <p className="font-body-lg text-[18px] text-[#ccc3d8] max-w-[280px]">
            Your {entry.entry_type.replace('_', ' ').toLowerCase()} has been processed successfully.
          </p>
        </div>

        {/* Amount Section */}
        <div className="w-full text-center mb-10 py-6 bg-gradient-to-b from-[#1c1b1b] to-transparent rounded-xl relative z-10">
          <span className="font-label-lg text-[14px] text-[#d2bbff] uppercase tracking-widest block mb-2 font-bold">Total Amount</span>
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-headline-md text-[24px] text-[#e5e2e1] font-bold">₦</span>
            <span className="font-display-lg text-[40px] text-[#e5e2e1] tracking-tighter font-bold">
              {entry.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Details Card */}
        <div className="w-full bg-[#1a1a1a]/60 backdrop-blur-md border border-[#958da1]/10 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden z-10">
          {/* Subtle atmospheric detail */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#d2bbff]/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
          
          {/* Row: Transaction Type */}
          <div className="flex items-center justify-between py-1 relative z-10">
            <span className="font-label-lg text-[14px] text-[#ccc3d8] font-semibold">Transaction Type</span>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#d2bbff] text-[18px]">
                {entry.entry_type === 'TOP_UP' ? 'account_balance_wallet' : 'payments'}
              </span>
              <span className="font-label-lg text-[14px] text-[#e5e2e1] font-semibold capitalize">
                {entry.entry_type.replace('_', ' ').toLowerCase()}
              </span>
            </div>
          </div>
          
          <div className="h-px w-full bg-[#4a4455]/30"></div>
          
          {/* Row: Status */}
          <div className="flex items-center justify-between py-1 relative z-10">
            <span className="font-label-lg text-[14px] text-[#ccc3d8] font-semibold">Status</span>
            <div className="bg-[#4edea3]/10 border border-[#4edea3]/20 px-3 py-1 rounded-full">
              <span className="font-label-sm text-[12px] text-[#4edea3] uppercase font-bold">COMPLETED</span>
            </div>
          </div>
          
          <div className="h-px w-full bg-[#4a4455]/30"></div>
          
          {/* Row: Date & Time */}
          <div className="flex items-center justify-between py-1 relative z-10">
            <span className="font-label-lg text-[14px] text-[#ccc3d8] font-semibold">Date & Time</span>
            <span className="font-label-lg text-[14px] text-[#e5e2e1] font-semibold">
              {new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          
          <div className="h-px w-full bg-[#4a4455]/30"></div>
          
          {/* Row: Reference */}
          <div className="flex items-center justify-between py-1 relative z-10">
            <span className="font-label-lg text-[14px] text-[#ccc3d8] font-semibold">Reference</span>
            <div className="flex items-center gap-1">
              <span className="font-label-lg text-[14px] text-[#e5e2e1] font-mono font-bold uppercase">{entry.id.split('-')[0]}</span>
              <span 
                onClick={async () => {
                  await navigator.clipboard.writeText(entry.id.split('-')[0]);
                  toast.success('Reference copied');
                }}
                className="material-symbols-outlined text-[#958da1] text-[16px] cursor-pointer hover:text-[#d2bbff]"
              >
                content_copy
              </span>
            </div>
          </div>

          <div className="h-px w-full bg-[#4a4455]/30"></div>
          
          {/* Row: Source */}
          <div className="flex items-center justify-between py-1 relative z-10">
            <span className="font-label-lg text-[14px] text-[#ccc3d8] font-semibold">{entry.direction === 'credit' ? 'Source' : 'Destination'}</span>
            <span className="font-label-lg text-[14px] text-[#e5e2e1] text-right font-semibold">
              {entry.entry_type === 'TOP_UP' ? 'Nomba / Virtual Account' : 'Linked Bank Account'}
            </span>
          </div>

          <div className="h-px w-full bg-[#4a4455]/30"></div>
          
          {/* Row: Wallet Effect */}
          <div className="flex items-center justify-between py-1 relative z-10">
            <span className="font-label-lg text-[14px] text-[#ccc3d8] font-semibold">Wallet {entry.direction === 'credit' ? 'Credit' : 'Debit'}</span>
            <span className={`font-label-lg text-[14px] font-bold ${entry.direction === 'credit' ? 'text-[#4edea3]' : 'text-[#e5e2e1]'}`}>
              {entry.direction === 'credit' ? '+' : '-'}₦ {entry.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Decorative Illustration Placeholder */}
        <div className="w-full mt-10 rounded-xl overflow-hidden aspect-video relative group z-10">
          <img 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            alt="A sophisticated 3D abstract digital render of floating glass spheres and purple glowing light trails on a deep black background." 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBT_EmzBYACaGB_S5ookl3NqKScQfb5-eY0r5_aO-oKmyL2LbYq6eglDssPDV2uMg9FjqC6otMTsu8C-iYn9VWUh6sy259XZPFy_b4SFl4qRFbdbuayzahoRFYo8yANAyElhkVQ_XmInoa-9bEd3N0Sl6NlPwF6bT-FF4aIyK63oH1UZZ9Iz4STh7qDXyamjs5MpBHD7sIN0NBpUYbvwWmUVJbx806u2-ePIRwF8APvmx6qwHXBusy4RDVynjd0CoNOj-urD0jjGwe1"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-transparent"></div>
        </div>

      </main>

      {/* Floating Action Bar */}
      <div className="action-buttons fixed bottom-0 left-0 w-full bg-[#131313]/90 backdrop-blur-md border-t border-[#4a4455]/30 px-5 py-4 z-50">
        <div className="max-w-[600px] mx-auto flex gap-3">
          <button 
            onClick={handleShare}
            className="flex-1 h-12 bg-[#2a2a2a] text-[#e5e2e1] rounded-xl font-label-lg text-[14px] font-bold flex items-center justify-center space-x-2 active:scale-95 transition-all hover:bg-[#353534]"
          >
            <span className="material-symbols-outlined">share</span>
            <span>Share</span>
          </button>
          
          <button 
            onClick={() => window.print()}
            className="flex-1 h-12 bg-[#d2bbff] text-[#3f008e] rounded-xl font-label-lg text-[14px] font-bold flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-md shadow-[#d2bbff]/10 hover:brightness-110"
          >
            <span className="material-symbols-outlined">download</span>
            <span>Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleReceipt;
