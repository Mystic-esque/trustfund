import { Link, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-50">
      <nav className="bg-[#101415]/85 backdrop-blur-2xl border border-white/10 rounded-full h-16 flex items-center justify-around px-2 shadow-2xl overflow-visible">
        
        {/* Home */}
        <Link to="/home" className={`flex flex-col items-center justify-center px-3 transition-transform active:scale-90 ${currentPath === '/home' ? 'text-primary' : 'text-white/60 hover:text-white'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentPath === '/home' ? "'FILL' 1" : "'FILL' 0" }}>home</span>
          <span className="font-label-sm text-[10px] mt-0.5">Home</span>
        </Link>

        {/* Deals (Originally Explore) */}
        <Link to="/orders" className={`flex flex-col items-center justify-center px-3 transition-transform active:scale-90 ${currentPath === '/orders' ? 'text-primary' : 'text-white/60 hover:text-white'}`}>
          <span className="material-symbols-outlined">handshake</span>
          <span className="font-label-sm text-[10px] mt-0.5">Deals</span>
        </Link>

        {/* Vibrant Add Button */}
        <Link to="/orders/new" className="w-14 h-14 -mt-8 rounded-full bg-gradient-to-br from-primary-container to-secondary-container shadow-lg shadow-primary/30 flex items-center justify-center text-white ring-4 ring-[#101415]/50 transition-all hover:scale-110 active:scale-90">
          <span className="material-symbols-outlined text-[32px]">add</span>
        </Link>

        {/* Chat */}
        <Link to="/orders" className="flex flex-col items-center justify-center text-white/60 hover:text-white px-3 transition-transform active:scale-90">
          <span className="material-symbols-outlined">chat_bubble</span>
          <span className="font-label-sm text-[10px] mt-0.5">Chat</span>
        </Link>

        {/* Profile */}
        <Link to="/profile" className={`flex flex-col items-center justify-center px-3 transition-transform active:scale-90 ${currentPath === '/profile' ? 'text-primary' : 'text-white/60 hover:text-white'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentPath === '/profile' ? "'FILL' 1" : "'FILL' 0" }}>person</span>
          <span className="font-label-sm text-[10px] mt-0.5">Profile</span>
        </Link>

      </nav>
    </div>
  );
};

export default BottomNav;
