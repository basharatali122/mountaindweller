-- Remove duplicate storage policies for payment-proofs bucket
DROP POLICY IF EXISTS "Users can upload payment proofs" ON storage.objects;

-- Keep only the properly named policy
-- The "Allow users to upload payment proofs" policy already exists and is correct

-- Ensure the bucket file size limit is appropriate (increase to 10MB)
UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id = 'payment-proofs';