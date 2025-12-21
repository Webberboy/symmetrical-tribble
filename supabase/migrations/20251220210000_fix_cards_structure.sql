-- Fix cards structure and add missing tables
-- This migration works with the existing card table structure

-- Add missing tables that don't exist yet
CREATE TABLE IF NOT EXISTS public.card_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    daily_limit DECIMAL(10,2) DEFAULT 1000.00,
    monthly_limit DECIMAL(10,2) DEFAULT 5000.00,
    daily_used DECIMAL(10,2) DEFAULT 0.00,
    monthly_used DECIMAL(10,2) DEFAULT 0.00,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.card_statements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    statement_month INTEGER NOT NULL,
    statement_year INTEGER NOT NULL,
    opening_balance DECIMAL(10,2) NOT NULL,
    closing_balance DECIMAL(10,2) NOT NULL,
    total_credits DECIMAL(10,2) DEFAULT 0.00,
    total_debits DECIMAL(10,2) DEFAULT 0.00,
    statement_date DATE NOT NULL,
    due_date DATE,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns to existing card_transactions table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_transactions' 
                  AND column_name = 'merchant_category') THEN
        ALTER TABLE public.card_transactions ADD COLUMN merchant_category TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_transactions' 
                  AND column_name = 'currency') THEN
        ALTER TABLE public.card_transactions ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_transactions' 
                  AND column_name = 'authorization_code') THEN
        ALTER TABLE public.card_transactions ADD COLUMN authorization_code VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_transactions' 
                  AND column_name = 'settlement_date') THEN
        ALTER TABLE public.card_transactions ADD COLUMN settlement_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_transactions' 
                  AND column_name = 'transaction_type') THEN
        ALTER TABLE public.card_transactions ADD COLUMN transaction_type VARCHAR(20) DEFAULT 'purchase';
    END IF;
END $$;

-- Add missing columns to existing card_freeze_history table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_freeze_history' 
                  AND column_name = 'performed_by') THEN
        ALTER TABLE public.card_freeze_history ADD COLUMN performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add missing columns to new tables
DO $$
BEGIN
    -- Add user_id to card_transactions if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_transactions' 
                  AND column_name = 'user_id') THEN
        ALTER TABLE public.card_transactions ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for card_limits table
CREATE INDEX IF NOT EXISTS idx_card_limits_card_id ON public.card_limits(card_id);
CREATE INDEX IF NOT EXISTS idx_card_limits_user_id ON public.card_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_card_limits_last_reset ON public.card_limits(last_reset_date);

-- Create indexes for card_statements table
CREATE INDEX IF NOT EXISTS idx_card_statements_card_id ON public.card_statements(card_id);
CREATE INDEX IF NOT EXISTS idx_card_statements_user_id ON public.card_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_card_statements_date ON public.card_statements(statement_date);
CREATE INDEX IF NOT EXISTS idx_card_statements_month_year ON public.card_statements(statement_month, statement_year);

-- Create indexes for existing tables that might be missing
CREATE INDEX IF NOT EXISTS idx_card_transactions_user_id ON public.card_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_type ON public.card_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_card_freeze_history_performed_by ON public.card_freeze_history(performed_by);

-- Create updated_at triggers for new tables
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_card_limits_updated_at') THEN
        CREATE TRIGGER update_card_limits_updated_at
            BEFORE UPDATE ON public.card_limits
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_card_statements_updated_at') THEN
        CREATE TRIGGER update_card_statements_updated_at
            BEFORE UPDATE ON public.card_statements
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Enable RLS for new tables
ALTER TABLE public.card_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_statements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for card_limits table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'card_limits' AND policyname = 'Users can view own card limits') THEN
        CREATE POLICY "Users can view own card limits" ON public.card_limits
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'card_limits' AND policyname = 'Users can insert own card limits') THEN
        CREATE POLICY "Users can insert own card limits" ON public.card_limits
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'card_limits' AND policyname = 'Users can update own card limits') THEN
        CREATE POLICY "Users can update own card limits" ON public.card_limits
            FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create RLS policies for card_statements table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'card_statements' AND policyname = 'Users can view own card statements') THEN
        CREATE POLICY "Users can view own card statements" ON public.card_statements
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Update existing RLS policy for card_transactions to include the new user_id column
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'card_transactions' 
              AND column_name = 'user_id') THEN
        -- Drop existing policy and recreate with user_id check
        IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'card_transactions' AND policyname = 'Users can view own card transactions') THEN
            DROP POLICY "Users can view own card transactions" ON public.card_transactions;
        END IF;
        
        CREATE POLICY "Users can view own card transactions" ON public.card_transactions
            FOR SELECT
            USING (auth.uid() = user_id);
        
        IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'card_transactions' AND policyname = 'Users can insert own card transactions') THEN
            DROP POLICY "Users can insert own card transactions" ON public.card_transactions;
        END IF;
        
        CREATE POLICY "Users can insert own card transactions" ON public.card_transactions
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;