-- 行動方案表
CREATE TABLE public.guanxin_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  guanxin_entry_id UUID REFERENCES public.guanxin_entries(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual', -- 'auto' (parsed from to do) or 'manual'
  remind_at DATE,
  remind_days INTEGER, -- 1, 3, 7
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_guanxin_actions_user ON public.guanxin_actions(user_id);
CREATE INDEX idx_guanxin_actions_remind ON public.guanxin_actions(remind_at) WHERE is_completed = false;

ALTER TABLE public.guanxin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own actions" ON public.guanxin_actions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all actions" ON public.guanxin_actions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_guanxin_actions_updated_at
  BEFORE UPDATE ON public.guanxin_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 行動方案通知表
CREATE TABLE public.action_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_id UUID NOT NULL REFERENCES public.guanxin_actions(id) ON DELETE CASCADE,
  notify_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(action_id, notify_date)
);

CREATE INDEX idx_action_notifications_user ON public.action_notifications(user_id, is_read);

ALTER TABLE public.action_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notifications" ON public.action_notifications
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 完成行動方案並獎勵
CREATE OR REPLACE FUNCTION public.complete_action(_action_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user UUID := auth.uid();
  _action RECORD;
  _today_earned INT;
  _awarded BOOLEAN := false;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _action FROM guanxin_actions WHERE id = _action_id AND user_id = _user;
  IF _action IS NULL THEN
    RETURN json_build_object('success', false, 'error', '找不到行動方案');
  END IF;

  IF _action.is_completed THEN
    RETURN json_build_object('success', false, 'error', '已完成');
  END IF;

  UPDATE guanxin_actions
  SET is_completed = true, completed_at = now(), updated_at = now()
  WHERE id = _action_id;

  -- 每日上限 15 點 (5 筆 × 3 點)
  SELECT COALESCE(SUM(amount), 0) INTO _today_earned
  FROM energy_transactions
  WHERE user_id = _user
    AND source = 'action_complete'
    AND type = 'earn'
    AND created_at::date = CURRENT_DATE;

  IF _today_earned < 15 THEN
    PERFORM award_energy_points(_user, 3, 'action_complete', '完成行動方案');
    _awarded := true;
  END IF;

  RETURN json_build_object('success', true, 'awarded', _awarded);
END;
$$;