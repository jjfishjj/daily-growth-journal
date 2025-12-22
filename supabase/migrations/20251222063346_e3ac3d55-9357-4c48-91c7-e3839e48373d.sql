-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create habits table for the 16 predefined habits
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  default_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_habits table for custom user habit preferences
CREATE TABLE public.user_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, habit_id)
);

-- Create daily_entries table for daily records
CREATE TABLE public.daily_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  overall_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Create daily_habit_records table for habit details per day
CREATE TABLE public.daily_habit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_entry_id UUID NOT NULL REFERENCES public.daily_entries(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  score INTEGER CHECK (score IS NULL OR (score >= 1 AND score <= 10)),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (daily_entry_id, habit_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_habit_records ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Habits policies (public read, admin write)
CREATE POLICY "Everyone can view active habits" ON public.habits
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage habits" ON public.habits
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User habits policies
CREATE POLICY "Users can view own habits" ON public.user_habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own habits" ON public.user_habits
  FOR ALL USING (auth.uid() = user_id);

-- Daily entries policies
CREATE POLICY "Users can view own entries" ON public.daily_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries" ON public.daily_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON public.daily_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all entries" ON public.daily_entries
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Daily habit records policies
CREATE POLICY "Users can view own habit records" ON public.daily_habit_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.daily_entries
      WHERE daily_entries.id = daily_habit_records.daily_entry_id
      AND daily_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own habit records" ON public.daily_habit_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.daily_entries
      WHERE daily_entries.id = daily_habit_records.daily_entry_id
      AND daily_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own habit records" ON public.daily_habit_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.daily_entries
      WHERE daily_entries.id = daily_habit_records.daily_entry_id
      AND daily_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all habit records" ON public.daily_habit_records
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_entries_updated_at
  BEFORE UPDATE ON public.daily_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert the 16 predefined habits
INSERT INTO public.habits (name, description, default_order) VALUES
  ('五感恩', '每日練習感恩五件事物', 1),
  ('大笑功法', '透過大笑釋放壓力與負能量', 2),
  ('一日一素食', '每日至少一餐選擇素食', 3),
  ('自我肯定', '對自己說正向肯定的話語', 4),
  ('餐前感恩', '用餐前感謝食物與一切', 5),
  ('欣賞身邊的人', '發現並欣賞周遭人的優點', 6),
  ('觀心書', '閱讀心靈成長相關書籍', 7),
  ('子時入睡', '在晚上11點前就寢', 8),
  ('祝福', '給予他人真誠的祝福', 9),
  ('恩啊轟', '練習能量呼吸法', 10),
  ('熱舞', '透過舞蹈活動身體', 11),
  ('感恩冥想', '進行感恩主題的冥想練習', 12),
  ('光的冥想', '觀想光明的冥想練習', 13),
  ('大悲咒', '持誦大悲咒', 14),
  ('心經', '持誦心經', 15),
  ('舞之禪', '透過舞蹈進入禪定狀態', 16);