-- Add checking_balance and savings_balance columns to profiles table
-- These columns are used by the admin wire transfer management and other components

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS checking_balance DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS savings_balance DECIMAL(12,2) DEFAULT 0.00;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_checking_balance ON public.profiles(checking_balance);
CREATE INDEX IF NOT EXISTS idx_profiles_savings_balance ON public.profiles(savings_balance);

-- Update RLS policies to allow users to view their own balance information
-- These policies should already exist, but we'll ensure they're comprehensive
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own balance') THEN
        CREATE POLICY "Users can view own balance" ON public.profiles
            FOR SELECT
            USING (auth.uid() = id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own balance') THEN
        CREATE POLICY "Users can update own balance" ON public.profiles
            FOR UPDATE
            USING (auth.uid() = id);
    END IF;
END $$;