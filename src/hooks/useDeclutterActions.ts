import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface DeclutterAction {
  id: string;
  user_id: string;
  declutter_item_id: string | null;
  content: string;
  source: string;
  remind_at: string | null;
  remind_days: number | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useDeclutterActions(filter: 'all' | 'pending' | 'completed' = 'all') {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['declutter-actions', user?.id, filter],
    queryFn: async () => {
      let q = supabase
        .from('declutter_actions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (filter === 'pending') q = q.eq('is_completed', false);
      if (filter === 'completed') q = q.eq('is_completed', true);
      const { data, error } = await q;
      if (error) throw error;
      return data as DeclutterAction[];
    },
    enabled: !!user,
  });
}

export function useCreateDeclutterAction() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      content: string;
      declutter_item_id?: string | null;
      source?: 'manual' | 'auto';
      remind_days?: number | null;
    }) => {
      const { content, declutter_item_id = null, source = 'manual', remind_days = null } = params;
      const remind_at = remind_days
        ? new Date(Date.now() + remind_days * 86400000).toISOString().split('T')[0]
        : null;
      const { error } = await supabase.from('declutter_actions').insert({
        user_id: user!.id,
        content,
        declutter_item_id,
        source,
        remind_days,
        remind_at,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['declutter-actions'] }),
  });
}

export function useCompleteDeclutterAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (actionId: string) => {
      const { data, error } = await supabase.rpc('complete_declutter_action', { _action_id: actionId });
      if (error) throw error;
      return data as { success: boolean; awarded?: boolean; error?: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['declutter-actions'] });
      qc.invalidateQueries({ queryKey: ['energy-balance'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteDeclutterAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('declutter_actions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['declutter-actions'] }),
  });
}

export function useUpdateDeclutterActionRemind() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ actionId, remind_days }: { actionId: string; remind_days: number | null }) => {
      const remind_at = remind_days
        ? new Date(Date.now() + remind_days * 86400000).toISOString().split('T')[0]
        : null;
      const { error } = await supabase
        .from('declutter_actions')
        .update({ remind_days, remind_at, updated_at: new Date().toISOString() })
        .eq('id', actionId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['declutter-actions'] }),
  });
}
