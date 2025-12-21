-- Move checking_balance and savings_balance columns from profiles to accounts table
-- This is the correct location for these balance columns

-- First, remove the columns from profiles table since they're in the wrong place
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS checking_balance,
DROP COLUMN IF EXISTS savings_balance;

-- Now add the columns to accounts table where they belong
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS checking_balance DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS savings_balance DECIMAL(12,2) DEFAULT 0.00;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_checking_balance ON public.accounts(checking_balance);
CREATE INDEX IF NOT EXISTS idx_accounts_savings_balance ON public.accounts(savings_balance);

-- Update existing accounts with proper balance data based on account_type
UPDATE public.accounts 
SET checking_balance = balance 
WHERE account_type = 'checking' AND (checking_balance IS NULL OR checking_balance = 0.00);

UPDATE public.accounts 
SET savings_balance = balance 
WHERE account_type = 'savings' AND (savings_balance IS NULL OR savings_balance = 0.00);