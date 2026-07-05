import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'payment' | 'order' | 'dispute' | 'system';
  order_id: string | null;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter(n => !n.read).length);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const subscription = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications(); // Refresh on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Optimistic update
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  };
}
