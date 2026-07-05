import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useDealChat } from '../hooks/useDealChat';

export default function DealChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [otherParty, setOtherParty] = useState<any>(null);
  const [inputText, setInputText] = useState('');

  const { messages, loading: messagesLoading, sendMessage, scrollRef } = useDealChat(id, currentUser?.id);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }
      setCurrentUser(user);

      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          vendor:users!orders_vendor_id_fkey(id, full_name, avatar_url),
          buyer:users!orders_buyer_id_fkey(id, full_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (orderError || !orderData) {
        console.error('Failed to load order', orderError);
        return;
      }

      setOrder(orderData);

      // Determine other party
      if (user.id === orderData.vendor_id) {
        setOtherParty(orderData.buyer);
      } else {
        setOtherParty(orderData.vendor);
      }
    };

    init();
  }, [id, navigate]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT': return { text: 'Awaiting Payment', bg: 'bg-[#353534]', color: 'text-outline-variant', dot: 'bg-outline-variant' };
      case 'ESCROW_LOCKED': return { text: 'In Escrow', bg: 'bg-[#3f008e]', color: 'text-[#d2bbff]', dot: 'bg-[#d2bbff]' };
      case 'IN_TRANSIT': return { text: 'In Transit', bg: 'bg-[#003824]', color: 'text-[#4edea3]', dot: 'bg-[#4edea3]' };
      case 'DELIVERED_PENDING_RELEASE': return { text: 'Delivered', bg: 'bg-[#490080]', color: 'text-[#ddb7ff]', dot: 'bg-[#ddb7ff]' };
      case 'SETTLED': return { text: 'Settled', bg: 'bg-[#005236]', color: 'text-[#6ffbbe]', dot: 'bg-[#6ffbbe]' };
      case 'DISPUTED': return { text: 'Under Review', bg: 'bg-[#93000a]', color: 'text-[#ffb4ab]', dot: 'bg-[#ffb4ab]' };
      case 'REFUNDED': return { text: 'Refunded', bg: 'bg-[#353534]', color: 'text-on-surface-variant', dot: 'bg-on-surface-variant' };
      default: return { text: status.replace(/_/g, ' '), bg: 'bg-[#353534]', color: 'text-outline-variant', dot: 'bg-outline-variant' };
    }
  };

  if (!currentUser || !order) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(order.status);

  return (
    <div className="bg-[#131313] text-[#e5e2e1] flex flex-col min-h-[100dvh] font-body-md relative max-w-[600px] mx-auto overflow-hidden">
      
      {/* TopAppBar */}
      <header className="w-full sticky top-0 z-50 bg-[#131313] border-b border-[#4a4455]/30 flex items-center justify-between px-5 h-16 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="active:scale-95 duration-150 p-2 -ml-2 rounded-full hover:bg-[#353534] transition-colors">
            <span className="material-symbols-outlined text-[#d2bbff]">arrow_back</span>
          </button>
          <div>
            <h1 className="font-headline-md text-lg text-[#e5e2e1] leading-tight font-bold">
              {otherParty ? otherParty.full_name : 'No Buyer Yet'}
            </h1>
            <p className="font-label-sm text-xs text-[#ccc3d8]">Case #{order.reference_id}</p>
          </div>
        </div>
        <button onClick={() => navigate(`/orders/${order.id}`)} className="active:scale-95 duration-150 p-2 -mr-2 rounded-full hover:bg-[#353534] transition-colors">
          <span className="material-symbols-outlined text-[#d2bbff]">info</span>
        </button>
      </header>

      {/* Case Context Banner */}
      <div className="px-5 py-3 bg-[#1c1b1b] border-b border-[#4a4455]/30 flex items-center justify-between shrink-0 shadow-sm z-40 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#353534] border border-[#4a4455]">
            <div className="w-full h-full flex items-center justify-center text-[#ccc3d8]">
              <span className="material-symbols-outlined text-xl">inventory_2</span>
            </div>
          </div>
          <div>
            <p className="font-label-sm text-[10px] uppercase tracking-wider text-[#ccc3d8]">Disputed Item</p>
            <p className="font-label-lg text-sm text-[#e5e2e1] font-semibold truncate max-w-[150px]">{order.item_name}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm ${statusDisplay.bg} ${statusDisplay.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'DISPUTED' || order.status === 'IN_TRANSIT' ? 'animate-pulse' : ''} ${statusDisplay.dot}`}></span>
          <span className="font-label-sm text-[10px] uppercase tracking-wider font-bold">{statusDisplay.text}</span>
        </div>
      </div>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6 pb-24 relative z-0 hide-scrollbar">
        {messagesLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          messages.map((msg) => {
            // System Message
            if (msg.sender_type === 'system') {
              return (
                <div key={msg.id} className="flex flex-col items-center gap-2 my-2 w-full">
                  <div className="h-[1px] w-12 bg-[#4a4455]/50"></div>
                  <p className="font-label-sm text-xs text-[#ccc3d8] italic text-center max-w-[80%] bg-[#353534]/50 px-4 py-1.5 rounded-full border border-[#4a4455]/30">
                    {msg.content}
                  </p>
                </div>
              );
            }

            // Current User (Outgoing)
            if (msg.sender_id === currentUser.id) {
              return (
                <div key={msg.id} className="flex flex-col gap-1 max-w-[85%] self-end items-end">
                  <div className="bg-[#7c3aed] text-white p-4 rounded-2xl rounded-tr-sm shadow-sm">
                    <p className="font-body-md text-[15px] leading-relaxed break-words">{msg.content}</p>
                  </div>
                  <span className="font-label-sm text-[10px] text-[#ccc3d8] opacity-70">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            }

            // Other Party (Incoming)
            return (
              <div key={msg.id} className="flex flex-col gap-1 max-w-[85%] self-start">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-[#353534]">
                    {otherParty?.avatar_url ? (
                      <img src={otherParty.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary text-white text-xs font-bold">
                        {otherParty?.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <span className="font-label-sm text-xs text-[#d2bbff] font-bold">
                    {otherParty?.full_name?.split(' ')[0] || 'User'} 
                    <span className="font-normal text-[#ccc3d8] ml-1 opacity-70">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>
                </div>
                <div className="bg-[rgba(32,31,31,0.8)] backdrop-blur-md border border-[#4a4455]/30 p-4 rounded-2xl rounded-tl-sm shadow-sm ml-8">
                  <p className="font-body-md text-[15px] text-[#e5e2e1] leading-relaxed break-words">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </main>

      {/* Input Area */}
      <div className="fixed bottom-0 w-full max-w-[600px] bg-[#131313]/90 backdrop-blur-xl border-t border-[#4a4455]/30 px-5 py-4 pb-8 z-50">
        <form onSubmit={handleSend} className="flex items-end gap-3">
          <button type="button" className="p-3 bg-[#353534]/50 text-[#ccc3d8] rounded-xl hover:bg-[#353534] transition-colors border border-[#4a4455]/30 shrink-0">
            <span className="material-symbols-outlined text-[20px]">attach_file</span>
          </button>
          <div className="flex-1 relative">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Type your message..."
              className="w-full bg-[#1c1b1b] border border-[#4a4455]/50 rounded-2xl py-3 px-4 pr-12 text-[#e5e2e1] focus:outline-none focus:border-[#d2bbff] focus:ring-1 focus:ring-[#d2bbff] resize-none overflow-hidden placeholder-[#ccc3d8]/50"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || messagesLoading}
              className="absolute right-2 bottom-2 p-2 bg-[#7c3aed] text-white rounded-xl disabled:opacity-50 disabled:bg-[#353534] disabled:text-[#ccc3d8] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
