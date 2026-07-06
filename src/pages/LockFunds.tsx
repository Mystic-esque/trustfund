import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import './LockFunds.css';

const LockFunds = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocking, setIsLocking] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  
  const [order, setOrder] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchContext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate(`/signin?redirect=/orders/${id}/lock`);
        return;
      }

      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (profile) setUserData(profile);

      if (id) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('*, vendor:users!orders_vendor_id_fkey(full_name, completed_deals_count)')
          .eq('id', id)
          .single();
        if (orderData) {
          setOrder(orderData);
          
          if (orderData.status === 'PENDING_PAYMENT' && (!orderData.buyer_id || orderData.buyer_id === user.id)) {
            const pendingDeals = JSON.parse(localStorage.getItem('pending_deals') || '[]');
            const existing = pendingDeals.findIndex((d: any) => d.id === id);
            if (existing >= 0) pendingDeals.splice(existing, 1);
            pendingDeals.unshift({ id, item_name: orderData.item_name, amount: orderData.amount, timestamp: Date.now() });
            localStorage.setItem('pending_deals', JSON.stringify(pendingDeals.slice(0, 10)));
          }
        }
      }

      setIsLoading(false);
    };

    fetchContext();

    // Subscribe to realtime balance updates
    let subscription: any = null;
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        subscription = supabase.channel(`lock_funds_${user.id}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
            (payload) => {
              if (payload.new) {
                setUserData(payload.new);
              }
            }
          )
          .subscribe();
      }
    });

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [id, navigate]);

  const executeLock = async (finalPin: string) => {
    if (isLocking) return;
    setIsLocking(true);
    
    try {
      const res = await supabase.functions.invoke('lock-funds', {
        body: { orderId: id, buyerId: userData?.id, pin: finalPin }
      });

      if (res.error || !res.data?.success) {
        throw new Error(res.error?.message || res.data?.error || "Failed to lock funds");
      }

      setIsSuccess(true);
      setShowPinModal(false);
      setTimeout(() => {
        navigate(`/orders/${id}`);
      }, 2500);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred while locking funds');
      setPin(['', '', '', '']);
      document.getElementById('pin-0')?.focus();
    } finally {
      setIsLocking(false);
    }
  };

  const handlePinInput = (index: number, value: string) => {
    if (value.length > 1) return;
    const newArr = [...pin];
    newArr[index] = value.replace(/[^0-9]/g, '');
    setPin(newArr);
    
    if (value !== '' && index < 3) {
      document.getElementById(`pin-${index + 1}`)?.focus();
    } else if (value !== '' && index === 3) {
      executeLock(newArr.join(''));
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      document.getElementById(`pin-${index - 1}`)?.focus();
    }
  };

  const handleInitialLockClick = () => {
    if (!userData.payment_pin) {
      toast('Please set up your payment PIN first', { icon: '🔒' });
      navigate(`/settings/pin-setup?redirect=lock&orderId=${id}`);
      return;
    }
    setShowPinModal(true);
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

  if (isLoading) {
    return <div className="min-h-screen bg-[#101415] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!order || !userData) {
    return <div className="min-h-screen bg-[#101415] flex items-center justify-center text-white">Order not found.</div>;
  }

  if (order.status !== 'PENDING_PAYMENT' || (order.buyer_id && order.buyer_id !== userData.id)) {
    return (
      <div className="min-h-screen bg-[#101415] flex flex-col items-center justify-center text-white px-5">
        <span className="material-symbols-outlined text-[64px] text-error mb-4">cancel</span>
        <h2 className="text-2xl font-bold mb-2 text-center tracking-tight">Deal Unavailable</h2>
        <p className="text-on-surface-variant/80 text-center mb-8 max-w-xs">This deal has already been claimed, paid for, or is no longer available.</p>
        <button onClick={() => navigate('/deals')} className="px-6 py-3 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors font-bold">Return to Deals</button>
      </div>
    );
  }

  const userBalance = Number(userData.available_balance || 0);
  const dealPrice = Number(order.amount);
  const isSufficient = userBalance >= dealPrice;

  if (!isSufficient) {
    // Insufficient Balance UI
    return (
      <div className="wallet-status-wrapper font-body-md pb-[100px]">
        <div className="ambient-bg-error"></div>
        <header className="fixed top-0 w-full z-50 bg-[#0b0b0d]/80 backdrop-blur-xl border-b border-white/10 max-w-[600px] left-1/2 -translate-x-1/2">
          <div className="flex items-center px-5 h-16">
            <button 
              onClick={() => navigate('/deals')}
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
                <span className="font-title-md text-lg text-white font-medium">₦{userBalance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-white/50 uppercase tracking-widest block mb-1">Required</span>
                <span className="font-title-md text-lg text-error font-semibold text-[#ffb4ab]">₦{dealPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
            
            <div className="bg-error-container/10 border border-error-container/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error text-[#ffb4ab]">warning</span>
                <span className="text-sm font-medium text-white/90">Shortfall</span>
              </div>
              <span className="font-title-md font-bold text-[#ffb4ab]">₦{(dealPrice - userBalance).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
          </section>

          <section className="status-glass rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-[0.2em] mb-5">Top Up Immediately via Transfer</h3>
            
            <div className="space-y-4 relative z-10">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">Bank Name</span>
                <span className="text-sm font-bold text-white tracking-wide">{userData?.nomba_bank_name || 'Nomba MFB'}</span>
              </div>
              
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">Account Number</span>
                <div className="flex justify-between items-center bg-[#060608] border border-white/10 rounded-xl p-3">
                  <span className="text-xl font-bold text-white tracking-widest font-title-md">{userData?.nomba_virtual_account_number || 'Pending'}</span>
                  <button 
                    onClick={() => handleCopy(userData?.nomba_virtual_account_number || '')}
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
          <button onClick={() => navigate('/deals')} className="mr-2 active:scale-95 transition-transform"><span className="material-symbols-outlined text-[#e0e3e5]">arrow_back</span></button>
          <img src="/images/logo.svg" alt="TrustFund Logo" className="h-8 w-8 object-contain" />
          <span className="font-headline-lg-mobile md:font-headline-lg tracking-tighter text-[#ddb7ff] uppercase">TRUSTFUND</span>
        </div>
      </header>

      <main className="flex-grow pt-32 pb-10 px-5 max-w-lg mx-auto w-full relative z-10">
        {/* Order Context Mini-Banner */}
        <div className="mb-8 rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top duration-700" style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 bg-white/10 flex items-center justify-center">
            {order.item_image_url ? (
              <img src={order.item_image_url} alt="Product" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-white/50 text-2xl">shopping_bag</span>
            )}
          </div>
          <div className="flex-grow">
            <p className="text-[12px] font-semibold text-[#cfc2d6] opacity-70 uppercase tracking-wider">Escrow Order</p>
            <h3 className="text-[20px] font-medium text-[#e0e3e5]">{order.item_name}</h3>
            <p className="text-[16px] text-[#ddb7ff]">₦{dealPrice.toLocaleString()}</p>
          </div>
        </div>

        {/* Main Glass Card - Summary */}
        <div className="rounded-[32px] p-8 mb-8 relative overflow-hidden animate-in fade-in zoom-in duration-1000 delay-200" style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="text-center mb-8">
            <p className="text-[12px] font-semibold text-[#cfc2d6] uppercase tracking-[0.2em] mb-2">Escrow Total</p>
            <h1 className="text-[32px] md:text-[40px] font-semibold text-[#e0e3e5]">₦{dealPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</h1>
            <div className="flex items-center justify-center gap-2 mt-4 py-2 px-4 bg-[#ddb7ff]/10 border border-[#ddb7ff]/20 rounded-full w-fit mx-auto">
              <span className="material-symbols-outlined text-[#ddb7ff] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <span className="text-[12px] font-semibold text-[#ddb7ff] uppercase">Secured by Aetheric Protocol</span>
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
              <p className="text-[20px] font-medium text-[#e0e3e5]">Available: ₦{userBalance.toLocaleString()}</p>
              <p className="text-[12px] font-semibold text-emerald-400">Ready to lock ✓</p>
            </div>
          </div>
          <div className="space-y-2 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-[16px] text-[#cfc2d6] opacity-70">After locking, available balance</span>
              <span className="text-[16px] text-[#cfc2d6] opacity-70">₦{(userBalance - dealPrice).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[16px] text-[#cfc2d6] opacity-70">Locked for this deal</span>
              <span className="text-[16px] text-[#e0e3e5]">₦{dealPrice.toLocaleString()}</span>
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
                <p className="text-[20px] font-medium text-[#e0e3e5]">{order.vendor?.full_name || 'Vendor'}</p>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[#ddb7ff] text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-[12px] font-semibold text-[#cfc2d6]">{order.vendor?.completed_deals_count || 0} Deals Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final Action Area */}
        <div className="fixed bottom-0 left-0 w-full p-5 bg-gradient-to-t from-[#101415] via-[#101415]/90 to-transparent pt-12 z-20">
          <div className="max-w-lg mx-auto text-center">
            <button 
              onClick={handleInitialLockClick}
              disabled={isLocking}
              className={`w-full h-16 rounded-full bg-[#ddb7ff] text-[#490080] font-medium text-[20px] flex items-center justify-center gap-3 transition-all ${isLocking ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 hover:opacity-90'}`}
              style={{ boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}
            >
              <span>{isLocking ? 'Locking Funds...' : 'Lock Funds Now'}</span>
              <span className="material-symbols-outlined">{isLocking ? 'hourglass_top' : 'lock_open'}</span>
            </button>
            <p className="mt-4 text-[12px] font-semibold text-[#cfc2d6] opacity-60">
              By tapping, you authorize the transfer of funds into secure escrow.
            </p>
          </div>
        </div>
      </main>

      {/* PIN Authorization Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-5 animate-in fade-in duration-300">
          <div className="bg-[#1a1a1a] border border-[#d2bbff]/20 rounded-[40px] p-6 md:p-10 text-center shadow-2xl w-full max-w-lg relative overflow-hidden" style={{ boxShadow: '0 4px 40px rgba(168, 85, 247, 0.2)' }}>
            
            <button 
              onClick={() => {
                setShowPinModal(false);
                setPin(['', '', '', '']);
              }}
              className="absolute top-6 right-6 text-[#958da1] hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="relative inline-flex items-center justify-center mb-8 mt-2">
              <div className="absolute inset-0 bg-[#ddb7ff]/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative w-20 h-20 flex items-center justify-center bg-[#ddb7ff]/10 border border-[#ddb7ff]/30 rounded-full shadow-[0_0_30px_10px_rgba(183,109,255,0.2)]">
                <span className="material-symbols-outlined text-[#ddb7ff] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield_lock</span>
              </div>
            </div>
            
            <h2 className="font-headline-lg text-3xl text-white mb-2 tracking-tight">Authorize Payment</h2>
            <p className="font-body-md text-[#ccc3d8] mb-10 max-w-xs mx-auto">
              Enter your 4-digit security PIN to lock <span className="text-[#ddb7ff] font-bold">₦{dealPrice.toLocaleString()}</span> into escrow.
            </p>

            <div className="flex justify-center gap-4 mb-10">
              {pin.map((digit, idx) => (
                <div key={idx} className="w-14 h-16 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center focus-within:border-[#ddb7ff] focus-within:shadow-[0_0_15px_rgba(221,183,255,0.3)] focus-within:bg-[#ddb7ff]/5 transition-all">
                  <input
                    id={`pin-${idx}`}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinInput(idx, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(idx, e)}
                    disabled={isLocking}
                    className="w-full h-full bg-transparent border-none text-center text-[#ddb7ff] font-bold text-2xl focus:ring-0 p-0 disabled:opacity-50"
                  />
                </div>
              ))}
            </div>

            <button 
              disabled={isLocking || pin.join('').length < 4}
              onClick={() => executeLock(pin.join(''))}
              className="w-full h-16 rounded-2xl flex items-center justify-center gap-3 text-[#490080] font-bold text-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #ddb7ff 0%, #b76dff 100%)' }}
            >
              {isLocking ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#490080] border-t-transparent rounded-full animate-spin"></div>
                  <span>Authorizing...</span>
                </>
              ) : (
                <>
                  <span>Confirm Securely</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
                </>
              )}
            </button>
            
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm text-[#958da1]">lock</span>
              <span className="text-xs text-[#958da1] uppercase tracking-widest font-bold">Encrypted Session v2.4</span>
            </div>
          </div>
        </div>
      )}

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
