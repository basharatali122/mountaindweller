-- Update purchase_package function to also create an order record for package purchases
CREATE OR REPLACE FUNCTION public.purchase_package(p_user_id uuid, p_package_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_package RECORD;
  v_wallet RECORD;
  v_profile RECORD;
  v_referrer RECORD;
  v_level2_referrer RECORD;
  v_level1_bonus NUMERIC;
  v_level2_bonus NUMERIC;
  v_order_id UUID;
BEGIN
  -- Get package details
  SELECT * INTO v_package 
  FROM packages 
  WHERE id = p_package_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Package not found or inactive');
  END IF;
  
  -- Get user wallet
  SELECT * INTO v_wallet 
  FROM wallets 
  WHERE user_id = p_user_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  -- Check balance
  IF v_wallet.balance < v_package.investment_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Get user profile
  SELECT * INTO v_profile 
  FROM profiles 
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  -- Check if user already has a package
  IF v_profile.package_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'You already have a package');
  END IF;
  
  -- Deduct from wallet
  UPDATE wallets 
  SET balance = balance - v_package.investment_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record purchase transaction
  INSERT INTO transactions (user_id, type, amount, description, reference_id)
  VALUES (p_user_id, 'purchase', -v_package.investment_amount, 
          'Package purchase: ' || v_package.name, p_package_id);
  
  -- Update user's package
  UPDATE profiles 
  SET package_id = p_package_id,
      updated_at = now()
  WHERE id = p_user_id;
  
  -- Create an order record for this package purchase
  INSERT INTO orders (user_id, total_amount, status, delivery_notes)
  VALUES (p_user_id, v_package.investment_amount, 'pending', 'Package Purchase: ' || v_package.name)
  RETURNING id INTO v_order_id;
  
  -- Create order item for the package
  INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
  VALUES (v_order_id, p_package_id, v_package.name || ' Package', 1, v_package.investment_amount, v_package.investment_amount);
  
  -- Get bonus amounts from package
  v_level1_bonus := v_package.level1_bonus;
  v_level2_bonus := v_package.level2_bonus;
  
  -- Process Level 1 referral bonus
  IF v_profile.referred_by IS NOT NULL THEN
    SELECT * INTO v_referrer 
    FROM profiles 
    WHERE id = v_profile.referred_by;
    
    IF FOUND AND v_level1_bonus > 0 THEN
      -- Add bonus to referrer's wallet
      UPDATE wallets 
      SET balance = balance + v_level1_bonus,
          total_earned = total_earned + v_level1_bonus,
          updated_at = now()
      WHERE user_id = v_referrer.id;
      
      -- Record bonus transaction
      INSERT INTO transactions (user_id, type, amount, description, reference_id)
      VALUES (v_referrer.id, 'referral_bonus', v_level1_bonus, 
              'Level 1 bonus from ' || v_profile.email || ' package purchase', p_package_id);
      
      -- Record in referral_bonuses table
      INSERT INTO referral_bonuses (user_id, referrer_id, source_type, source_id, source_amount, bonus_amount, level)
      VALUES (p_user_id, v_referrer.id, 'package', p_package_id, v_package.investment_amount, v_level1_bonus, 1);
      
      -- Process Level 2 referral bonus
      IF v_referrer.referred_by IS NOT NULL THEN
        SELECT * INTO v_level2_referrer 
        FROM profiles 
        WHERE id = v_referrer.referred_by;
        
        IF FOUND AND v_level2_bonus > 0 THEN
          -- Add bonus to level 2 referrer's wallet
          UPDATE wallets 
          SET balance = balance + v_level2_bonus,
              total_earned = total_earned + v_level2_bonus,
              updated_at = now()
          WHERE user_id = v_level2_referrer.id;
          
          -- Record bonus transaction
          INSERT INTO transactions (user_id, type, amount, description, reference_id)
          VALUES (v_level2_referrer.id, 'referral_bonus', v_level2_bonus, 
                  'Level 2 bonus from ' || v_profile.email || ' package purchase', p_package_id);
          
          -- Record in referral_bonuses table
          INSERT INTO referral_bonuses (user_id, referrer_id, source_type, source_id, source_amount, bonus_amount, level)
          VALUES (p_user_id, v_level2_referrer.id, 'package', p_package_id, v_package.investment_amount, v_level2_bonus, 2);
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Package purchased successfully',
    'order_id', v_order_id
  );
END;
$$;