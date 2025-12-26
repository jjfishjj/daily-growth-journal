-- Drop unique constraint to allow multiple entries per day
ALTER TABLE public.daily_entries DROP CONSTRAINT IF EXISTS daily_entries_user_id_date_key;