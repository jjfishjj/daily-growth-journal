-- Enable realtime for daily_entries table to trigger updates when new entries are created
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_entries;

-- Enable realtime for daily_habit_records table to trigger updates when habits are recorded
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_habit_records;