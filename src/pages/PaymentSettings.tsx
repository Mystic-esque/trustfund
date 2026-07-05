import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function PaymentSettings() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

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
    } catch (err) {
      console.error(err);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutoPayout = async () => {
    if (!userData?.bank_account_number) return;
    
    setIsUpdating(true);
    const newValue = !userData.auto_payout_enabled;
    try {
      const { error } = await supabase
        .from('users')
        .update({ auto_payout_enabled: newValue })
        .eq('id', userData.id);

      if (error) throw error;
      setUserData({ ...userData, auto_payout_enabled: newValue });
      toast.success(newValue ? 'Auto-payout enabled' : 'Auto-payout disabled');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update preference');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#101415] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ddb7ff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const hasBank = !!userData?.bank_account_number;

  return (
    <div className="bg-[#101415] text-[#e0e3e5] min-h-screen font-body-md overflow-x-hidden selection:bg-[#b76dff] selection:text-white pb-10">
      
      {/* Top App Bar */}
      <header className="sticky top-0 w-full z-50 backdrop-blur-[40px] bg-[#101415]/80 border-b border-white/5">
        <div className="flex items-center px-5 h-16 w-full max-w-[600px] mx-auto gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="material-symbols-outlined text-[#cfc2d6] hover:bg-[#323537] transition-colors p-2 rounded-full active:scale-95 duration-100 -ml-2"
          >
            arrow_back
          </button>
          <h1 className="font-headline-sm text-lg font-bold">Payment Settings</h1>
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-5 py-6 space-y-8">
        
        {/* Auto Payout Section */}
        <section className="space-y-4">
          <h3 className="font-label-lg font-bold text-on-surface-variant/60 uppercase tracking-widest text-[11px] px-1">Payout Preferences</h3>
          
          <div className="bg-surface-container-high/20 backdrop-blur-xl border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
                  <h4 className="font-body-lg font-bold text-white">Auto-payout to bank</h4>
                </div>
                <p className="font-body-sm text-on-surface-variant/80 text-[13px] leading-relaxed">
                  When enabled, settled funds are automatically sent to your linked bank account. Turn off to collect funds manually.
                </p>
              </div>
              
              {/* Toggle switch */}
              <button 
                onClick={toggleAutoPayout}
                disabled={!hasBank || isUpdating}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 mt-1 ${
                  userData?.auto_payout_enabled && hasBank ? 'bg-primary' : 'bg-surface-container-highest border border-white/10'
                } ${(!hasBank || isUpdating) && 'opacity-50 cursor-not-allowed'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                  userData?.auto_payout_enabled && hasBank ? 'translate-x-6' : 'translate-x-0'
                }`}></div>
              </button>
            </div>

            {!hasBank && (
              <div className="pt-3 border-t border-white/5 mt-2">
                <p className="font-body-sm text-error/80 text-[13px] mb-3">
                  Link a bank account to enable automatic payouts
                </p>
                <Link to="/bank-setup" className="inline-flex items-center justify-center py-2 px-4 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors">
                  Add Bank Account
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Security Section */}
        <section className="space-y-4">
          <h3 className="font-label-lg font-bold text-on-surface-variant/60 uppercase tracking-widest text-[11px] px-1">Security</h3>
          
          <div className="bg-surface-container-high/20 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
            <Link to="/settings/pin-setup" className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined">pin</span>
                </div>
                <div>
                  <h4 className="font-body-md font-bold text-white">
                    {userData?.payment_pin ? 'Change Payment PIN' : 'Set up Payment PIN'}
                  </h4>
                  <p className="font-body-sm text-on-surface-variant/80 text-[12px] mt-0.5">
                    Required for manual withdrawals
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:translate-x-1 transition-transform">chevron_right</span>
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
