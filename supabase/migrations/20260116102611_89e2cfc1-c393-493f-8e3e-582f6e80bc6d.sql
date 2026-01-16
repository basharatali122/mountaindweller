-- Drop existing function and recreate to handle both products and packages
DROP FUNCTION IF EXISTS public.purchase_products(uuid, jsonb, text, text, text, text);

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
SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet wallets%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_total_amount integer := 0;
  v_order_id uuid;
  v_item jsonb;
  v_product products%ROWTYPE;
  v_package packages%ROWTYPE;
  v_referrer_id uuid;
  v_level2_referrer_id uuid;
  v_level3_referrer_id uuid;
  v_product_referral_bonus integer := 500;
  v_item_type text;
  v_item_id uuid;
  v_item_name text;
  v_item_price integer;
  v_already_purchased boolean;
BEGIN
  -- Validate cart is not empty
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Cart cannot be empty');
  END IF;

  -- Get user wallet
  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  -- Get user profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;

  -- Calculate total amount and validate items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := (v_item->>'product_id')::uuid;
    
    -- Check if it's a package first
    SELECT * INTO v_package FROM packages WHERE id = v_item_id AND is_active = true;
    
    IF FOUND THEN
      -- It's a package - check if already purchased
      SELECT EXISTS(
        SELECT 1 FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.user_id = p_user_id AND oi.product_id = v_item_id
      ) INTO v_already_purchased;
      
      IF v_already_purchased THEN
        RETURN json_build_object('success', false, 'error', 'You already purchased the ' || v_package.name || ' package');
      END IF;
      
      v_total_amount := v_total_amount + (v_package.investment_amount * COALESCE((v_item->>'quantity')::integer, 1));
    ELSE
      -- Check if it's a product
      SELECT * INTO v_product FROM products WHERE id = v_item_id AND is_active = true;
      IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Product not found: ' || v_item_id);
      END IF;
      v_total_amount := v_total_amount + (v_product.price * (v_item->>'quantity')::integer);
    END IF;
  END LOOP;

  -- Check sufficient balance
  IF v_wallet.balance < v_total_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance. Required: ' || v_total_amount || ', Available: ' || v_wallet.balance);
  END IF;

  -- Deduct from wallet
  UPDATE wallets SET balance = balance - v_total_amount, updated_at = now() WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'purchase', -v_total_amount, 'Order purchase');

  -- Create order
  INSERT INTO orders (user_id, total_amount, status, delivery_address, delivery_phone, delivery_city, delivery_notes)
  VALUES (p_user_id, v_total_amount, 'pending', p_delivery_address, p_delivery_phone, p_delivery_city, p_delivery_notes)
  RETURNING id INTO v_order_id;

  -- Create order items and handle referral bonuses
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := (v_item->>'product_id')::uuid;
    
    -- Check if it's a package
    SELECT * INTO v_package FROM packages WHERE id = v_item_id AND is_active = true;
    
    IF FOUND THEN
      -- Insert package order item
      INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
      VALUES (v_order_id, v_package.id, v_package.name || ' Package', 1, v_package.investment_amount, v_package.investment_amount);
      
      -- Update profile with package (for backward compatibility)
      UPDATE profiles SET package_id = v_package.id, updated_at = now() WHERE id = p_user_id;
      
      -- Update referral to paid status
      UPDATE referrals SET is_paid = true WHERE referred_id = p_user_id;
      
      -- Get Level 1 referrer for package bonus
      v_referrer_id := v_profile.referred_by;
      
      -- Distribute package referral bonuses (3 levels)
      IF v_referrer_id IS NOT NULL AND v_package.level1_bonus > 0 THEN
        UPDATE wallets SET balance = balance + v_package.level1_bonus, total_earned = total_earned + v_package.level1_bonus, updated_at = now() WHERE user_id = v_referrer_id;
        
        INSERT INTO transactions (user_id, type, amount, reference_id, description)
        VALUES (v_referrer_id, 'referral_bonus', v_package.level1_bonus, p_user_id, 'Level 1 package bonus from ' || v_profile.email);
        
        INSERT INTO referral_bonuses (user_id, referrer_id, level, bonus_amount, source_type, source_amount, source_id)
        VALUES (p_user_id, v_referrer_id, 1, v_package.level1_bonus, 'package', v_package.investment_amount, v_package.id);

        -- Get Level 2 referrer
        SELECT referred_by INTO v_level2_referrer_id FROM profiles WHERE id = v_referrer_id;

        IF v_level2_referrer_id IS NOT NULL AND v_package.level2_bonus > 0 THEN
          UPDATE wallets SET balance = balance + v_package.level2_bonus, total_earned = total_earned + v_package.level2_bonus, updated_at = now() WHERE user_id = v_level2_referrer_id;
          
          INSERT INTO transactions (user_id, type, amount, reference_id, description)
          VALUES (v_level2_referrer_id, 'referral_bonus', v_package.level2_bonus, p_user_id, 'Level 2 package bonus from ' || v_profile.email);
          
          INSERT INTO referral_bonuses (user_id, referrer_id, level, bonus_amount, source_type, source_amount, source_id)
          VALUES (p_user_id, v_level2_referrer_id, 2, v_package.level2_bonus, 'package', v_package.investment_amount, v_package.id);

          -- Get Level 3 referrer
          SELECT referred_by INTO v_level3_referrer_id FROM profiles WHERE id = v_level2_referrer_id;

          IF v_level3_referrer_id IS NOT NULL AND v_package.level3_bonus > 0 THEN
            UPDATE wallets SET balance = balance + v_package.level3_bonus, total_earned = total_earned + v_package.level3_bonus, updated_at = now() WHERE user_id = v_level3_referrer_id;
            
            INSERT INTO transactions (user_id, type, amount, reference_id, description)
            VALUES (v_level3_referrer_id, 'referral_bonus', v_package.level3_bonus, p_user_id, 'Level 3 package bonus from ' || v_profile.email);
            
            INSERT INTO referral_bonuses (user_id, referrer_id, level, bonus_amount, source_type, source_amount, source_id)
            VALUES (p_user_id, v_level3_referrer_id, 3, v_package.level3_bonus, 'package', v_package.investment_amount, v_package.id);
          END IF;
        END IF;
      END IF;
    ELSE
      -- It's a regular product
      SELECT * INTO v_product FROM products WHERE id = v_item_id;
      INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
      VALUES (v_order_id, v_product.id, v_product.name, (v_item->>'quantity')::integer, v_product.price, v_product.price * (v_item->>'quantity')::integer);
    END IF;
  END LOOP;

  -- Get Level 1 referrer for product bonus (500 PKR flat for any product purchase)
  v_referrer_id := v_profile.referred_by;

  IF v_referrer_id IS NOT NULL THEN
    UPDATE wallets SET balance = balance + v_product_referral_bonus, total_earned = total_earned + v_product_referral_bonus, updated_at = now() WHERE user_id = v_referrer_id;
    
    INSERT INTO transactions (user_id, type, amount, reference_id, description)
    VALUES (v_referrer_id, 'referral_bonus', v_product_referral_bonus, p_user_id, 'Order purchase bonus from ' || v_profile.email);
    
    INSERT INTO referral_bonuses (user_id, referrer_id, level, bonus_amount, source_type, source_amount, source_id)
    VALUES (p_user_id, v_referrer_id, 1, v_product_referral_bonus, 'product', v_total_amount, v_order_id);
  END IF;

  RETURN json_build_object('success', true, 'message', 'Order placed successfully', 'order_id', v_order_id);
END;
$function$;