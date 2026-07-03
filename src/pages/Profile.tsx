import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [activeEscrows, setActiveEscrows] = useState<number>(0);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) setUserData(profile);

      // Fetch active escrows count
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', user.id)
        .in('status', ['ESCROW_LOCKED', 'IN_TRANSIT', 'DELIVERED_PENDING_RELEASE', 'SETTLING', 'DISPUTED']);
      
      setActiveEscrows(count || 0);
    };

    fetchUser();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/signin');
  };

  return (
    <div className="text-on-surface min-h-screen font-body-md pb-[100px]" style={{ background: 'radial-gradient(circle at top right, #1a1a2e 0%, #0a0a0a 100%)' }}>
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#131313]/80 backdrop-blur-md border-b border-outline-variant/10">
        <div className="flex items-center justify-between px-5 h-16 w-full max-w-[600px] mx-auto">
          <div className="w-10 h-10 flex items-center justify-start">
            <button onClick={() => navigate(-1)} className="text-on-surface-variant hover:text-primary transition-colors active:scale-95 duration-150 p-2 -ml-2 rounded-full hover:bg-white/5">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          </div>
          <h1 className="font-headline-md text-xl tracking-tight text-primary font-bold">Profile</h1>
          <div className="w-10 h-10 flex items-center justify-end">
            <button className="relative hover:bg-surface-bright/10 p-1 rounded-full transition-all">
              <span className="material-symbols-outlined text-primary">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-12 w-full max-w-[600px] mx-auto px-5 space-y-8">
        
        {/* Identity Section */}
        <section className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative mb-4 group cursor-pointer">
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-primary/40 to-secondary-container/40 shadow-2xl transition-all group-hover:from-primary group-hover:to-secondary-container">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
                <img alt="User Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJjdDezYwaTshpyTEGshF9s2v6yfgjBdZuAgQUzrvLGSFcLCKb2PFJJ8VrKMo9Aof3eOmFhsb-xp4cB_6BayquKBLpST133QrnfYhHw6mT0JxG2WB_rxeHIAY2R87VgpbCsnZFDrEMQIi-ndATMoL3cztehYtraXlKTdOyN6yIs_O8I9sEPJziwVoI14iwQhoUmNH6dG2tRX6AZt0NWdKOInuNLqHVMnCryJvTiJKecuWlx1D1uNg7rvTBiAvnUVpiGz0D46DaOBO_"/>
              </div>
            </div>
            <div className="absolute bottom-1 right-1 bg-surface-bright text-primary w-9 h-9 rounded-full flex items-center justify-center border-2 border-background shadow-lg group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h2 className="font-headline-lg text-[28px] font-bold tracking-tight">{userData?.full_name || 'Loading...'}</h2>
              <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <p className="text-primary font-body-md font-medium tracking-wide">@{userData?.username || userData?.full_name?.split(' ')[0]?.toLowerCase() || 'user'}</p>
            
            <div className="pt-4 flex flex-col items-center gap-3">
              <button className="px-6 py-2 rounded-full glass-panel-profile border-primary/30 text-primary font-label-lg font-bold hover:bg-primary/10 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">edit_note</span>
                EDIT PROFILE
              </button>
              <div className="glass-panel-profile px-4 py-1.5 rounded-full flex items-center gap-2 bg-primary/5 border-primary/20">
                <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
                <span className="font-label-lg font-bold text-primary tracking-[0.15em] text-[11px]">99 TRUST SCORE</span>
              </div>
            </div>
          </div>
        </section>

        {/* Deal Snapshot */}
        <section className="space-y-3">
          <h3 className="font-label-lg font-bold text-on-surface-variant/60 px-1 uppercase tracking-widest text-[11px]">Deal Snapshot</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative overflow-hidden glass-panel-profile rounded-2xl p-5 aetheric-glow-profile border-primary/10">
              <p className="text-on-surface-variant font-label-sm uppercase tracking-wider mb-2 opacity-60 text-xs">Completed Deals</p>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-[28px] font-bold">{userData?.completed_deals_count || 0}</span>
                <span className="material-symbols-outlined text-tertiary text-lg">check_circle</span>
              </div>
            </div>
            <div className="relative overflow-hidden glass-panel-profile rounded-2xl p-5 border-primary/10">
              <p className="text-on-surface-variant font-label-sm uppercase tracking-wider mb-2 opacity-60 text-xs">Active Escrows</p>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-[28px] font-bold">{activeEscrows}</span>
                <span className="material-symbols-outlined text-secondary text-lg">sync</span>
              </div>
            </div>
          </div>
        </section>

        {/* Financials & Accounts */}
        <section className="space-y-3">
          <h3 className="font-label-lg font-bold text-on-surface-variant/60 px-1 uppercase tracking-widest text-[11px]">Financials</h3>
          <div className="glass-panel-profile rounded-2xl overflow-hidden divide-y divide-outline-variant/5">
            
            {/* Wallet Summary */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-label-sm text-on-surface-variant/60 uppercase tracking-wider text-xs">Wallet Balance</p>
                <p className="font-headline-md text-[24px] font-bold text-primary">₦{Number(userData?.available_balance || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              </div>
              <Link to="/wallet/top-up" className="bg-primary/10 text-primary p-2 rounded-xl border border-primary/20 hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined">add</span>
              </Link>
            </div>

            {/* Transaction History (Added per user request) */}
            <Link to="/wallet" className="flex items-center justify-between p-4 hover:bg-surface-bright/5 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">history</span>
                </div>
                <div>
                  <p className="font-body-md font-semibold">Transaction History</p>
                  <p className="text-label-sm text-on-surface-variant/60 text-xs">View all ins and outs</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:translate-x-1 transition-transform">chevron_right</span>
            </Link>

            {/* Linked Banks */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">account_balance</span>
                  </div>
                  <div>
                    <p className="font-body-md font-semibold">{userData?.bank_name || 'Add Bank Account'}</p>
                    <p className="text-label-sm text-on-surface-variant/60 text-xs">{userData?.bank_account_number ? `**** ${userData.bank_account_number.slice(-4)}` : 'No bank linked'}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant/40">chevron_right</span>
              </div>
              <button className="w-full py-3 rounded-xl border border-dashed border-outline-variant/30 flex items-center justify-center gap-2 text-on-surface-variant/60 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all">
                <span className="material-symbols-outlined text-sm">add_circle</span>
                <span className="font-label-lg font-bold text-sm">ADD BANK ACCOUNT</span>
              </button>
            </div>
          </div>
        </section>

        {/* Verification & Logistics */}
        <section className="space-y-3">
          <h3 className="font-label-lg font-bold text-on-surface-variant/60 px-1 uppercase tracking-widest text-[11px]">Verification & Logistics</h3>
          <div className="glass-panel-profile rounded-2xl overflow-hidden divide-y divide-outline-variant/5">
            <Link to="/profile/verification" className="flex items-center justify-between p-4 hover:bg-surface-bright/5 transition-colors cursor-pointer group block">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined">verified_user</span>
                </div>
                <div>
                  <p className="font-body-md font-semibold text-white">Verification Level</p>
                  <p className="text-label-sm text-tertiary text-xs mt-0.5">Tier 3 • Full Merchant Rights</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:translate-x-1 transition-transform">chevron_right</span>
            </Link>
            
            <div className="flex items-center justify-between p-4 hover:bg-surface-bright/5 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">local_shipping</span>
                </div>
                <div>
                  <p className="font-body-md font-semibold">Shipping Addresses</p>
                  <p className="text-label-sm text-on-surface-variant/60 text-xs mt-0.5">2 Addresses Saved</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:translate-x-1 transition-transform">chevron_right</span>
            </div>
          </div>
        </section>

        {/* Account Settings */}
        <section className="space-y-3">
          <h3 className="font-label-lg font-bold text-on-surface-variant/60 px-1 uppercase tracking-widest text-[11px]">Account Settings</h3>
          <div className="glass-panel-profile rounded-2xl overflow-hidden divide-y divide-outline-variant/5">
            <div className="flex items-center justify-between p-4 hover:bg-surface-bright/5 cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant/60">
                  <span className="material-symbols-outlined">fingerprint</span>
                </div>
                <p className="font-body-md font-semibold">Security & Biometrics</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:translate-x-1 transition-transform">chevron_right</span>
            </div>
            <div className="flex items-center justify-between p-4 hover:bg-surface-bright/5 cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant/60">
                  <span className="material-symbols-outlined">notifications_active</span>
                </div>
                <p className="font-body-md font-semibold">Notifications</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:translate-x-1 transition-transform">chevron_right</span>
            </div>
            <div className="flex items-center justify-between p-4 hover:bg-surface-bright/5 cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant/60">
                  <span className="material-symbols-outlined">help</span>
                </div>
                <p className="font-body-md font-semibold">Help & Support</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:translate-x-1 transition-transform">chevron_right</span>
            </div>
          </div>
        </section>

        {/* Sign Out */}
        <button 
          onClick={handleSignOut}
          className="w-full p-5 flex items-center justify-center gap-2 text-error hover:bg-error/5 transition-colors group rounded-2xl border border-error/10 mt-6 active:scale-[0.98] duration-200"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label-lg font-bold uppercase tracking-widest text-sm">Sign Out</span>
        </button>

        {/* App Version */}
        <p className="text-center text-label-sm text-on-surface-variant/20 py-4 pb-4 text-xs font-medium">TrustFund v2.4.0 • Enterprise Secured</p>

      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
