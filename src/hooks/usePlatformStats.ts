import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformStats {
  popularHabits: { habitId: string; habitName: string; completionCount: number; avgScore: number }[];
  bestPracticeTimes: { hour: number; count: number }[];
  activeMembers: { userId: string; userName: string; entryCount: number; avgScore: number }[];
  totalUsers: number;
  totalEntries: number;
  overallAvgScore: number;
  topHabit: { name: string; avgScore: number } | null;
}

interface DbPlatformStats {
  totalUsers: number;
  totalEntries: number;
  overallAvgScore: number;
  popularHabits: { habit_id: string; habit_name: string; completion_count: number; avg_score: number }[];
  bestPracticeTimes: { hour: number; count: number }[];
  activeMembers: { user_id: string; user_name: string; entry_count: number; avg_score: number }[];
}

export function usePlatformStats() {
  const queryClient = useQueryClient();

  // Subscribe to realtime changes for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('platform-stats-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_entries' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_habit_records' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: async (): Promise<PlatformStats> => {
      // Use the database function that any authenticated user can call
      const { data, error } = await supabase.rpc('get_platform_stats');
      
      if (error) {
        console.error('Error fetching platform stats:', error);
        throw error;
      }

      const stats = data as unknown as DbPlatformStats;
      
      // Transform the data to match the expected interface
      const popularHabits = (stats.popularHabits || []).map(h => ({
        habitId: h.habit_id,
        habitName: h.habit_name,
        completionCount: Number(h.completion_count),
        avgScore: Number(h.avg_score)
      }));

      const bestPracticeTimes = (stats.bestPracticeTimes || []).map(t => ({
        hour: Number(t.hour),
        count: Number(t.count)
      }));

      const activeMembers = (stats.activeMembers || []).map(m => ({
        userId: m.user_id,
        userName: m.user_name,
        entryCount: Number(m.entry_count),
        avgScore: Number(m.avg_score)
      }));

      const topHabit = popularHabits.length > 0 
        ? { name: popularHabits[0].habitName, avgScore: popularHabits[0].avgScore }
        : null;

      return {
        popularHabits,
        bestPracticeTimes,
        activeMembers,
        totalUsers: stats.totalUsers || 0,
        totalEntries: stats.totalEntries || 0,
        overallAvgScore: Number(stats.overallAvgScore) || 0,
        topHabit
      };
    },
    staleTime: 30 * 1000, // 30 seconds cache (shorter for near-realtime feel)
  });
}
