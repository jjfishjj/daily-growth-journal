import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarqueeMessage {
  id: string;
  content: string;
  link_url: string | null;
  text_color: string;
  bg_color: string;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarqueeConfig {
  id: string;
  is_enabled: boolean;
  scroll_speed: number;
}

export function useMarqueeConfig() {
  return useQuery({
    queryKey: ['marquee-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marquee_config')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as MarqueeConfig | null;
    },
    staleTime: 60_000,
  });
}

export function useActiveMarqueeMessages() {
  return useQuery({
    queryKey: ['marquee-messages', 'active'],
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('marquee_messages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const list = (data || []) as MarqueeMessage[];
      return list.filter(
        m =>
          (!m.starts_at || m.starts_at <= nowIso) &&
          (!m.ends_at || m.ends_at >= nowIso),
      );
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}

export function useAllMarqueeMessages() {
  return useQuery({
    queryKey: ['marquee-messages', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marquee_messages')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as MarqueeMessage[];
    },
  });
}

export function useUpsertMarqueeMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (msg: Partial<MarqueeMessage> & { content: string }) => {
      if (msg.id) {
        const { error } = await supabase
          .from('marquee_messages')
          .update({
            content: msg.content,
            link_url: msg.link_url ?? null,
            text_color: msg.text_color ?? '#ffffff',
            bg_color: msg.bg_color ?? '#f59e0b',
            is_active: msg.is_active ?? true,
            sort_order: msg.sort_order ?? 0,
            starts_at: msg.starts_at ?? null,
            ends_at: msg.ends_at ?? null,
          })
          .eq('id', msg.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('marquee_messages').insert({
          content: msg.content,
          link_url: msg.link_url ?? null,
          text_color: msg.text_color ?? '#ffffff',
          bg_color: msg.bg_color ?? '#f59e0b',
          is_active: msg.is_active ?? true,
          sort_order: msg.sort_order ?? 0,
          starts_at: msg.starts_at ?? null,
          ends_at: msg.ends_at ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marquee-messages'] });
    },
  });
}

export function useDeleteMarqueeMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('marquee_messages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marquee-messages'] }),
  });
}

export function useUpdateMarqueeConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_enabled, scroll_speed }: { id: string; is_enabled: boolean; scroll_speed: number }) => {
      const { error } = await supabase
        .from('marquee_config')
        .update({ is_enabled, scroll_speed })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marquee-config'] }),
  });
}
