-- Fix the handle_new_user function to properly increment team_count when a referral is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_code TEXT;
BEGIN
  -- Get and normalize referral code (handle case sensitivity and whitespace)
  v_referral_code := UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'referral_code', '')));
  
  -- Debug log
  RAISE NOTICE 'Processing new user: %, referral_code: %', NEW.email, v_referral_code;
  
  -- Find referrer by code (case-insensitive)
  IF v_referral_code <> '' THEN
    SELECT id INTO v_referrer_id 
    FROM public.profiles 
    WHERE UPPER(TRIM(referral_code)) = v_referral_code 
    LIMIT 1;
    
    RAISE NOTICE 'Found referrer_id: %', v_referrer_id;
  END IF;
  
  -- Prevent self-referral
  IF v_referrer_id = NEW.id THEN
    RAISE NOTICE 'Self-referral prevented for user: %', NEW.email;
    v_referrer_id := NULL;
  END IF;
  
  -- Create profile with referrer linked
  INSERT INTO public.profiles (id, email, full_name, phone, city, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    v_referrer_id
  );
  
  -- Create wallet
  INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  -- Create referral record and update team_count if referrer exists
  IF v_referrer_id IS NOT NULL THEN
    -- Create the referral record
    INSERT INTO public.referrals (referrer_id, referred_id)
    VALUES (v_referrer_id, NEW.id);
    
    -- Increment the referrer's team_count
    UPDATE public.profiles 
    SET team_count = COALESCE(team_count, 0) + 1 
    WHERE id = v_referrer_id;
    
    RAISE NOTICE 'Referral created: referrer=%, referred=%', v_referrer_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;