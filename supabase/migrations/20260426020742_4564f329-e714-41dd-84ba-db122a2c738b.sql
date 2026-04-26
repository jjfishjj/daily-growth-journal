
-- 1. 斷捨離行動方案
CREATE TABLE public.declutter_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  declutter_item_id UUID REFERENCES public.declutter_items(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  remind_at DATE,
  remind_days INTEGER,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.declutter_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own declutter actions" ON public.declutter_actions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all declutter actions" ON public.declutter_actions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_declutter_actions_updated_at BEFORE UPDATE ON public.declutter_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_declutter_actions_user ON public.declutter_actions(user_id, is_completed);

CREATE OR REPLACE FUNCTION public.complete_declutter_action(_action_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _user UUID := auth.uid(); _action RECORD; _today_earned INT; _awarded BOOLEAN := false;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _action FROM declutter_actions WHERE id = _action_id AND user_id = _user;
  IF _action IS NULL THEN RETURN json_build_object('success', false, 'error', '找不到行動方案'); END IF;
  IF _action.is_completed THEN RETURN json_build_object('success', false, 'error', '已完成'); END IF;
  UPDATE declutter_actions SET is_completed = true, completed_at = now(), updated_at = now() WHERE id = _action_id;
  SELECT COALESCE(SUM(amount), 0) INTO _today_earned FROM energy_transactions
   WHERE user_id = _user AND source = 'declutter_action_complete' AND type = 'earn' AND created_at::date = CURRENT_DATE;
  IF _today_earned < 10 THEN
    PERFORM award_energy_points(_user, 2, 'declutter_action_complete', '完成斷捨離行動');
    _awarded := true;
  END IF;
  RETURN json_build_object('success', true, 'awarded', _awarded);
END; $$;

-- 2. 論壇分類
CREATE TABLE public.forum_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view categories" ON public.forum_categories
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins manage categories" ON public.forum_categories
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.forum_categories (name, description, icon, slug, sort_order, habit_id)
SELECT '🌿 ' || h.name, h.description, '🌿', 'habit-' || h.default_order, h.default_order, h.id
FROM public.habits h WHERE h.is_active = true;

INSERT INTO public.forum_categories (name, description, icon, slug, sort_order) VALUES
  ('📖 觀心書專區', '分享每日靈性紀錄與覺察', '📖', 'guanxin', 100),
  ('♻️ 斷捨離專區', '分享斷捨離歷程與心得', '♻️', 'declutter', 101),
  ('💬 綜合討論', '其他修行心得與交流', '💬', 'general', 200);

-- 3. 論壇貼文
CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_id UUID,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view posts" ON public.forum_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own posts" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own posts" ON public.forum_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own posts" ON public.forum_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all posts" ON public.forum_posts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_forum_posts_category_created ON public.forum_posts(category_id, created_at DESC);
CREATE INDEX idx_forum_posts_user ON public.forum_posts(user_id, created_at DESC);

-- 4. 論壇回文
CREATE TABLE public.forum_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view comments" ON public.forum_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own comments" ON public.forum_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.forum_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_forum_comments_post ON public.forum_comments(post_id, created_at);

-- 5. 論壇按讚
CREATE TABLE public.forum_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view likes" ON public.forum_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own likes" ON public.forum_likes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. 觸發器與獎勵
CREATE OR REPLACE FUNCTION public.handle_forum_post_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _today INT;
BEGIN
  SELECT COALESCE(SUM(amount),0) INTO _today FROM energy_transactions
   WHERE user_id = NEW.user_id AND source = 'forum_post' AND type='earn' AND created_at::date = CURRENT_DATE;
  IF _today < 15 THEN PERFORM award_energy_points(NEW.user_id, 5, 'forum_post', '發表論壇貼文'); END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_forum_post_insert AFTER INSERT ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_forum_post_insert();

CREATE OR REPLACE FUNCTION public.handle_forum_comment_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _today INT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    SELECT COALESCE(SUM(amount),0) INTO _today FROM energy_transactions
     WHERE user_id = NEW.user_id AND source = 'forum_comment' AND type='earn' AND created_at::date = CURRENT_DATE;
    IF _today < 10 THEN PERFORM award_energy_points(NEW.user_id, 2, 'forum_comment', '回覆論壇貼文'); END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_forum_comment_change AFTER INSERT OR DELETE ON public.forum_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_forum_comment_change();

CREATE OR REPLACE FUNCTION public.handle_forum_like_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _author UUID; _today INT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET like_count = like_count + 1 WHERE id = NEW.post_id RETURNING user_id INTO _author;
    IF _author IS NOT NULL AND _author <> NEW.user_id THEN
      SELECT COALESCE(SUM(amount),0) INTO _today FROM energy_transactions
       WHERE user_id = _author AND source = 'forum_like_received' AND type='earn' AND created_at::date = CURRENT_DATE;
      IF _today < 10 THEN PERFORM award_energy_points(_author, 1, 'forum_like_received', '收到論壇按讚'); END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_forum_like_change AFTER INSERT OR DELETE ON public.forum_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_forum_like_change();

CREATE OR REPLACE FUNCTION public.increment_forum_share(_post_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE forum_posts SET share_count = share_count + 1 WHERE id = _post_id;
$$;

-- 7. 通知總覽
CREATE OR REPLACE FUNCTION public.get_my_notifications()
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _user UUID := auth.uid(); _result JSON;
BEGIN
  IF _user IS NULL THEN RETURN json_build_object('total_unread_messages', 0); END IF;
  SELECT json_build_object(
    'total_unread_messages', (SELECT COUNT(*) FROM messages WHERE to_user_id = _user AND is_read = false),
    'pending_guanxin_actions', (SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json) FROM (
        SELECT id, content, remind_at,
          CASE WHEN remind_at < CURRENT_DATE THEN 'overdue'
               WHEN remind_at <= CURRENT_DATE + 1 THEN 'due' ELSE 'upcoming' END AS status
        FROM guanxin_actions WHERE user_id = _user AND is_completed = false AND remind_at IS NOT NULL
          AND remind_at <= CURRENT_DATE + 7 ORDER BY remind_at ASC LIMIT 20) a),
    'pending_declutter_actions', (SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json) FROM (
        SELECT id, content, remind_at,
          CASE WHEN remind_at < CURRENT_DATE THEN 'overdue'
               WHEN remind_at <= CURRENT_DATE + 1 THEN 'due' ELSE 'upcoming' END AS status
        FROM declutter_actions WHERE user_id = _user AND is_completed = false AND remind_at IS NOT NULL
          AND remind_at <= CURRENT_DATE + 7 ORDER BY remind_at ASC LIMIT 20) a),
    'recent_forum_comments', (SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json) FROM (
        SELECT fc.id, fc.post_id, fc.content, fc.created_at,
          COALESCE(p.name,'匿名') AS commenter_name, fp.title AS post_title
        FROM forum_comments fc JOIN forum_posts fp ON fp.id = fc.post_id
        LEFT JOIN profiles p ON p.user_id = fc.user_id
        WHERE fp.user_id = _user AND fc.user_id <> _user
          AND fc.created_at > now() - interval '14 days' ORDER BY fc.created_at DESC LIMIT 20) c),
    'recent_forum_likes', (SELECT COALESCE(json_agg(row_to_json(l)), '[]'::json) FROM (
        SELECT fl.id, fl.post_id, fl.created_at,
          COALESCE(p.name,'匿名') AS liker_name, fp.title AS post_title
        FROM forum_likes fl JOIN forum_posts fp ON fp.id = fl.post_id
        LEFT JOIN profiles p ON p.user_id = fl.user_id
        WHERE fp.user_id = _user AND fl.user_id <> _user
          AND fl.created_at > now() - interval '14 days' ORDER BY fl.created_at DESC LIMIT 20) l),
    'recent_greetings', (SELECT COALESCE(json_agg(row_to_json(g)), '[]'::json) FROM (
        SELECT gr.id, gr.message, gr.created_at, gr.is_read,
          COALESCE(p.name,'匿名') AS from_name, gr.from_user_id
        FROM greetings gr LEFT JOIN profiles p ON p.user_id = gr.from_user_id
        WHERE gr.to_user_id = _user AND gr.is_read = false
        ORDER BY gr.created_at DESC LIMIT 10) g)
  ) INTO _result;
  RETURN _result;
END; $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.declutter_actions;
