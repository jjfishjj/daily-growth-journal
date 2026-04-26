import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface NotificationItem {
  id: string;
  type: 'message' | 'guanxin_action' | 'declutter_action' | 'forum_comment' | 'forum_like' | 'greeting';
  title: string;
  description?: string;
  created_at?: string;
  remind_at?: string;
  status?: 'overdue' | 'due' | 'upcoming';
  link: string;
  icon: string;
}

interface RawNotificationsPayload {
  total_unread_messages?: number;
  pending_guanxin_actions?: Array<{ id: string; content: string; remind_at: string; status: string }>;
  pending_declutter_actions?: Array<{ id: string; content: string; remind_at: string; status: string }>;
  recent_forum_comments?: Array<{ id: string; post_id: string; content: string; created_at: string; commenter_name: string; post_title: string | null }>;
  recent_forum_likes?: Array<{ id: string; post_id: string; created_at: string; liker_name: string; post_title: string | null }>;
  recent_greetings?: Array<{ id: string; message: string; created_at: string; from_name: string; from_user_id: string }>;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () =>
        queryClient.invalidateQueries({ queryKey: ['notifications'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_comments' }, () =>
        queryClient.invalidateQueries({ queryKey: ['notifications'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_likes' }, () =>
        queryClient.invalidateQueries({ queryKey: ['notifications'] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_notifications');
      if (error) throw error;
      const raw = (data ?? {}) as RawNotificationsPayload;

      const items: NotificationItem[] = [];

      (raw.pending_guanxin_actions ?? []).forEach((a) => {
        items.push({
          id: `ga-${a.id}`,
          type: 'guanxin_action',
          title: a.status === 'overdue' ? '觀心書行動方案逾期' : a.status === 'due' ? '觀心書行動方案到期' : '觀心書行動方案即將到期',
          description: a.content,
          remind_at: a.remind_at,
          status: a.status as NotificationItem['status'],
          link: '/guanxin?tab=actions',
          icon: '📖',
        });
      });

      (raw.pending_declutter_actions ?? []).forEach((a) => {
        items.push({
          id: `da-${a.id}`,
          type: 'declutter_action',
          title: a.status === 'overdue' ? '斷捨離行動逾期' : a.status === 'due' ? '斷捨離行動到期' : '斷捨離行動即將到期',
          description: a.content,
          remind_at: a.remind_at,
          status: a.status as NotificationItem['status'],
          link: '/declutter?tab=actions',
          icon: '♻️',
        });
      });

      (raw.recent_forum_comments ?? []).forEach((c) => {
        items.push({
          id: `fc-${c.id}`,
          type: 'forum_comment',
          title: `${c.commenter_name} 回覆了你的貼文`,
          description: c.content,
          created_at: c.created_at,
          link: `/forum/post/${c.post_id}`,
          icon: '💬',
        });
      });

      (raw.recent_forum_likes ?? []).forEach((l) => {
        items.push({
          id: `fl-${l.id}`,
          type: 'forum_like',
          title: `${l.liker_name} 對你的貼文按讚`,
          description: l.post_title ?? '',
          created_at: l.created_at,
          link: `/forum/post/${l.post_id}`,
          icon: '❤️',
        });
      });

      (raw.recent_greetings ?? []).forEach((g) => {
        items.push({
          id: `gr-${g.id}`,
          type: 'greeting',
          title: `${g.from_name} 向你打招呼`,
          description: g.message,
          created_at: g.created_at,
          link: `/messages?to=${g.from_user_id}`,
          icon: '👋',
        });
      });

      const unreadMessages = raw.total_unread_messages ?? 0;
      if (unreadMessages > 0) {
        items.unshift({
          id: 'msg-unread',
          type: 'message',
          title: `你有 ${unreadMessages} 則未讀訊息`,
          link: '/messages',
          icon: '✉️',
        });
      }

      return { items, unreadMessages };
    },
    enabled: !!user,
    refetchInterval: 60000,
  });
}
