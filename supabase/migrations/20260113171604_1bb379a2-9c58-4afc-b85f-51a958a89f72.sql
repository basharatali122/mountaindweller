-- =====================================================
-- UPDATE PURCHASE_PACKAGE FUNCTION WITH NEW REFERRAL LOGIC
-- =====================================================

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
  v_referral_id UUID;
  v_purchaser_email TEXT;
BEGIN
  -- Check if user already has a package
  SELECT package_id INTO v_existing_package FROM profiles WHERE id = p_user_id;
  IF v_existing_package IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'You already have an active package');
  END IF;

  -- Get package details with new referral bonus columns
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

  -- Add direct join bonus to wallet
  UPDATE wallets 
  SET balance = balance + v_package.bonus_amount,
      total_earned = total_earned + v_package.bonus_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create purchase transaction
  INSERT INTO transactions (user_id, type, amount, description, reference_id)
  VALUES (p_user_id, 'purchase', -v_package.investment_amount, 'Package purchase: ' || v_package.name, p_package_id);

  -- Create direct join bonus transaction
  INSERT INTO transactions (user_id, type, amount, description, reference_id)
  VALUES (p_user_id, 'bonus', v_package.bonus_amount, 'Direct Join Bonus: ' || v_package.name, p_package_id);

  -- Update user profile with package
  UPDATE profiles 
  SET package_id = p_package_id,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- ========== 2-LEVEL REFERRAL BONUSES (Package-specific) ==========
  
  -- Level 1: Direct referrer gets package-specific level1_bonus
  SELECT referred_by INTO v_level1_referrer_id FROM profiles WHERE id = p_user_id;
  
  IF v_level1_referrer_id IS NOT NULL AND v_package.level1_bonus > 0 THEN
    -- Get the referral record for level 1
    SELECT id INTO v_referral_id FROM referrals 
    WHERE referrer_id = v_level1_referrer_id AND referred_id = p_user_id AND is_paid = false
    LIMIT 1;
    
    IF v_referral_id IS NOT NULL THEN
      -- Add bonus to level 1 referrer's wallet
      UPDATE wallets 
      SET balance = balance + v_package.level1_bonus,
          total_earned = total_earned + v_package.level1_bonus,
          updated_at = NOW()
      WHERE user_id = v_level1_referrer_id;
      
      -- Update referral record
      UPDATE referrals 
      SET bonus_amount = v_package.level1_bonus,
          is_paid = true
      WHERE id = v_referral_id;
      
      -- Create referral bonus transaction
      INSERT INTO transactions (user_id, type, amount, description, reference_id)
      VALUES (v_level1_referrer_id, 'referral_bonus', v_package.level1_bonus, 
              'Level 1 bonus from ' || v_purchaser_email || ' (Package: ' || v_package.name || ')', p_user_id);
      
      -- Insert into referral_bonuses table for detailed tracking
      INSERT INTO referral_bonuses (user_id, referrer_id, level, bonus_amount, source_type, source_amount, source_id)
      VALUES (p_user_id, v_level1_referrer_id, 1, v_package.level1_bonus, 'package', v_package.investment_amount, p_package_id);
    END IF;
    
    -- Level 2: Referrer's referrer gets package-specific level2_bonus
    SELECT referred_by INTO v_level2_referrer_id FROM profiles WHERE id = v_level1_referrer_id;
    
    IF v_level2_referrer_id IS NOT NULL AND v_package.level2_bonus > 0 THEN
      -- Add bonus to level 2 referrer's wallet
      UPDATE wallets 
      SET balance = balance + v_package.level2_bonus,
          total_earned = total_earned + v_package.level2_bonus,
          updated_at = NOW()
      WHERE user_id = v_level2_referrer_id;
      
      -- Create level 2 referral bonus transaction
      INSERT INTO transactions (user_id, type, amount, description, reference_id)
      VALUES (v_level2_referrer_id, 'referral_bonus', v_package.level2_bonus, 
              'Level 2 bonus from ' || v_purchaser_email || ' (Package: ' || v_package.name || ')', p_user_id);
      
      -- Insert into referral_bonuses table for detailed tracking
      INSERT INTO referral_bonuses (user_id, referrer_id, level, bonus_amount, source_type, source_amount, source_id)
      VALUES (p_user_id, v_level2_referrer_id, 2, v_package.level2_bonus, 'package', v_package.investment_amount, p_package_id);
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

-- =====================================================
-- CREATE DIRECT INVESTMENT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.make_direct_investment(p_user_id uuid, p_amount integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet RECORD;
  v_existing_package UUID;
  v_existing_investment UUID;
  v_bonus_percentage INTEGER;
  v_bonus_amount INTEGER;
  v_level1_referrer_id UUID;
  v_level2_referrer_id UUID;
  v_referral_id UUID;
  v_level1_bonus INTEGER;
  v_level2_bonus INTEGER;
  v_investor_email TEXT;
  v_investment_id UUID;
BEGIN
  -- Check if user already has a package (can't do direct investment if has package)
  SELECT package_id INTO v_existing_package FROM profiles WHERE id = p_user_id;
  IF v_existing_package IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'You already have an active package. Direct investment is only for users without packages.');
  END IF;

  -- Check if user already has an investment
  SELECT id INTO v_existing_investment FROM investments WHERE user_id = p_user_id AND status = 'active';
  IF v_existing_investment IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'You already have an active investment.');
  END IF;

  -- Validate investment amount (must be 5000, 10000, or 15000)
  IF p_amount NOT IN (5000, 10000, 15000) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid investment amount. Choose 5,000, 10,000, or 15,000 PKR');
  END IF;

  -- Determine bonus percentage based on amount
  IF p_amount = 5000 THEN
    v_bonus_percentage := 30;
    v_bonus_amount := 1500;
  ELSIF p_amount = 10000 THEN
    v_bonus_percentage := 30;
    v_bonus_amount := 3000;
  ELSIF p_amount = 15000 THEN
    v_bonus_percentage := 40;
    v_bonus_amount := 6000;
  END IF;

  -- Get wallet balance
  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  -- Check if user has enough balance
  IF v_wallet.balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance. Required: ' || p_amount || ' PKR');
  END IF;

  -- Get investor email
  SELECT email INTO v_investor_email FROM profiles WHERE id = p_user_id;

  -- Deduct investment amount from wallet
  UPDATE wallets 
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Add direct bonus to wallet
  UPDATE wallets 
  SET balance = balance + v_bonus_amount,
      total_earned = total_earned + v_bonus_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create investment record
  INSERT INTO investments (user_id, amount, bonus_percentage, bonus_amount)
  VALUES (p_user_id, p_amount, v_bonus_percentage, v_bonus_amount)
  RETURNING id INTO v_investment_id;

  -- Create investment transaction
  INSERT INTO transactions (user_id, type, amount, description, reference_id)
  VALUES (p_user_id, 'purchase', -p_amount, 'Direct Investment: ' || p_amount || ' PKR', v_investment_id);

  -- Create direct bonus transaction
  INSERT INTO transactions (user_id, type, amount, description, reference_id)
  VALUES (p_user_id, 'bonus', v_bonus_amount, 'Direct Investment Bonus (' || v_bonus_percentage || '%)', v_investment_id);

  -- ========== 2-LEVEL REFERRAL BONUSES (Percentage-based for investments) ==========
  
  -- Level 1: Direct referrer gets 10% of investment
  SELECT referred_by INTO v_level1_referrer_id FROM profiles WHERE id = p_user_id;
  
  IF v_level1_referrer_id IS NOT NULL THEN
    v_level1_bonus := (p_amount * 10) / 100;
    
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
      VALUES (v_level1_referrer_id, 'referral_bonus', v_level1_bonus, 
              'Level 1 bonus (10%) from ' || v_investor_email || ' (Investment)', p_user_id);
      
      -- Insert into referral_bonuses table for detailed tracking
      INSERT INTO referral_bonuses (user_id, referrer_id, level, bonus_amount, source_type, source_amount, source_id)
      VALUES (p_user_id, v_level1_referrer_id, 1, v_level1_bonus, 'investment', p_amount, v_investment_id);
    ELSE
      -- No unpaid referral record, but still give bonus (for already paid referrals on re-investment)
      UPDATE wallets 
      SET balance = balance + v_level1_bonus,
          total_earned = total_earned + v_level1_bonus,
          updated_at = NOW()
      WHERE user_id = v_level1_referrer_id;
      
      INSERT INTO transactions (user_id, type, amount, description, reference_id)
      VALUES (v_level1_referrer_id, 'referral_bonus', v_level1_bonus, 
              'Level 1 bonus (10%) from ' || v_investor_email || ' (Investment)', p_user_id);
      
      INSERT INTO referral_bonuses (user_id, referrer_id, level, bonus_amount, source_type, source_amount, source_id)
      VALUES (p_user_id, v_level1_referrer_id, 1, v_level1_bonus, 'investment', p_amount, v_investment_id);
    END IF;
    
    -- Level 2: Referrer's referrer gets 5% of investment
    SELECT referred_by INTO v_level2_referrer_id FROM profiles WHERE id = v_level1_referrer_id;
    
    IF v_level2_referrer_id IS NOT NULL THEN
      v_level2_bonus := (p_amount * 5) / 100;
      
      -- Add bonus to level 2 referrer's wallet
      UPDATE wallets 
      SET balance = balance + v_level2_bonus,
          total_earned = total_earned + v_level2_bonus,
          updated_at = NOW()
      WHERE user_id = v_level2_referrer_id;
      
      -- Create level 2 referral bonus transaction
      INSERT INTO transactions (user_id, type, amount, description, reference_id)
      VALUES (v_level2_referrer_id, 'referral_bonus', v_level2_bonus, 
              'Level 2 bonus (5%) from ' || v_investor_email || ' (Investment)', p_user_id);
      
      -- Insert into referral_bonuses table for detailed tracking
      INSERT INTO referral_bonuses (user_id, referrer_id, level, bonus_amount, source_type, source_amount, source_id)
      VALUES (p_user_id, v_level2_referrer_id, 2, v_level2_bonus, 'investment', p_amount, v_investment_id);
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true, 
    'message', 'Investment completed successfully',
    'amount', p_amount,
    'bonus_amount', v_bonus_amount,
    'bonus_percentage', v_bonus_percentage
  );
END;
$function$;