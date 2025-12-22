import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  default_order: number;
}

export interface DailyEntry {
  id: string;
  user_id: string;
  date: string;
  overall_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyHabitRecord {
  id: string;
  daily_entry_id: string;
  habit_id: string;
  completed: boolean;
  score: number | null;
  note: string | null;
}

export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('is_active', true)
        .order('default_order');
      
      if (error) throw error;
      return data as Habit[];
    }
  });
}

export function useDailyEntry(date: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['daily-entry', date, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('daily_entries')
        .select(`
          *,
          daily_habit_records (*)
        `)
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();
      
      if (error) throw error;
      return data as (DailyEntry & { daily_habit_records: DailyHabitRecord[] }) | null;
    },
    enabled: !!user
  });
}

export function useSaveDailyEntry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      date,
      overallComment,
      habitRecords
    }: {
      date: string;
      overallComment: string;
      habitRecords: Array<{ habitId: string; completed: boolean; score: number | null; note: string }>;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Upsert daily entry
      const { data: entry, error: entryError } = await supabase
        .from('daily_entries')
        .upsert({
          user_id: user.id,
          date,
          overall_comment: overallComment
        }, {
          onConflict: 'user_id,date'
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Delete existing habit records for this entry
      await supabase
        .from('daily_habit_records')
        .delete()
        .eq('daily_entry_id', entry.id);

      // Insert new habit records
      const recordsToInsert = habitRecords.map(record => ({
        daily_entry_id: entry.id,
        habit_id: record.habitId,
        completed: record.completed,
        score: record.completed && record.score ? record.score : null,
        note: record.note || null
      }));

      if (recordsToInsert.length > 0) {
        const { error: recordsError } = await supabase
          .from('daily_habit_records')
          .insert(recordsToInsert);

        if (recordsError) throw recordsError;
      }

      return entry;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['daily-entry', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });
}

export function useHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['history', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('daily_entries')
        .select(`
          *,
          daily_habit_records (*)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as (DailyEntry & { daily_habit_records: DailyHabitRecord[] })[];
    },
    enabled: !!user
  });
}

export function useStats(startDate: string, endDate: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stats', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('daily_entries')
        .select(`
          *,
          daily_habit_records (*)
        `)
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');

      if (error) throw error;
      return data as (DailyEntry & { daily_habit_records: DailyHabitRecord[] })[];
    },
    enabled: !!user
  });
}
