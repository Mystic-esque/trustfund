import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './Orders.css';

interface Deal {
  id: string;
  title: string;
  sellerHandle: string;
  price: number;
  status: 'In Transit' | 'Locked' | 'Completed' | 'Disputed';
  date: string; // e.g. "2026-10"
  avatarUrl?: string;
  iconName?: string;
}

const mockDeals: Deal[] = [
  {
    id: '1',
    title: 'Vintage Leica M6',
    sellerHandle: '@elias_vault',
    price: 3250.00,
    status: 'In Transit',
    date: 'October 2026',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1JK1lwtodCLh6c7pWTTmC5WSNAWfIiQV-bSoIYA-8K2osfht5fbTZCTFhJpzQdI0PQBTDaCSLJihL-pCLkd8JlHP22n8-Dblfwlk5Kbjr_0LdK-6EfWrGhjs0fzrV1186zPAqhBiXNqaYMX9RyZQIlr27xNFyXE_ZiqblFPA_aGX1gXoQkhM8BuuY_t-2uFQRjU6NpUf2CA5inky0-oC3ekUoeNdZKnLWKxmbc7dH5Z5eap0_Ws9XRqOg1X1_gBB7y2fqnJ8SZi2b'
  },
  {
    id: '2',
    title: 'Custom PC Build',
    sellerHandle: '@nebula_systems',
    price: 12400.00,
    status: 'Locked',
    date: 'October 2026',
    iconName: 'storefront'
  },
  {
    id: '3',
    title: 'MacBook Pro M4',
    sellerHandle: '@sarah_digital',
    price: 2499.00,
    status: 'Completed',
    date: 'September 2026',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcewq5YrKca_0jV8LLY6Q-d3sDW0Lug-GzZc9pv9ZaWOnDhRkFKFHccIESwKiU2w9io6S5KbasHgc71lIGpqtT-OI49uNz6jK86DkO4zrMNzRoVUWU6v7ft0gxlC4-ND_Mhcca9gwARg5i6G-_7rDyJW19yC74sYXRDnRY1qtvja0baSL-fS3z2kSY49lMcEB84omFN-GxG5XFl6GCKEV7dAJC3Btx5PHG5RXf9Dte3tAZvveg6mX_jA2iCAwbqXRvwu4KBhTAV7WR'
  },
  {
    id: '4',
    title: 'Rare Chronograph',
    sellerHandle: '@watch_collector',
    price: 8750.00,
    status: 'Disputed',
    date: 'September 2026',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnFVPX5u6qbj1ZPW4oyj1b7URi4Y-ZftuAg8VSV8eo2COefPvmW89w698dVCGslrSSNScdoWp-f48pTEDS2ZFOsilU5hYatFTIZAbTMBFY8hUoIUX51cGrU3DTY86OjasfkaeJcmRgH5BN1wV4twxJryX5YyW9o5wysNWRXmTgnK38P6AaTdFS1aCffPpJrsWPDIIrOH45wwPK1kfbQbW909vclcbv1cDSb9UCEepaJUchwFuDXKhXuS591nwxCov8zNdt0d0tC2IX'
  }
];

const getStatusStyle = (status: Deal['status']) => {
  switch (status) {
    case 'In Transit':
      return 'bg-secondary-container/20 text-[#c3c0ff] border-secondary-container/30';
    case 'Locked':
      return 'bg-primary/20 text-primary border-primary/30';
    case 'Completed':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'Disputed':
      return 'bg-error-container/20 text-[#ffb4ab] border-error-container/30';
  }
};

const DealCard = ({ deal }: { deal: Deal }) => {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => navigate(`/orders/${deal.id}/lock`)} 
      className="aether-glass-orders rounded-2xl p-5 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center ${deal.avatarUrl ? 'ring-1 ring-primary/20 animate-pulse bg-white/10' : ''}`}>
          {deal.avatarUrl ? (
            <img loading="lazy" className="w-full h-full object-cover" alt="Avatar" src={deal.avatarUrl} />
          ) : (
            <span className="material-symbols-outlined text-primary/70">{deal.iconName}</span>
          )}
        </div>
        <div>
          <h3 className="font-body-md text-white font-semibold">{deal.title}</h3>
          <p className="text-xs text-white/50">{deal.sellerHandle}</p>
        </div>
      </div>
      <div className="text-right flex flex-col items-end">
        <p className={`font-title-md font-semibold ${deal.status === 'Disputed' ? 'text-[#ffb4ab]' : 'text-white'}`}>
          ${deal.price.toLocaleString(undefined, {minimumFractionDigits: 2})}
        </p>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mt-1.5 border ${getStatusStyle(deal.status)}`}>
          {deal.status}
        </span>
      </div>
    </div>
  );
};

const Orders = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Locked', 'In Transit', 'Completed', 'Disputed'];

  const filteredDeals = useMemo(() => {
    if (activeFilter === 'All') return mockDeals;
    return mockDeals.filter(deal => deal.status === activeFilter);
  }, [activeFilter]);

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
          {/* Search Icon Removed per request */}
        </div>
      </header>

      <main className="pt-24 px-5 max-w-[600px] mx-auto min-h-screen">
        
        {/* Search & Filters */}
        <section className="space-y-6 mb-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-white/30">search</span>
            </div>
            <input 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all backdrop-blur-md font-body-md text-white placeholder:text-white/20" 
              placeholder="Search deals, usernames..." 
              type="text"
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
        <div className="space-y-10">
          {Object.keys(groupedDeals).length === 0 ? (
            <div className="text-center text-white/40 pt-10">
              No deals found for this filter.
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
