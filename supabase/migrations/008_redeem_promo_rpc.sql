-- Migration 008: Atomic promo code redemption
--
-- The /api/redeem route previously read the promo_codes JSON array, checked
-- limits in JS, then wrote the incremented array back. Two concurrent
-- requests could both pass the max_uses check (read-modify-write race).
-- This RPC locks the paywall_config row (FOR UPDATE), validates, and
-- increments in one transaction.
--
-- Returns jsonb:
--   { "ok": true,  "match": { ...promo code object with incremented uses } }
--   { "ok": false, "error": "Invalid code" | "This code has expired"
--                         | "This code has reached its usage limit" }

CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_codes jsonb;
  v_elem jsonb;
  v_match jsonb;
  v_idx int := -1;
  i int;
BEGIN
  SELECT value INTO v_codes
  FROM paywall_config
  WHERE key = 'promo_codes'
  FOR UPDATE;

  IF v_codes IS NULL OR jsonb_typeof(v_codes) <> 'array' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid code');
  END IF;

  FOR i IN 0 .. jsonb_array_length(v_codes) - 1 LOOP
    v_elem := v_codes -> i;
    IF v_elem ->> 'code' = p_code
       AND COALESCE((v_elem ->> 'active')::boolean, true) THEN
      v_idx := i;
      v_match := v_elem;
      EXIT;
    END IF;
  END LOOP;

  IF v_idx < 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid code');
  END IF;

  IF (v_match ->> 'expires_at') IS NOT NULL
     AND (v_match ->> 'expires_at')::timestamptz < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This code has expired');
  END IF;

  -- max_uses of null/0 means unlimited (matches old JS falsy check)
  IF COALESCE((v_match ->> 'max_uses')::int, 0) > 0
     AND COALESCE((v_match ->> 'uses')::int, 0) >= (v_match ->> 'max_uses')::int THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This code has reached its usage limit');
  END IF;

  v_match := jsonb_set(v_match, '{uses}', to_jsonb(COALESCE((v_match ->> 'uses')::int, 0) + 1));

  UPDATE paywall_config
  SET value = jsonb_set(v_codes, ARRAY[v_idx::text], v_match)
  WHERE key = 'promo_codes';

  RETURN jsonb_build_object('ok', true, 'match', v_match);
END;
$$;

-- Server-side only (called via service role from /api/redeem)
REVOKE EXECUTE ON FUNCTION public.redeem_promo_code(text) FROM PUBLIC, anon, authenticated;
