import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface Conversation {
  partner_id: string;
  partner_name: string;
  last_message: string;
  last_at: string;
  unread_count: number;
}

export interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export function useConversations() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('messages-list-' + user.id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          qc.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_my_conversations');
      if (error) throw error;
      return (data ?? []) as Conversation[];
    },
    enabled: !!user,
  });
}

export function useConversationMessages(partnerId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user || !partnerId) return;
    const channel = supabase
      .channel(`messages-thread-${user.id}-${partnerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as Message;
          const inThread =
            (m.from_user_id === user.id && m.to_user_id === partnerId) ||
            (m.from_user_id === partnerId && m.to_user_id === user.id);
          if (inThread) {
            qc.invalidateQueries({ queryKey: ['messages-thread', user.id, partnerId] });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partnerId, qc]);

  return useQuery({
    queryKey: ['messages-thread', user?.id, partnerId],
    queryFn: async () => {
      if (!user || !partnerId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(from_user_id.eq.${user.id},to_user_id.eq.${partnerId}),and(from_user_id.eq.${partnerId},to_user_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Message[];
    },
    enabled: !!user && !!partnerId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ toUserId, content }: { toUserId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      const trimmed = content.trim();
      if (!trimmed) throw new Error('訊息不能為空');
      if (trimmed.length > 1000) throw new Error('訊息上限 1000 字');
      const { error } = await supabase
        .from('messages')
        .insert({ from_user_id: user.id, to_user_id: toUserId, content: trimmed });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messages-thread', user?.id, vars.toUserId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkConversationRead(partnerId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user || !partnerId) return;
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('to_user_id', user.id)
        .eq('from_user_id', partnerId)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUnreadMessageCount() {
  const { data } = useConversations();
  return (data ?? []).reduce((sum, c) => sum + Number(c.unread_count ?? 0), 0);
}
