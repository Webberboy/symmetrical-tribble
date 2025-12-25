-- Comprehensive fix for card tables to match the CreateCard component requirements
-- This script updates the card_limits table to match what the CreateCard component expects

-- First, let's ensure the basic cards table exists with all required columns
DO $$
BEGIN
    -- Create cards table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'cards') THEN
        CREATE TABLE public.cards (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            card_number VARCHAR(20) NOT NULL UNIQUE,
            card_number_masked VARCHAR(20) NOT NULL,
            card_holder_name VARCHAR(255) NOT NULL,
            expiry_date VARCHAR(5) NOT NULL,
            cvv VARCHAR(4) NOT NULL,
            card_type VARCHAR(20) NOT NULL CHECK (card_type IN ('credit', 'debit', 'prepaid')),
            card_status VARCHAR(20) DEFAULT 'active' CHECK (card_status IN ('active', 'inactive', 'suspended', 'frozen', 'expired')),
            card_color VARCHAR(50) DEFAULT 'gradient-blue',
            current_balance DECIMAL(10,2) DEFAULT 0.00,
            credit_limit DECIMAL(10,2),
            available_credit DECIMAL(10,2),
            card_brand VARCHAR(50),
            is_frozen BOOLEAN DEFAULT FALSE,
            frozen_at TIMESTAMP WITH TIME ZONE,
            freeze_reason TEXT,
            issued_at TIMESTAMP WITH TIME ZONE,
            activated_at TIMESTAMP WITH TIME ZONE,
            expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;
END $$;

-- Update card_limits table to match CreateCard component structure
DO $$
BEGIN
    -- Add missing columns to card_limits table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_limits' 
                  AND column_name = 'daily_purchase_limit') THEN
        ALTER TABLE public.card_limits ADD COLUMN daily_purchase_limit DECIMAL(10,2) DEFAULT 5000.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_limits' 
                  AND column_name = 'daily_withdrawal_limit') THEN
        ALTER TABLE public.card_limits ADD COLUMN daily_withdrawal_limit DECIMAL(10,2) DEFAULT 1000.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_limits' 
                  AND column_name = 'monthly_limit') THEN
        ALTER TABLE public.card_limits ADD COLUMN monthly_limit DECIMAL(10,2) DEFAULT 50000.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_limits' 
                  AND column_name = 'daily_spent') THEN
        ALTER TABLE public.card_limits ADD COLUMN daily_spent DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_limits' 
                  AND column_name = 'daily_withdrawn') THEN
        ALTER TABLE public.card_limits ADD COLUMN daily_withdrawn DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_limits' 
                  AND column_name = 'monthly_spent') THEN
        ALTER TABLE public.card_limits ADD COLUMN monthly_spent DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_limits' 
                  AND column_name = 'international_transactions_enabled') THEN
        ALTER TABLE public.card_limits ADD COLUMN international_transactions_enabled BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_limits' 
                  AND column_name = 'online_transactions_enabled') THEN
        ALTER TABLE public.card_limits ADD COLUMN online_transactions_enabled BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_limits' 
                  AND column_name = 'contactless_enabled') THEN
        ALTER TABLE public.card_limits ADD COLUMN contactless_enabled BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_limits' 
                  AND column_name = 'atm_withdrawals_enabled') THEN
        ALTER TABLE public.card_limits ADD COLUMN atm_withdrawals_enabled BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Add missing columns to cards table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'cards' 
                  AND column_name = 'issued_at') THEN
        ALTER TABLE public.cards ADD COLUMN issued_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'cards' 
                  AND column_name = 'activated_at') THEN
        ALTER TABLE public.cards ADD COLUMN activated_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'cards' 
                  AND column_name = 'expires_at') THEN
        ALTER TABLE public.cards ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create card_transactions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_transactions') THEN
        CREATE TABLE public.card_transactions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            merchant_name VARCHAR(255) NOT NULL,
            merchant_category VARCHAR(100),
            amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
            currency VARCHAR(3) DEFAULT 'USD',
            transaction_type VARCHAR(20) NOT NULL DEFAULT 'purchase' CHECK (transaction_type IN ('purchase', 'withdrawal', 'refund', 'chargeback')),
            transaction_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'disputed')),
            authorization_code VARCHAR(50),
            settlement_date DATE,
            location VARCHAR(255),
            reference_number VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;
END $$;

-- Create card_freeze_history table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_freeze_history') THEN
        CREATE TABLE public.card_freeze_history (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
            action VARCHAR(20) NOT NULL CHECK (action IN ('freeze', 'unfreeze')),
            reason TEXT,
            freeze_type VARCHAR(50),
            initiated_by VARCHAR(50) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_card_number ON public.cards(card_number);
CREATE INDEX IF NOT EXISTS idx_cards_card_status ON public.cards(card_status);
CREATE INDEX IF NOT EXISTS idx_cards_is_frozen ON public.cards(is_frozen);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON public.cards(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_card_transactions_card_id ON public.card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_user_id ON public.card_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_transaction_date ON public.card_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_card_transactions_status ON public.card_transactions(status);
CREATE INDEX IF NOT EXISTS idx_card_transactions_merchant ON public.card_transactions(merchant_name);

CREATE INDEX IF NOT EXISTS idx_card_freeze_history_card_id ON public.card_freeze_history(card_id);
CREATE INDEX IF NOT EXISTS idx_card_freeze_history_user_id ON public.card_freeze_history(user_id);
CREATE INDEX IF NOT EXISTS idx_card_freeze_history_created_at ON public.card_freeze_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_card_limits_card_id ON public.card_limits(card_id);
CREATE INDEX IF NOT EXISTS idx_card_limits_user_id ON public.card_limits(user_id);

-- Create updated_at triggers
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cards_updated_at') THEN
        CREATE TRIGGER update_cards_updated_at
            BEFORE UPDATE ON public.cards
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_card_transactions_updated_at') THEN
        CREATE TRIGGER update_card_transactions_updated_at
            BEFORE UPDATE ON public.card_transactions
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_card_freeze_history_updated_at') THEN
        CREATE TRIGGER update_card_freeze_history_updated_at
            BEFORE UPDATE ON public.card_freeze_history
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_card_limits_updated_at') THEN
        CREATE TRIGGER update_card_limits_updated_at
            BEFORE UPDATE ON public.card_limits
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_freeze_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own cards" ON public.cards
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards" ON public.cards
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards" ON public.cards
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own card transactions" ON public.card_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own card transactions" ON public.card_transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own card freeze history" ON public.card_freeze_history
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own card freeze history" ON public.card_freeze_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own card limits" ON public.card_limits
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own card limits" ON public.card_limits
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own card limits" ON public.card_limits
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create the update_updated_at_column function if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE OR REPLACE FUNCTION public.update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = timezone('utc'::text, now());
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END $$;