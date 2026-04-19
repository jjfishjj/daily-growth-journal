import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface GuanxinAction {
  id: string;
  user_id: string;
  guanxin_entry_id: string | null;
  content: string;
  source: string;
  remind_at: string | null;
  remind_days: number | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Parse "to do：" sections from guanxin content */
export function parseToDoFromContent(content: string): string[] {
  const items: string[] = [];
  const regex = /to\s*do\s*[：:]\s*([\s\S]*?)(?=\n\s*【|\n\s*to\s*do|\n\s*🌊|\n\s*✨|$)/gi;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const text = m[1].trim();
    if (text) {
      // split by line breaks and bullet markers
      text.split(/\n+/).forEach((line) => {
        const cleaned = line.replace(/^[-•·*\s]+/, '').trim();
        if (cleaned && cleaned.length > 1) items.push(cleaned);
      });
    }
  }
  return items;
}

export function useGuanxinActions(filter: 'all' | 'pending' | 'completed' = 'all') {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['guanxin-actions', user?.id, filter],
    queryFn: async () => {
      let query = supabase
        .from('guanxin_actions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (filter === 'pending') query = query.eq('is_completed', false);
      if (filter === 'completed') query = query.eq('is_completed', true);
      const { data, error } = await query;
      if (error) throw error;
      return data as GuanxinAction[];
    },
    enabled: !!user,
  });
}

export function useCreateAction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      content: string;
      guanxin_entry_id?: string | null;
      source?: 'auto' | 'manual';
      remind_days?: number | null;
    }) => {
      const { content, guanxin_entry_id = null, source = 'manual', remind_days = null } = params;
      const remind_at = remind_days
        ? new Date(Date.now() + remind_days * 86400000).toISOString().split('T')[0]
        : null;
      const { error } = await supabase.from('guanxin_actions').insert({
        user_id: user!.id,
        content,
        guanxin_entry_id,
        source,
        remind_days,
        remind_at,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guanxin-actions'] });
    },
  });
}

export function useCompleteAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (actionId: string) => {
      const { data, error } = await supabase.rpc('complete_action', { _action_id: actionId });
      if (error) throw error;
      return data as { success: boolean; awarded?: boolean; error?: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guanxin-actions'] });
      queryClient.invalidateQueries({ queryKey: ['energy-balance'] });
    },
  });
}

export function useDeleteAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (actionId: string) => {
      const { error } = await supabase.from('guanxin_actions').delete().eq('id', actionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guanxin-actions'] }),
  });
}

export function useUpdateActionRemind() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ actionId, remind_days }: { actionId: string; remind_days: number | null }) => {
      const remind_at = remind_days
        ? new Date(Date.now() + remind_days * 86400000).toISOString().split('T')[0]
        : null;
      const { error } = await supabase
        .from('guanxin_actions')
        .update({ remind_days, remind_at, updated_at: new Date().toISOString() })
        .eq('id', actionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guanxin-actions'] }),
  });
}
