-- Marquee announcements table for site-wide scrolling banner
CREATE TABLE public.marquee_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  link_url TEXT,
  text_color TEXT NOT NULL DEFAULT '#ffffff',
  bg_color TEXT NOT NULL DEFAULT '#f59e0b',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Site-wide marquee config (single row)
CREATE TABLE public.marquee_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  scroll_speed INTEGER NOT NULL DEFAULT 40, -- seconds per loop
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

INSERT INTO public.marquee_config (is_enabled, scroll_speed) VALUES (true, 40);

ALTER TABLE public.marquee_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marquee_config ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active messages
CREATE POLICY "Authenticated view active marquee" ON public.marquee_messages
FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Admins manage marquee messages" ON public.marquee_messages
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated view marquee config" ON public.marquee_config
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage marquee config" ON public.marquee_config
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_marquee_messages_updated_at
BEFORE UPDATE ON public.marquee_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marquee_config_updated_at
BEFORE UPDATE ON public.marquee_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();