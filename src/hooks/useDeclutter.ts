import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export type DeclutterCategory = 'object' | 'thought' | 'relation' | 'habit' | 'other';

export interface DeclutterItem {
  id: string;
  user_id: string;
  date: string;
  content: string;
  category: DeclutterCategory;
  note: string | null;
  is_completed: boolean;
  completed_at: string | null;
  completion_reflection: string | null;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_LABELS: Record<DeclutterCategory, string> = {
  object: '物品',
  thought: '想法',
  relation: '關係',
  habit: '習慣',
  other: '其他',
};

export function useDeclutterItems(filter: 'all' | 'pending' | 'completed' = 'all') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['declutter-items', user?.id, filter],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from('declutter_items')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filter === 'pending') q = q.eq('is_completed', false);
      if (filter === 'completed') q = q.eq('is_completed', true);

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as DeclutterItem[];
    },
  });
}

export function useDeclutterStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['declutter-stats', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('declutter_items')
        .select('category, is_completed, date')
        .eq('user_id', user!.id);
      if (error) throw error;
      const items = data || [];
      const total = items.length;
      const completed = items.filter(i => i.is_completed).length;
      const byCategory: Record<string, number> = {};
      items.filter(i => i.is_completed).forEach(i => {
        byCategory[i.category] = (byCategory[i.category] || 0) + 1;
      });
      const days = new Set(items.map(i => i.date)).size;
      return { total, completed, pending: total - completed, byCategory, days };
    },
  });
}

export function useCreateDeclutter() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { content: string; category: DeclutterCategory; note?: string; date?: string }) => {
      const { error } = await supabase.from('declutter_items').insert({
        user_id: user!.id,
        content: input.content,
        category: input.category,
        note: input.note ?? null,
        date: input.date ?? new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['declutter-items'] });
      qc.invalidateQueries({ queryKey: ['declutter-stats'] });
    },
  });
}

export function useCompleteDeclutter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, reflection }: { itemId: string; reflection?: string }) => {
      const { data, error } = await supabase.rpc('complete_declutter', {
        _item_id: itemId,
        _reflection: reflection ?? null,
      });
      if (error) throw error;
      return data as { success: boolean; awarded?: boolean; error?: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['declutter-items'] });
      qc.invalidateQueries({ queryKey: ['declutter-stats'] });
      qc.invalidateQueries({ queryKey: ['energy-balance'] });
      qc.invalidateQueries({ queryKey: ['energy-transactions'] });
    },
  });
}

export function useDeleteDeclutter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('declutter_items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['declutter-items'] });
      qc.invalidateQueries({ queryKey: ['declutter-stats'] });
    },
  });
}
