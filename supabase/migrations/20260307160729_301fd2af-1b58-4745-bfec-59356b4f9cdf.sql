ALTER TABLE public.referral_bonuses DROP CONSTRAINT referral_bonuses_level_check;
ALTER TABLE public.referral_bonuses ADD CONSTRAINT referral_bonuses_level_check CHECK (level = ANY (ARRAY[1, 2, 3]));