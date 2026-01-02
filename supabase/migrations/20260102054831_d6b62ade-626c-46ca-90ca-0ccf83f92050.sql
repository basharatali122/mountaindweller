-- Make the payment-proofs bucket public so URLs work
UPDATE storage.buckets SET public = true WHERE name = 'payment-proofs';

-- Drop existing policies and recreate simpler ones
DROP POLICY IF EXISTS "Users can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Public can view payment proofs" ON storage.objects;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to payment proofs
CREATE POLICY "Public can view payment proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-proofs');