import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface GuanxinEntry {
  id: string;
  user_id: string;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface GuanxinLeave {
  id: string;
  user_id: string;
  date: string;
  reason: string | null;
  created_at: string;
}

export function useGuanxinEntries(month?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['guanxin-entries', user?.id, month],
    queryFn: async () => {
      let query = supabase
        .from('guanxin_entries')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      if (month) {
        const start = `${month}-01`;
        const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0);
        const end = `${month}-${String(endDate.getDate()).padStart(2, '0')}`;
        query = query.gte('date', start).lte('date', end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GuanxinEntry[];
    },
    enabled: !!user,
  });
}

export function useGuanxinLeaves(month?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['guanxin-leaves', user?.id, month],
    queryFn: async () => {
      let query = supabase
        .from('guanxin_leaves')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      if (month) {
        const start = `${month}-01`;
        const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0);
        const end = `${month}-${String(endDate.getDate()).padStart(2, '0')}`;
        query = query.gte('date', start).lte('date', end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GuanxinLeave[];
    },
    enabled: !!user,
  });
}

export function useSubmitGuanxin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, content, existingId }: { date: string; content: string; existingId?: string }) => {
      if (existingId) {
        const { error } = await supabase
          .from('guanxin_entries')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('id', existingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('guanxin_entries')
          .insert({ user_id: user!.id, date, content });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guanxin-entries'] });
    },
  });
}

export function useSubmitLeave() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, reason }: { date: string; reason?: string }) => {
      const { error } = await supabase
        .from('guanxin_leaves')
        .insert({ user_id: user!.id, date, reason: reason || null });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guanxin-leaves'] });
    },
  });
}

export function useCancelLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leaveId: string) => {
      const { error } = await supabase
        .from('guanxin_leaves')
        .delete()
        .eq('id', leaveId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guanxin-leaves'] });
    },
  });
}

// Admin hooks
export function useAllGuanxinEntries(month?: string) {
  const { isAdmin } = useAuth();
  return useQuery({
    queryKey: ['admin-guanxin-entries', month],
    queryFn: async () => {
      let query = supabase
        .from('guanxin_entries')
        .select('*')
        .order('date', { ascending: false });

      if (month) {
        const start = `${month}-01`;
        const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0);
        const end = `${month}-${String(endDate.getDate()).padStart(2, '0')}`;
        query = query.gte('date', start).lte('date', end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GuanxinEntry[];
    },
    enabled: isAdmin,
  });
}

export function useAllGuanxinLeaves(month?: string) {
  const { isAdmin } = useAuth();
  return useQuery({
    queryKey: ['admin-guanxin-leaves', month],
    queryFn: async () => {
      let query = supabase
        .from('guanxin_leaves')
        .select('*')
        .order('date', { ascending: false });

      if (month) {
        const start = `${month}-01`;
        const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0);
        const end = `${month}-${String(endDate.getDate()).padStart(2, '0')}`;
        query = query.gte('date', start).lte('date', end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GuanxinLeave[];
    },
    enabled: isAdmin,
  });
}
