import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface InboxChat {
  order_id: string;
  item_name: string;
  status: string;
  amount: number;
  other_party_name: string;
  other_party_avatar: string | null;
  latest_message_content: string | null;
  latest_message_time: string | null;
  latest_message_sender_id: string | null;
  latest_message_sender_type: string | null;
  has_unread: boolean;
}

export function useInbox() {
  const [chats, setChats] = useState<InboxChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const userRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchInbox = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }
      if (isMounted) {
        setCurrentUser(user);
        userRef.current = user;
      }

      // Fetch all orders for this user
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id, item_name, status, amount, vendor_id, buyer_id,
          vendor_last_read_at, buyer_last_read_at,
          vendor:users!orders_vendor_id_fkey(id, full_name, avatar_url),
          buyer:users!orders_buyer_id_fkey(id, full_name, avatar_url)
        `)
        .or(`vendor_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (ordersError || !orders) {
        console.error('Error fetching inbox orders:', ordersError);
        if (isMounted) setLoading(false);
        return;
      }

      // Fetch latest message for each order
      // We do this by querying messages for all these order_ids
      const orderIds = orders.map((o) => o.id);
      
      let latestMessagesMap: Record<string, any> = {};
      let allMessages: any[] = [];
      
      if (orderIds.length > 0) {
        const { data: messagesData, error: msgsError } = await supabase
          .from('messages')
          .select('*')
          .in('order_id', orderIds)
          .order('created_at', { ascending: false });

        if (!msgsError && messagesData) {
          // Keep only the first (latest) message for each order
          messagesData.forEach((msg) => {
            if (!latestMessagesMap[msg.order_id]) {
              latestMessagesMap[msg.order_id] = msg;
            }
          });
        }
      }

      const inboxChats: InboxChat[] = orders.map((order) => {
        const isVendor = user.id === order.vendor_id;
        const otherParty: any = isVendor ? order.buyer : order.vendor;
        const latestMsg = latestMessagesMap[order.id];
        const lastReadAt = isVendor ? order.vendor_last_read_at : order.buyer_last_read_at;

        let hasUnread = false;
        if (latestMsg && latestMsg.sender_id !== user.id) {
          hasUnread = !lastReadAt || new Date(latestMsg.created_at) > new Date(lastReadAt);
        }

        return {
          order_id: order.id,
          item_name: order.item_name,
          status: order.status,
          amount: order.amount,
          other_party_name: otherParty?.full_name || 'No Buyer Yet',
          other_party_avatar: otherParty?.avatar_url || null,
          latest_message_content: latestMsg ? latestMsg.content : null,
          latest_message_time: latestMsg ? latestMsg.created_at : null,
          latest_message_sender_id: latestMsg ? latestMsg.sender_id : null,
          latest_message_sender_type: latestMsg ? latestMsg.sender_type : null,
          has_unread: hasUnread,
        };
      });

      // Sort by latest message time
      inboxChats.sort((a, b) => {
        const timeA = a.latest_message_time ? new Date(a.latest_message_time).getTime() : 0;
        const timeB = b.latest_message_time ? new Date(b.latest_message_time).getTime() : 0;
        return timeB - timeA;
      });

      if (isMounted) {
        setChats(inboxChats);
        setLoading(false);
      }
    };

    fetchInbox();

    // Subscribe to any new message
    const subscription = supabase
      .channel(`inbox_messages_${Math.random()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (!isMounted) return;
          const newMsg = payload.new;
          
          setChats((prevChats) => {
            const updatedChats = prevChats.map((chat) => {
              if (chat.order_id === newMsg.order_id) {
                return {
                  ...chat,
                  latest_message_content: newMsg.content,
                  latest_message_time: newMsg.created_at,
                  latest_message_sender_id: newMsg.sender_id,
                  latest_message_sender_type: newMsg.sender_type,
                  has_unread: (newMsg.sender_id && userRef.current && newMsg.sender_id !== userRef.current.id) 
                                ? true 
                                : chat.has_unread,
                };
              }
              return chat;
            });

            // Re-sort to put the most recent chat on top
            return updatedChats.sort((a, b) => {
              const timeA = a.latest_message_time ? new Date(a.latest_message_time).getTime() : 0;
              const timeB = b.latest_message_time ? new Date(b.latest_message_time).getTime() : 0;
              return timeB - timeA;
            });
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(subscription);
    };
  }, []);

  return { chats, loading, currentUser };
}
