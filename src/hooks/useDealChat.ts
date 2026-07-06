import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface DealMessage {
  id: string;
  order_id: string;
  sender_id: string | null;
  sender_type: 'user' | 'system';
  content: string;
  message_type: string;
  metadata: any;
  created_at: string;
}

export function useDealChat(orderId: string | undefined, currentUserId: string | undefined) {
  const [messages, setMessages] = useState<DealMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orderId || !currentUserId) return;

    let isMounted = true;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else if (isMounted) {
        setMessages(data || []);
        scrollToBottom();
      }
      if (isMounted) setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`deal-chat-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          if (isMounted) {
            setMessages((prev) => {
              // Check if we already have it (optimistic update case)
              if (prev.find(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new as DealMessage];
            });
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(subscription);
    };
  }, [orderId, currentUserId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !orderId || !currentUserId) return;

    // Optimistic update
    const messageId = crypto.randomUUID();
    const optimisticMessage: DealMessage = {
      id: messageId,
      order_id: orderId,
      sender_id: currentUserId,
      sender_type: 'user',
      content,
      message_type: 'text',
      metadata: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();

    const { error } = await supabase
      .from('messages')
      .insert([
        {
          id: messageId,
          order_id: orderId,
          sender_id: currentUserId,
          sender_type: 'user',
          content,
          message_type: 'text',
        },
      ]);

    if (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message if failed
      setMessages((prev) => prev.filter(m => m.id !== messageId));
    }
  };

  return { messages, loading, sendMessage, scrollRef };
}
