import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';


type LedgerEntry = {
  id: string;
  created_at: string;
  entry_type: string;
  amount: number;
  direction: 'credit' | 'debit';
  narration: string;
};

export default function TransactionHistory() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Top Up' | 'Escrow' | 'Withdrawal'>('All');

  useEffect(() => {

    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }
      setUser(user);
      try {
        const { data, error } = await supabase
          .from('ledger_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setTransactions(data as LedgerEntry[]);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'All') return true;
    if (filter === 'Top Up' && tx.entry_type === 'TOP_UP') return true;
    if (filter === 'Escrow' && tx.entry_type.includes('ESCROW')) return true;
    if (filter === 'Withdrawal' && tx.entry_type === 'WITHDRAWAL') return true;
    return false;
  });

  const getIcon = (type: string) => {
    if (type.includes('TOP_UP')) return 'account_balance_wallet';
    if (type.includes('WITHDRAWAL')) return 'payments';
    if (type.includes('ESCROW')) return 'lock';
    return 'sync_alt';
  };

  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen pb-32 font-body-md selection:bg-[#d2bbff]/30">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#131313]/80 backdrop-blur-md border-b border-[#4a4455]/30 shadow-sm h-16 flex justify-between items-center px-5 max-w-[600px] left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-[#353534]/50 transition-colors active:scale-95 duration-150"
          >
            <span className="material-symbols-outlined text-[#d2bbff]">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-[24px] font-bold text-[#d2bbff]">Transactions</h1>
        </div>
        <button className="w-10 h-10 rounded-full border border-[#4a4455]/30 overflow-hidden active:scale-95 duration-150 bg-[#353534] flex items-center justify-center">
          <span className="material-symbols-outlined text-[#ccc3d8]">person</span>
        </button>
      </header>

      <main className="max-w-[600px] mx-auto pt-16 px-5">
        {/* Search & Filter Sticky Section */}
        <div className="sticky top-16 z-40 bg-[#131313]/95 pt-6 pb-4 space-y-4">
          {/* Search Bar */}
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#958da1] group-focus-within:text-[#d2bbff] transition-colors">search</span>
            <input 
              type="text" 
              placeholder="Search transactions..." 
              className="w-full bg-[#1c1b1b] border border-[#4a4455]/50 rounded-xl py-3 pl-12 pr-4 text-[16px] focus:outline-none focus:border-[#d2bbff] focus:ring-1 focus:ring-[#d2bbff] transition-all text-[#e5e2e1]"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {['All', 'Top Up', 'Escrow', 'Withdrawal'].map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-5 py-2 rounded-full font-label-lg font-bold text-[14px] whitespace-nowrap active:scale-95 duration-150 border transition-colors ${
                  filter === f 
                    ? 'bg-[#d2bbff] text-[#3f008e] border-[#d2bbff]' 
                    : 'bg-[#2a2a2a] text-[#ccc3d8] border-[#4a4455]/30 hover:bg-[#353534]/50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        <div className="mt-2 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-[#d2bbff] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-10 text-[#ccc3d8]">
              <span className="material-symbols-outlined text-[48px] opacity-20 mb-2">history</span>
              <p>No transactions found.</p>
            </div>
          ) : (
            filteredTransactions.map((tx: any) => (
              <div 
                key={tx.id} 
                onClick={() => {
                  if (tx.entry_type.includes('ESCROW') || tx.entry_type.includes('SETTLEMENT')) {
                    if (tx.reference_id && tx.reference_id.startsWith('TF-')) {
                      // We don't have order_id directly here unless added, let's assume if there's order_id we use it.
                      // If it's not present, we can't reliably go to EscrowReceipt. 
                      // Actually, if we just navigate to order.id, how do we get it?
                      // The schema has `reference_id` which might be the order.id or order.link_slug.
                      // Let's use `tx.order_id` if we modify the type. Let's just use `/transactions/${tx.id}/receipt` for now, 
                      // or if we have order_id, `/orders/${tx.order_id}/receipt`.
                      // But wait, the user's requirement is to separate by category.
                      // Let's use tx.order_id if it exists.
                    }
                    if (tx.order_id) {
                      const typeParam = tx.entry_type.includes('LOCK') ? '?type=lock' : '?type=release';
                      navigate(`/orders/${tx.order_id}/receipt${typeParam}`);
                    } else {
                      navigate(`/transactions/${tx.id}/receipt`);
                    }
                  } else {
                    navigate(`/transactions/${tx.id}/receipt`);
                  }
                }}
                className="bg-[#201f1f] rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer border border-transparent hover:border-[#4a4455]/30"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  tx.direction === 'credit' ? 'bg-[#007650]/20 text-[#4edea3]' : 'bg-[#93000a]/20 text-[#ffb4ab]'
                }`}>
                  <span className="material-symbols-outlined">{getIcon(tx.entry_type)}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[16px] text-[#e5e2e1] truncate">{tx.narration || tx.entry_type}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[12px] text-[#958da1]">
                      {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="w-1 h-1 bg-[#4a4455] rounded-full"></span>
                    <span className="text-[12px] text-[#958da1] uppercase tracking-wider">{tx.entry_type.replace('_', ' ')}</span>
                  </div>
                </div>
                
                <div className="text-right shrink-0">
                  <p className={`font-headline-md text-[18px] font-bold ${
                    tx.direction === 'credit' ? 'text-[#4edea3]' : 'text-[#e5e2e1]'
                  }`}>
                    {tx.direction === 'credit' ? '+' : '-'}₦{Number(tx.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
