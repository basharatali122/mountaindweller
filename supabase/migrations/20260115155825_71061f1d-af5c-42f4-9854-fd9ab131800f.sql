-- Add delivery details columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_phone TEXT,
ADD COLUMN IF NOT EXISTS delivery_city TEXT,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Update the purchase_products function to accept delivery details
CREATE OR REPLACE FUNCTION public.purchase_products(
  p_user_id UUID,
  p_items JSON,
  p_delivery_address TEXT DEFAULT NULL,
  p_delivery_phone TEXT DEFAULT NULL,
  p_delivery_city TEXT DEFAULT NULL,
  p_delivery_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_balance INTEGER;
  v_total_amount INTEGER := 0;
  v_item JSON;
  v_product RECORD;
  v_order_id UUID;
BEGIN
  -- Get wallet balance
  SELECT balance INTO v_wallet_balance
  FROM wallets
  WHERE user_id = p_user_id;

  IF v_wallet_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  -- Calculate total amount
  FOR v_item IN SELECT * FROM json_array_elements(p_items)
  LOOP
    SELECT id, name, price INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID AND is_active = true;

    IF v_product.id IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Product not found: ' || (v_item->>'product_name'));
    END IF;

    v_total_amount := v_total_amount + (v_product.price * (v_item->>'quantity')::INTEGER);
  END LOOP;

  -- Check sufficient balance
  IF v_wallet_balance < v_total_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient wallet balance. Required: ' || v_total_amount || ' PKR, Available: ' || v_wallet_balance || ' PKR');
  END IF;

  -- Create order with delivery details
  INSERT INTO orders (user_id, total_amount, status, delivery_address, delivery_phone, delivery_city, delivery_notes)
  VALUES (p_user_id, v_total_amount, 'completed', p_delivery_address, p_delivery_phone, p_delivery_city, p_delivery_notes)
  RETURNING id INTO v_order_id;

  -- Create order items
  FOR v_item IN SELECT * FROM json_array_elements(p_items)
  LOOP
    SELECT id, name, price INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID;

    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
    VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      (v_item->>'quantity')::INTEGER,
      v_product.price,
      v_product.price * (v_item->>'quantity')::INTEGER
    );
  END LOOP;

  -- Deduct from wallet
  UPDATE wallets
  SET balance = balance - v_total_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO transactions (user_id, type, amount, reference_id, description)
  VALUES (p_user_id, 'purchase', v_total_amount, v_order_id, 'Product purchase');

  RETURN json_build_object('success', true, 'order_id', v_order_id, 'total_amount', v_total_amount);
END;
$$;