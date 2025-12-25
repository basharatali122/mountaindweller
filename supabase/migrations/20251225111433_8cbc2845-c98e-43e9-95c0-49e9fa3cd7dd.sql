-- Create a function to handle package purchase atomically
CREATE OR REPLACE FUNCTION public.purchase_package(
  p_user_id UUID,
  p_package_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_package RECORD;
  v_wallet RECORD;
  v_existing_package UUID;
BEGIN
  -- Check if user already has a package
  SELECT package_id INTO v_existing_package FROM profiles WHERE id = p_user_id;
  IF v_existing_package IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'You already have an active package');
  END IF;

  -- Get package details
  SELECT * INTO v_package FROM packages WHERE id = p_package_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Package not found or inactive');
  END IF;

  -- Get wallet balance
  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  -- Check if user has enough balance
  IF v_wallet.balance < v_package.investment_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Deduct investment amount from wallet
  UPDATE wallets 
  SET balance = balance - v_package.investment_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Add bonus to wallet
  UPDATE wallets 
  SET balance = balance + v_package.bonus_amount,
      total_earned = total_earned + v_package.bonus_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create purchase transaction
  INSERT INTO transactions (user_id, type, amount, description, reference_id)
  VALUES (p_user_id, 'purchase', -v_package.investment_amount, 'Package purchase: ' || v_package.name, p_package_id);

  -- Create bonus transaction
  INSERT INTO transactions (user_id, type, amount, description, reference_id)
  VALUES (p_user_id, 'bonus', v_package.bonus_amount, 'Package bonus: ' || v_package.name, p_package_id);

  -- Update user profile with package
  UPDATE profiles 
  SET package_id = p_package_id,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true, 
    'message', 'Package purchased successfully',
    'package_name', v_package.name,
    'bonus_amount', v_package.bonus_amount
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.purchase_package TO authenticated;