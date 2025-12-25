-- Fix card_limits table - add missing columns
ALTER TABLE public.card_limits 
ADD COLUMN IF NOT EXISTS daily_purchase_limit DECIMAL(10,2) DEFAULT 5000.00,
ADD COLUMN IF NOT EXISTS daily_withdrawal_limit DECIMAL(10,2) DEFAULT 1000.00,
ADD COLUMN IF NOT EXISTS monthly_limit DECIMAL(10,2) DEFAULT 20000.00,
ADD COLUMN IF NOT EXISTS daily_spent DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS daily_withdrawn DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS monthly_spent DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS international_transactions_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS online_transactions_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS contactless_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS atm_withdrawals_enabled BOOLEAN DEFAULT true;

-- Fix cards table - add missing columns
ALTER TABLE public.cards 
ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 years');

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_card_limits_user_id ON public.card_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_card_limits_card_id ON public.card_limits(card_id);

-- Ensure RLS policies exist
ALTER TABLE public.card_limits ENABLE ROW LEVEL SECURITY;