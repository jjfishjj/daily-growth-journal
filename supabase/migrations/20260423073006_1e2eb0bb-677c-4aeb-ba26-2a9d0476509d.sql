-- declutter_items table
CREATE TABLE public.declutter_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'object',
  note TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_reflection TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.declutter_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own declutter items"
ON public.declutter_items
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all declutter items"
ON public.declutter_items
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_declutter_items_user_date ON public.declutter_items(user_id, date DESC);

CREATE TRIGGER update_declutter_items_updated_at
BEFORE UPDATE ON public.declutter_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Complete + reward function
CREATE OR REPLACE FUNCTION public.complete_declutter(_item_id UUID, _reflection TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user UUID := auth.uid();
  _item RECORD;
  _today_earned INT;
  _awarded BOOLEAN := false;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _item FROM declutter_items WHERE id = _item_id AND user_id = _user;
  IF _item IS NULL THEN
    RETURN json_build_object('success', false, 'error', '找不到項目');
  END IF;

  IF _item.is_completed THEN
    RETURN json_build_object('success', false, 'error', '已完成');
  END IF;

  UPDATE declutter_items
  SET is_completed = true,
      completed_at = now(),
      completion_reflection = _reflection,
      updated_at = now()
  WHERE id = _item_id;

  -- 每日上限 10 點 (5 筆 × 2 點)
  SELECT COALESCE(SUM(amount), 0) INTO _today_earned
  FROM energy_transactions
  WHERE user_id = _user
    AND source = 'declutter_complete'
    AND type = 'earn'
    AND created_at::date = CURRENT_DATE;

  IF _today_earned < 10 THEN
    PERFORM award_energy_points(_user, 2, 'declutter_complete', '完成斷捨離項目');
    _awarded := true;
  END IF;

  RETURN json_build_object('success', true, 'awarded', _awarded);
END;
$$;