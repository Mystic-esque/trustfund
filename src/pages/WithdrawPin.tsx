import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function WithdrawPin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount');
  
  const [pin, setPin] = useState(['', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInput = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newArr = [...pin];
    newArr[index] = value.replace(/[^0-9]/g, '');
    
    setPin(newArr);
    
    if (value !== '' && index < 3) {
      document.getElementById(`pin-${index + 1}`)?.focus();
    } else if (value !== '' && index === 3) {
      executeWithdrawal(newArr.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      document.getElementById(`pin-${index - 1}`)?.focus();
    }
  };

  const executeWithdrawal = async (finalPin: string) => {
    if (!amount) return;
    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('manual-withdraw', {
        body: { amount: Number(amount), pin: finalPin },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Success
      navigate(`/withdraw/success?amount=${amount}&ref=${data.reference}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Withdrawal failed');
      setPin(['', '', '', '']);
      document.getElementById('pin-0')?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#101415] text-[#e0e3e5] min-h-screen font-body-md overflow-x-hidden selection:bg-[#b76dff] selection:text-white pb-10">
      
      <header className="sticky top-0 w-full z-50 backdrop-blur-[40px] bg-[#101415]/80 border-b border-white/5">
        <div className="flex items-center px-5 h-16 w-full max-w-[600px] mx-auto gap-4">
          <button 
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="material-symbols-outlined text-[#cfc2d6] hover:bg-[#323537] transition-colors p-2 rounded-full active:scale-95 duration-100 -ml-2 disabled:opacity-50"
          >
            arrow_back
          </button>
          <h1 className="font-headline-sm text-lg font-bold">Security PIN</h1>
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-5 py-8 space-y-8 flex flex-col items-center mt-8">
        
        <div className="text-center space-y-2">
          <h2 className="font-headline-md text-2xl font-bold text-white tracking-tight">Enter Payment PIN</h2>
          <p className="font-body-sm text-on-surface-variant/80 max-w-[250px] mx-auto">
            Authorize withdrawal of ₦{Number(amount).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-4 justify-center mt-8 relative">
          {pin.map((digit, idx) => (
            <input
              key={idx}
              id={`pin-${idx}`}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={digit}
              disabled={isSubmitting}
              onChange={(e) => handleInput(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-14 h-14 rounded-2xl bg-surface-container-highest border border-white/10 text-center text-2xl text-white font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
            />
          ))}
          
          {isSubmitting && (
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-primary font-bold animate-pulse">Processing...</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
