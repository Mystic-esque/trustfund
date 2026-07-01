import { useState } from 'react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './Home.css';

const Home = () => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const toggleBalance = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBalanceVisible(!isBalanceVisible);
  };

  const cards = [
    {
      id: 0,
      title: 'Available Balance',
      amount: '24,500.00',
      tag: 'Secured by TrustGuard™',
      gradient: 'bg-gradient-to-br from-primary-container to-secondary-container'
    },
    {
      id: 1,
      title: 'Escrow Balance',
      amount: '5,000.00',
      tag: 'Locked in Active Deals',
      gradient: 'bg-[#1A1625] border-white/10'
    },
    {
      id: 2,
      title: 'Pending Release',
      amount: '12,400.00',
      tag: 'Awaiting Buyer Confirmation',
      gradient: 'bg-[#162224] border-white/10'
    }
  ];

  const handleNextCard = () => {
    setActiveIndex((prev) => (prev + 1) % cards.length);
  };

  return (
    <div className="home2-wrapper antialiased font-body-md pb-[100px] bg-[#101415] desktop-radial-bg">
      <div className="max-w-[600px] mx-auto text-on-background relative">
        
        {/* TopAppBar */}
        <header className="w-full top-0 sticky bg-white/5 backdrop-blur-xl transition-opacity duration-200 flex items-center justify-between px-5 h-16 z-40 border-b border-white/10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 cursor-pointer hover:opacity-80 transition-opacity bg-white/10 animate-pulse">
              <img alt="User Profile" loading="lazy" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC94k3VGb5Ss-S0hfQJQZMduDlYwYtUq4hc3XsEG8u3BYRn--UK6_TThC-w6Lxk5i6XsVgHBS5hZBCItX1-PkRAO3eVBCPdVf_fl3VyD1KMmiKqdWVUPDK9SMwXgODxt62vKNI_2U32jm7ZzmXRpQrH-LSGsw2oUFN5Julm6bk6b7pgfRZhwGExiI-KkZDwjl6eGyLmiH32Q2N1vQ9mqeQs2UXMpeRpOOze3ZoIM3sRVrdsr58NuAsRVEzDCf8y2Tr09O44yDtcuxVh"/>
            </div>
            <h1 className="font-headline-lg-mobile text-[24px] font-bold text-white hover:opacity-80 transition-opacity cursor-pointer">TrustFund</h1>
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
                        {isBalanceVisible || position !== 0 ? card.amount : '••••••••'}
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
                <span className="material-symbols-outlined text-white">lock_outline</span>
              </div>
              <span className="font-label-sm text-white/60 group-hover:text-white transition-colors text-xs text-center">Lock</span>
            </Link>

            <Link to="#" className="flex flex-col items-center gap-3 group">
              <div className="w-14 h-14 rounded-2xl glass-button flex items-center justify-center group-hover:bg-white/10 transition-all group-active:scale-90">
                <span className="material-symbols-outlined text-white">output</span>
              </div>
              <span className="font-label-sm text-white/60 group-hover:text-white transition-colors text-xs text-center">Withdraw</span>
            </Link>

            <Link to="#" className="flex flex-col items-center gap-3 group">
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
              {/* Deal Item 1 */}
              <Link to="/orders/1" className="glass-container rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.06] transition-all cursor-pointer active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/20 shrink-0 animate-pulse">
                    <img alt="Deal Avatar" loading="lazy" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1i5Hqqd1pQSV9eYplnqM7xezicFeKBKQvZhG3YaID8nz7lA3OHlH0U6y2bSq1Yu-z9QVIzpP0kSCkKCGRYoowOiky2tlxhUbTASVryQuRKe_xiF_hoASaKUSDI9x1T2TerkY7qXcpCZoeyUOE5t1HZJ0eZ3-_eK-QlOvmmo1rW9PXfethwePQNvJViJb-6R1oDjzi12bOKSXw1WWVLvHHfLJcov-wmYNLonldzeXLtlJ9ZsnqqMh__uWaP1dcOzrKcOx4caa7py0W"/>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-md text-white font-medium">@alex_chen</span>
                    <span className="font-label-sm text-white/50 text-xs">Rolex Submariner</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-body-md text-white font-semibold">₦12,400.00</span>
                  <div className="bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">IN TRANSIT</div>
                </div>
              </Link>

              {/* Deal Item 2 */}
              <Link to="/orders/2" className="glass-container rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.06] transition-all cursor-pointer active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/20 shrink-0 animate-pulse">
                    <img alt="Deal Avatar" loading="lazy" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFYtuYxBk9p4vqNrIF-XHdz0uqIEdYFYAE2FcBT7JIwJWHc5Nam8nWB7jPaGNlx2qa1vThU0Gt9MIarxTv1jf7-0u2Ss04G2a1-yHvrct3I9cXq0Hh0RflbJ013f-RBM5RlkuiANChVylaQOq40jkhf9ug85eUNc4O1Ypp1ataVlfj1QF7JpR5mM1SxIH5FjZbsswq_k3CYrspDBovEM1KAJlSqXj8Ju71PYGbtKU6MJQdnw_8OdeGipXrEJnLhEw2RG9-tiJtJouo"/>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-md text-white font-medium">@sarah_j</span>
                    <span className="font-label-sm text-white/50 text-xs">Vintage Porsche Deposit</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-body-md text-white font-semibold">₦5,000.00</span>
                  <div className="bg-white/10 text-white/80 border border-white/20 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">LOCKED</div>
                </div>
              </Link>

              {/* Deal Item 3 */}
              <Link to="/orders/3" className="glass-container rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.06] transition-all cursor-pointer active:scale-[0.98] opacity-70">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/20 shrink-0 animate-pulse">
                    <img alt="Deal Avatar" loading="lazy" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLKrj0jYZ0G0EkL8atq85fsaED403aVrn7rcN8354ACYUh3xCXc1THZ8B5xqFlF48DX7g_ClBgJHGAH4IHTA4D8KoBf2hx81MdERJb60CvjHpCfSc3i3dJUCfTkIID4WimW7qB2xV-qYdPn_GlaNfVxBltGgOdtjNqxZk9gQuqyEAhqSzBMCOU1Ea5LcdIBNfgUxtx9Y6XRmyKwiNx-M3Nc86t09u0vOHchuNZViJZw_taV03lNPE_IIcTMIB0Sz4-qMOMsmFXATiq"/>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-md text-white font-medium">@dev_mike</span>
                    <span className="font-label-sm text-white/50 text-xs">Freelance Dev Milestone</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-body-md text-white font-semibold">₦3,200.00</span>
                  <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">COMPLETED</div>
                </div>
              </Link>
            </div>
          </section>

        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default Home;
