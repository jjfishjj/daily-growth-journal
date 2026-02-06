import { useQuery } from '@tanstack/react-query';
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

export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: async (): Promise<PlatformStats> => {
      // Get all habits
      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('is_active', true);

      // Get total user count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total entries count
      const { count: entriesCount } = await supabase
        .from('daily_entries')
        .select('*', { count: 'exact', head: true });

      // Get habit records with entries for aggregation
      const { data: entries } = await supabase
        .from('daily_entries')
        .select(`
          id,
          user_id,
          date,
          created_at,
          daily_habit_records (
            habit_id,
            completed,
            score
          )
        `)
        .order('date', { ascending: false })
        .limit(500);

      // Get profiles for user names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name');

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      // Calculate popular habits
      const habitStats: Record<string, { count: number; totalScore: number; scoreCount: number }> = {};
      
      entries?.forEach(entry => {
        entry.daily_habit_records?.forEach(record => {
          if (!habitStats[record.habit_id]) {
            habitStats[record.habit_id] = { count: 0, totalScore: 0, scoreCount: 0 };
          }
          if (record.completed) {
            habitStats[record.habit_id].count++;
            if (record.score) {
              habitStats[record.habit_id].totalScore += record.score;
              habitStats[record.habit_id].scoreCount++;
            }
          }
        });
      });

      const popularHabits = Object.entries(habitStats)
        .map(([habitId, stats]) => ({
          habitId,
          habitName: habits?.find(h => h.id === habitId)?.name || '未知習慣',
          completionCount: stats.count,
          avgScore: stats.scoreCount > 0 ? stats.totalScore / stats.scoreCount : 0
        }))
        .sort((a, b) => b.completionCount - a.completionCount)
        .slice(0, 10);

      // Calculate best practice times (by hour of creation)
      const hourStats: Record<number, number> = {};
      entries?.forEach(entry => {
        const hour = new Date(entry.created_at).getHours();
        hourStats[hour] = (hourStats[hour] || 0) + 1;
      });

      const bestPracticeTimes = Object.entries(hourStats)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count);

      // Calculate active members
      const userStats: Record<string, { count: number; totalScore: number; scoreCount: number }> = {};
      
      entries?.forEach(entry => {
        if (!userStats[entry.user_id]) {
          userStats[entry.user_id] = { count: 0, totalScore: 0, scoreCount: 0 };
        }
        userStats[entry.user_id].count++;
        
        entry.daily_habit_records?.forEach(record => {
          if (record.completed && record.score) {
            userStats[entry.user_id].totalScore += record.score;
            userStats[entry.user_id].scoreCount++;
          }
        });
      });

      const activeMembers = Object.entries(userStats)
        .map(([userId, stats]) => ({
          userId,
          userName: profileMap.get(userId) || '匿名用戶',
          entryCount: stats.count,
          avgScore: stats.scoreCount > 0 ? stats.totalScore / stats.scoreCount : 0
        }))
        .sort((a, b) => b.entryCount - a.entryCount)
        .slice(0, 10);

      // Calculate overall average score
      let totalScore = 0;
      let scoreCount = 0;
      entries?.forEach(entry => {
        entry.daily_habit_records?.forEach(record => {
          if (record.completed && record.score) {
            totalScore += record.score;
            scoreCount++;
          }
        });
      });

      const topHabit = popularHabits.length > 0 
        ? { name: popularHabits[0].habitName, avgScore: popularHabits[0].avgScore }
        : null;

      return {
        popularHabits,
        bestPracticeTimes,
        activeMembers,
        totalUsers: usersCount || 0,
        totalEntries: entriesCount || 0,
        overallAvgScore: scoreCount > 0 ? totalScore / scoreCount : 0,
        topHabit
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
