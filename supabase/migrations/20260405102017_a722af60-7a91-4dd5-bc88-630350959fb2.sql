
-- 能量點數餘額表
CREATE TABLE public.energy_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 能量點數交易紀錄表
CREATE TABLE public.energy_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
  source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 興趣分類表
CREATE TABLE public.interest_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 興趣標籤表
CREATE TABLE public.interest_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.interest_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);

-- 使用者興趣表（公開/隱藏）
CREATE TABLE public.user_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  interest_tag_id UUID NOT NULL REFERENCES public.interest_tags(id) ON DELETE CASCADE,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'hidden')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, interest_tag_id)
);

-- 商城道具表
CREATE TABLE public.shop_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'cosmetic',
  cost INTEGER NOT NULL,
  duration_days INTEGER,
  stock INTEGER,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 使用者持有道具表
CREATE TABLE public.user_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shop_item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 每日配對紀錄表
CREATE TABLE public.daily_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  matched_user_id UUID NOT NULL,
  compatibility_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 好友關係表
CREATE TABLE public.friend_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  intimacy_score INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '初識',
  chat_bg_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- RLS policies
ALTER TABLE public.energy_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_relationships ENABLE ROW LEVEL SECURITY;

-- energy_balances: users see own, admins see all
CREATE POLICY "Users can view own energy balance" ON public.energy_balances FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own energy balance" ON public.energy_balances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own energy balance" ON public.energy_balances FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all energy balances" ON public.energy_balances FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- energy_transactions: users see own
CREATE POLICY "Users can view own transactions" ON public.energy_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.energy_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.energy_transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- interest_categories & tags: all authenticated can read
CREATE POLICY "Authenticated can view categories" ON public.interest_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage categories" ON public.interest_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view tags" ON public.interest_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage tags" ON public.interest_tags FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_interests: users manage own
CREATE POLICY "Users can manage own interests" ON public.user_interests FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view others public interests" ON public.user_interests FOR SELECT TO authenticated USING (visibility = 'public');

-- shop_items: all can view active, admins manage
CREATE POLICY "Authenticated can view active shop items" ON public.shop_items FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage shop items" ON public.shop_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_items: users see own
CREATE POLICY "Users can view own items" ON public.user_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own items" ON public.user_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- daily_matches: users see own
CREATE POLICY "Users can view own matches" ON public.daily_matches FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = matched_user_id);
CREATE POLICY "Users can insert own matches" ON public.daily_matches FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own matches" ON public.daily_matches FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

-- friend_relationships: users see own
CREATE POLICY "Users can view own friendships" ON public.friend_relationships FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can insert own friendships" ON public.friend_relationships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own friendships" ON public.friend_relationships FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Trigger for updated_at
CREATE TRIGGER update_energy_balances_updated_at BEFORE UPDATE ON public.energy_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_friend_relationships_updated_at BEFORE UPDATE ON public.friend_relationships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create energy balance for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_energy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.energy_balances (user_id, balance)
  VALUES (NEW.id, 100);
  
  INSERT INTO public.energy_transactions (user_id, amount, type, source, description)
  VALUES (NEW.id, 100, 'earn', 'welcome_bonus', '歡迎加入！獲得新手獎勵 100 能量點數');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_energy
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_energy();

-- Function to award points for daily habits
CREATE OR REPLACE FUNCTION public.award_energy_points(
  _user_id UUID,
  _amount INTEGER,
  _source TEXT,
  _description TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.energy_transactions (user_id, amount, type, source, description)
  VALUES (_user_id, _amount, 'earn', _source, _description);
  
  INSERT INTO public.energy_balances (user_id, balance, total_earned)
  VALUES (_user_id, _amount, _amount)
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = energy_balances.balance + _amount,
    total_earned = energy_balances.total_earned + _amount,
    updated_at = now();
END;
$$;

-- Function to spend energy points
CREATE OR REPLACE FUNCTION public.spend_energy_points(
  _user_id UUID,
  _amount INTEGER,
  _source TEXT,
  _description TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT balance INTO current_balance FROM public.energy_balances WHERE user_id = _user_id;
  
  IF current_balance IS NULL OR current_balance < _amount THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.energy_balances
  SET balance = balance - _amount,
      total_spent = total_spent + _amount,
      updated_at = now()
  WHERE user_id = _user_id;
  
  INSERT INTO public.energy_transactions (user_id, amount, type, source, description)
  VALUES (_user_id, _amount, 'spend', _source, _description);
  
  RETURN TRUE;
END;
$$;
