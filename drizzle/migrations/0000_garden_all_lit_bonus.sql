CREATE OR REPLACE FUNCTION public.claim_garden_bonus()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u uuid := auth.uid();
BEGIN
  IF _u IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM energy_transactions WHERE user_id=_u AND source='garden_all_lit'
     AND (created_at AT TIME ZONE 'Asia/Taipei')::date = (now() AT TIME ZONE 'Asia/Taipei')::date) THEN
    RETURN json_build_object('awarded', false);
  END IF;
  PERFORM award_energy_points(_u, 10, 'garden_all_lit', '觀心庭園全部點亮');
  RETURN json_build_object('awarded', true, 'amount', 10);
END $$;
REVOKE ALL ON FUNCTION public.claim_garden_bonus() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_garden_bonus() TO authenticated;