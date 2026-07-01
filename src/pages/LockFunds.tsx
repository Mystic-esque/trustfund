import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './LockFunds.css';

const LockFunds = () => {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);

  // MOCK DATA: Change these to test both states
  const userBalance = 200000;
  // const dealPrice = 250000; // Insufficient
  const dealPrice = 154500; // Sufficient
  
  const isSufficient = userBalance >= dealPrice;

  const handleLock = () => {
    setIsSuccess(true);
    setTimeout(() => {
      navigate('/orders');
    }, 2500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Account number copied!', {
      style: {
        background: 'rgba(26, 26, 30, 0.9)',
        color: '#fff',
        border: '1px solid rgba(168, 85, 247, 0.3)',
      }
    });
  };

  if (!isSufficient) {
    // Insufficient Balance UI
    return (
      <div className="wallet-status-wrapper font-body-md pb-[100px]">
        <div className="ambient-bg-error"></div>
        <header className="fixed top-0 w-full z-50 bg-[#0b0b0d]/80 backdrop-blur-xl border-b border-white/10 max-w-[600px] left-1/2 -translate-x-1/2">
          <div className="flex items-center px-5 h-16">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="flex-1 text-center pr-10">
              <h1 className="font-headline-md text-lg font-bold text-white tracking-wide">Wallet Status</h1>
            </div>
          </div>
        </header>

        <main className="pt-24 px-5 max-w-[600px] mx-auto min-h-screen">
          <div className="text-center mb-10 mt-4">
            <div className="w-20 h-20 mx-auto bg-error-container/20 rounded-full flex items-center justify-center mb-6 border border-error-container/30 relative">
              <div className="absolute inset-0 border-2 border-error-container rounded-full opacity-50"></div>
              <span className="material-symbols-outlined text-error text-[36px] text-[#ffb4ab]">account_balance_wallet</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Insufficient Balance</h2>
            <p className="text-white/60 text-sm max-w-[280px] mx-auto">
              Your wallet balance is lower than the required amount to secure this deal.
            </p>
          </div>

          <section className="status-glass-error rounded-3xl p-6 mb-6">
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/10">
              <div>
                <span className="text-xs text-white/50 uppercase tracking-widest block mb-1">Available</span>
                <span className="font-title-md text-lg text-white font-medium">₦{userBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-white/50 uppercase tracking-widest block mb-1">Required</span>
                <span className="font-title-md text-lg text-error font-semibold text-[#ffb4ab]">₦{dealPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
            </div>
            
            <div className="bg-error-container/10 border border-error-container/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error text-[#ffb4ab]">warning</span>
                <span className="text-sm font-medium text-white/90">Shortfall</span>
              </div>
              <span className="font-title-md font-bold text-[#ffb4ab]">₦{(dealPrice - userBalance).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
          </section>

          <section className="status-glass rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-[0.2em] mb-5">Top Up Immediately via Transfer</h3>
            
            <div className="space-y-4 relative z-10">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">Bank Name</span>
                <span className="text-sm font-bold text-white tracking-wide">Providus Bank (TrustFund)</span>
              </div>
              
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">Account Number</span>
                <div className="flex justify-between items-center bg-[#060608] border border-white/10 rounded-xl p-3">
                  <span className="text-xl font-bold text-white tracking-widest font-title-md">990 123 4567</span>
                  <button 
                    onClick={() => handleCopy('9901234567')}
                    className="text-primary hover:text-primary-hover active:scale-95 transition-all p-2 rounded-lg bg-primary/10"
                  >
                    <span className="material-symbols-outlined text-[20px]">content_copy</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // Sufficient Balance UI
  return (
    <div className="min-h-screen font-['Hanken_Grotesk'] text-[#e0e3e5] bg-[#101415] flex flex-col relative overflow-x-hidden pb-40">
      <div className="fixed inset-0 z-[0] opacity-60 pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 30%, #2c0051 0%, transparent 40%), radial-gradient(circle at 80% 70%, #100563 0%, transparent 40%)', filter: 'blur(100px)' }}></div>
      
      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-[40px] border-b border-white/10 h-20 flex items-center px-5 md:px-16 justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="mr-2 active:scale-95 transition-transform"><span className="material-symbols-outlined text-[#e0e3e5]">arrow_back</span></button>
          <img src="/images/logo.svg" alt="TrustFund Logo" className="h-8 w-8 object-contain" />
          <span className="font-headline-lg-mobile md:font-headline-lg tracking-tighter text-[#ddb7ff] uppercase">TRUSTFUND</span>
        </div>
        <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center overflow-hidden">
          <img className="w-full h-full object-cover" alt="User" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCS8ms8_oPndj3guDoGP_XC-qV3_pXihFufsps-QkbryAlcug268fpu4CdE4NEKAMNfDQhJ8GT-L-6orF2u3Fb64YgxaKSAmcSZS1EscPqMe50oMYUZhDdgLHhD-PB_ZsCkPv7y7cNxHUWFejVLL78-XPUOMqWOLFN7SUyZ_ZLKz8Fflb851PJEAUpGEffwHxX7_Dt-Wqspsg5oVHutA3-CHXv2Pk8l_-QsT3Jv-LIyTEV4rYPkV3gUCv_HvPvEXwUs6XgVznbREC79" />
        </div>
      </header>

      <main className="flex-grow pt-32 pb-10 px-5 max-w-lg mx-auto w-full relative z-10">
        {/* Order Context Mini-Banner */}
        <div className="mb-8 rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top duration-700" style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
            <img className="w-full h-full object-cover" alt="Jacket" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwiqyZYWqec4TDRmsE7NPoER4oMSZq1gZKVPler3uo9VfCCf3w0WEulOgtaHipHTk_EP6NYBn-Rw9zXz5Pw6Sxs31BcRTBpbGcnhK_3yKJKmmZ_GHRL4f7GQ75e29pSx6xmlhSm2oC9VUSaBfuLlyMOufnU3gB28OD-pxp6zJfRRCXsQXlhcwc7Q2SHJrmkI6iFb0f-w8Zvz5B2ojw_AHrMRK8_aniCbRyJA3OhIbEJ7VugK79jonDCAV3DaVBJx5KTUdFppCXyno4" />
          </div>
          <div className="flex-grow">
            <p className="text-[12px] font-semibold text-[#cfc2d6] opacity-70 uppercase tracking-wider">Escrow Order</p>
            <h3 className="text-[20px] font-medium text-[#e0e3e5]">Vintage 90s Nike Jacket</h3>
            <p className="text-[16px] text-[#ddb7ff]">₦150,000</p>
          </div>
        </div>

        {/* Main Glass Card - Summary */}
        <div className="rounded-[32px] p-8 mb-8 relative overflow-hidden animate-in fade-in zoom-in duration-1000 delay-200" style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="text-center mb-8">
            <p className="text-[12px] font-semibold text-[#cfc2d6] uppercase tracking-[0.2em] mb-2">Escrow Total</p>
            <h1 className="text-[32px] md:text-[40px] font-semibold text-[#e0e3e5]">₦151,500</h1>
            <div className="flex items-center justify-center gap-2 mt-4 py-2 px-4 bg-[#ddb7ff]/10 border border-[#ddb7ff]/20 rounded-full w-fit mx-auto">
              <span className="material-symbols-outlined text-[#ddb7ff] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <span className="text-[12px] font-semibold text-[#ddb7ff] uppercase">Secured by Aetheric Protocol</span>
            </div>
          </div>
          <div className="space-y-4 border-t border-white/5 pt-8">
            <div className="flex justify-between items-center py-1">
              <span className="text-[16px] text-[#cfc2d6]">Purchase Price</span>
              <span className="text-[16px] text-[#e0e3e5]">₦150,000</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[16px] text-[#cfc2d6]">Service Fee (1.0%)</span>
              <span className="text-[16px] text-[#e0e3e5]">₦1,500</span>
            </div>
            <div className="pt-6 mt-6 border-t border-white/10 flex justify-between items-center">
              <span className="text-[20px] text-[#e0e3e5] font-bold uppercase tracking-tight">Total Commitment</span>
              <span className="text-[24px] text-[#ddb7ff] font-bold">₦151,500</span>
            </div>
          </div>
        </div>

        {/* Funds Destination Block */}
        <div className="rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-300 py-8" style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2 md:gap-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[12px] font-semibold text-[#cfc2d6] uppercase tracking-wider">Wallet Status</span>
            </div>
            <div className="flex flex-col justify-start md:justify-center">
              <p className="text-[20px] font-medium text-[#e0e3e5]">Available: ₦200,000</p>
              <p className="text-[12px] font-semibold text-emerald-400">Ready to lock ✓</p>
            </div>
          </div>
          <div className="space-y-2 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-[16px] text-[#cfc2d6] opacity-70">After locking, available balance</span>
              <span className="text-[16px] text-[#cfc2d6] opacity-70">₦48,500</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[16px] text-[#cfc2d6] opacity-70">Locked for this deal</span>
              <span className="text-[16px] text-[#e0e3e5]">₦151,500</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-400" style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h4 className="text-[12px] font-semibold text-[#cfc2d6] opacity-70 uppercase mb-4">Funds Destination</h4>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <span className="material-symbols-outlined text-[#cfc2d6]">storefront</span>
              </div>
              <div>
                <p className="text-[20px] font-medium text-[#e0e3e5]">Steve Vintage Co.</p>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[#ddb7ff] text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-[12px] font-semibold text-[#cfc2d6]">4.9/5.0 Trust Rating</span>
                </div>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Verified Merchant</span>
            </div>
          </div>
        </div>

        {/* Final Action Area */}
        <div className="fixed bottom-0 left-0 w-full p-5 bg-gradient-to-t from-[#101415] via-[#101415]/90 to-transparent pt-12 z-20">
          <div className="max-w-lg mx-auto text-center">
            <button 
              onClick={handleLock}
              className="w-full h-16 rounded-full bg-[#ddb7ff] text-[#490080] font-medium text-[20px] flex items-center justify-center gap-3 transition-all active:scale-95 hover:opacity-90"
              style={{ boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}
            >
              <span>Lock Funds Now</span>
              <span className="material-symbols-outlined">lock_open</span>
            </button>
            <p className="mt-4 text-[12px] font-semibold text-[#cfc2d6] opacity-60">
              By tapping, you authorize the transfer of funds into secure escrow.
            </p>
          </div>
        </div>
      </main>

      {/* Success Feedback Layer */}
      <div 
        className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${isSuccess ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(40px)' }}
      >
        <div className={`text-center p-12 transition-transform duration-500 ${isSuccess ? 'scale-100' : 'scale-95'}`}>
          <div className="w-24 h-24 rounded-full bg-[#ddb7ff]/20 border border-[#ddb7ff]/40 flex items-center justify-center mx-auto mb-6" style={{ boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}>
            <span className="material-symbols-outlined text-[#ddb7ff] text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
          <h2 className="text-[40px] font-semibold text-[#e0e3e5] mb-2">Funds Vaulted</h2>
          <p className="text-[18px] text-[#cfc2d6]">The Aetheric Protocol is now securing your transaction.</p>
        </div>
      </div>
    </div>
  );
};

export default LockFunds;
