import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface DailyFeelingRecord {
  id: string;
  daily_entry_id: string;
  feeling: string;
  intensity: number | null;
  source: string;
  created_at: string;
}

export interface GuanxinFeelingPractice {
  id: string;
  user_id: string;
  guanxin_entry_id: string | null;
  feeling: string;
  note: string | null;
  is_practiced: boolean;
  practiced_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Insert feeling records linked to a freshly created daily entry */
export function useSaveDailyFeelings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      dailyEntryId,
      feelings,
      source = 'manual',
    }: {
      dailyEntryId: string;
      feelings: string[];
      source?: 'manual' | 'auto';
    }) => {
      if (feelings.length === 0) return;
      const rows = feelings.map((f) => ({ daily_entry_id: dailyEntryId, feeling: f, source }));
      const { error } = await supabase.from('daily_feeling_records').insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-feelings'] });
    },
  });
}

export function useDailyFeelings(dailyEntryIds: string[]) {
  return useQuery({
    queryKey: ['daily-feelings', dailyEntryIds.sort().join(',')],
    queryFn: async () => {
      if (dailyEntryIds.length === 0) return [] as DailyFeelingRecord[];
      const { data, error } = await supabase
        .from('daily_feeling_records')
        .select('*')
        .in('daily_entry_id', dailyEntryIds);
      if (error) throw error;
      return data as DailyFeelingRecord[];
    },
    enabled: dailyEntryIds.length > 0,
  });
}

// ===== Guanxin feeling practices =====
export function useFeelingPractices(filter: 'all' | 'pending' | 'done' = 'all') {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['feeling-practices', user?.id, filter],
    queryFn: async () => {
      let q = supabase
        .from('guanxin_feeling_practices')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (filter === 'pending') q = q.eq('is_practiced', false);
      if (filter === 'done') q = q.eq('is_practiced', true);
      const { data, error } = await q;
      if (error) throw error;
      return data as GuanxinFeelingPractice[];
    },
    enabled: !!user,
  });
}

export function useCreateFeelingPractice() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { feeling: string; note?: string; guanxin_entry_id?: string | null }) => {
      const { error } = await supabase.from('guanxin_feeling_practices').insert({
        user_id: user!.id,
        feeling: params.feeling,
        note: params.note ?? null,
        guanxin_entry_id: params.guanxin_entry_id ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feeling-practices'] }),
  });
}

export function useToggleFeelingPractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_practiced }: { id: string; is_practiced: boolean }) => {
      const { error } = await supabase
        .from('guanxin_feeling_practices')
        .update({
          is_practiced,
          practiced_at: is_practiced ? new Date().toISOString() : null,
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feeling-practices'] }),
  });
}

export function useDeleteFeelingPractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('guanxin_feeling_practices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feeling-practices'] }),
  });
}

/** Call edge function to extract feelings from text */
export async function summarizeFeelings(text: string): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke('summarize-feelings', {
    body: { text },
  });
  if (error) throw error;
  return (data?.feelings ?? []) as string[];
}
