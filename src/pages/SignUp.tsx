import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import './Auth.css';

const SignUp = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted || isLoading) return;
    setIsLoading(true);

    try {
      // 1. Create auth user using Email instead of Phone
      // We pass name and phone in options.data so the Postgres Trigger can read them
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name,
            phone: phone,
          }
        }
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("No user ID returned");

      // 2. Insert into public.users is now handled by a secure Postgres Trigger automatically!
      
      // 3. Provision virtual account
      const res = await supabase.functions.invoke('provision-virtual-account', {
        body: { userId, userFullName: name }
      });

      if (res.error) {
        console.error("Virtual account provisioning error:", res.error);
        toast.error("Account created but virtual account provisioning failed. Please retry later.");
      } else {
        toast.success('Wallet created successfully! Redirecting...');
      }

      setTimeout(() => {
        navigate('/home');
      }, 1500);

    } catch (err: any) {
      toast.error(err.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container flex flex-col min-h-screen text-on-surface">
      {/* Background Shader Canvas */}
      <div className="fixed inset-0 -z-10 bg-background">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 aurora-blur"
          style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }}
        ></div>
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 aurora-blur"
          style={{ transform: `translate(${mousePos.x * 40}px, ${mousePos.y * 40}px)` }}
        ></div>
      </div>

      {/* Top Navigation Anchor */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-5 md:px-16 h-20 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2 group cursor-pointer">
          <img src="/images/logo.svg" alt="TrustFund Logo" className="h-8 w-8 object-contain" />
          <span className="font-headline-lg-mobile md:font-headline-lg tracking-tighter text-primary">TRUSTFUND</span>
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center px-5 py-24">
        {/* Auth Container */}
        <div className="w-full max-w-[480px] space-y-8 animate-fade-in z-10 relative">
          
          {/* Header Section */}
          <div className="space-y-4 text-center md:text-left">
            <h1 className="font-headline-lg-mobile md:text-[40px] leading-tight text-on-surface tracking-tight">Create Account</h1>
            <p className="font-body-md text-on-surface-variant/80">Begin your journey into the secure aetheric vault.</p>
          </div>

          {/* Registration Form */}
          <form className="space-y-6" onSubmit={handleSignUp}>
            <div className="space-y-4">
              {/* Full Name */}
              <div className="group">
                <label className="block font-label-sm text-on-surface-variant group-focus-within:text-primary transition-colors mb-2 ml-1" htmlFor="name">Full Name</label>
                <input 
                  className="w-full h-14 px-4 rounded-xl input-glass font-body-md text-on-surface placeholder:text-on-surface-variant/30" 
                  id="name" 
                  placeholder="Elias Vance" 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Email Address */}
              <div className="group">
                <label className="block font-label-sm text-on-surface-variant group-focus-within:text-primary transition-colors mb-2 ml-1" htmlFor="email">Email Address</label>
                <input 
                  className="w-full h-14 px-4 rounded-xl input-glass font-body-md text-on-surface placeholder:text-on-surface-variant/30" 
                  id="email" 
                  placeholder="elias@example.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="group">
                <label className="block font-label-sm text-on-surface-variant group-focus-within:text-primary transition-colors mb-2 ml-1" htmlFor="phone">Phone Number</label>
                <input 
                  className="w-full h-14 px-4 rounded-xl input-glass font-body-md text-on-surface placeholder:text-on-surface-variant/30" 
                  id="phone" 
                  placeholder="+2348000000000" 
                  type="tel"
                  pattern="^\+234\d{10}$"
                  title="Phone number must start with +234 followed by 10 digits"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="group relative">
                <label className="block font-label-sm text-on-surface-variant group-focus-within:text-primary transition-colors mb-2 ml-1" htmlFor="password">Password</label>
                <input 
                  className="w-full h-14 px-4 rounded-xl input-glass font-body-md text-on-surface placeholder:text-on-surface-variant/30 pr-12" 
                  id="password" 
                  placeholder="••••••••••••" 
                  type={showPassword ? "text" : "password"}
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button className="absolute right-4 top-[42px] text-on-surface-variant/50 hover:text-primary transition-colors" type="button" onClick={() => setShowPassword(!showPassword)}>
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Terms & Privacy */}
            <div className="flex items-start gap-3 px-1">
              <div className="pt-1">
                <input 
                  className="rounded bg-surface-container-highest border-white/10 text-primary focus:ring-primary/40 focus:ring-offset-background" 
                  id="terms" 
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
              </div>
              <label className="font-label-sm text-on-surface-variant/60 leading-relaxed cursor-pointer" htmlFor="terms">
                I acknowledge the 256-bit encryption protocols and agree to the <a className="text-primary hover:underline" href="#" onClick={(e) => { e.preventDefault(); toast.error('Terms page not available yet'); }}>Terms of Service</a> and <a className="text-primary hover:underline" href="#" onClick={(e) => { e.preventDefault(); toast.error('Privacy page not available yet'); }}>Privacy Charter</a>.
              </label>
            </div>

            {/* Primary Action */}
            <button 
              className={`w-full h-14 rounded-full font-title-md flex items-center justify-center gap-2 transition-all ${(termsAccepted && !isLoading) ? 'primary-glow-btn text-on-primary hover:opacity-90 active:scale-95 group' : 'bg-surface-container-highest text-on-surface-variant/50 cursor-not-allowed opacity-70'}`} 
              type="submit"
              disabled={!termsAccepted || isLoading}
            >
              {isLoading ? 'Creating Wallet...' : 'Create My Wallet'}
              {!isLoading && <span className={`material-symbols-outlined transition-transform ${termsAccepted ? 'group-hover:translate-x-1' : ''}`}>arrow_forward</span>}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 font-label-sm text-on-surface-variant/40">Secure Identity Sync</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          {/* Social Auth Grid */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              className="h-14 rounded-xl glass-surface flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95"
              onClick={() => toast.success('Connecting to Google...')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              <span className="font-body-md text-on-surface">Google</span>
            </button>
            <button 
              className="h-14 rounded-xl glass-surface flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95"
              onClick={() => toast.success('Connecting to Apple...')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-5 h-5 fill-current">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
              </svg>
              <span className="font-body-md text-on-surface">Apple</span>
            </button>
          </div>

          {/* Footer Link */}
          <p className="text-center font-body-md text-on-surface-variant">
            Already have an account? 
            <Link className="text-primary font-semibold hover:text-primary-container transition-colors ml-1" to="/signin">Sign in</Link>
          </p>
        </div>
      </main>

      {/* Side Atmospheric Visual (Desktop only) */}
      <div className="hidden lg:block fixed right-0 top-0 w-1/3 h-full pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] aspect-square">
          <div className="w-full h-full glass-surface rounded-[40px] rotate-[15deg] opacity-20 border border-white/20 animate-float"></div>
          <div className="absolute inset-4 glass-surface rounded-[30px] -rotate-[10deg] opacity-40 border border-white/10"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 text-center px-12">
            <span className="material-symbols-outlined text-primary text-7xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>verified_user</span>
            <div className="space-y-2">
              <h3 className="font-headline-lg text-primary">Vault Security</h3>
              <p className="font-body-lg text-on-surface-variant/70">Your assets are protected by Aetheric Grade end-to-end encryption and decentralized shard storage.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Bottom Gradient */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent pointer-events-none z-0"></div>
    </div>
  );
};

export default SignUp;
