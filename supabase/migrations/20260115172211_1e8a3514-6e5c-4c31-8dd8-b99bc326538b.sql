-- First, drop ALL existing purchase_products function variants to resolve ambiguity
DROP FUNCTION IF EXISTS public.purchase_products(uuid, json, text, text, text, text);
DROP FUNCTION IF EXISTS public.purchase_products(uuid, jsonb, text, text, text, text);
DROP FUNCTION IF EXISTS public.purchase_products(uuid, jsonb);

-- Drop the foreign key constraint on order_items.product_id so packages can be stored there too
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Recreate a single purchase_products function with jsonb parameter
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