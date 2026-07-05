import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function WithdrawAmount() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      setUserData(data);

      if (!data.bank_account_number) {
        navigate('/bank-setup?redirect=withdraw');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    const numAmount = Number(amount.replace(/,/g, ''));
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (numAmount > Number(userData?.available_balance)) {
      toast.error('Insufficient available balance');
      return;
    }

    if (!userData?.payment_pin) {
      navigate(`/settings/pin-setup?redirect=withdraw&amount=${numAmount}`);
      return;
    }

    navigate(`/withdraw/summary?amount=${numAmount}`);
  };

  if (isLoading || !userData) {
    return (
      <div className="min-h-screen bg-[#101415] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ddb7ff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#101415] text-[#e0e3e5] min-h-screen font-body-md overflow-x-hidden selection:bg-[#b76dff] selection:text-white pb-10">
      
      <header className="sticky top-0 w-full z-50 backdrop-blur-[40px] bg-[#101415]/80 border-b border-white/5">
        <div className="flex items-center px-5 h-16 w-full max-w-[600px] mx-auto gap-4">
          <button 
            onClick={() => navigate('/profile')}
            className="material-symbols-outlined text-[#cfc2d6] hover:bg-[#323537] transition-colors p-2 rounded-full active:scale-95 duration-100 -ml-2"
          >
            arrow_back
          </button>
          <h1 className="font-headline-sm text-lg font-bold">Withdraw Funds</h1>
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-5 py-8 flex flex-col items-center">
        
        <p className="font-label-lg font-bold text-on-surface-variant/60 uppercase tracking-widest text-[11px] mb-4">Enter Amount</p>
        
        <div className="flex items-baseline gap-1 mb-8">
          <span className="font-headline-md text-2xl text-on-surface-variant/60">₦</span>
          <input 
            type="text"
            inputMode="numeric"
            autoFocus
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              if (val) {
                setAmount(Number(val).toLocaleString());
              } else {
                setAmount('');
              }
            }}
            className="bg-transparent border-none text-5xl font-bold text-white text-center w-full max-w-[250px] focus:outline-none focus:ring-0 placeholder:text-on-surface-variant/20"
          />
        </div>

        <div className="px-4 py-2 rounded-full bg-surface-container-high/50 border border-white/5 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[16px]">account_balance_wallet</span>
          <span className="font-body-sm text-on-surface-variant/80">Available: </span>
          <span className="font-body-md font-bold text-white">₦{Number(userData.available_balance || 0).toLocaleString()}</span>
        </div>

        <div className="w-full mt-12 p-4 rounded-2xl bg-surface-container-high/30 border border-white/5 flex items-center gap-4 text-left cursor-pointer hover:bg-surface-container-high/50 transition-colors" onClick={() => navigate('/bank-setup?redirect=withdraw')}>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary">account_balance</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-label-sm text-on-surface-variant/60 uppercase tracking-widest text-[10px] mb-0.5">Transfer To</p>
            <p className="font-body-md font-bold text-white truncate">{userData.bank_account_name}</p>
            <p className="font-body-sm text-on-surface-variant/80 text-xs mt-0.5">{userData.bank_name} • {userData.bank_account_number}</p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant/40">chevron_right</span>
        </div>

      </main>

      <div className="fixed bottom-0 left-0 w-full p-5 bg-[#101415]/90 backdrop-blur-xl border-t border-white/5 z-40">
        <div className="max-w-[600px] mx-auto">
          <button 
            onClick={handleContinue}
            disabled={!amount || Number(amount.replace(/,/g, '')) <= 0}
            className="w-full font-bold py-4 rounded-xl bg-white text-[#101415] hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>

    </div>
  );
}
