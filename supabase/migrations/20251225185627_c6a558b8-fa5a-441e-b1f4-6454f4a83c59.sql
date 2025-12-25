-- Create atomic function for processing deposit requests
CREATE OR REPLACE FUNCTION public.process_deposit_request(
  p_deposit_id UUID,
  p_approved BOOLEAN,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deposit RECORD;
  v_new_balance INTEGER;
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;

  -- Lock and get deposit request
  SELECT * INTO v_deposit 
  FROM deposit_requests 
  WHERE id = p_deposit_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Deposit request not found');
  END IF;
  
  -- Check if already processed
  IF v_deposit.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Deposit request already processed');
  END IF;
  
  -- Update deposit request status
  UPDATE deposit_requests SET 
    status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
    admin_notes = p_admin_notes,
    processed_at = NOW()
  WHERE id = p_deposit_id;
  
  -- If approved, update wallet and create transaction atomically
  IF p_approved THEN
    -- Update wallet balance
    UPDATE wallets
    SET balance = balance + v_deposit.amount,
        updated_at = NOW()
    WHERE user_id = v_deposit.user_id
    RETURNING balance INTO v_new_balance;
    
    -- Create transaction record
    INSERT INTO transactions (user_id, type, amount, description, reference_id)
    VALUES (
      v_deposit.user_id, 
      'deposit', 
      v_deposit.amount, 
      'Bank transfer deposit' || COALESCE(' (Ref: ' || v_deposit.bank_reference || ')', ''),
      v_deposit.id
    );
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'status', CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
    'amount', v_deposit.amount,
    'user_id', v_deposit.user_id
  );
END;
$$;

-- Create atomic function for processing withdrawal requests
CREATE OR REPLACE FUNCTION public.process_withdrawal_request(
  p_withdrawal_id UUID,
  p_status withdrawal_status,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal RECORD;
  v_wallet RECORD;
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;

  -- Lock and get withdrawal
  SELECT * INTO v_withdrawal 
  FROM withdrawals 
  WHERE id = p_withdrawal_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Withdrawal request not found');
  END IF;
  
  -- Check if already processed
  IF v_withdrawal.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Withdrawal already processed');
  END IF;
  
  -- Update withdrawal status
  UPDATE withdrawals SET 
    status = p_status,
    admin_notes = p_admin_notes,
    processed_at = NOW()
  WHERE id = p_withdrawal_id;
  
  -- If approved, update wallet and create transaction atomically
  IF p_status = 'approved' THEN
    -- Get and lock wallet
    SELECT * INTO v_wallet 
    FROM wallets 
    WHERE user_id = v_withdrawal.user_id 
    FOR UPDATE;
    
    -- Check sufficient balance
    IF v_wallet.balance < v_withdrawal.amount THEN
      -- Rollback the status update
      UPDATE withdrawals SET 
        status = 'pending',
        admin_notes = NULL,
        processed_at = NULL
      WHERE id = p_withdrawal_id;
      
      RETURN json_build_object('success', false, 'error', 'Insufficient wallet balance');
    END IF;
    
    -- Deduct from wallet
    UPDATE wallets
    SET balance = balance - v_withdrawal.amount,
        total_withdrawn = total_withdrawn + v_withdrawal.amount,
        updated_at = NOW()
    WHERE user_id = v_withdrawal.user_id;
    
    -- Create transaction record
    INSERT INTO transactions (user_id, type, amount, description, reference_id)
    VALUES (
      v_withdrawal.user_id, 
      'withdrawal', 
      -v_withdrawal.amount, 
      'Withdrawal processed',
      v_withdrawal.id
    );
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'status', p_status::text,
    'amount', v_withdrawal.amount,
    'user_id', v_withdrawal.user_id
  );
END;
$$;