import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface ProfileDetail {
  user_id: string;
  bio: string | null;
  avatar_url: string | null;
  region: string | null;
  practice_goal: string | null;
  ideal_friend_type: string | null;
}

export interface DailyDraw {
  id: string;
  date: string;
  draw_number: number;
  cost: number;
  matched_user_id: string | null;
  compatibility_score: number;
  created_at: string;
}

export const DRAW_COSTS = [0, 10, 30];
export const MAX_DRAWS_PER_DAY = 3;

export function useMyProfileDetail() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile-detail', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profile_details')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as ProfileDetail | null;
    },
    enabled: !!user,
  });
}

export function useUpsertProfileDetail() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: Partial<ProfileDetail>) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profile_details')
        .upsert({ user_id: user.id, ...payload }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile-detail'] }),
  });
}

export function useMyKeywords() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-keywords', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_keywords')
        .select('id, keyword')
        .eq('user_id', user.id)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAddKeyword() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (keyword: string) => {
      if (!user) throw new Error('Not authenticated');
      const trimmed = keyword.trim();
      if (!trimmed || trimmed.length > 20) throw new Error('關鍵字長度需在 1-20 字');
      const { error } = await supabase
        .from('user_keywords')
        .insert({ user_id: user.id, keyword: trimmed });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-keywords'] }),
  });
}

export function useRemoveKeyword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_keywords').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-keywords'] }),
  });
}

export function useMyPracticePrefs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-practice-prefs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_practice_preferences')
        .select('habit_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return data.map(d => d.habit_id);
    },
    enabled: !!user,
  });
}

export function useTogglePracticePref() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ habitId, enabled }: { habitId: string; enabled: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (enabled) {
        const { error } = await supabase
          .from('user_practice_preferences')
          .insert({ user_id: user.id, habit_id: habitId });
        if (error && error.code !== '23505') throw error;
      } else {
        const { error } = await supabase
          .from('user_practice_preferences')
          .delete()
          .eq('user_id', user.id)
          .eq('habit_id', habitId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-practice-prefs'] }),
  });
}

export function useTodayDraws() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ['today-draws', user?.id, today],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('daily_draws')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('draw_number');
      if (error) throw error;
      return data as DailyDraw[];
    },
    enabled: !!user,
  });
}

export function usePerformDraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('perform_daily_draw');
      if (error) throw error;
      return data as { success: boolean; error?: string; matched_user_id?: string; compatibility_score?: number; draw_number?: number; cost?: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today-draws'] });
      qc.invalidateQueries({ queryKey: ['energy-balance'] });
      qc.invalidateQueries({ queryKey: ['energy-transactions'] });
    },
  });
}

export function useUserPublicProfile(userId: string | null) {
  return useQuery({
    queryKey: ['user-public-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const [profile, detail, interests, keywords, practices] = await Promise.all([
        supabase.from('profiles').select('user_id, name').eq('user_id', userId).maybeSingle(),
        supabase.from('profile_details').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_interests').select('id, interest_tag_id, visibility, interest_tags(name, interest_categories(name))').eq('user_id', userId).eq('visibility', 'public'),
        supabase.from('user_keywords').select('keyword').eq('user_id', userId),
        supabase.from('user_practice_preferences').select('habit_id, habits(name)').eq('user_id', userId),
      ]);
      return {
        name: profile.data?.name ?? '匿名用戶',
        detail: detail.data as ProfileDetail | null,
        interests: (interests.data ?? []) as any[],
        keywords: (keywords.data ?? []).map(k => k.keyword),
        practices: (practices.data ?? []) as any[],
      };
    },
    enabled: !!userId,
  });
}

export function useSendGreeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ toUserId, message }: { toUserId: string; message: string }) => {
      const { data, error } = await supabase.rpc('send_greeting', {
        _to_user: toUserId,
        _message: message,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['greetings'] });
      qc.invalidateQueries({ queryKey: ['energy-balance'] });
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ favoritedUserId, favorite }: { favoritedUserId: string; favorite: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (favorite) {
        const { error } = await supabase
          .from('favorite_friends')
          .insert({ user_id: user.id, favorited_user_id: favoritedUserId });
        if (error && error.code !== '23505') throw error;
      } else {
        const { error } = await supabase
          .from('favorite_friends')
          .delete()
          .eq('user_id', user.id)
          .eq('favorited_user_id', favoritedUserId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-favorites'] }),
  });
}

export function useMyFavorites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('favorite_friends')
        .select('favorited_user_id, created_at, profiles!favorite_friends_favorited_user_id_fkey(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        // Fallback if FK relation not auto-detected
        const fallback = await supabase.from('favorite_friends').select('favorited_user_id, created_at').eq('user_id', user.id);
        return (fallback.data ?? []).map(f => ({ favorited_user_id: f.favorited_user_id, created_at: f.created_at, name: '' }));
      }
      return data as any[];
    },
    enabled: !!user,
  });
}

export function useGreetings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['greetings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('greetings')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
