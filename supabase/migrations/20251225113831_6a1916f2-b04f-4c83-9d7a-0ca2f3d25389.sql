
-- Update purchase_package function to include multi-level referral bonuses
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
  v_level1_referrer_id UUID;
  v_level2_referrer_id UUID;
  v_level3_referrer_id UUID;
  v_referral_id UUID;
  v_level1_bonus INTEGER;
  v_level2_bonus INTEGER;
  v_level3_bonus INTEGER;
  v_purchaser_email TEXT;
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

  -- Get purchaser email for transaction descriptions
  SELECT email INTO v_purchaser_email FROM profiles WHERE id = p_user_id;

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

  -- ========== MULTI-LEVEL REFERRAL BONUSES ==========
  
  -- Level 1: Direct referrer (10%)
  SELECT referred_by INTO v_level1_referrer_id FROM profiles WHERE id = p_user_id;
  
  IF v_level1_referrer_id IS NOT NULL THEN
    v_level1_bonus := (v_package.investment_amount * 10) / 100;
    
    -- Get the referral record for level 1
    SELECT id INTO v_referral_id FROM referrals 
    WHERE referrer_id = v_level1_referrer_id AND referred_id = p_user_id AND is_paid = false
    LIMIT 1;
    
    IF v_referral_id IS NOT NULL THEN
      -- Add bonus to level 1 referrer's wallet
      UPDATE wallets 
      SET balance = balance + v_level1_bonus,
          total_earned = total_earned + v_level1_bonus,
          updated_at = NOW()
      WHERE user_id = v_level1_referrer_id;
      
      -- Update referral record
      UPDATE referrals 
      SET bonus_amount = v_level1_bonus,
          is_paid = true
      WHERE id = v_referral_id;
      
      -- Create referral bonus transaction
      INSERT INTO transactions (user_id, type, amount, description, reference_id)
      VALUES (v_level1_referrer_id, 'referral_bonus', v_level1_bonus, 'Level 1 bonus from ' || v_purchaser_email, p_user_id);
    END IF;
    
    -- Level 2: Referrer's referrer (5%)
    SELECT referred_by INTO v_level2_referrer_id FROM profiles WHERE id = v_level1_referrer_id;
    
    IF v_level2_referrer_id IS NOT NULL THEN
      v_level2_bonus := (v_package.investment_amount * 5) / 100;
      
      -- Add bonus to level 2 referrer's wallet
      UPDATE wallets 
      SET balance = balance + v_level2_bonus,
          total_earned = total_earned + v_level2_bonus,
          updated_at = NOW()
      WHERE user_id = v_level2_referrer_id;
      
      -- Create level 2 referral bonus transaction
      INSERT INTO transactions (user_id, type, amount, description, reference_id)
      VALUES (v_level2_referrer_id, 'referral_bonus', v_level2_bonus, 'Level 2 bonus from ' || v_purchaser_email, p_user_id);
      
      -- Level 3: Referrer's referrer's referrer (2%)
      SELECT referred_by INTO v_level3_referrer_id FROM profiles WHERE id = v_level2_referrer_id;
      
      IF v_level3_referrer_id IS NOT NULL THEN
        v_level3_bonus := (v_package.investment_amount * 2) / 100;
        
        -- Add bonus to level 3 referrer's wallet
        UPDATE wallets 
        SET balance = balance + v_level3_bonus,
            total_earned = total_earned + v_level3_bonus,
            updated_at = NOW()
        WHERE user_id = v_level3_referrer_id;
        
        -- Create level 3 referral bonus transaction
        INSERT INTO transactions (user_id, type, amount, description, reference_id)
        VALUES (v_level3_referrer_id, 'referral_bonus', v_level3_bonus, 'Level 3 bonus from ' || v_purchaser_email, p_user_id);
      END IF;
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
