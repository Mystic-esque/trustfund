import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import './Orders.css';

interface Deal {
  id: string;
  title: string;
  sellerHandle: string;
  price: number;
  status: string;
  date: string; // e.g. "2026-10"
  imageUrl?: string;
  avatarUrl?: string;
  iconName?: string;
  isVendor: boolean;
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'IN_TRANSIT':
    case 'DELIVERED_PENDING_RELEASE':
      return 'bg-secondary-container/20 text-[#c3c0ff] border-secondary-container/30';
    case 'ESCROW_LOCKED':
    case 'LOCKED':
      return 'bg-primary/20 text-primary border-primary/30';
    case 'COMPLETED':
    case 'SETTLED':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'DISPUTED':
      return 'bg-error-container/20 text-[#ffb4ab] border-error-container/30';
    default:
      return 'bg-white/10 text-white/50 border-white/20';
  }
};

const getDisplayStatus = (status: string) => {
  if (status === 'IN_TRANSIT') return 'In Transit';
  if (status === 'ESCROW_LOCKED' || status === 'LOCKED') return 'Locked';
  if (status === 'COMPLETED' || status === 'SETTLED') return 'Completed';
  if (status === 'DISPUTED') return 'Disputed';
  if (status === 'DELIVERED_PENDING_RELEASE') return 'Pending Release';
  if (status === 'PENDING_PAYMENT') return 'Pending Payment';
  return status;
};

const DealCard = ({ deal }: { deal: Deal }) => {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => {
        if (deal.status === 'PENDING_PAYMENT' && !deal.isVendor) {
          navigate(`/orders/${deal.id}/lock`);
        } else {
          navigate(`/orders/${deal.id}`);
        }
      }} 
      className="aether-glass-orders rounded-2xl p-5 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center ${deal.imageUrl || deal.avatarUrl ? 'ring-1 ring-primary/20 bg-white/10' : ''}`}>
          {deal.imageUrl ? (
            <img loading="lazy" className="w-full h-full object-cover" alt="Product" src={deal.imageUrl} />
          ) : deal.avatarUrl ? (
            <img loading="lazy" className="w-full h-full object-cover" alt="Avatar" src={deal.avatarUrl} />
          ) : (
            <span className="material-symbols-outlined text-primary/70">{deal.iconName || 'shopping_bag'}</span>
          )}
        </div>
        <div>
          <h3 className="font-body-md text-white font-semibold">{deal.title}</h3>
          <p className="text-xs text-white/50">{deal.sellerHandle}</p>
        </div>
      </div>
      <div className="text-right flex flex-col items-end">
        <p className={`font-title-md font-semibold ${deal.status === 'DISPUTED' ? 'text-[#ffb4ab]' : 'text-white'}`}>
          ₦{deal.price.toLocaleString(undefined, {minimumFractionDigits: 2})}
        </p>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mt-1.5 border ${getStatusStyle(deal.status)}`}>
          {getDisplayStatus(deal.status)}
        </span>
      </div>
    </div>
  );
};

const Orders = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState(() => {
    const filterQuery = searchParams.get('filter');
    if (filterQuery === 'In_Transit') return 'In Transit';
    return 'All';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const filters = ['All', 'Pending', 'Locked', 'In Transit', 'Completed', 'Disputed'];

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      const pendingDealsLocal = JSON.parse(localStorage.getItem('pending_deals') || '[]');
      const pendingIds = pendingDealsLocal.map((d: any) => d.id).filter(Boolean);
      let orString = `vendor_id.eq.${user.id},buyer_id.eq.${user.id}`;
      if (pendingIds.length > 0) {
        orString += `,id.in.(${pendingIds.join(',')})`;
      }

      const { data: ordersData } = await supabase
        .from('order_details_view')
        .select('*')
        .or(orString)
        .order('created_at', { ascending: false });

      if (ordersData) {
        const mappedDeals = [];
        const validPendingIds: string[] = [];

        for (const o of ordersData) {
          const isVendor = o.vendor_id === user.id;
          const isBuyer = o.buyer_id === user.id;

          if (!isVendor && !isBuyer) {
            // This is a pending deal from localStorage.
            if (o.status !== 'PENDING_PAYMENT' || (o.buyer_id && o.buyer_id !== user.id)) {
              continue;
            }
            validPendingIds.push(o.id);
          }

          const otherPartyName = isVendor ? (o.buyer?.full_name || 'Unknown Buyer') : (o.vendor?.full_name || 'Unknown Vendor');
          const dateObj = new Date(o.created_at);
          const monthYear = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });

          mappedDeals.push({
            id: o.id,
            title: o.item_name,
            sellerHandle: `@${otherPartyName.replace(/\s+/g, '_').toLowerCase()}`,
            price: Number(o.amount),
            status: o.status,
            date: monthYear,
            imageUrl: o.item_image_url,
            isVendor
          });
        }

        if (pendingIds.length !== validPendingIds.length) {
          const newPending = pendingDealsLocal.filter((d: any) => validPendingIds.includes(d.id));
          localStorage.setItem('pending_deals', JSON.stringify(newPending));
        }

        setDeals(mappedDeals);
      }
      setIsLoading(false);
    };

    fetchOrders();
  }, [navigate]);

  const filteredDeals = useMemo(() => {
    let result = deals;
    
    if (activeFilter !== 'All') {
      const targetStatus = activeFilter.toUpperCase().replace(' ', '_');
      result = result.filter(deal => {
        if (activeFilter === 'Pending') return deal.status === 'PENDING_PAYMENT';
        if (activeFilter === 'Locked') return deal.status === 'ESCROW_LOCKED' || deal.status === 'LOCKED';
        if (activeFilter === 'Completed') return deal.status === 'COMPLETED' || deal.status === 'SETTLED';
        if (activeFilter === 'In Transit') return deal.status === 'IN_TRANSIT' || deal.status === 'DELIVERED_PENDING_RELEASE';
        return deal.status === targetStatus;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(deal => 
        deal.title.toLowerCase().includes(q) || 
        deal.sellerHandle.toLowerCase().includes(q)
      );
    }

    return result;
  }, [deals, activeFilter, searchQuery]);

  const groupedDeals = useMemo(() => {
    return filteredDeals.reduce((acc, deal) => {
      if (!acc[deal.date]) acc[deal.date] = [];
      acc[deal.date].push(deal);
      return acc;
    }, {} as Record<string, Deal[]>);
  }, [filteredDeals]);

  return (
    <div className="orders-wrapper font-body-md pb-[100px]" style={{ background: 'radial-gradient(circle at 20% 30%, rgba(221, 183, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(62, 60, 143, 0.2) 0%, transparent 50%), #101415' }}>
      <div className="cinematic-bg-orders">
        <div className="energy-stream-orders" style={{ left: '10%', animationDuration: '15s' }}></div>
        <div className="energy-stream-orders" style={{ left: '30%', animationDuration: '25s', animationDelay: '2s' }}></div>
        <div className="energy-stream-orders" style={{ left: '70%', animationDuration: '20s', animationDelay: '5s' }}></div>
        <div className="energy-stream-orders" style={{ left: '90%', animationDuration: '18s' }}></div>
      </div>

      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#101415]/40 backdrop-blur-xl border-b border-white/10 max-w-[600px] left-1/2 -translate-x-1/2">
        <div className="flex items-center justify-between px-5 h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="active:scale-95 duration-150 p-2 rounded-full hover:bg-white/5 transition-colors">
              <span className="material-symbols-outlined text-primary">arrow_back</span>
            </button>
            <h1 className="font-headline-md text-2xl font-bold text-white tracking-tight">Your Deals</h1>
          </div>
        </div>
      </header>

      <main className="pt-24 px-5 max-w-[600px] mx-auto min-h-screen">
        
        {/* Search & Filters */}
        <section className="space-y-6 mb-8 relative z-10">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-white/30">search</span>
            </div>
            <input 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all backdrop-blur-md font-body-md text-white placeholder:text-white/20" 
              placeholder="Search deals, usernames..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            {filters.map((f) => (
              <button 
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-5 py-2 rounded-full font-medium whitespace-nowrap active:scale-95 transition-all ${
                  activeFilter === f 
                    ? 'bg-primary-container text-white aether-glow-orders' 
                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </section>

        {/* Deal List */}
        <div className="space-y-10 relative z-10">
          {isLoading ? (
            <div className="flex justify-center pt-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : Object.keys(groupedDeals).length === 0 ? (
            <div className="text-center text-white/40 pt-10">
              No deals found.
            </div>
          ) : (
            Object.entries(groupedDeals).map(([date, deals]) => (
              <section key={date}>
                <h2 className="text-xs font-semibold text-white/40 uppercase tracking-[0.2em] mb-5 px-1">{date}</h2>
                <div className="space-y-4">
                  {deals.map(deal => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Orders;
