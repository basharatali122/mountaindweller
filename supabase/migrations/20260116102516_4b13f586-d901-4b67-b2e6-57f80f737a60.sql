-- Fix the referral_bonuses source_type check constraint to include 'product'
ALTER TABLE public.referral_bonuses DROP CONSTRAINT IF EXISTS referral_bonuses_source_type_check;
ALTER TABLE public.referral_bonuses ADD CONSTRAINT referral_bonuses_source_type_check CHECK (source_type = ANY (ARRAY['package'::text, 'investment'::text, 'product'::text]));