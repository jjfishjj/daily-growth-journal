
-- 1. Fix energy point functions: enforce caller identity
CREATE OR REPLACE FUNCTION public.award_energy_points(_user_id uuid, _amount integer, _source text, _description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Permission denied';
    END IF;
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.spend_energy_points(_user_id uuid, _amount integer, _source text, _description text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_balance INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Permission denied';
    END IF;
  END IF;

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
$function$;

-- 2. Remove user INSERT/UPDATE on energy_balances (only SECURITY DEFINER funcs should mutate)
DROP POLICY IF EXISTS "Users can insert own energy balance" ON public.energy_balances;
DROP POLICY IF EXISTS "Users can update own energy balance" ON public.energy_balances;

-- 3. Remove user direct INSERT on energy_transactions (force usage of award/spend funcs)
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.energy_transactions;

-- 4. Realtime authorization: restrict subscriptions on daily_entries / daily_habit_records topics to owner
-- Topic convention used by app: clients should subscribe with topic = 'user:' || auth.uid()
-- We add a permissive RLS policy on realtime.messages allowing only matching topic.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read own topic" ON realtime.messages;
CREATE POLICY "Authenticated users can read own topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('user:' || auth.uid()::text)
  OR realtime.topic() LIKE 'public:%'
);

DROP POLICY IF EXISTS "Authenticated users can write own topic" ON realtime.messages;
CREATE POLICY "Authenticated users can write own topic"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() = ('user:' || auth.uid()::text)
);
