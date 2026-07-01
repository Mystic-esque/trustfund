import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Onboarding.css';

const slides = [
  {
    id: 0,
    title: 'Secure Your',
    highlight: 'Social Commerce',
    description: 'TrustFund eliminates the trust deadlock in DM-based commerce with professional-grade escrow.',
    pills: [
      { icon: 'verified_user', text: 'Escrow Protected' },
      { icon: 'lock', text: 'High Stakes Security' }
    ],
    bgImage: '/images/onboarding/bg-1.png'
  },
  {
    id: 1,
    title: 'Dedicated',
    highlight: 'Virtual Accounts',
    description: 'Every user gets a secure Nomba virtual account. Top up instantly to lock funds for any deal.',
    pills: [
      { icon: 'account_balance', text: 'Instant Funding' },
      { icon: 'credit_card', text: 'Dedicated NUBAN' }
    ],
    bgImage: '/images/onboarding/bg-2.png'
  },
  {
    id: 2,
    title: 'Link, Lock,',
    highlight: 'and Release',
    description: 'Generate secure deal links for your DMs. Funds are only released when delivery is confirmed.',
    pills: [
      { icon: 'link', text: 'One-Click Links' },
      { icon: 'package_2', text: 'Verified Delivery' }
    ],
    bgImage: '/images/onboarding/bg-3.png'
  }
];

const Onboarding = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 4500); // Increased slightly so users can appreciate the animation
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-surface-container-lowest text-on-surface font-body-md selection:bg-primary/30 antialiased overflow-hidden h-[100dvh] relative">
      {/* Background Layer: Cinematic Cross-fading */}
      <div className="fixed inset-0 z-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`bg-transition absolute inset-0 bg-cover bg-center ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url('${slide.bgImage}')` }}
          />
        ))}
        {/* Dark Overlay for Readability */}
        <div className="absolute inset-0 overlay-gradient z-10" />
      </div>

      {/* Main Onboarding Content Shell */}
      <main className="relative z-20 h-full flex flex-col justify-between items-center px-5 py-8 md:py-12 md:max-w-[600px] mx-auto text-center">
        {/* Logo Header */}
        <header className="w-full animate-fade-in flex-shrink-0 mt-4 md:mt-6">
          <img 
            alt="TrustFund Logo" 
            className="h-[64px] md:h-[80px] mx-auto object-contain drop-shadow-[0_0_24px_rgba(124,58,237,0.4)]" 
            src="/images/logo.svg"
          />
        </header>

        {/* Dynamic Content Carousel */}
        <div className="w-full flex-grow relative flex flex-col justify-center min-h-[300px] max-h-[420px] my-6">
          <div className="relative w-full h-full flex flex-col justify-center">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`slide-container ${index === currentIndex ? 'active' : ''}`}
              >
                <div className="animate-slide-up opacity-0 w-full">
                  <h1 className="font-headline-lg-mobile text-[34px] leading-[42px] md:text-display-lg md:leading-tight text-white mb-4 tracking-tight drop-shadow-lg">
                    {slide.title} <br />
                    <span className="text-primary">{slide.highlight}</span>
                  </h1>
                  <p className="font-body-md text-[15px] leading-relaxed text-on-surface-variant mb-8 max-w-[280px] md:max-w-[340px] mx-auto drop-shadow-md">
                    {slide.description}
                  </p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-3 w-full">
                  {slide.pills.map((pill, pIndex) => (
                    <span 
                      key={pIndex} 
                      className={`glass-pill px-4 py-2.5 rounded-full font-label-lg text-[13px] flex items-center gap-2 animate-pill-${pIndex + 1}`}
                    >
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>
                        {pill.icon}
                      </span>
                      {pill.text}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-2 mt-auto pt-8 pb-4 z-10 relative">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                  index === currentIndex ? 'w-8 bg-primary shadow-[0_0_8px_rgba(124,58,237,0.6)]' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Sticky Bottom Actions */}
        <div className="w-full flex flex-col items-center gap-4 pb-4 md:pb-8 flex-shrink-0">
          <Link
            to="/signup"
            className="w-full max-w-sm py-4 bg-primary-container text-on-primary-container font-label-lg text-[15px] rounded-xl glow-button hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 block text-center shadow-lg"
          >
            Create Secure Account
          </Link>
          <Link
            to="/signin"
            className="font-label-lg text-[15px] text-on-surface-variant hover:text-white transition-colors flex items-center gap-1 group py-2"
          >
            Log in to existing account
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" style={{ fontSize: '18px' }}>
              arrow_forward
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
