-- Update purchase_package function to allow multiple package purchases
CREATE OR REPLACE FUNCTION public.purchase_package(p_user_id uuid, p_package_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_package packages%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_referrer_id uuid;
  v_level2_referrer_id uuid;
  v_level3_referrer_id uuid;
  v_order_id uuid;
  v_already_purchased boolean;
BEGIN
  -- Get package details
  SELECT * INTO v_package FROM packages WHERE id = p_package_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Package not found or inactive');
  END IF;

  -- Get user wallet
  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  -- Check sufficient balance
  IF v_wallet.balance < v_package.investment_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Get user profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;

  -- Check if user already purchased THIS specific package
  SELECT EXISTS(
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.user_id = p_user_id AND oi.product_id = p_package_id
  ) INTO v_already_purchased;

  IF v_already_purchased THEN
    RETURN json_build_object('success', false, 'error', 'You already purchased this package');
  END IF;

  -- Deduct from wallet
  UPDATE wallets SET balance = balance - v_package.investment_amount, updated_at = now() WHERE user_id = p_user_id;

  -- Update profile with package (keep for backward compatibility, stores last purchased)
  UPDATE profiles SET package_id = p_package_id, updated_at = now() WHERE id = p_user_id;

  -- Record transaction
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'purchase', -v_package.investment_amount, 'Package purchase: ' || v_package.name);

  -- Create order record for the package
  INSERT INTO orders (user_id, total_amount, status)
  VALUES (p_user_id, v_package.investment_amount, 'completed')
  RETURNING id INTO v_order_id;

  -- Create order item for the package
  INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
  VALUES (v_order_id, p_package_id, v_package.name || ' Package', 1, v_package.investment_amount, v_package.investment_amount);

  -- Update referral to paid status
  UPDATE referrals SET is_paid = true WHERE referred_id = p_user_id;

  -- Get Level 1 referrer
  v_referrer_id := v_profile.referred_by;

  -- Distribute Level 1 bonus
  IF v_referrer_id IS NOT NULL AND v_package.level1_bonus > 0 THEN
    UPDATE wallets SET balance = balance + v_package.level1_bonus, total_earned = total_earned + v_package.level1_bonus, updated_at = now() WHERE user_id = v_referrer_id;
    
    INSERT INTO transactions (user_id, type, amount, reference_id, description)
    VALUES (v_referrer_id, 'referral_bonus', v_package.level1_bonus, p_user_id, 'Level 1 package bonus from ' || v_profile.email);
    
    INSERT INTO referral_bonuses (user_id, referrer_id, level, bonus_amount, source_type, source_amount, source_id)
    VALUES (p_user_id, v_referrer_id, 1, v_package.level1_bonus, 'package', v_package.investment_amount, p_package_id);

    -- Get Level 2 referrer
    SELECT referred_by INTO v_level2_referrer_id FROM profiles WHERE id = v_referrer_id;

    -- Distribute Level 2 bonus
    IF v_level2_referrer_id IS NOT NULL AND v_package.level2_bonus > 0 THEN
      UPDATE wallets SET balance = balance + v_package.level2_bonus, total_earned = total_earned + v_package.level2_bonus, updated_at = now() WHERE user_id = v_level2_referrer_id;
      
      INSERT INTO transactions (user_id, type, amount, reference_id, description)
      VALUES (v_level2_referrer_id, 'referral_bonus', v_package.level2_bonus, p_user_id, 'Level 2 package bonus from ' || v_profile.email);
      
      INSERT INTO referral_bonuses (user_id, referrer_id, level, bonus_amount, source_type, source_amount, source_id)
      VALUES (p_user_id, v_level2_referrer_id, 2, v_package.level2_bonus, 'package', v_package.investment_amount, p_package_id);

      -- Get Level 3 referrer
      SELECT referred_by INTO v_level3_referrer_id FROM profiles WHERE id = v_level2_referrer_id;

      -- Distribute Level 3 bonus
      IF v_level3_referrer_id IS NOT NULL AND v_package.level3_bonus > 0 THEN
        UPDATE wallets SET balance = balance + v_package.level3_bonus, total_earned = total_earned + v_package.level3_bonus, updated_at = now() WHERE user_id = v_level3_referrer_id;
        
        INSERT INTO transactions (user_id, type, amount, reference_id, description)
        VALUES (v_level3_referrer_id, 'referral_bonus', v_package.level3_bonus, p_user_id, 'Level 3 package bonus from ' || v_profile.email);
        
        INSERT INTO referral_bonuses (user_id, referrer_id, level, bonus_amount, source_type, source_amount, source_id)
        VALUES (p_user_id, v_level3_referrer_id, 3, v_package.level3_bonus, 'package', v_package.investment_amount, p_package_id);
      END IF;
    END IF;
  END IF;

  RETURN json_build_object('success', true, 'message', 'Package purchased successfully');
END;
$$;