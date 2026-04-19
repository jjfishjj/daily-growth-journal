-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 1000),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_pair ON public.messages (from_user_id, to_user_id, created_at DESC);
CREATE INDEX idx_messages_to_unread ON public.messages (to_user_id, is_read);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own messages" ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id AND from_user_id <> to_user_id);

CREATE POLICY "Receiver marks read" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = to_user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Mock users registry
CREATE TABLE public.mock_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  handle TEXT NOT NULL UNIQUE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mock_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage mock users" ON public.mock_users
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Function: admin seeds a single mock user with full profile
CREATE OR REPLACE FUNCTION public.admin_seed_mock_user(
  _handle TEXT,
  _bio TEXT,
  _region TEXT,
  _practice_goal TEXT,
  _ideal_friend_type TEXT,
  _keywords TEXT[],
  _habit_ids UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_user UUID;
  _kw TEXT;
  _hid UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF EXISTS (SELECT 1 FROM mock_users WHERE handle = _handle) THEN
    RAISE EXCEPTION 'Handle already exists: %', _handle;
  END IF;

  _new_user := gen_random_uuid();

  INSERT INTO profiles (user_id, name) VALUES (_new_user, _handle);
  INSERT INTO mock_users (user_id, handle, created_by) VALUES (_new_user, _handle, auth.uid());

  INSERT INTO profile_details (user_id, bio, region, practice_goal, ideal_friend_type)
  VALUES (_new_user, _bio, _region, _practice_goal, _ideal_friend_type);

  IF _keywords IS NOT NULL THEN
    FOREACH _kw IN ARRAY _keywords LOOP
      INSERT INTO user_keywords (user_id, keyword) VALUES (_new_user, _kw);
    END LOOP;
  END IF;

  IF _habit_ids IS NOT NULL THEN
    FOREACH _hid IN ARRAY _habit_ids LOOP
      INSERT INTO user_practice_preferences (user_id, habit_id) VALUES (_new_user, _hid)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN _new_user;
END;
$$;

-- Function: list conversations for current user (last message per partner + unread count)
CREATE OR REPLACE FUNCTION public.get_my_conversations()
RETURNS TABLE (
  partner_id UUID,
  partner_name TEXT,
  last_message TEXT,
  last_at TIMESTAMPTZ,
  unread_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH pairs AS (
    SELECT
      CASE WHEN from_user_id = auth.uid() THEN to_user_id ELSE from_user_id END AS partner_id,
      content,
      created_at,
      is_read,
      to_user_id
    FROM messages
    WHERE auth.uid() IN (from_user_id, to_user_id)
  ),
  ranked AS (
    SELECT partner_id, content, created_at,
      ROW_NUMBER() OVER (PARTITION BY partner_id ORDER BY created_at DESC) AS rn
    FROM pairs
  )
  SELECT
    r.partner_id,
    COALESCE(p.name, '匿名用戶') AS partner_name,
    r.content AS last_message,
    r.created_at AS last_at,
    (SELECT COUNT(*) FROM pairs px WHERE px.partner_id = r.partner_id AND px.to_user_id = auth.uid() AND px.is_read = false) AS unread_count
  FROM ranked r
  LEFT JOIN profiles p ON p.user_id = r.partner_id
  WHERE r.rn = 1
  ORDER BY r.created_at DESC;
$$;