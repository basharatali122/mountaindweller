-- Update purchase_products function to add input validation for cart items
CREATE OR REPLACE FUNCTION public.purchase_products(p_user_id uuid, p_items jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet RECORD;
  v_total_amount INTEGER := 0;
  v_order_id UUID;
  v_item JSONB;
  v_product RECORD;
  v_item_quantity INTEGER;
BEGIN
  -- Validate cart is not empty
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Cart cannot be empty');
  END IF;

  -- Validate cart size (max 50 items)
  IF jsonb_array_length(p_items) > 50 THEN
    RETURN json_build_object('success', false, 'error', 'Cart cannot exceed 50 items');
  END IF;

  -- Calculate total amount with validation
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Validate quantity exists and is a valid number
    IF v_item->>'quantity' IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Quantity is required for all items');
    END IF;
    
    -- Parse quantity with error handling
    BEGIN
      v_item_quantity := (v_item->>'quantity')::INTEGER;
    EXCEPTION WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', 'Invalid quantity format');
    END;
    
    -- Validate quantity range (1-99)
    IF v_item_quantity < 1 THEN
      RETURN json_build_object('success', false, 'error', 'Quantity must be at least 1');
    END IF;
    
    IF v_item_quantity > 99 THEN
      RETURN json_build_object('success', false, 'error', 'Maximum quantity per item is 99');
    END IF;
    
    -- Validate product_id exists
    IF v_item->>'product_id' IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Product ID is required for all items');
    END IF;
    
    SELECT * INTO v_product FROM products 
    WHERE id = (v_item->>'product_id')::UUID AND is_active = true;
    
    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Product not found or inactive: ' || COALESCE(v_item->>'product_name', 'Unknown'));
    END IF;
    
    v_total_amount := v_total_amount + (v_product.price * v_item_quantity);
  END LOOP;

  -- Get wallet balance
  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  -- Check if user has enough balance
  IF v_wallet.balance < v_total_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance. Required: ' || v_total_amount || ' PKR');
  END IF;

  -- Deduct from wallet
  UPDATE wallets 
  SET balance = balance - v_total_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create order
  INSERT INTO orders (user_id, total_amount)
  VALUES (p_user_id, v_total_amount)
  RETURNING id INTO v_order_id;

  -- Create order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      v_item->>'product_name',
      (v_item->>'quantity')::INTEGER,
      v_product.price,
      v_product.price * (v_item->>'quantity')::INTEGER
    );
  END LOOP;

  -- Create transaction record
  INSERT INTO transactions (user_id, type, amount, description, reference_id)
  VALUES (p_user_id, 'purchase', -v_total_amount, 'Product purchase', v_order_id);

  RETURN json_build_object(
    'success', true, 
    'message', 'Products purchased successfully',
    'order_id', v_order_id,
    'total_amount', v_total_amount
  );
END;
$function$;