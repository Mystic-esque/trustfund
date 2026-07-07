import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function CompactAuth() {
  const navigate = useNavigate();
  const { slug } = useParams();
  
  const [isSignIn, setIsSignIn] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!slug) return;
        
        // Try fetching by link_slug
        const { data: orderData, error: orderError } = await supabase
          .from('order_details_view')
          .select('*')
          .eq('link_slug', slug)
          .single();

        let finalOrderData = orderData;

        if (orderError) {
          // Fallback to id
          const { data: orderById, error: idError } = await supabase
            .from('order_details_view')
            .select('*')
            .eq('id', slug)
            .single();
          
          if (idError) throw idError;
          finalOrderData = orderById;
        }

        setOrder(finalOrderData);
      } catch (err) {
        console.error('Error fetching order for auth context:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isSignIn) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      } else {
        // Sign Up
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
            }
          }
        });
        if (authError) throw authError;

        const userId = authData.user?.id;
        if (userId) {
          // Provision virtual account (matches SignUp.tsx logic)
          await supabase.functions.invoke('provision-virtual-account', {
            body: { userId, userFullName: fullName }
          });
        }
      }

      // Success
      toast.success(isSignIn ? 'Welcome back!' : 'Account created successfully!');
      
      // Navigate to lock funds with preserving context
      if (order?.id) {
        navigate(`/orders/${order.id}/lock`);
      } else {
        navigate('/');
      }

    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen flex flex-col items-center bg-[#0a0a0c] text-on-surface font-body-md relative overflow-x-hidden">
      {/* Aurora Background */}
      <div 
        className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 20% 30%, rgba(168, 85, 247, 0.12) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(62, 60, 143, 0.15) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(16, 20, 21, 1) 0%, rgba(11, 15, 16, 1) 100%)'
        }}
      ></div>

      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-5 h-16 bg-background/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
          <span className="text-xl font-bold text-on-surface tracking-tight">TrustFund</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">person</span>
        </div>
      </header>

      <main className="w-full max-w-[480px] mt-24 mb-8 px-5 flex flex-col gap-6 items-center animate-in fade-in duration-700 z-10 relative">
        {/* Compact Order Context (Mini-Banner) */}
        {order && (
          <section className="w-full bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-dim border border-white/5">
              <img 
                className="w-full h-full object-cover" 
                alt={order.item_name} 
                src={order.item_image_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAn5qFjUGn4Vig4jLu0qNzVtLARjasvu_JvDtt3MO5DHwfSM6GhTfGch3CzbHtP8nEwoRc9TEe9qxEsMCyx8s02g6e9kKBBlB3WZty7TZHJA8zA4Zkgmm_2uGw4NTd_AEdIfA5n072ieORhSzzoOFcUs5TPfsEBfYIKznCRnaiZEX3TdkTeQdfRzPROe9acL73qpsu7nTWRCOY246oISruRJ0x8mHfB-KtV9eRYBQnYhvAO7jN7CXCNs-zX5196UJ61qyfZHhdp1B8m"}
              />
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-primary/20 text-primary border border-primary/30 tracking-wider">SECURED ORDER</span>
              </div>
              <h3 className="text-sm font-semibold text-on-surface truncate">{order.item_name}</h3>
              <p className="text-[11px] text-on-surface-variant opacity-60 truncate">Seller: {order.vendor?.full_name || 'Vendor'}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base font-bold text-primary">₦{order.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </section>
        )}

        <section className="text-center mt-2">
          <h1 className="text-lg font-semibold text-on-surface tracking-tight">
            {isSignIn ? "Sign in to secure this deal" : "Create an account to secure this deal"}
          </h1>
        </section>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-4">
            {!isSignIn && (
              <>
                {/* Full Name */}
                <div className="relative">
                  <label className="text-[11px] font-bold text-primary uppercase tracking-widest ml-1 mb-1.5 block">Full Name</label>
                  <input 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name" 
                    className="w-full h-12 px-4 py-3 bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-white outline-none transition-all" 
                    placeholder="Enter your full name" 
                    type="text"
                  />
                </div>
                
                {/* Phone Number */}
                <div className="relative">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1 mb-1.5 block">Phone Number</label>
                  <input 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel" 
                    className="w-full h-12 px-4 py-3 bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-white outline-none transition-all" 
                    placeholder="0800 000 0000" 
                    type="tel"
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div className="relative">
              <label className={`text-[11px] font-bold uppercase tracking-widest ml-1 mb-1.5 block ${isSignIn ? 'text-primary' : 'text-on-surface-variant'}`}>Email</label>
              <input 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" 
                className="w-full h-12 px-4 py-3 bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-white outline-none transition-all" 
                placeholder="you@example.com" 
                type="email"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest ml-1 mb-1.5 block">Password</label>
              <div className="relative">
                <input 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignIn ? "current-password" : "new-password"} 
                  className="w-full h-12 px-4 py-3 bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-white outline-none transition-all pr-12" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full h-12 bg-primary text-[#2c0051] font-semibold rounded-2xl shadow-[0_0_24px_rgba(168,85,247,0.35)] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50" 
            type="submit"
          >
            {isSubmitting ? 'Processing...' : (isSignIn ? 'Sign In' : 'Create Account')}
            {!isSubmitting && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
          </button>
        </form>

        <p className="text-xs text-on-surface-variant mt-2">
          {isSignIn ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            type="button"
            onClick={() => setIsSignIn(!isSignIn)}
            className="text-primary font-bold hover:underline"
          >
            {isSignIn ? "Sign Up" : "Sign In"}
          </button>
        </p>

        {/* Trust Badges */}
        <footer className="w-full mt-6 flex flex-col items-center gap-4 border-t border-white/10 pt-6">
          <div className="flex flex-wrap justify-center gap-4 px-2 opacity-50">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">encrypted</span>
              <span className="text-[9px] font-bold uppercase tracking-wider">Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span className="text-[9px] font-bold uppercase tracking-wider">Buyer Protection</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">shield</span>
              <span className="text-[9px] font-bold uppercase tracking-wider">NDIC Insured</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
