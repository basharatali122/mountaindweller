-- Create deposit_requests table
CREATE TABLE public.deposit_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  bank_reference TEXT,
  payment_proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own deposit requests
CREATE POLICY "Users can view own deposit requests"
ON public.deposit_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create deposit requests
CREATE POLICY "Users can create deposit requests"
ON public.deposit_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all deposit requests
CREATE POLICY "Admins can view all deposit requests"
ON public.deposit_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update deposit requests
CREATE POLICY "Admins can update deposit requests"
ON public.deposit_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false);

-- Storage policies
CREATE POLICY "Users can upload payment proofs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own payment proofs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all payment proofs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-proofs' AND has_role(auth.uid(), 'admin'::app_role));