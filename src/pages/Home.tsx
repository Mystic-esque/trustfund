import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import './Home.css';

const Home = () => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) setUserData(profile);

      // Fetch recent orders
      const { data: userOrders } = await supabase
        .from('orders')
        .select('*')
        .or(`vendor_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (userOrders) setOrders(userOrders);
    };

    fetchUser();

    // Subscribe to realtime balance updates
    const subscription = supabase
      .channel('public:users')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, (payload) => {
        setUserData(payload.new);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const toggleBalance = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBalanceVisible(!isBalanceVisible);
  };

  const formatMoney = (amount: number) => {
    return Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const cards = [
    {
      id: 0,
      title: 'Available Balance',
      amount: userData ? formatMoney(userData.available_balance) : '0.00',
      tag: 'Secured by TrustGuard™',
      gradient: 'bg-gradient-to-br from-primary-container to-secondary-container'
    },
    {
      id: 1,
      title: 'Escrow Balance',
      amount: userData ? formatMoney(userData.escrow_balance) : '0.00',
      tag: 'Locked in Active Deals',
      gradient: 'bg-gradient-to-br from-[#0F766E] to-[#042F2E] border-white/10'
    },
    {
      id: 2,
      title: 'Pending Release',
      amount: userData ? formatMoney(userData.pending_balance) : '0.00',
      tag: 'Awaiting Buyer Confirmation',
      gradient: 'bg-gradient-to-br from-[#1D4ED8] to-[#172554] border-white/10'
    }
  ];

  const handleNextCard = () => {
    setActiveIndex((prev) => (prev + 1) % cards.length);
  };

  return (
    <div className="home2-wrapper antialiased font-body-md pb-[100px]" style={{ background: 'radial-gradient(circle at 20% 30%, rgba(221, 183, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(62, 60, 143, 0.2) 0%, transparent 50%), #101415' }}>
      <div className="max-w-[600px] mx-auto text-on-background relative">
        
        {/* TopAppBar */}
        <header className="w-full top-0 sticky bg-white/5 backdrop-blur-xl transition-opacity duration-200 flex items-center justify-between px-5 h-16 z-40 border-b border-white/10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 cursor-pointer hover:opacity-80 transition-opacity bg-white/10 animate-pulse">
              <img alt="User Profile" loading="lazy" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC94k3VGb5Ss-S0hfQJQZMduDlYwYtUq4hc3XsEG8u3BYRn--UK6_TThC-w6Lxk5i6XsVgHBS5hZBCItX1-PkRAO3eVBCPdVf_fl3VyD1KMmiKqdWVUPDK9SMwXgODxt62vKNI_2U32jm7ZzmXRpQrH-LSGsw2oUFN5Julm6bk6b7pgfRZhwGExiI-KkZDwjl6eGyLmiH32Q2N1vQ9mqeQs2UXMpeRpOOze3ZoIM3sRVrdsr58NuAsRVEzDCf8y2Tr09O44yDtcuxVh"/>
            </div>
            <h1 className="font-headline-lg-mobile text-[24px] font-bold text-white hover:opacity-80 transition-opacity cursor-pointer">
              {userData ? `Hi 👋, ${userData.full_name.split(' ')[0]}` : 'TrustFund'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-white/80 hover:text-white transition-opacity p-2 rounded-full hover:bg-white/10">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>notifications</span>
            </button>
          </div>
        </header>

        <main className="px-5 py-6 flex flex-col gap-8">
          
          {/* Interactive Balance Card Stack */}
          <div className="flex flex-col items-center">
            <div className="relative w-full h-[200px] mt-8 mb-4 cursor-pointer group" onClick={handleNextCard}>
              {cards.map((card, idx) => {
                const position = (idx - activeIndex + cards.length) % cards.length;
                
                let styleClasses = '';
                if (position === 0) {
                  styleClasses = 'top-0 z-30 scale-100 translate-y-0 shadow-2xl opacity-100 border-white/20 group-hover:-translate-y-1';
                } else if (position === 1) {
                  styleClasses = 'top-0 z-20 scale-[0.92] -translate-y-4 rotate-2 shadow-md opacity-70 border-white/10 group-hover:-translate-y-5';
                } else if (position === 2) {
                  styleClasses = 'top-0 z-10 scale-[0.85] -translate-y-8 -rotate-2 shadow-sm opacity-40 border-white/5 group-hover:-translate-y-9';
                }

                return (
                  <section 
                    key={card.id} 
                    className={`absolute left-0 right-0 h-[200px] overflow-hidden rounded-[24px] p-6 transition-all duration-500 ease-out border ${styleClasses} ${card.gradient}`}
                  >
                    {position === 0 && <div className="shimmer-effect"></div>}
                    
                    {position === 0 && card.id === 0 && (
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary blur-[60px] opacity-20 rounded-full pointer-events-none transition-all duration-500 group-hover:opacity-40 group-hover:scale-125"></div>
                    )}
                    
                    <div className="flex justify-between items-center mb-4 relative z-10">
                      <span className="font-label-sm text-white/80 uppercase tracking-[0.2em] text-xs">{card.title}</span>
                      {position === 0 && (
                        <button className="text-white/80 hover:text-white transition-colors relative z-20" onClick={toggleBalance}>
                          <span className="material-symbols-outlined text-[20px]">{isBalanceVisible ? 'visibility' : 'visibility_off'}</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="relative z-10 flex items-baseline gap-2 mb-8">
                      <span className="font-headline-lg-mobile text-white/80 text-2xl">₦</span>
                      <h2 className="font-display-lg text-[48px] leading-tight text-white tracking-tight font-bold transition-all duration-300">
                        {isBalanceVisible ? card.amount : '••••••••'}
                      </h2>
                    </div>
                    
                    <div className="relative z-10 flex items-center gap-2 text-white/90 bg-black/20 w-fit px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">
                      <span className="material-symbols-outlined text-[16px]">{card.id === 0 ? 'lock' : 'info'}</span>
                      <span className="font-label-sm text-xs font-medium">{card.tag}</span>
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Pagination Dots */}
            <div className="flex gap-2 justify-center items-center h-4">
              {cards.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ease-out ${activeIndex === idx ? 'w-6 bg-primary shadow-[0_0_8px_rgba(221,183,255,0.6)]' : 'w-1.5 bg-white/20'}`} 
                />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <section className="grid grid-cols-4 gap-4">
            <Link to="/wallet/top-up" className="flex flex-col items-center gap-3 group">
              <div className="w-14 h-14 rounded-2xl glass-button flex items-center justify-center group-hover:bg-white/10 transition-all group-active:scale-90">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 0" }}>add_circle</span>
              </div>
              <span className="font-label-sm text-white/60 group-hover:text-white transition-colors text-xs text-center">Top Up</span>
            </Link>

            <Link to="/lock" className="flex flex-col items-center gap-3 group">
              <div className="w-14 h-14 rounded-2xl glass-button flex items-center justify-center group-hover:bg-white/10 transition-all group-active:scale-90">
                <span className="material-symbols-outlined text-white">lock</span>
              </div>
              <span className="font-label-sm text-white/60 group-hover:text-white transition-colors text-xs text-center">Lock</span>
            </Link>

            <Link to="/withdraw" className="flex flex-col items-center gap-3 group">
              <div className="w-14 h-14 rounded-2xl glass-button flex items-center justify-center group-hover:bg-white/10 transition-all group-active:scale-90">
                <span className="material-symbols-outlined text-white">output</span>
              </div>
              <span className="font-label-sm text-white/60 group-hover:text-white transition-colors text-xs text-center">Withdraw</span>
            </Link>

            <Link to="/orders" className="flex flex-col items-center gap-3 group">
              <div className="w-14 h-14 rounded-2xl glass-button flex items-center justify-center group-hover:bg-white/10 transition-all group-active:scale-90">
                <span className="material-symbols-outlined text-white">key</span>
              </div>
              <span className="font-label-sm text-white/60 group-hover:text-white transition-colors text-xs text-center">Release</span>
            </Link>
          </section>

          {/* Your Deals */}
          <section className="flex flex-col gap-5">
            <div className="flex justify-between items-end px-1">
              <h3 className="font-headline-lg-mobile text-[22px] font-semibold text-white">Your Deals</h3>
              <Link to="/orders" className="font-label-sm text-primary hover:text-primary-fixed transition-colors text-sm font-medium">View All</Link>
            </div>

            <div className="flex flex-col gap-4">
              {orders.length === 0 ? (
                <div className="glass-container rounded-2xl p-8 flex flex-col items-center justify-center text-center opacity-70">
                  <span className="material-symbols-outlined text-4xl text-white/50 mb-3">handshake</span>
                  <p className="font-body-md text-white/80">No deals yet.</p>
                  <p className="font-label-sm text-white/50 mt-1">Create a deal to get started.</p>
                </div>
              ) : (
                orders.map((order) => {
                  const isVendor = order.vendor_id === user?.id;
                  const displayName = isVendor ? "Buyer" : "Vendor"; // Simplified for now
                  
                  let statusClass = "bg-white/10 text-white/80 border border-white/20";
                  if (order.status === "COMPLETED" || order.status === "SETTLED") {
                    statusClass = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
                  } else if (order.status === "IN_TRANSIT" || order.status === "DELIVERED_PENDING_RELEASE") {
                    statusClass = "bg-primary/20 text-primary border border-primary/30";
                  }

                  return (
                    <Link key={order.id} to={`/orders/${order.id}`} className="glass-container rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.06] transition-all cursor-pointer active:scale-[0.98]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/20 shrink-0 flex items-center justify-center">
                          {order.item_image_url ? (
                            <img src={order.item_image_url} alt="Product" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-white/50">shopping_bag</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-body-md text-white font-medium">{order.item_name}</span>
                          <span className="font-label-sm text-white/50 text-xs">{isVendor ? 'Selling' : 'Buying'} • {order.reference_id}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-body-md text-white font-semibold">₦{formatMoney(order.amount)}</span>
                        <div className={`${statusClass} px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase`}>
                          {order.status.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default Home;
