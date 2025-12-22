import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export function useAllUsers() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin
  });
}

export function useAllEntries(startDate?: string, endDate?: string, userId?: string) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['admin-entries', startDate, endDate, userId],
    queryFn: async () => {
      let query = supabase
        .from('daily_entries')
        .select(`
          *,
          profiles!daily_entries_user_id_fkey (name, user_id),
          daily_habit_records (*)
        `)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: isAdmin
  });
}

export function useAdminStats() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Get total users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total entries count
      const { count: entriesCount } = await supabase
        .from('daily_entries')
        .select('*', { count: 'exact', head: true });

      // Get all habits
      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('is_active', true)
        .order('default_order');

      // Get all habit records
      const { data: records } = await supabase
        .from('daily_habit_records')
        .select('*');

      // Calculate habit stats
      const habitStats = habits?.map(habit => {
        const habitRecords = records?.filter(r => r.habit_id === habit.id) || [];
        const completedRecords = habitRecords.filter(r => r.completed);
        const scoresWithValue = completedRecords
          .filter(r => r.score !== null)
          .map(r => r.score as number);

        return {
          habit,
          totalRecords: habitRecords.length,
          completedCount: completedRecords.length,
          completionRate: habitRecords.length > 0 
            ? (completedRecords.length / habitRecords.length) * 100 
            : 0,
          avgScore: scoresWithValue.length > 0 
            ? scoresWithValue.reduce((a, b) => a + b, 0) / scoresWithValue.length 
            : 0
        };
      }) || [];

      return {
        usersCount: usersCount || 0,
        entriesCount: entriesCount || 0,
        habitStats
      };
    },
    enabled: isAdmin
  });
}
