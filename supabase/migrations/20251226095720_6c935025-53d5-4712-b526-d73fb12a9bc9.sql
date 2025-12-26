-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for order_items
CREATE POLICY "Users can view own order items" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create order items for own orders" 
ON public.order_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all order items" 
ON public.order_items 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create purchase_products function
CREATE OR REPLACE FUNCTION public.purchase_products(
  p_user_id UUID,
  p_items JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet RECORD;
  v_total_amount INTEGER := 0;
  v_order_id UUID;
  v_item JSONB;
  v_product RECORD;
BEGIN
  -- Calculate total amount
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products 
    WHERE id = (v_item->>'product_id')::UUID AND is_active = true;
    
    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Product not found or inactive: ' || (v_item->>'product_name'));
    END IF;
    
    v_total_amount := v_total_amount + (v_product.price * (v_item->>'quantity')::INTEGER);
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
$$;