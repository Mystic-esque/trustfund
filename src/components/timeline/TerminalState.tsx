import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TerminalStateProps {
  order: any;
  currentUser: any;
}

const TerminalState: React.FC<TerminalStateProps> = ({ order, currentUser }) => {
  const navigate = useNavigate();

  const isVendor = currentUser.id === order.vendor_id;
  const isBuyer = currentUser.id === order.buyer_id;

  const handleCreateNewDeal = () => {
    // Navigate to new deal page with pre-filled state (if our router setup allows state passing)
    navigate('/orders/new', { state: { itemName: order.item_name, amount: order.amount } });
  };

  const renderSettled = () => (
    <div className="flex flex-col items-center justify-center pt-20 text-center space-y-6">
      <div className="w-24 h-24 rounded-full bg-[#005236]/20 border border-[#005236]/50 flex items-center justify-center relative">
        <div className="absolute inset-0 rounded-full border border-[#6ffbbe]/20 animate-ping" style={{ animationDuration: '3s' }}></div>
        <span className="material-symbols-outlined text-[48px] text-[#6ffbbe]">task_alt</span>
      </div>
      <div className="space-y-2">
        <h2 className="font-display-lg text-[32px] font-bold text-white">Deal Complete</h2>
        <p className="font-body-md text-on-surface-variant max-w-[280px] mx-auto">
          {isVendor 
            ? `₦${order.net_payout?.toLocaleString()} has been released to your wallet.`
            : `You have released the funds. Thank you for using TrustFund.`}
        </p>
      </div>
      <div className="w-full mt-8">
        <button 
          onClick={() => navigate(`/orders/${order.id}/receipt`)}
          className="w-full bg-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">receipt_long</span>
          View Receipt
        </button>
      </div>
    </div>
  );

  const renderRefunded = () => (
    <div className="flex flex-col items-center justify-center pt-20 text-center space-y-6">
      <div className="w-24 h-24 rounded-full bg-[#4a0005] border border-error-container/50 flex items-center justify-center">
        <span className="material-symbols-outlined text-[48px] text-error-container">currency_exchange</span>
      </div>
      <div className="space-y-2">
        <h2 className="font-display-lg text-[32px] font-bold text-white">Deal Refunded</h2>
        <p className="font-body-md text-on-surface-variant max-w-[280px] mx-auto">
          {isBuyer 
            ? `₦${order.amount?.toLocaleString()} has been refunded to your wallet balance.`
            : `The dispute was resolved and funds were returned to the buyer.`}
        </p>
      </div>
      <div className="w-full mt-8">
        <button 
          onClick={() => navigate(`/orders/${order.id}/chat`)}
          className="w-full bg-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">history</span>
          View Case History
        </button>
      </div>
    </div>
  );

  const renderExpired = () => (
    <div className="flex flex-col items-center justify-center pt-20 text-center space-y-6">
      <div className="w-24 h-24 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant">timer_off</span>
      </div>
      <div className="space-y-2">
        <h2 className="font-display-lg text-[32px] font-bold text-white">Link Expired</h2>
        <p className="font-body-md text-on-surface-variant max-w-[280px] mx-auto">
          This deal link expired after 72 hours because the funds were not locked in escrow.
        </p>
      </div>
      
      {isVendor && (
        <div className="w-full mt-8">
          <button 
            onClick={handleCreateNewDeal}
            className="w-full bg-primary text-[#101415] font-bold py-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Create New Deal
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen w-full text-[#e5e2e1] bg-background font-body-md antialiased pb-32">
      {/* Top App Bar */}
      <header className="w-full top-0 sticky z-50 bg-background/80 backdrop-blur-md flex items-center justify-between px-5 h-16 border-b border-white/5 max-w-[600px] mx-auto">
        <button 
          onClick={() => navigate('/home')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors -ml-2"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-[20px] font-bold text-on-surface">Order Details</h1>
        <div className="w-10 h-10"></div>
      </header>

      <main className="max-w-[600px] mx-auto px-5">
        {order.status === 'SETTLED' && renderSettled()}
        {order.status === 'REFUNDED' && renderRefunded()}
        {order.status === 'EXPIRED' && renderExpired()}
      </main>
    </div>
  );
};

export default TerminalState;
