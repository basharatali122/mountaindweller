-- Create atomic function for admin direct deposits
CREATE OR REPLACE FUNCTION public.admin_direct_deposit(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;

  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Update wallet atomically and get new balance
  UPDATE wallets
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  -- Create transaction record
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'deposit', p_amount, COALESCE(p_description, 'Admin deposit'));

  RETURN json_build_object('success', true, 'amount', p_amount, 'new_balance', v_new_balance);
END;
$$;