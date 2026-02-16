-- Balance integrity (20.6): Atomic redemption — check balance, deduct, insert ledger and redemption in one transaction.
-- Caller must be the authenticated user (auth.uid() = p_user_id).

CREATE OR REPLACE FUNCTION public.redeem_pineapples(
  p_user_id uuid,
  p_amount int,
  p_reward_type text DEFAULT 'uber_eats'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance int;
  v_balance_after int;
  v_redemption_id uuid;
  v_idempotency_key text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_amount IS NULL OR p_amount < 50 THEN
    RAISE EXCEPTION 'Amount must be at least 50';
  END IF;

  SELECT pineapple_balance INTO v_balance
  FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  v_balance_after := v_balance - p_amount;
  v_idempotency_key := 'redeem-' || p_user_id::text || '-' || gen_random_uuid()::text;

  UPDATE profiles SET pineapple_balance = v_balance_after WHERE id = p_user_id;

  INSERT INTO redemptions (user_id, amount, reward_type, status)
  VALUES (p_user_id, p_amount, COALESCE(NULLIF(trim(p_reward_type), ''), 'uber_eats'), 'pending')
  RETURNING id INTO v_redemption_id;

  INSERT INTO reward_ledger (user_id, project_id, event_type, reward_amount, balance_after, idempotency_key)
  VALUES (p_user_id, NULL, 'reward_redeemed', -p_amount, v_balance_after, v_idempotency_key);

  INSERT INTO activity_events (project_id, user_id, event_type, description, metadata)
  VALUES (NULL, p_user_id, 'reward_redeemed', 'Redeemed ' || p_amount || ' pineapples (' || COALESCE(NULLIF(trim(p_reward_type), ''), 'uber_eats') || ')', jsonb_build_object('amount', p_amount, 'reward_type', COALESCE(NULLIF(trim(p_reward_type), ''), 'uber_eats')));

  RETURN v_redemption_id;
END;
$$;
