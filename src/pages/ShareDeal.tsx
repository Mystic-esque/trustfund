import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import './ShareDeal.css';

const ShareDeal = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (err: any) {
        toast.error('Failed to load deal link');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const shareUrl = order ? `${window.location.origin}/o/${order.link_slug}` : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TrustFund Escrow Deal',
          text: `Pay securely for ${order?.item_name || 'this deal'} via TrustFund Escrow:`,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopy();
    }
  };

  const handleSocialShare = (platform: string) => {
    const text = encodeURIComponent(`Pay securely for ${order?.item_name || 'this deal'} via TrustFund Escrow: ${shareUrl}`);
    let url = '';
    
    switch (platform) {
      case 'WhatsApp':
        url = `https://wa.me/?text=${text}`;
        break;
      case 'Twitter':
        url = `https://twitter.com/intent/tweet?text=${text}`;
        break;
      case 'Telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Pay securely via TrustFund Escrow')}`;
        break;
      default:
        handleCopy();
        return;
    }
    setTimeout(() => {
      window.open(url, '_blank');
    }, 500);
  };

  return (
    <div className="bg-[#131313] text-[#e5e2e1] font-body-md overflow-hidden min-h-screen">
      {/* Background Screen Context (Obscured) */}
      <div className="fixed inset-0 z-0">
        <img 
          className="w-full h-full object-cover opacity-30 grayscale blur-sm" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCv8-Gjrv6sZhlMgDfZ68CWrw2ghaIVJg72dZ5TUFKMFJrMnuHpsh9_rRHXi5bBXThP97_NWRO5oB98DXkRitCyUC9kJPxVFg8ZtJLwHdGhyJ7cGZM59JZa75a5rWzfucTclNz7N5i0bGL6Gd5aJn3Xaf41BvDFTvxDfRCuLr-Tykcj3KLp34hElP5S5CzUmZF3Ukte_3pAI1U69HYnmjsbQKDldoLNkvBTdCdJlMYNGmvKRvNp7kN8CpJb_c42aNWQQ-P-c-0oGG5o" 
          alt="Background" 
        />
      </div>

      {/* Modal Overlay Backdrop */}
      <div className="fixed inset-0 z-10 bg-[#131313]/80 backdrop-blur-sm flex items-end justify-center">
        {/* Premium Modal Wrapper */}
        <div className="relative w-full max-w-[600px] modal-height-share bg-[#201f1f] rounded-t-[32px] border-t border-[#4a4455]/30 flex flex-col animate-slide-up-share shadow-2xl">
          
          {/* Drag Handle for Mobile UX */}
          <div className="w-full flex justify-center py-4">
            <div className="w-12 h-1.5 bg-[#4a4455] rounded-full opacity-50"></div>
          </div>

          {/* Header Section: Link Ready Success State */}
          <div className="px-5 flex flex-col items-center text-center mt-4">
            <div className="w-16 h-16 bg-[#007650] text-[#76ffc2] rounded-full flex items-center justify-center mb-4 shadow-lg shadow-[#007650]/20">
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h1 className="text-2xl font-semibold text-[#e5e2e1] mb-1">Link Ready!</h1>
            <p className="text-[#ccc3d8] font-body-md">Your secure escrow deal link is live and waiting.</p>
          </div>

          {/* Content Area Scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-8 space-y-8 no-scrollbar">
            {/* Section 1: Copy Deal Link */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#e5e2e1] uppercase tracking-widest opacity-60">Copy Deal Link</span>
              </div>
              <div className="flex items-center gap-2 p-1 pl-4 bg-[#2a2a2a] rounded-2xl border border-[#4a4455]/50 focus-within:border-[#d2bbff] transition-colors">
                <span className="material-symbols-outlined text-[#d2bbff]" style={{ fontVariationSettings: "'FILL' 0" }}>link</span>
                <input 
                  className="flex-1 bg-transparent border-none text-[#e5e2e1] focus:ring-0 overflow-ellipsis font-medium" 
                  readOnly 
                  type="text" 
                  value={loading ? 'Generating link...' : shareUrl} 
                />
                <button 
                  className="bg-[#7c3aed] hover:bg-[#6f00be] text-[#ede0ff] px-6 py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50" 
                  onClick={handleCopy}
                  disabled={loading}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </section>

            {/* Section 2: Social Commerce / Direct to DMs */}
            <section className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 w-full">
                  <div className="flex-1 h-[1px] bg-[#4a4455]/30"></div>
                  <span className="text-xs font-medium text-[#ccc3d8] uppercase tracking-[0.2em] whitespace-nowrap">OR SEND DIRECTLY VIA</span>
                  <div className="flex-1 h-[1px] bg-[#4a4455]/30"></div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {/* WhatsApp */}
                  <button onClick={() => handleSocialShare('WhatsApp')} className="flex flex-col items-center gap-2 p-4 bg-[#353534]/30 hover:bg-[#353534]/50 rounded-2xl border border-[#4a4455]/10 transition-all active:scale-95 backdrop-blur-sm">
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-transparent">
                      <svg viewBox="0 0 24 24" width="48" height="48">
                        <path fill="#25D366" d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.83 3.08 1.26 4.79 1.26 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.91-9.91-9.91z"/>
                        <path fill="#FFF" d="M17.5 14.4c-.3-.1-1.8-.9-2-.1-.3-.1-.5-.1-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2.1-.4 0-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1 1-1 2.5s1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/>
                      </svg>
                    </div>
                    <span className="text-xs text-[#ccc3d8] font-medium">WhatsApp</span>
                  </button>
                  
                  {/* Twitter/X */}
                  <button onClick={() => handleSocialShare('Twitter')} className="flex flex-col items-center gap-2 p-4 bg-[#353534]/30 hover:bg-[#353534]/50 rounded-2xl border border-[#4a4455]/10 transition-all active:scale-95 backdrop-blur-sm">
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-transparent">
                      <svg viewBox="0 0 24 24" width="48" height="48">
                        <circle cx="12" cy="12" r="12" fill="#000"/>
                        <path d="M16.6 5h2.1l-4.5 5.2 5.3 7h-4.2l-3.3-4.3-3.7 4.3h-2l4.8-5.5-5.1-6.7h4.3l3 4 3.3-4zm-.7 10.9h1.1l-7.3-10.1h-1.2l7.4 10.1z" fill="#FFF"/>
                      </svg>
                    </div>
                    <span className="text-xs text-[#ccc3d8] font-medium">X (Twitter)</span>
                  </button>
                  
                  {/* Telegram */}
                  <button onClick={() => handleSocialShare('Telegram')} className="flex flex-col items-center gap-2 p-4 bg-[#353534]/30 hover:bg-[#353534]/50 rounded-2xl border border-[#4a4455]/10 transition-all active:scale-95 backdrop-blur-sm">
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-transparent">
                      <svg viewBox="0 0 24 24" width="48" height="48">
                        <circle cx="12" cy="12" r="12" fill="#2AABEE"/>
                        <path d="M4.6 11.9l13.8-5.3c.6-.2 1.1.1.9.9l-2.4 11.2c-.2 1-.8 1.2-1.6.8l-4.4-3.2-2.1 2c-.2.2-.4.4-.8.4l.3-4.5 8.2-7.4c.4-.3-.1-.5-.5-.2l-10.2 6.4-4.4-1.4c-1-.3-1-.9.2-1.4z" fill="#FFF"/>
                      </svg>
                    </div>
                    <span className="text-xs text-[#ccc3d8] font-medium">Telegram</span>
                  </button>

                  {/* More */}
                  <button onClick={handleShare} className="flex flex-col items-center gap-2 p-4 bg-[#353534]/30 hover:bg-[#353534]/50 rounded-2xl border border-[#4a4455]/10 transition-all active:scale-95 backdrop-blur-sm">
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#2a2a2a] text-[#e5e2e1]">
                      <span className="material-symbols-outlined text-3xl">ios_share</span>
                    </div>
                    <span className="text-xs text-[#ccc3d8] font-medium">More</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Info Card */}
            <div className="p-5 rounded-2xl bg-[#6f00be]/10 border border-[#6f00be]/20 flex gap-4 items-start">
              <span className="material-symbols-outlined text-[#ddb7ff]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <div>
                <p className="text-[#ddb7ff] font-semibold text-sm">Trust Guarantee Enabled</p>
                <p className="text-xs text-[#ccc3d8] mt-1 leading-relaxed">This link includes identity verification requirements for the buyer to ensure a safe transaction.</p>
              </div>
            </div>
          </div>

          {/* Footer Action: Share via System */}
          <div className="p-5 pb-10 border-t border-[#4a4455]/10 bg-[#201f1f]">
            <button 
              onClick={handleShare}
              disabled={loading}
              className="w-full bg-[#d2bbff] text-[#3f008e] h-12 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#d2bbff]/90 transition-all active:scale-95 shadow-lg shadow-[#d2bbff]/20 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">share</span>
              Share via System
            </button>
            <button 
              onClick={() => navigate('/home')}
              className="w-full mt-4 text-[#ccc3d8] text-xs font-semibold uppercase tracking-[0.2em] py-2 hover:text-[#e5e2e1] transition-colors"
            >
              Back to Home
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ShareDeal;
