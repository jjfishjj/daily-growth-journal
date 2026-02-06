-- Create a function to get platform stats that any authenticated user can access
-- Uses SECURITY DEFINER to aggregate data without exposing individual records

CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalUsers', (SELECT COUNT(*) FROM profiles),
    'totalEntries', (SELECT COUNT(*) FROM daily_entries),
    'overallAvgScore', COALESCE((
      SELECT AVG(score)::numeric(4,2) 
      FROM daily_habit_records 
      WHERE completed = true AND score IS NOT NULL
    ), 0),
    'popularHabits', (
      SELECT COALESCE(json_agg(habit_stats ORDER BY completion_count DESC), '[]'::json)
      FROM (
        SELECT 
          dhr.habit_id,
          h.name as habit_name,
          COUNT(*) FILTER (WHERE dhr.completed = true) as completion_count,
          COALESCE(AVG(dhr.score) FILTER (WHERE dhr.completed = true AND dhr.score IS NOT NULL), 0)::numeric(4,2) as avg_score
        FROM daily_habit_records dhr
        JOIN habits h ON h.id = dhr.habit_id
        GROUP BY dhr.habit_id, h.name
        ORDER BY completion_count DESC
        LIMIT 10
      ) habit_stats
    ),
    'bestPracticeTimes', (
      SELECT COALESCE(json_agg(time_stats ORDER BY count DESC), '[]'::json)
      FROM (
        SELECT 
          EXTRACT(HOUR FROM created_at)::int as hour,
          COUNT(*) as count
        FROM daily_entries
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY count DESC
      ) time_stats
    ),
    'activeMembers', (
      SELECT COALESCE(json_agg(member_stats ORDER BY entry_count DESC), '[]'::json)
      FROM (
        SELECT 
          de.user_id,
          COALESCE(p.name, '匿名用戶') as user_name,
          COUNT(DISTINCT de.id) as entry_count,
          COALESCE(AVG(dhr.score) FILTER (WHERE dhr.completed = true AND dhr.score IS NOT NULL), 0)::numeric(4,2) as avg_score
        FROM daily_entries de
        LEFT JOIN profiles p ON p.user_id = de.user_id
        LEFT JOIN daily_habit_records dhr ON dhr.daily_entry_id = de.id
        GROUP BY de.user_id, p.name
        ORDER BY entry_count DESC
        LIMIT 10
      ) member_stats
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated;