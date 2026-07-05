import { useNavigate, useSearchParams } from 'react-router-dom';

export default function WithdrawSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') || '0';
  const ref = searchParams.get('ref') || 'N/A';

  return (
    <div className="bg-[#101415] text-[#e0e3e5] min-h-screen font-body-md overflow-x-hidden selection:bg-[#b76dff] selection:text-white pb-10 flex flex-col items-center justify-center">
      
      <main className="max-w-[600px] w-full mx-auto px-5 py-8 flex flex-col items-center flex-1 justify-center">
        
        <div className="w-24 h-24 rounded-full bg-[#005236]/20 border border-[#005236]/50 flex items-center justify-center mx-auto mb-6 relative">
          <div className="absolute inset-0 rounded-full border border-[#6ffbbe]/20 animate-ping" style={{ animationDuration: '3s' }}></div>
          <span className="material-symbols-outlined text-[48px] text-[#6ffbbe]">check_circle</span>
        </div>

        <h2 className="font-headline-md text-3xl font-bold text-white tracking-tight text-center mb-2">Withdrawal Initiated</h2>
        <p className="font-body-sm text-on-surface-variant/80 text-center max-w-[280px]">
          Your funds are on the way. It usually takes a few minutes to reflect in your bank account.
        </p>

        <div className="bg-surface-container-high/20 backdrop-blur-xl border border-white/5 rounded-3xl p-6 w-full mt-10 space-y-4">
          <div className="flex justify-between items-center py-2">
            <span className="font-body-md text-on-surface-variant/80">Amount</span>
            <span className="font-body-md font-bold text-white">₦{Number(amount).toLocaleString()}</span>
          </div>
          <div className="h-px w-full bg-white/5"></div>
          <div className="flex justify-between items-center py-2">
            <span className="font-body-md text-on-surface-variant/80">Reference</span>
            <span className="font-body-md font-bold text-white text-sm">{ref}</span>
          </div>
        </div>

      </main>

      <div className="w-full p-5 z-40 max-w-[600px] mx-auto mt-auto">
        <button 
          onClick={() => navigate('/profile')}
          className="w-full font-bold py-4 rounded-xl bg-white text-[#101415] hover:bg-white/90 active:scale-[0.98] transition-all"
        >
          Back to Wallet
        </button>
      </div>

    </div>
  );
}
