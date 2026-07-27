
CREATE TABLE public.safepay_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tracker TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending',
  credited BOOLEAN NOT NULL DEFAULT false,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.safepay_transactions TO authenticated;
GRANT ALL ON public.safepay_transactions TO service_role;

ALTER TABLE public.safepay_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own safepay transactions"
  ON public.safepay_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_safepay_transactions_updated_at
  BEFORE UPDATE ON public.safepay_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.credit_safepay_payment(
  p_tracker TEXT,
  p_status TEXT,
  p_raw JSONB DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx public.safepay_transactions%ROWTYPE;
  v_new_balance INTEGER;
BEGIN
  SELECT * INTO v_tx FROM public.safepay_transactions
  WHERE tracker = p_tracker FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Transaction not found');
  END IF;

  UPDATE public.safepay_transactions
  SET status = p_status,
      raw = COALESCE(p_raw, raw),
      updated_at = now()
  WHERE id = v_tx.id;

  IF p_status <> 'paid' THEN
    RETURN json_build_object('success', true, 'credited', false, 'status', p_status);
  END IF;

  IF v_tx.credited THEN
    RETURN json_build_object('success', true, 'credited', true, 'already', true);
  END IF;

  UPDATE public.wallets
  SET balance = balance + v_tx.amount, updated_at = now()
  WHERE user_id = v_tx.user_id
  RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (v_tx.user_id, 'deposit', v_tx.amount, 'SafePay online deposit (' || v_tx.tracker || ')');

  UPDATE public.safepay_transactions
  SET credited = true, updated_at = now()
  WHERE id = v_tx.id;

  RETURN json_build_object('success', true, 'credited', true, 'amount', v_tx.amount, 'new_balance', v_new_balance);
END;
$$;

REVOKE ALL ON FUNCTION public.credit_safepay_payment(TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_safepay_payment(TEXT, TEXT, JSONB) TO service_role;
