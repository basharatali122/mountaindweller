
-- Update purchase_package function to include referral bonus payout
CREATE OR REPLACE FUNCTION public.purchase_package(p_user_id uuid, p_package_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_package RECORD;
  v_wallet RECORD;
  v_existing_package UUID;
  v_referrer_id UUID;
  v_referral_id UUID;
  v_referral_bonus INTEGER;
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

  -- Handle referral bonus payout (10% of investment amount)
  SELECT referred_by INTO v_referrer_id FROM profiles WHERE id = p_user_id;
  
  IF v_referrer_id IS NOT NULL THEN
    -- Calculate referral bonus (10% of investment)
    v_referral_bonus := (v_package.investment_amount * 10) / 100;
    
    -- Get the referral record
    SELECT id INTO v_referral_id FROM referrals 
    WHERE referrer_id = v_referrer_id AND referred_id = p_user_id AND is_paid = false
    LIMIT 1;
    
    IF v_referral_id IS NOT NULL THEN
      -- Add bonus to referrer's wallet
      UPDATE wallets 
      SET balance = balance + v_referral_bonus,
          total_earned = total_earned + v_referral_bonus,
          updated_at = NOW()
      WHERE user_id = v_referrer_id;
      
      -- Update referral record
      UPDATE referrals 
      SET bonus_amount = v_referral_bonus,
          is_paid = true
      WHERE id = v_referral_id;
      
      -- Create referral bonus transaction for referrer
      INSERT INTO transactions (user_id, type, amount, description, reference_id)
      VALUES (v_referrer_id, 'referral_bonus', v_referral_bonus, 'Referral bonus from ' || (SELECT email FROM profiles WHERE id = p_user_id), p_user_id);
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true, 
    'message', 'Package purchased successfully',
    'package_name', v_package.name,
    'bonus_amount', v_package.bonus_amount
  );
END;
$function$;
