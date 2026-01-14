-- ========================================
-- Fix 1: Remove Direct Join Bonus from purchase_package
-- Only referrers get bonuses, not the purchaser
-- ========================================

CREATE OR REPLACE FUNCTION public.purchase_package(p_user_id UUID, p_package_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_package RECORD;
  v_wallet RECORD;
  v_existing_package UUID;
  v_level1_referrer_id UUID;
  v_level2_referrer_id UUID;
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

  -- Deduct investment amount from wallet (NO direct join bonus added)
  UPDATE wallets 
  SET balance = balance - v_package.investment_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create purchase transaction
  INSERT INTO transactions (user_id, type, amount, description, reference_id)
  VALUES (p_user_id, 'purchase', -v_package.investment_amount, 'Package purchase: ' || v_package.name, p_package_id);

  -- Update user profile with package
  UPDATE profiles 
  SET package_id = p_package_id,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- ========== 2-LEVEL REFERRAL BONUSES (Only referrers get bonuses) ==========
  -- Get Level 1 referrer (direct referrer of the purchaser)
  SELECT referred_by INTO v_level1_referrer_id FROM profiles WHERE id = p_user_id;
  
  -- Level 1 bonus: Direct referrer
  IF v_level1_referrer_id IS NOT NULL AND v_package.level1_bonus > 0 THEN
    -- Add bonus to level 1 referrer's wallet
    UPDATE wallets 
    SET balance = balance + v_package.level1_bonus,
        total_earned = total_earned + v_package.level1_bonus,
        updated_at = NOW()
    WHERE user_id = v_level1_referrer_id;
    
    -- Update referral record
    UPDATE referrals 
    SET bonus_amount = COALESCE(bonus_amount, 0) + v_package.level1_bonus,
        is_paid = true
    WHERE referrer_id = v_level1_referrer_id AND referred_id = p_user_id;
    
    -- Create referral bonus transaction
    INSERT INTO transactions (user_id, type, amount, description, reference_id)
    VALUES (v_level1_referrer_id, 'referral_bonus', v_package.level1_bonus, 
            'Level 1 bonus from ' || v_purchaser_email || ' (Package: ' || v_package.name || ')', p_user_id);
    
    -- Insert into referral_bonuses table for detailed tracking
    INSERT INTO referral_bonuses (user_id, referrer_id, level, bonus_amount, source_type, source_amount, source_id)
    VALUES (p_user_id, v_level1_referrer_id, 1, v_package.level1_bonus, 'package', v_package.investment_amount, p_package_id);
  END IF;
  
  -- Level 2 bonus: Referrer's referrer
  IF v_level1_referrer_id IS NOT NULL THEN
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
      
      -- Insert into referral_bonuses table
      INSERT INTO referral_bonuses (user_id, referrer_id, level, bonus_amount, source_type, source_amount, source_id)
      VALUES (p_user_id, v_level2_referrer_id, 2, v_package.level2_bonus, 'package', v_package.investment_amount, p_package_id);
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true, 
    'message', 'Package purchased successfully',
    'package_name', v_package.name,
    'amount_paid', v_package.investment_amount
  );
END;
$$;

-- ========================================
-- Fix 2: Remove Direct Bonus from make_direct_investment
-- Only referrers get bonuses, not the investor
-- ========================================

CREATE OR REPLACE FUNCTION public.make_direct_investment(p_user_id UUID, p_amount INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
  v_existing_package UUID;
  v_existing_investment UUID;
  v_bonus_percentage INTEGER;
  v_level1_referrer_id UUID;
  v_level2_referrer_id UUID;
  v_level1_bonus INTEGER;
  v_level2_bonus INTEGER;
  v_investor_email TEXT;
  v_investment_id UUID;
BEGIN
  -- Check if user already has a package
  SELECT package_id INTO v_existing_package FROM profiles WHERE id = p_user_id;
  IF v_existing_package IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'You already have an active package. Direct investment is only for users without packages.');
  END IF;

  -- Check if user already has an investment
  SELECT id INTO v_existing_investment FROM investments WHERE user_id = p_user_id AND status = 'active';
  IF v_existing_investment IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'You already have an active investment.');
  END IF;

  -- Validate investment amount
  IF p_amount NOT IN (5000, 10000, 15000) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid investment amount. Choose 5,000, 10,000, or 15,000 PKR');
  END IF;

  -- Determine bonus percentage (for referral calculation reference only)
  IF p_amount = 5000 THEN
    v_bonus_percentage := 30;
  ELSIF p_amount = 10000 THEN
    v_bonus_percentage := 30;
  ELSIF p_amount = 15000 THEN
    v_bonus_percentage := 40;
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

  -- Deduct investment amount from wallet (NO direct bonus added)
  UPDATE wallets 
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create investment record (bonus_amount is 0 since investor doesn't get bonus)
  INSERT INTO investments (user_id, amount, bonus_percentage, bonus_amount)
  VALUES (p_user_id, p_amount, v_bonus_percentage, 0)
  RETURNING id INTO v_investment_id;

  -- Create investment transaction
  INSERT INTO transactions (user_id, type, amount, description, reference_id)
  VALUES (p_user_id, 'purchase', -p_amount, 'Direct Investment: ' || p_amount || ' PKR', v_investment_id);

  -- ========== 2-LEVEL REFERRAL BONUSES (10% and 5%) - Only referrers get bonuses ==========
  -- Get Level 1 referrer
  SELECT referred_by INTO v_level1_referrer_id FROM profiles WHERE id = p_user_id;
  
  IF v_level1_referrer_id IS NOT NULL THEN
    v_level1_bonus := (p_amount * 10) / 100; -- 10% for level 1
    
    -- Add bonus to level 1 referrer's wallet
    UPDATE wallets 
    SET balance = balance + v_level1_bonus,
        total_earned = total_earned + v_level1_bonus,
        updated_at = NOW()
    WHERE user_id = v_level1_referrer_id;
    
    -- Update referral record
    UPDATE referrals 
    SET bonus_amount = COALESCE(bonus_amount, 0) + v_level1_bonus,
        is_paid = true
    WHERE referrer_id = v_level1_referrer_id AND referred_id = p_user_id;
    
    -- Create referral bonus transaction
    INSERT INTO transactions (user_id, type, amount, description, reference_id)
    VALUES (v_level1_referrer_id, 'referral_bonus', v_level1_bonus, 
            'Level 1 bonus (10%) from ' || v_investor_email || ' (Investment)', p_user_id);
    
    -- Insert into referral_bonuses table
    INSERT INTO referral_bonuses (user_id, referrer_id, level, bonus_amount, source_type, source_amount, source_id)
    VALUES (p_user_id, v_level1_referrer_id, 1, v_level1_bonus, 'investment', p_amount, v_investment_id);
  END IF;
  
  -- Level 2 referrer bonus (5%)
  IF v_level1_referrer_id IS NOT NULL THEN
    SELECT referred_by INTO v_level2_referrer_id FROM profiles WHERE id = v_level1_referrer_id;
    
    IF v_level2_referrer_id IS NOT NULL THEN
      v_level2_bonus := (p_amount * 5) / 100; -- 5% for level 2
      
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
      
      -- Insert into referral_bonuses table
      INSERT INTO referral_bonuses (user_id, referrer_id, level, bonus_amount, source_type, source_amount, source_id)
      VALUES (p_user_id, v_level2_referrer_id, 2, v_level2_bonus, 'investment', p_amount, v_investment_id);
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true, 
    'message', 'Investment completed successfully',
    'amount', p_amount,
    'investment_id', v_investment_id
  );
END;
$$;

-- ========================================
-- Fix 3: Improved handle_new_user trigger with better referral code handling
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_code TEXT;
BEGIN
  -- Get and normalize referral code (handle case sensitivity)
  v_referral_code := UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'referral_code', '')));
  
  -- Find referrer by code (case-insensitive)
  IF v_referral_code <> '' THEN
    SELECT id INTO v_referrer_id 
    FROM public.profiles 
    WHERE UPPER(referral_code) = v_referral_code 
    LIMIT 1;
  END IF;
  
  -- Prevent self-referral
  IF v_referrer_id = NEW.id THEN
    v_referrer_id := NULL;
  END IF;
  
  -- Create profile with referrer linked
  INSERT INTO public.profiles (id, email, full_name, phone, city, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    v_referrer_id
  );
  
  -- Create wallet
  INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  -- Create referral record if referrer exists
  IF v_referrer_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id)
    VALUES (v_referrer_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;