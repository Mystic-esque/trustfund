import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function PinSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const amount = searchParams.get('amount'); // Optional, to preserve context
  
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInput = (index: number, value: string, isConfirm: boolean) => {
    if (value.length > 1) return; // Prevent multiple chars
    
    const newArr = isConfirm ? [...confirmPin] : [...pin];
    newArr[index] = value.replace(/[^0-9]/g, ''); // Only numbers
    
    if (isConfirm) {
      setConfirmPin(newArr);
      if (value !== '' && index < 3) {
        document.getElementById(`confirm-pin-${index + 1}`)?.focus();
      }
    } else {
      setPin(newArr);
      if (value !== '' && index < 3) {
        document.getElementById(`pin-${index + 1}`)?.focus();
      } else if (value !== '' && index === 3) {
        // Automatically go to confirm step
        setTimeout(() => {
          setStep('confirm');
          setTimeout(() => document.getElementById('confirm-pin-0')?.focus(), 50);
        }, 300);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm: boolean) => {
    if (e.key === 'Backspace' && !isConfirm && pin[index] === '' && index > 0) {
      document.getElementById(`pin-${index - 1}`)?.focus();
    } else if (e.key === 'Backspace' && isConfirm && confirmPin[index] === '' && index > 0) {
      document.getElementById(`confirm-pin-${index - 1}`)?.focus();
    }
  };

  const handleSave = async () => {
    const finalPin = pin.join('');
    const finalConfirm = confirmPin.join('');
    
    if (finalPin.length < 4 || finalConfirm.length < 4) return;

    if (finalPin !== finalConfirm) {
      toast.error('PINs do not match');
      setConfirmPin(['', '', '', '']);
      document.getElementById('confirm-pin-0')?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('set-payment-pin', {
        body: { pin: finalPin },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Payment PIN set successfully!');
      
      if (redirect === 'withdraw') {
        navigate(`/withdraw/summary?amount=${amount}`); // Redirect to withdraw summary with amount
      } else if (redirect === 'lock') {
        const orderId = searchParams.get('orderId');
        navigate(`/orders/${orderId}/lock`);
      } else if (redirect === 'bank-setup') {
        navigate('/bank-setup');
      } else {
        navigate(-1);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to set PIN');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#101415] text-[#e0e3e5] min-h-screen font-body-md overflow-x-hidden selection:bg-[#b76dff] selection:text-white pb-10">
      
      <header className="sticky top-0 w-full z-50 backdrop-blur-[40px] bg-[#101415]/80 border-b border-white/5">
        <div className="flex items-center px-5 h-16 w-full max-w-[600px] mx-auto gap-4">
          <button 
            onClick={() => {
              if (step === 'confirm') {
                setStep('create');
                setConfirmPin(['', '', '', '']);
              } else {
                navigate(-1);
              }
            }}
            className="material-symbols-outlined text-[#cfc2d6] hover:bg-[#323537] transition-colors p-2 rounded-full active:scale-95 duration-100 -ml-2"
          >
            arrow_back
          </button>
          <h1 className="font-headline-sm text-lg font-bold">Security</h1>
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-5 py-8 space-y-8 flex flex-col items-center">
        
        <div className="text-center space-y-2 mt-4">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-[32px] text-primary">dialpad</span>
          </div>
          <h2 className="font-headline-md text-2xl font-bold text-white tracking-tight">
            {step === 'create' ? 'Create Payment PIN' : 'Confirm Payment PIN'}
          </h2>
          <p className="font-body-sm text-on-surface-variant/80 max-w-[250px] mx-auto">
            {step === 'create' ? 'Enter a 4-digit PIN to authorize your withdrawals securely.' : 'Please re-enter your PIN to confirm.'}
          </p>
        </div>

        <div className="flex gap-4 justify-center mt-8">
          {(step === 'create' ? pin : confirmPin).map((digit, idx) => (
            <input
              key={idx}
              id={step === 'create' ? `pin-${idx}` : `confirm-pin-${idx}`}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={digit}
              onChange={(e) => handleInput(idx, e.target.value, step === 'confirm')}
              onKeyDown={(e) => handleKeyDown(idx, e, step === 'confirm')}
              className="w-14 h-14 rounded-2xl bg-surface-container-highest border border-white/10 text-center text-2xl text-white font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          ))}
        </div>

      </main>

      {step === 'confirm' && confirmPin.join('').length === 4 && (
        <div className="fixed bottom-0 left-0 w-full p-5 bg-[#101415]/90 backdrop-blur-xl border-t border-white/5 z-40">
          <div className="max-w-[600px] mx-auto">
            <button 
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full font-bold py-4 rounded-xl bg-gradient-to-r from-primary to-[#b76dff] text-white hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Set PIN'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
