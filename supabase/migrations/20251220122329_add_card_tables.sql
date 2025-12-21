-- Create card-related tables for the dashboard
-- These tables are used by the Cards component and card management features

-- Create cards table
CREATE TABLE IF NOT EXISTS public.cards (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create card_transactions table
CREATE TABLE IF NOT EXISTS public.card_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    merchant_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'withdrawal', 'refund', 'chargeback')),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'disputed')),
    category VARCHAR(100),
    location VARCHAR(255),
    reference_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create card_freeze_history table
CREATE TABLE IF NOT EXISTS public.card_freeze_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('freeze', 'unfreeze')),
    reason TEXT,
    freeze_type VARCHAR(50),
    initiated_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for cards table
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_card_number ON public.cards(card_number);
CREATE INDEX IF NOT EXISTS idx_cards_card_status ON public.cards(card_status);
CREATE INDEX IF NOT EXISTS idx_cards_is_frozen ON public.cards(is_frozen);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON public.cards(created_at DESC);

-- Create indexes for card_transactions table
CREATE INDEX IF NOT EXISTS idx_card_transactions_card_id ON public.card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_transaction_date ON public.card_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_card_transactions_status ON public.card_transactions(status);
CREATE INDEX IF NOT EXISTS idx_card_transactions_merchant ON public.card_transactions(merchant_name);

-- Create indexes for card_freeze_history table
CREATE INDEX IF NOT EXISTS idx_card_freeze_history_card_id ON public.card_freeze_history(card_id);
CREATE INDEX IF NOT EXISTS idx_card_freeze_history_user_id ON public.card_freeze_history(user_id);
CREATE INDEX IF NOT EXISTS idx_card_freeze_history_created_at ON public.card_freeze_history(created_at DESC);

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

-- Enable RLS on all tables
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_freeze_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cards table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cards' AND policyname = 'Users can view own cards') THEN
        CREATE POLICY "Users can view own cards" ON public.cards
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cards' AND policyname = 'Users can insert own cards') THEN
        CREATE POLICY "Users can insert own cards" ON public.cards
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cards' AND policyname = 'Users can update own cards') THEN
        CREATE POLICY "Users can update own cards" ON public.cards
            FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create RLS policies for card_transactions table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'card_transactions' AND policyname = 'Users can view own card transactions') THEN
        CREATE POLICY "Users can view own card transactions" ON public.card_transactions
            FOR SELECT
            USING (EXISTS (
                SELECT 1 FROM public.cards 
                WHERE cards.id = card_transactions.card_id 
                AND cards.user_id = auth.uid()
            ));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'card_transactions' AND policyname = 'Users can insert own card transactions') THEN
        CREATE POLICY "Users can insert own card transactions" ON public.card_transactions
            FOR INSERT
            WITH CHECK (EXISTS (
                SELECT 1 FROM public.cards 
                WHERE cards.id = card_transactions.card_id 
                AND cards.user_id = auth.uid()
            ));
    END IF;
END $$;

-- Create RLS policies for card_freeze_history table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'card_freeze_history' AND policyname = 'Users can view own card freeze history') THEN
        CREATE POLICY "Users can view own card freeze history" ON public.card_freeze_history
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'card_freeze_history' AND policyname = 'Users can insert own card freeze history') THEN
        CREATE POLICY "Users can insert own card freeze history" ON public.card_freeze_history
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;