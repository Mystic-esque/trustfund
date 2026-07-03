import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import './Auth.css';

const SignIn = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      toast.success('Signed in successfully! Redirecting...');
      
      const redirectUrl = searchParams.get('redirect') || '/home';
      setTimeout(() => {
        navigate(redirectUrl);
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container relative z-10 flex flex-col items-center justify-center min-h-screen px-5 md:px-16 py-8 text-on-surface">
      {/* Midnight Aurora Animation */}
      <div 
        className="aurora-bg"
        style={{
          background: `
            radial-gradient(circle at ${20 + (mousePos.x * 10)}% ${30 + (mousePos.y * 10)}%, rgba(64, 0, 113, 0.4) 0%, transparent 50%),
            radial-gradient(circle at ${80 - (mousePos.x * 10)}% ${70 - (mousePos.y * 10)}%, rgba(132, 43, 210, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(16, 20, 21, 1) 0%, rgba(11, 15, 16, 1) 100%)
          `
        }}
      ></div>

      {/* Brand Identity Section */}
      <header className="flex flex-col items-center mb-10 animate-fade-in">
        <div className="w-14 h-14 glass-panel rounded-xl flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 rounded-xl glass-stroke"></div>
          <img src="/images/logo.svg" alt="TrustFund Logo" className="w-8 h-8 object-contain" />
        </div>
        <h1 className="font-headline-lg-mobile md:font-headline-lg tracking-tight text-white mb-2">Welcome Back</h1>
        <p className="font-body-md text-on-surface-variant/80">Access your digital asset vault</p>
      </header>

      {/* Login Form Container */}
      <div className="w-full max-w-md glass-panel p-8 md:p-10 rounded-[2rem] relative z-10">
        <div className="absolute inset-0 rounded-[2rem] glass-stroke opacity-50 pointer-events-none"></div>
        <form className="space-y-6" onSubmit={handleSignIn}>
          
          {/* Email Input */}
          <div className="group">
            <label className="block font-label-sm text-primary mb-2 ml-1">Email Address</label>
            <div className="relative">
              <input 
                className="w-full bg-black/20 border-b border-white/10 px-4 py-3 text-white font-body-md placeholder:text-on-surface-variant/40 transition-all duration-300 focus:bg-white/5 focus:border-primary focus:outline-none rounded-t-lg" 
                placeholder="elias@example.com" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="group">
            <div className="flex justify-between items-center mb-2">
              <label className="font-label-sm text-primary ml-1">Password</label>
              <a className="font-label-sm text-on-surface-variant/60 hover:text-primary transition-colors" href="#" onClick={(e) => { e.preventDefault(); toast.error('Reset password flow not implemented yet'); }}>Forgot Password?</a>
            </div>
            <div className="relative">
              <input 
                className="w-full bg-black/20 border-b border-white/10 px-4 py-3 text-white font-body-md placeholder:text-on-surface-variant/40 transition-all duration-300 focus:bg-white/5 focus:border-primary focus:outline-none rounded-t-lg pr-12" 
                placeholder="••••••••••••" 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-primary transition-colors" 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {/* Primary Action */}
          <button 
            className={`w-full py-4 px-6 font-title-md rounded-xl transition-all duration-200 mt-4 flex items-center justify-center gap-2 ${isLoading ? 'bg-primary/50 text-white/50 cursor-not-allowed' : 'bg-primary text-on-primary violet-glow hover:opacity-90 active:scale-95'}`} 
            type="submit"
            disabled={isLoading}
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            {!isLoading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="h-[1px] flex-1 bg-white/10"></div>
          <span className="font-label-sm text-on-surface-variant/40">OR CONTINUE WITH</span>
          <div className="h-[1px] flex-1 bg-white/10"></div>
        </div>

        {/* Social Logins */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            className="glass-panel flex items-center justify-center gap-3 py-3 rounded-xl hover:bg-white/10 transition-colors relative"
            onClick={() => toast.success('Connecting to Google...')}
          >
            <div className="absolute inset-0 rounded-xl glass-stroke pointer-events-none"></div>
            <div className="w-5 h-5 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
            </div>
            <span className="font-label-sm text-white">Google</span>
          </button>
          <button 
            className="glass-panel flex items-center justify-center gap-3 py-3 rounded-xl hover:bg-white/10 transition-colors relative"
            onClick={() => toast.success('Connecting to Apple...')}
          >
            <div className="absolute inset-0 rounded-xl glass-stroke pointer-events-none"></div>
            <div className="w-5 h-5 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-5 h-5 fill-current text-white">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
              </svg>
            </div>
            <span className="font-label-sm text-white">Apple</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
        <p className="font-body-md text-on-surface-variant/60">
          Don't have an account? 
          <Link className="text-primary font-bold hover:underline decoration-primary/30 underline-offset-4 ml-1" to="/signup">Sign up</Link>
        </p>
      </footer>
    </div>
  );
};

export default SignIn;
