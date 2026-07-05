import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

const getIconForType = (type: string) => {
  switch (type) {
    case 'payment': return { icon: 'payments', color: 'text-[#4edea3]', bg: 'bg-[#003824]' };
    case 'order': return { icon: 'local_shipping', color: 'text-[#d2bbff]', bg: 'bg-[#3f008e]' };
    case 'dispute': return { icon: 'gavel', color: 'text-[#ffb4ab]', bg: 'bg-[#93000a]' };
    case 'system': return { icon: 'info', color: 'text-[#ddb7ff]', bg: 'bg-[#490080]' };
    default: return { icon: 'notifications', color: 'text-[#ccc3d8]', bg: 'bg-[#353534]' };
  }
};

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen selection:bg-[#7c3aed] selection:text-white pb-32 font-body-md">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#131313]/80 backdrop-blur-md border-b border-[#4a4455]/30 shadow-sm h-16 flex justify-between items-center px-5 max-w-[600px] left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/home')}
            className="p-2 -ml-2 rounded-full hover:bg-[#353534]/50 transition-colors active:scale-95 duration-150"
          >
            <span className="material-symbols-outlined text-[#d2bbff]">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-[24px] font-bold text-[#d2bbff]">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-[12px] font-label-sm uppercase tracking-widest text-[#d2bbff] hover:bg-[#353534]/50 px-3 py-1.5 rounded-full transition-colors active:scale-95"
          >
            Mark all read
          </button>
        )}
      </header>

      <main className="max-w-[600px] mx-auto pt-20 px-5 space-y-4">
        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="w-8 h-8 border-4 border-[#d2bbff] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-32 text-[#ccc3d8]">
            <div className="w-24 h-24 rounded-full bg-[#201f1f] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[40px] text-[#4a4455]">notifications_off</span>
            </div>
            <p className="font-headline-md text-[20px] font-bold">No notifications yet</p>
            <p className="text-[14px] opacity-70 mt-2">When you get updates, they'll show up here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const { icon, color, bg } = getIconForType(notification.type);
              return (
                <div 
                  key={notification.id}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification.id);
                    if (notification.order_id) navigate(`/orders/${notification.order_id}`);
                  }}
                  className={`p-4 rounded-2xl flex gap-4 cursor-pointer transition-all active:scale-[0.98] ${
                    notification.read 
                      ? 'bg-[#1c1b1b] border border-transparent opacity-80' 
                      : 'bg-[#201f1f] border border-[#d2bbff]/30 shadow-[0_0_15px_rgba(210,187,255,0.05)]'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined ${color}`}>{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className={`font-bold text-[16px] truncate ${notification.read ? 'text-[#e5e2e1]' : 'text-[#d2bbff]'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-[#7c3aed] shrink-0 mt-2 shadow-[0_0_8px_rgba(124,58,237,0.8)]"></div>
                      )}
                    </div>
                    <p className="text-[#ccc3d8] text-[14px] leading-relaxed line-clamp-2">
                      {notification.body}
                    </p>
                    <p className="text-[#958da1] text-[11px] font-medium tracking-wide mt-2">
                      {new Date(notification.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
