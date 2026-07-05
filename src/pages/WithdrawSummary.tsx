import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function WithdrawSummary() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount');
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!amount) {
      navigate('/withdraw/amount');
      return;
    }
    fetchUserData();
  }, [amount, navigate]);

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

      if (!data.payment_pin) {
        navigate(`/settings/pin-setup?redirect=withdraw&amount=${amount}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    navigate(`/withdraw/pin?amount=${amount}`);
  };

  if (isLoading || !userData) {
    return (
      <div className="min-h-screen bg-[#101415] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ddb7ff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const numericAmount = Number(amount);
  const fee: number = 0; // Assuming free withdrawals for now

  return (
    <div className="bg-[#101415] text-[#e0e3e5] min-h-screen font-body-md overflow-x-hidden selection:bg-[#b76dff] selection:text-white pb-10">
      
      <header className="sticky top-0 w-full z-50 backdrop-blur-[40px] bg-[#101415]/80 border-b border-white/5">
        <div className="flex items-center px-5 h-16 w-full max-w-[600px] mx-auto gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="material-symbols-outlined text-[#cfc2d6] hover:bg-[#323537] transition-colors p-2 rounded-full active:scale-95 duration-100 -ml-2"
          >
            arrow_back
          </button>
          <h1 className="font-headline-sm text-lg font-bold">Transaction Summary</h1>
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-5 py-8 space-y-6">
        
        <div className="bg-surface-container-high/20 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col items-center gap-2">
          <p className="font-label-lg font-bold text-on-surface-variant/60 uppercase tracking-widest text-[11px]">Withdrawal Amount</p>
          <h2 className="font-headline-lg text-4xl font-bold text-white tracking-tight">₦{numericAmount.toLocaleString()}</h2>
        </div>

        <div className="bg-surface-container-high/20 backdrop-blur-xl border border-white/5 rounded-3xl p-5 space-y-4">
          
          <div className="flex justify-between items-center py-2">
            <span className="font-body-md text-on-surface-variant/80">Recipient Bank</span>
            <div className="text-right">
              <p className="font-body-md font-bold text-white">{userData.bank_name}</p>
              <p className="font-label-sm text-on-surface-variant/60">{userData.bank_account_number}</p>
            </div>
          </div>
          <div className="h-px w-full bg-white/5"></div>
          
          <div className="flex justify-between items-center py-2">
            <span className="font-body-md text-on-surface-variant/80">Account Name</span>
            <span className="font-body-md font-bold text-white">{userData.bank_account_name}</span>
          </div>
          <div className="h-px w-full bg-white/5"></div>

          <div className="flex justify-between items-center py-2">
            <span className="font-body-md text-on-surface-variant/80">Fee</span>
            <span className="font-body-md font-bold text-primary">{fee === 0 ? 'Free' : `₦${fee.toLocaleString()}`}</span>
          </div>

        </div>

      </main>

      <div className="fixed bottom-0 left-0 w-full p-5 bg-[#101415]/90 backdrop-blur-xl border-t border-white/5 z-40">
        <div className="max-w-[600px] mx-auto">
          <button 
            onClick={handleContinue}
            className="w-full font-bold py-4 rounded-xl bg-white text-[#101415] hover:bg-white/90 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
          >
            Confirm & Proceed
          </button>
        </div>
      </div>

    </div>
  );
}
