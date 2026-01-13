-- =====================================================
-- REFERRAL SYSTEM UPGRADE - DATABASE SCHEMA CHANGES
-- =====================================================

-- Step 1: Add referral bonus columns to packages table
ALTER TABLE public.packages 
ADD COLUMN IF NOT EXISTS level1_bonus INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS level2_bonus INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS products_included JSONB DEFAULT '[]'::jsonb;

-- Step 2: Create referral_bonuses table for detailed bonus tracking
CREATE TABLE IF NOT EXISTS public.referral_bonuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  referrer_id UUID NOT NULL,
  level INTEGER NOT NULL CHECK (level IN (1, 2)),
  bonus_amount INTEGER NOT NULL DEFAULT 0,
  source_type TEXT NOT NULL CHECK (source_type IN ('package', 'investment')),
  source_amount INTEGER NOT NULL,
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 3: Create investments table for direct investments without packages
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  bonus_percentage INTEGER NOT NULL DEFAULT 30,
  bonus_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 4: Enable RLS on new tables
ALTER TABLE public.referral_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS policies for referral_bonuses
CREATE POLICY "Users can view own received bonuses"
ON public.referral_bonuses
FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referral bonuses"
ON public.referral_bonuses
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert referral bonuses"
ON public.referral_bonuses
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Step 6: RLS policies for investments
CREATE POLICY "Users can view own investments"
ON public.investments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create investments"
ON public.investments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all investments"
ON public.investments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update investments"
ON public.investments
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Step 7: Add trigger for investments updated_at
CREATE TRIGGER update_investments_updated_at
BEFORE UPDATE ON public.investments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 8: Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_bonuses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.investments;

-- Step 9: Update the existing packages with new referral bonus structure
-- Package 1: 5000 PKR - Level1: 500, Level2: 200
UPDATE public.packages 
SET level1_bonus = 500, 
    level2_bonus = 200,
    bonus_amount = 1500,
    products_included = '["Facewash", "Nevolis Whitening Cream", "Urgent Tutti Frutti Facial"]'::jsonb,
    features = '["Direct Join Bonus: 1,500 PKR", "Level 1 Referral: 500 PKR", "Level 2 Referral: 200 PKR", "3 Premium Products Included"]'::jsonb
WHERE investment_amount = 5000;

-- Package 2: 10000 PKR - Level1: 500, Level2: 200
UPDATE public.packages 
SET level1_bonus = 500, 
    level2_bonus = 200,
    bonus_amount = 3000,
    products_included = '["Urgent Facial", "Nevolic Cream", "Shampoo", "Pure Alpine Glow"]'::jsonb,
    features = '["Direct Join Bonus: 3,000 PKR", "Level 1 Referral: 500 PKR", "Level 2 Referral: 200 PKR", "4 Premium Products Included"]'::jsonb
WHERE investment_amount = 10000;

-- Package 3: 15000 PKR - Level1: 1000, Level2: 500
UPDATE public.packages 
SET level1_bonus = 1000, 
    level2_bonus = 500,
    bonus_amount = 6000,
    products_included = '["Sunblock", "Urgent Facial", "Hair Conditioner", "Shampoo", "Nevolic Cream", "Vitamin C Serum", "Facewash"]'::jsonb,
    features = '["Direct Join Bonus: 6,000 PKR", "Level 1 Referral: 1,000 PKR", "Level 2 Referral: 500 PKR", "7 Premium Products Included"]'::jsonb
WHERE investment_amount = 15000;

-- Insert Package 4: 50000 PKR - Level1: 2000, Level2: 1000 (if it doesn't exist)
INSERT INTO public.packages (name, investment_amount, bonus_amount, level1_bonus, level2_bonus, features, products_included, is_active)
SELECT 'Elite', 50000, 20000, 2000, 1000, 
  '["Direct Join Bonus: 20,000 PKR", "Level 1 Referral: 2,000 PKR", "Level 2 Referral: 1,000 PKR", "All Premium Products", "VIP Support"]'::jsonb,
  '["All-in-One Super Luxury Box", "All Premium M.D Product Kit", "Luxury Items"]'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.packages WHERE investment_amount = 50000);