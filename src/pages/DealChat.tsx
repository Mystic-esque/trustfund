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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const { messages, loading: messagesLoading, sendMessage, scrollRef } = useDealChat(id, currentUser?.id, isAdmin);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }
      setCurrentUser(user);
      
      const adminEmails = ['mysticx404@gmail.com', 'admin@trustfund.com'];
      const isAdminUser = adminEmails.includes(user.email || '');
      setIsAdmin(isAdminUser);

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

  // Mark as read when messages change
  useEffect(() => {
    if (!order || !currentUser || messages.length === 0) return;
    
    const isVendor = currentUser.id === order.vendor_id;
    const updateColumn = isVendor ? 'vendor_last_read_at' : 'buyer_last_read_at';

    supabase.from('orders').update({
      [updateColumn]: new Date().toISOString()
    }).eq('id', order.id).then(({ error }) => {
      if (error) console.error("Failed to update read receipt", error);
    });
  }, [messages.length, order, currentUser]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleResolution = async (resolution: 'refund' | 'settle') => {
    if (!order) return;
    setIsResolving(true);
    try {
      const { error } = await supabase.rpc('resolve_dispute', {
        p_order_id: order.id,
        p_resolution: resolution
      });
      if (error) throw error;
      
      // Add a system message
      await supabase.from('messages').insert([{
        order_id: order.id,
        sender_type: 'system',
        content: `Dispute Resolved: ${resolution === 'refund' ? 'Buyer Refunded' : 'Vendor Settled'}`,
        message_type: 'status_update'
      }]);

      setOrder({ ...order, status: resolution === 'refund' ? 'REFUNDED' : 'SETTLED' });
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to resolve dispute');
    } finally {
      setIsResolving(false);
    }
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
      
      {/* Header */}
      <header className="flex-shrink-0 z-10 sticky top-0 bg-[#131313]/90 backdrop-blur-xl border-b border-[#4a4455]/30 flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (isAdmin) {
                navigate('/admin/disputes');
              } else {
                navigate(`/orders/${order.id}`);
              }
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#353534]/50 hover:bg-[#353534] transition-colors"
          >
            <span className="material-symbols-outlined text-[#e5e2e1]">arrow_back</span>
          </button>
          
          <div className="flex flex-col">
            <span className="font-title-md font-semibold text-[#e5e2e1] truncate max-w-[200px]">
              {isAdmin ? `Dispute: ${order.item_name}` : (otherParty?.full_name || 'Buyer')}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${statusDisplay.dot}`}></span>
                <span className="font-label-sm text-[#ccc3d8] text-xs truncate max-w-[150px]">{order.item_name}</span>
              </div>
            </div>
          </div>
        </div>
        {isAdmin && <div className="text-[10px] font-bold text-error border border-error px-2 py-1 rounded">ADMIN</div>}
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6 pb-24 relative z-0 hide-scrollbar">
        {messagesLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          messages.map((msg) => {
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
      </div>

      {/* Admin Resolution Area */}
      {isAdmin && order.status === 'DISPUTED' && (
        <div className="p-4 bg-error-container/10 border-t border-error/20 flex flex-col gap-3">
          <div className="text-sm text-error/80 font-bold mb-1">Mediator Actions</div>
          <div className="flex gap-3">
            <button
              onClick={() => handleResolution('refund')}
              disabled={isResolving}
              className="flex-1 py-3 rounded-full bg-error text-white font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
            >
              {isResolving ? 'Resolving...' : 'Refund Buyer'}
            </button>
            <button
              onClick={() => handleResolution('settle')}
              disabled={isResolving}
              className="flex-1 py-3 rounded-full bg-primary text-white font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
            >
              {isResolving ? 'Resolving...' : 'Settle Vendor'}
            </button>
          </div>
        </div>
      )}

      {/* Chat Input */}
      {(!isAdmin || order.status === 'DISPUTED') && (
        <footer className="flex-shrink-0 z-10 sticky bottom-0 bg-[#131313]/90 backdrop-blur-xl border-t border-[#4a4455]/30 p-4 pb-8">
          <form onSubmit={handleSend} className="flex items-end gap-3 max-w-[600px] mx-auto">
            <div className="flex-1 min-h-[48px] max-h-[120px] bg-[#353534]/50 rounded-2xl border border-[#4a4455]/30 focus-within:border-primary focus-within:bg-[#353534]/80 transition-all flex items-end">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder={isAdmin ? "Type an admin message..." : "Type a message..."}
                className="w-full bg-transparent text-[#e5e2e1] placeholder-[#ccc3d8]/50 px-4 py-3 outline-none resize-none min-h-[48px] max-h-[120px]"
                rows={1}
                disabled={messagesLoading}
              />
            </div>
            
            <button 
              type="submit"
              disabled={!inputText.trim() || messagesLoading}
              className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-primary text-white disabled:bg-[#353534] disabled:text-[#ccc3d8]/50 transition-all active:scale-95 disabled:active:scale-100"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </form>
        </footer>
      )}
    </div>
  );
}
