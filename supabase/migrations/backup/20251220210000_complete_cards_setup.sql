-- Complete cards setup migration
-- This migration creates all card-related tables and ensures proper structure

-- Create cards table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    card_number VARCHAR(20) UNIQUE NOT NULL,
    cardholder_name VARCHAR(100) NOT NULL,
    expiration_date DATE NOT NULL,
    cvv VARCHAR(4) NOT NULL,
    card_type VARCHAR(20) NOT NULL DEFAULT 'debit',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    credit_limit DECIMAL(10,2) DEFAULT 0.00,
    current_balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create card_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.card_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    merchant_name VARCHAR(200),
    merchant_category VARCHAR(100),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'completed',
    currency VARCHAR(3) DEFAULT 'USD',
    authorization_code VARCHAR(50),
    settlement_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create card_freeze_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.card_freeze_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL, -- 'freeze' or 'unfreeze'
    reason TEXT,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create card_limits table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.card_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_limit DECIMAL(10,2) DEFAULT 1000.00,
    monthly_limit DECIMAL(10,2) DEFAULT 5000.00,
    daily_used DECIMAL(10,2) DEFAULT 0.00,
    monthly_used DECIMAL(10,2) DEFAULT 0.00,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create card_statements table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.card_statements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    statement_month INTEGER NOT NULL,
    statement_year INTEGER NOT NULL,
    opening_balance DECIMAL(10,2) NOT NULL,
    closing_balance DECIMAL(10,2) NOT NULL,
    total_credits DECIMAL(10,2) DEFAULT 0.00,
    total_debits DECIMAL(10,2) DEFAULT 0.00,
    statement_date DATE NOT NULL,
    due_date DATE,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing tables
DO $$
BEGIN
    -- Add missing columns to card_transactions
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
        ALTER TABLE public.card_transactions ADD COLUMN currency TEXT DEFAULT 'USD';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_transactions' 
                  AND column_name = 'authorization_code') THEN
        ALTER TABLE public.card_transactions ADD COLUMN authorization_code TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_transactions' 
                  AND column_name = 'settlement_date') THEN
        ALTER TABLE public.card_transactions ADD COLUMN settlement_date DATE;
    END IF;
    
    -- Add missing columns to card_freeze_history
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_freeze_history' 
                  AND column_name = 'performed_by') THEN
        ALTER TABLE public.card_freeze_history ADD COLUMN performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    -- Add missing columns to card_limits
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_limits' 
                  AND column_name = 'updated_at') THEN
        ALTER TABLE public.card_limits ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add missing columns to card_statements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_statements' 
                  AND column_name = 'updated_at') THEN
        ALTER TABLE public.card_statements ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_card_number ON public.cards(card_number);
CREATE INDEX IF NOT EXISTS idx_cards_status ON public.cards(status);

CREATE INDEX IF NOT EXISTS idx_card_transactions_card_id ON public.card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_user_id ON public.card_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_date ON public.card_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_card_transactions_type ON public.card_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_card_transactions_merchant ON public.card_transactions(merchant_name);

CREATE INDEX IF NOT EXISTS idx_card_freeze_history_card_id ON public.card_freeze_history(card_id);
CREATE INDEX IF NOT EXISTS idx_card_freeze_history_user_id ON public.card_freeze_history(user_id);
CREATE INDEX IF NOT EXISTS idx_card_freeze_history_created ON public.card_freeze_history(created_at);

CREATE INDEX IF NOT EXISTS idx_card_limits_card_id ON public.card_limits(card_id);
CREATE INDEX IF NOT EXISTS idx_card_limits_user_id ON public.card_limits(user_id);

CREATE INDEX IF NOT EXISTS idx_card_statements_card_id ON public.card_statements(card_id);
CREATE INDEX IF NOT EXISTS idx_card_statements_user_id ON public.card_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_card_statements_date ON public.card_statements(statement_date);
CREATE INDEX IF NOT EXISTS idx_card_statements_month_year ON public.card_statements(statement_month, statement_year);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON public.cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_transactions_updated_at
    BEFORE UPDATE ON public.card_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_limits_updated_at
    BEFORE UPDATE ON public.card_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_statements_updated_at
    BEFORE UPDATE ON public.card_statements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS for card tables to allow full access (can be enabled later with specific policies)
ALTER TABLE public.cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_freeze_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_limits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_statements DISABLE ROW LEVEL SECURITY;