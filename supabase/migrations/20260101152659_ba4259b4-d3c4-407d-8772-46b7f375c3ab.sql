-- Drop existing storage policies for payment-proofs bucket
DROP POLICY IF EXISTS "Users can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_select_policy" ON storage.objects;

-- Create simple policies for payment-proofs bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Allow users to upload payment proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own uploads
CREATE POLICY "Allow users to view own payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all payment proofs
CREATE POLICY "Allow admins to view all payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);