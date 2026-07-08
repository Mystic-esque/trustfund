import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import './TopUp.css';

const TopUp = () => {
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    let subscription: any;

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('full_name, nomba_virtual_account_number, nomba_bank_name')
        .eq('id', user.id)
        .single();
        
      console.log('Fetched profile:', profile, 'Error:', error);
      if (profile) setUserData(profile);

      // Append a timestamp to make the channel name unique per-render for React Strict Mode
      const channel = supabase.channel(`user-updates-${user.id}-${Date.now()}`);
      subscription = channel
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
          (payload) => {
            setUserData((prev: any) => ({ ...prev, ...payload.new }));
          }
        )
        .subscribe();
    };
    fetchUser();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [navigate]);

  const accountNumber = userData?.nomba_virtual_account_number || "Pending...";
  const bankName = userData?.nomba_bank_name || "Provisioning...";
  const fullName = userData?.full_name || "Loading...";

  const handleCopy = () => {
    if (!userData?.nomba_virtual_account_number) return;
    navigator.clipboard.writeText(accountNumber.replace(/\s/g, '')).then(() => {
      setIsCopied(true);
      toast.success('Account number copied to clipboard', {
        style: {
          background: '#1d2022',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)'
        }
      });
      setTimeout(() => setIsCopied(false), 2000);
    });
  };


  return (
    <div className="min-h-screen font-body-md text-on-background relative">
      {/* Aetheric Background Elements */}
      <div className="aurora-bg"></div>
      <div className="aurora-glow glow-1"></div>
      <div className="aurora-glow glow-2"></div>
      
      <div className="max-w-[600px] mx-auto min-h-screen flex flex-col relative z-10 pb-[100px]">
        
        {/* Header */}
        <header className="w-full sticky top-0 z-50 flex items-center justify-between px-6 h-20">
          <button 
            onClick={() => navigate(-1)}
            className="w-11 h-11 flex items-center justify-center rounded-full glass-panel hover:bg-white/10 transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-primary text-xl">arrow_back</span>
          </button>
          <h1 className="text-lg font-medium tracking-tight text-on-surface">Virtual Account</h1>
          <button className="w-11 h-11 flex items-center justify-center rounded-full glass-panel hover:bg-white/10 transition-all">
            <span className="material-symbols-outlined text-primary text-xl">security</span>
          </button>
        </header>

        <main className="flex-1 px-6 pt-4">
          
          {/* Virtual Account Card */}
          <section className="mb-10">
            <div 
              className="glass-card-topup rounded-[40px] relative overflow-hidden group active:scale-[0.99] transition-all cursor-pointer p-8" 
              onClick={handleCopy}
            >
              {/* Inner Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
              
              {/* Card Header */}
              <div className="flex justify-between items-start mb-8">
                <div className="w-12 h-10 bg-white/5 rounded-lg relative overflow-hidden border border-white/10 flex items-center justify-center">
                  <div className="grid grid-cols-2 grid-rows-2 gap-1 w-6 h-6 opacity-30">
                    <div className="bg-white/40 rounded-sm"></div><div className="bg-white/40 rounded-sm"></div>
                    <div className="bg-white/40 rounded-sm"></div><div className="bg-white/40 rounded-sm"></div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold mb-1">Recipient Bank</p>
                  <h2 className="text-sm font-bold text-white tracking-wide">{bankName}</h2>
                </div>
              </div>
              
              {/* Card Number */}
              <div className="mb-8">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-2 font-bold">Account Identifier</p>
                <div className="flex items-center gap-4">
                  <span className="font-mono-custom text-3xl font-light text-white drop-shadow-[0_0_15px_rgba(210,187,255,0.2)] tracking-widest">
                    {accountNumber.match(/.{1,4}/g)?.join(' ') || accountNumber}
                  </span>
                  <span className={`material-symbols-outlined text-xl transition-colors ${isCopied ? 'text-primary' : 'text-primary/40 group-hover:text-primary'}`}>
                    {isCopied ? 'check_circle' : 'content_copy'}
                  </span>
                </div>
              </div>
              
              {/* Card Footer */}
              <div className="flex justify-between items-end relative z-10">
                <div className="text-left">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-white/40 font-semibold mb-1">Legal Name</p>
                  <p className="text-sm font-medium text-white/90 uppercase tracking-widest">{fullName}</p>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                  {!isCopied && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(221,183,255,0.6)]"></span>}
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    {isCopied ? 'Copied' : 'Tap to Copy'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Protocol Layer */}
          <section className="mb-10 space-y-6">
            <h3 className="text-[11px] tracking-[0.4em] text-center text-white/25 uppercase font-bold">Transfer Protocol</h3>
            <div className="space-y-4">
              <div className="glass-panel rounded-3xl p-6 flex items-center gap-5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[12px] text-primary font-bold shrink-0">01</div>
                <p className="text-sm font-light text-white/70 leading-snug">Copy account details and open your banking interface.</p>
              </div>
              <div className="glass-panel rounded-3xl p-6 flex items-center gap-5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[12px] text-primary font-bold shrink-0">02</div>
                <p className="text-sm font-light text-white/70 leading-snug">Initiate a standard transfer to the specified Nomba account.</p>
              </div>
              <div className="glass-panel rounded-3xl p-6 flex items-center gap-5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[12px] text-primary font-bold shrink-0">03</div>
                <p className="text-sm font-light text-white/70 leading-snug">Wallet liquidity synchronizes upon transaction confirmation.</p>
              </div>
            </div>
            
            <div className="mt-6 bg-error-container/10 border border-error-container/20 rounded-2xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">info</span>
              <div>
                <p className="text-sm font-bold text-white/90 mb-1">Deposit Fee Applies</p>
                <p className="text-xs text-white/70">A flat ₦10 processing fee is deducted from all virtual account deposits. For example, transferring ₦50 will credit ₦40 to your wallet.</p>
              </div>
            </div>
          </section>

          {/* Thresholds */}
          <section className="mb-10 space-y-5">
            <h3 className="text-[11px] tracking-[0.4em] text-center text-white/25 uppercase font-bold">Volume Thresholds</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-6 rounded-[28px] text-center border-white/5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2 font-bold">Daily</p>
                <p className="text-2xl font-light text-white tracking-tight">₦5M</p>
              </div>
              <div className="glass-panel p-6 rounded-[28px] text-center border-white/5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2 font-bold">Monthly</p>
                <p className="text-2xl font-light text-white tracking-tight">₦50M</p>
              </div>
            </div>
            <p className="text-center text-[11px] font-medium text-white/30 px-8">
              Tiered limits based on verification status. <Link to="/profile/verification" className="text-primary/60 hover:text-primary transition-colors underline underline-offset-8">Elevate Tier</Link>
            </p>
          </section>

        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default TopUp;
