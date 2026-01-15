
-- Add level3_bonus column to packages table
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS level3_bonus integer NOT NULL DEFAULT 0;

-- Update packages with correct bonus amounts
UPDATE public.packages SET level1_bonus = 1500, level2_bonus = 500, level3_bonus = 0 WHERE investment_amount = 5000;
UPDATE public.packages SET level1_bonus = 3000, level2_bonus = 500, level3_bonus = 200 WHERE investment_amount = 10000;
UPDATE public.packages SET level1_bonus = 6000, level2_bonus = 500, level3_bonus = 200 WHERE investment_amount = 15000;
UPDATE public.packages SET level1_bonus = 20000, level2_bonus = 2000, level3_bonus = 1000 WHERE investment_amount = 50000;

-- Drop and recreate purchase_package function with 3-level referral bonuses
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

  -- Check if user already has a package
  IF v_profile.package_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'You already have a package');
  END IF;

  -- Deduct from wallet
  UPDATE wallets SET balance = balance - v_package.investment_amount, updated_at = now() WHERE user_id = p_user_id;

  -- Update profile with package
  UPDATE profiles SET package_id = p_package_id, updated_at = now() WHERE id = p_user_id;

  -- Record transaction
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'purchase', -v_package.investment_amount, 'Package purchase: ' || v_package.name);

  -- Create order record for the package
  INSERT INTO orders (user_id, total_amount, status)
  VALUES (p_user_id, v_package.investment_amount, 'pending')
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

-- Create or replace purchase_products function with Level 1 referral bonus (500 PKR)
CREATE OR REPLACE FUNCTION public.purchase_products(
  p_user_id uuid,
  p_items jsonb,
  p_delivery_address text DEFAULT NULL,
  p_delivery_phone text DEFAULT NULL,
  p_delivery_city text DEFAULT NULL,
  p_delivery_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet wallets%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_total_amount integer := 0;
  v_order_id uuid;
  v_item jsonb;
  v_product products%ROWTYPE;
  v_referrer_id uuid;
  v_product_referral_bonus integer := 500;
BEGIN
  -- Get user wallet
  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  -- Get user profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;

  -- Calculate total amount
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::uuid AND is_active = true;
    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Product not found: ' || (v_item->>'product_id'));
    END IF;
    v_total_amount := v_total_amount + (v_product.price * (v_item->>'quantity')::integer);
  END LOOP;

  -- Check sufficient balance
  IF v_wallet.balance < v_total_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance. Required: ' || v_total_amount || ', Available: ' || v_wallet.balance);
  END IF;

  -- Deduct from wallet
  UPDATE wallets SET balance = balance - v_total_amount, updated_at = now() WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'purchase', -v_total_amount, 'Product purchase');

  -- Create order
  INSERT INTO orders (user_id, total_amount, status, delivery_address, delivery_phone, delivery_city, delivery_notes)
  VALUES (p_user_id, v_total_amount, 'pending', p_delivery_address, p_delivery_phone, p_delivery_city, p_delivery_notes)
  RETURNING id INTO v_order_id;

  -- Create order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::uuid;
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
    VALUES (v_order_id, v_product.id, v_product.name, (v_item->>'quantity')::integer, v_product.price, v_product.price * (v_item->>'quantity')::integer);
  END LOOP;

  -- Get Level 1 referrer and give 500 PKR bonus for product purchase
  v_referrer_id := v_profile.referred_by;

  IF v_referrer_id IS NOT NULL THEN
    UPDATE wallets SET balance = balance + v_product_referral_bonus, total_earned = total_earned + v_product_referral_bonus, updated_at = now() WHERE user_id = v_referrer_id;
    
    INSERT INTO transactions (user_id, type, amount, reference_id, description)
    VALUES (v_referrer_id, 'referral_bonus', v_product_referral_bonus, p_user_id, 'Product purchase bonus from ' || v_profile.email);
    
    INSERT INTO referral_bonuses (user_id, referrer_id, level, bonus_amount, source_type, source_amount, source_id)
    VALUES (p_user_id, v_referrer_id, 1, v_product_referral_bonus, 'product', v_total_amount, v_order_id);
  END IF;

  RETURN json_build_object('success', true, 'message', 'Products purchased successfully', 'order_id', v_order_id);
END;
$$;
