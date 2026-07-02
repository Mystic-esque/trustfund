import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './LockFundsParser.css';

const LockFundsParser = () => {
  const navigate = useNavigate();
  const [link, setLink] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleParse = () => {
    if (!link.trim()) return;
    setIsParsing(true);
    setTimeout(() => {
      navigate('/o/demo-order-123');
    }, 1500);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setLink(text);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  return (
    <div className="min-h-screen text-[#e5e2e1] font-['Hanken_Grotesk'] flex flex-col" style={{ background: 'radial-gradient(circle at top right, #1a1a2e 0%, #0a0a0a 100%)' }}>


      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-[#4a4455]/20 bg-[#131313]/80">
        <div className="flex items-center justify-between px-5 h-16 w-full max-w-[600px] mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="active:scale-95 transition-transform duration-200 text-[#ccc3d8] hover:bg-[#3a3939]/10 p-2 rounded-full flex items-center justify-center"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-[24px] font-semibold tracking-tight">Lock Funds</h1>
          </div>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 pt-24 pb-32 px-5 w-full max-w-[600px] mx-auto space-y-8 z-10">
        {/* Hero Section */}
        <section className="text-center space-y-4 pt-4">
          <div className="relative inline-block">
            <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center" style={{ background: 'rgba(32, 31, 31, 0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(210, 187, 255, 0.1)', boxShadow: '0 0 20px rgba(210, 187, 255, 0.15)' }}>
              <span className="material-symbols-outlined text-[#d2bbff] text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#007650] rounded-full p-1.5 border-2 border-[#131313]">
              <span className="material-symbols-outlined text-[#76ffc2] text-sm" style={{ fontVariationSettings: "'wght' 700" }}>verified_user</span>
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-[28px] font-semibold text-[#e5e2e1]">Secure Lock-in</h2>
            <p className="text-[16px] text-[#ccc3d8] max-w-[280px] mx-auto">Paste the deal link shared by the seller.</p>
          </div>
        </section>

        {/* Input Section */}
        <section className="space-y-6">
          <div className="rounded-[24px] p-6 space-y-6" style={{ background: 'rgba(32, 31, 31, 0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(210, 187, 255, 0.1)' }}>
            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-[#d2bbff] tracking-widest block uppercase" htmlFor="deal-link">
                Deal Identifier Link
              </label>
              <div className="relative">
                <textarea 
                  id="deal-link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://trustfund.io/d/..."
                  rows={3}
                  className="w-full bg-[#1c1b1b]/50 border border-[#4a4455]/30 rounded-xl px-4 py-4 text-[16px] text-[#e5e2e1] placeholder:text-[#ccc3d8]/40 focus:ring-1 focus:ring-[#d2bbff] focus:border-[#d2bbff] transition-all resize-none outline-none"
                ></textarea>
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  {link && (
                    <button 
                      onClick={() => setLink('')}
                      className="bg-[#353534] hover:bg-[#3a3939] text-[#e5e2e1] w-8 h-8 rounded-full transition-colors flex items-center justify-center border border-[#4a4455]/20 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                  <button 
                    onClick={handlePaste}
                    className="bg-[#353534] hover:bg-[#3a3939] text-[#e5e2e1] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 border border-[#4a4455]/20 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">content_paste</span>
                    <span className="text-xs font-semibold">Paste</span>
                  </button>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleParse}
              disabled={!link.trim() || isParsing}
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #490080 100%)' }}
              className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 text-white text-[24px] font-semibold transition-transform shadow-lg shadow-[#d2bbff]/20 ${!link.trim() || isParsing ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}`}
            >
              {isParsing ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[24px]">autorenew</span>
                  <span className="text-[20px]">Parsing...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[24px]">security</span>
                  <span className="text-[20px]">Securely Parse Link</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* High-Fidelity Security Badges */}
        <section className="grid grid-cols-3 gap-4 pt-4">
          <div className="rounded-2xl p-4 flex flex-col items-center text-center space-y-2 border border-[#d2bbff]/5" style={{ background: 'rgba(32, 31, 31, 0.4)', backdropFilter: 'blur(12px)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(124, 58, 237, 0.2)' }}>
              <span className="material-symbols-outlined text-[#d2bbff]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-tighter text-[#ccc3d8]">Verified</span>
          </div>
          <div className="rounded-2xl p-4 flex flex-col items-center text-center space-y-2 border border-[#4edea3]/5" style={{ background: 'rgba(32, 31, 31, 0.4)', backdropFilter: 'blur(12px)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 118, 80, 0.2)' }}>
              <span className="material-symbols-outlined text-[#4edea3]" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-tighter text-[#ccc3d8]">Secured</span>
          </div>
          <div className="rounded-2xl p-4 flex flex-col items-center text-center space-y-2 border border-[#ddb7ff]/5" style={{ background: 'rgba(32, 31, 31, 0.4)', backdropFilter: 'blur(12px)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(111, 0, 190, 0.2)' }}>
              <span className="material-symbols-outlined text-[#ddb7ff]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-tighter text-[#ccc3d8]">Encrypted</span>
          </div>
        </section>

      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default LockFundsParser;
