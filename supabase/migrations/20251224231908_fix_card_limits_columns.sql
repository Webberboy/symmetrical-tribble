-- Fix card_limits table to match CreateCard component requirements
-- This migration adds the missing columns that the CreateCard component expects

-- Add missing columns to card_limits table
ALTER TABLE public.card_limits 
ADD COLUMN IF NOT EXISTS daily_purchase_limit DECIMAL(10,2) DEFAULT 5000.00,
ADD COLUMN IF NOT EXISTS daily_withdrawal_limit DECIMAL(10,2) DEFAULT 1000.00,
ADD COLUMN IF NOT EXISTS monthly_limit DECIMAL(10,2) DEFAULT 50000.00,
ADD COLUMN IF NOT EXISTS daily_spent DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS daily_withdrawn DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS monthly_spent DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS international_transactions_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS online_transactions_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS contactless_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS atm_withdrawals_enabled BOOLEAN DEFAULT TRUE;

-- Add missing columns to cards table if they don't exist
ALTER TABLE public.cards
ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Ensure all necessary indexes exist
CREATE INDEX IF NOT EXISTS idx_card_limits_card_id ON public.card_limits(card_id);
CREATE INDEX IF NOT EXISTS idx_card_limits_user_id ON public.card_limits(user_id);

-- Ensure RLS policies exist for card_limits
ALTER TABLE public.card_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'card_limits' AND policyname = 'Users can view own card limits') THEN
        CREATE POLICY "Users can view own card limits" ON public.card_limits
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'card_limits' AND policyname = 'Users can insert own card limits') THEN
        CREATE POLICY "Users can insert own card limits" ON public.card_limits
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'card_limits' AND policyname = 'Users can update own card limits') THEN
        CREATE POLICY "Users can update own card limits" ON public.card_limits
            FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
END $$;