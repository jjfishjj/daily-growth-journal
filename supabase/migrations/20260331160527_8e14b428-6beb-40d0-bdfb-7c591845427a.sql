
-- 觀心書填寫紀錄表
CREATE TABLE public.guanxin_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 觀心書請假表
CREATE TABLE public.guanxin_leaves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.guanxin_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guanxin_leaves ENABLE ROW LEVEL SECURITY;

-- RLS for guanxin_entries
CREATE POLICY "Users can insert own guanxin entries"
  ON public.guanxin_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own guanxin entries"
  ON public.guanxin_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own guanxin entries"
  ON public.guanxin_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all guanxin entries"
  ON public.guanxin_entries FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS for guanxin_leaves
CREATE POLICY "Users can insert own guanxin leaves"
  ON public.guanxin_leaves FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own guanxin leaves"
  ON public.guanxin_leaves FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own guanxin leaves"
  ON public.guanxin_leaves FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all guanxin leaves"
  ON public.guanxin_leaves FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_guanxin_entries_updated_at
  BEFORE UPDATE ON public.guanxin_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
