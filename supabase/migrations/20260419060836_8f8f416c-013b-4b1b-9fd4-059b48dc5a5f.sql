
-- 1. Profile details (extended profile info)
CREATE TABLE public.profile_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  bio text,
  avatar_url text,
  region text,
  practice_goal text,
  ideal_friend_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile details" ON public.profile_details
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated can view profile details" ON public.profile_details
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_profile_details_updated
  BEFORE UPDATE ON public.profile_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. User focus keywords
CREATE TABLE public.user_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  keyword text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, keyword)
);

ALTER TABLE public.user_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own keywords" ON public.user_keywords
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated can view keywords" ON public.user_keywords
  FOR SELECT TO authenticated USING (true);

-- 3. User practice preferences (which habits they currently do)
CREATE TABLE public.user_practice_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  habit_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, habit_id)
);

ALTER TABLE public.user_practice_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own practice prefs" ON public.user_practice_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated can view practice prefs" ON public.user_practice_preferences
  FOR SELECT TO authenticated USING (true);

-- 4. Daily draws tracking
CREATE TABLE public.daily_draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  draw_number integer NOT NULL,
  cost integer NOT NULL DEFAULT 0,
  matched_user_id uuid,
  compatibility_score numeric(5,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own draws" ON public.daily_draws
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_daily_draws_user_date ON public.daily_draws (user_id, date);

-- 5. Greetings
CREATE TABLE public.greetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  message text NOT NULL DEFAULT '哈囉！很高興認識你 🙏',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.greetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own greetings" ON public.greetings
  FOR SELECT TO authenticated USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users send greetings" ON public.greetings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Receivers mark read" ON public.greetings
  FOR UPDATE TO authenticated USING (auth.uid() = to_user_id);

-- 6. Favorite friends
CREATE TABLE public.favorite_friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  favorited_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, favorited_user_id)
);

ALTER TABLE public.favorite_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites" ON public.favorite_friends
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Compatibility calculation function
CREATE OR REPLACE FUNCTION public.calculate_compatibility(_user_a uuid, _user_b uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  interest_score numeric := 0;
  keyword_score numeric := 0;
  habit_score numeric := 0;
  time_score numeric := 0;
  shared_interests int;
  total_interests int;
  shared_keywords int;
  total_keywords int;
  shared_habits int;
  total_habits int;
  hour_diff numeric;
BEGIN
  -- Interests overlap (0-30)
  SELECT COUNT(*) INTO shared_interests
  FROM user_interests a
  JOIN user_interests b ON a.interest_tag_id = b.interest_tag_id
  WHERE a.user_id = _user_a AND b.user_id = _user_b;

  SELECT GREATEST(
    (SELECT COUNT(DISTINCT interest_tag_id) FROM user_interests WHERE user_id IN (_user_a, _user_b)),
    1
  ) INTO total_interests;

  interest_score := LEAST(30, (shared_interests::numeric / total_interests) * 30 + shared_interests * 3);

  -- Keywords overlap (0-25)
  SELECT COUNT(*) INTO shared_keywords
  FROM user_keywords a
  JOIN user_keywords b ON LOWER(a.keyword) = LOWER(b.keyword)
  WHERE a.user_id = _user_a AND b.user_id = _user_b;

  keyword_score := LEAST(25, shared_keywords * 5);

  -- Habits overlap (0-25)
  SELECT COUNT(*) INTO shared_habits
  FROM user_practice_preferences a
  JOIN user_practice_preferences b ON a.habit_id = b.habit_id
  WHERE a.user_id = _user_a AND b.user_id = _user_b;

  habit_score := LEAST(25, shared_habits * 4);

  -- Active time similarity (0-20) - based on average entry hour
  SELECT COALESCE(ABS(
    (SELECT AVG(EXTRACT(HOUR FROM created_at)) FROM daily_entries WHERE user_id = _user_a) -
    (SELECT AVG(EXTRACT(HOUR FROM created_at)) FROM daily_entries WHERE user_id = _user_b)
  ), 12) INTO hour_diff;

  time_score := GREATEST(0, 20 - hour_diff * 1.5);

  RETURN ROUND(interest_score + keyword_score + habit_score + time_score, 2);
END;
$$;

-- 8. Draw cost rule helper
CREATE OR REPLACE FUNCTION public.get_draw_cost(_draw_number integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE _draw_number
    WHEN 1 THEN 0
    WHEN 2 THEN 10
    WHEN 3 THEN 30
    ELSE -1
  END;
$$;

-- 9. Perform draw function
CREATE OR REPLACE FUNCTION public.perform_daily_draw()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _today date := CURRENT_DATE;
  _draw_count int;
  _next_draw int;
  _cost int;
  _balance int;
  _matched uuid;
  _score numeric;
  _draw_id uuid;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COUNT(*) INTO _draw_count FROM daily_draws WHERE user_id = _user AND date = _today;
  _next_draw := _draw_count + 1;

  IF _next_draw > 3 THEN
    RETURN json_build_object('success', false, 'error', '今日抽取次數已達上限（3次）');
  END IF;

  _cost := get_draw_cost(_next_draw);

  IF _cost > 0 THEN
    SELECT balance INTO _balance FROM energy_balances WHERE user_id = _user;
    IF COALESCE(_balance, 0) < _cost THEN
      RETURN json_build_object('success', false, 'error', '能量點數不足', 'required', _cost, 'balance', COALESCE(_balance, 0));
    END IF;

    UPDATE energy_balances
    SET balance = balance - _cost,
        total_spent = total_spent + _cost,
        updated_at = now()
    WHERE user_id = _user;

    INSERT INTO energy_transactions (user_id, amount, type, source, description)
    VALUES (_user, _cost, 'spend', 'match_draw', '每日一抽 第' || _next_draw || '次');
  END IF;

  -- Pick a random user (not self, not already drawn today, has profile)
  SELECT p.user_id INTO _matched
  FROM profiles p
  WHERE p.user_id <> _user
    AND p.user_id NOT IN (
      SELECT matched_user_id FROM daily_draws
      WHERE user_id = _user AND date = _today AND matched_user_id IS NOT NULL
    )
  ORDER BY random()
  LIMIT 1;

  IF _matched IS NULL THEN
    -- Refund if no candidate
    IF _cost > 0 THEN
      UPDATE energy_balances SET balance = balance + _cost, total_spent = total_spent - _cost WHERE user_id = _user;
      DELETE FROM energy_transactions WHERE user_id = _user AND source = 'match_draw' AND created_at > now() - interval '5 seconds';
    END IF;
    RETURN json_build_object('success', false, 'error', '目前沒有可配對的對象');
  END IF;

  _score := calculate_compatibility(_user, _matched);

  INSERT INTO daily_draws (user_id, date, draw_number, cost, matched_user_id, compatibility_score)
  VALUES (_user, _today, _next_draw, _cost, _matched, _score)
  RETURNING id INTO _draw_id;

  RETURN json_build_object(
    'success', true,
    'draw_id', _draw_id,
    'matched_user_id', _matched,
    'compatibility_score', _score,
    'draw_number', _next_draw,
    'cost', _cost
  );
END;
$$;

-- 10. Send greeting function (validates input, awards points to receiver)
CREATE OR REPLACE FUNCTION public.send_greeting(_to_user uuid, _message text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _from uuid := auth.uid();
  _greeting_id uuid;
BEGIN
  IF _from IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _from = _to_user THEN
    RAISE EXCEPTION 'Cannot greet self';
  END IF;
  IF length(coalesce(_message,'')) = 0 OR length(_message) > 200 THEN
    RAISE EXCEPTION 'Message must be 1-200 chars';
  END IF;

  INSERT INTO greetings (from_user_id, to_user_id, message)
  VALUES (_from, _to_user, _message)
  RETURNING id INTO _greeting_id;

  -- Award 3 points for social interaction (to sender)
  PERFORM award_energy_points(_from, 3, 'social_interact', '送出打招呼');

  RETURN json_build_object('success', true, 'greeting_id', _greeting_id);
END;
$$;
