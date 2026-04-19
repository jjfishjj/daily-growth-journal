CREATE OR REPLACE FUNCTION public.get_draw_cost(_draw_number integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _draw_number
    WHEN 1 THEN 0
    WHEN 2 THEN 10
    WHEN 3 THEN 30
    ELSE -1
  END;
$$;