import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInbox } from '../hooks/useInbox';
import BottomNav from '../components/BottomNav';

export default function Messages() {
  const navigate = useNavigate();
  const { chats, loading, currentUser } = useInbox();
  const [filter, setFilter] = useState<'all' | 'active'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter((chat) => {
    if (filter === 'active') {
      if (chat.status === 'SETTLED' || chat.status === 'REFUNDED' || chat.status === 'EXPIRED') return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!chat.other_party_name.toLowerCase().includes(query) && !chat.item_name.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ESCROW_LOCKED':
      case 'IN_TRANSIT':
      case 'DELIVERED_PENDING_RELEASE':
      case 'SETTLING':
        return (
          <div className="mt-2 flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-md bg-[#201f1f] border border-[#4a4455]/50">
            <span className="material-symbols-outlined text-[14px] text-[#4edea3]">lock</span>
            <span className="font-label-sm text-[10px] text-[#4edea3] uppercase tracking-wider">Escrow Active</span>
          </div>
        );
      case 'DISPUTED':
        return (
          <div className="mt-2 flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-md bg-[#93000a]/20 border border-[#93000a]/50">
            <span className="material-symbols-outlined text-[14px] text-[#ffb4ab]">report_problem</span>
            <span className="font-label-sm text-[10px] text-[#ffb4ab] uppercase tracking-wider">Disputed</span>
          </div>
        );
      case 'SETTLED':
        return (
          <div className="mt-2 flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-md bg-[#005236]/20 border border-[#005236]/50">
            <span className="material-symbols-outlined text-[14px] text-[#6ffbbe]">check_circle</span>
            <span className="font-label-sm text-[10px] text-[#6ffbbe] uppercase tracking-wider">Settled</span>
          </div>
        );
      default:
        return null;
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen flex flex-col font-body-md pb-[84px] relative selection:bg-[#7c3aed] selection:text-white">
      
      {/* TopAppBar */}
      <header className="w-full sticky top-0 z-40 bg-[#131313]/80 backdrop-blur-xl border-b border-[#4a4455]/30 flex items-center justify-between px-5 h-16 transition-opacity duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#353534] bg-[#353534]">
            {currentUser?.user_metadata?.avatar_url ? (
              <img src={currentUser.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                {currentUser?.user_metadata?.full_name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <h1 className="font-headline-md text-xl font-bold text-[#d2bbff]">TrustFund</h1>
        </div>
        <button 
          onClick={() => navigate('/notifications')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#353534] transition-colors text-[#ccc3d8] active:scale-95"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-5 py-6 flex flex-col gap-6 max-w-[600px] mx-auto">
        
        {/* Page Title & Search */}
        <div className="flex flex-col gap-4">
          <h2 className="font-headline-lg text-3xl font-semibold text-[#e5e2e1] tracking-tight">Messages</h2>
          
          {/* Search Input */}
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-[#4a4455] group-focus-within:text-[#d2bbff] transition-colors">search</span>
            </div>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1c1b1b] border border-[#4a4455]/50 text-[#e5e2e1] rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-[#d2bbff] focus:ring-1 focus:ring-[#d2bbff] transition-all placeholder-[#4a4455]" 
              placeholder="Search conversations..." 
              type="text" 
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 pt-1">
            <button 
              onClick={() => setFilter('all')}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full font-label-lg transition-all border ${filter === 'all' ? 'bg-[#7c3aed] text-white border-transparent' : 'bg-[#1c1b1b] text-[#ccc3d8] border-[#4a4455]/50 hover:border-[#d2bbff]/50'}`}
            >
              All Chats
            </button>
            <button 
              onClick={() => setFilter('active')}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full font-label-lg transition-all border ${filter === 'active' ? 'bg-[#7c3aed] text-white border-transparent' : 'bg-[#1c1b1b] text-[#ccc3d8] border-[#4a4455]/50 hover:border-[#d2bbff]/50'}`}
            >
              Active Deals
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex flex-col gap-2 mt-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-[#353534] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px] text-[#ccc3d8]">chat</span>
              </div>
              <h3 className="font-headline-md text-lg text-[#e5e2e1] font-bold">No Messages Found</h3>
              <p className="font-body-md text-[#ccc3d8] mt-2 max-w-[250px]">
                {searchQuery ? "No conversations match your search." : "You don't have any active chats yet. Start a deal to begin chatting!"}
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div 
                key={chat.order_id} 
                onClick={() => navigate(`/orders/${chat.order_id}/chat`)}
                className="bg-[rgba(32,31,31,0.6)] backdrop-blur-xl border border-[#4a4455]/30 rounded-2xl p-4 flex gap-4 items-center cursor-pointer hover:bg-[#353534]/50 transition-colors relative group active:scale-[0.98]"
              >
                {/* Unread Indicator Pill */}
                {chat.has_unread && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#7c3aed] rounded-r-full shadow-[0_0_8px_rgba(124,58,237,0.6)]"></div>
                )}
                
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#4a4455] bg-[#353534]">
                    {chat.other_party_avatar ? (
                      <img src={chat.other_party_avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#d2bbff] font-bold">
                        {chat.other_party_name.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  {/* Small Item Image Indicator */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#4edea3] rounded-full border-2 border-[#131313] flex items-center justify-center overflow-hidden">
                    <span className="material-symbols-outlined text-[12px] text-[#003824]">inventory_2</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-label-lg text-[15px] text-[#e5e2e1] font-bold truncate pr-2">{chat.other_party_name}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="font-label-sm text-[11px] text-[#ccc3d8]">{formatTime(chat.latest_message_time)}</span>
                        {chat.has_unread && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#7c3aed] shadow-[0_0_8px_rgba(124,58,237,0.6)]"></div>
                        )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center gap-2">
                    <p className={`font-body-md text-sm truncate ${chat.latest_message_sender_type === 'system' ? 'italic text-[#4edea3]' : 'text-[#ccc3d8]'}`}>
                      {chat.latest_message_content || `Deal started for ${chat.item_name}`}
                    </p>
                  </div>
                  
                  {getStatusBadge(chat.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
