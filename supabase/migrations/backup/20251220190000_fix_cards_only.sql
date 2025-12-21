-- Ultra-clean cards migration - only what we need for cards page
-- Skip all problematic tables and focus only on cards functionality

-- Ensure cards table exists with proper structure
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_number VARCHAR(20) NOT NULL UNIQUE,
    cardholder_name VARCHAR(100) NOT NULL,
    expiry_month VARCHAR(2) NOT NULL,
    expiry_year VARCHAR(4) NOT NULL,
    cvv VARCHAR(4) NOT NULL,
    card_type VARCHAR(20) DEFAULT 'debit' NOT NULL,
    brand VARCHAR(20) DEFAULT 'visa' NOT NULL,
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    is_frozen BOOLEAN DEFAULT false NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    credit_limit DECIMAL(10,2) DEFAULT 1000.00 NOT NULL,
    available_credit DECIMAL(10,2) DEFAULT 1000.00 NOT NULL,
    color VARCHAR(7) DEFAULT '#1e40af' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Ensure card_transactions table exists
CREATE TABLE IF NOT EXISTS public.card_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    merchant_name VARCHAR(200),
    merchant_category VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'completed' NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Ensure card_freeze_history table exists
CREATE TABLE IF NOT EXISTS public.card_freeze_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Ensure card_limits table exists
CREATE TABLE IF NOT EXISTS public.card_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    daily_limit DECIMAL(10,2) DEFAULT 1000.00 NOT NULL,
    monthly_limit DECIMAL(10,2) DEFAULT 5000.00 NOT NULL,
    atm_limit DECIMAL(10,2) DEFAULT 500.00 NOT NULL,
    online_limit DECIMAL(10,2) DEFAULT 2000.00 NOT NULL,
    contactless_limit DECIMAL(10,2) DEFAULT 100.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Ensure card_statements table exists
CREATE TABLE IF NOT EXISTS public.card_statements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    statement_month INTEGER NOT NULL,
    statement_year INTEGER NOT NULL,
    opening_balance DECIMAL(10,2) NOT NULL,
    closing_balance DECIMAL(10,2) NOT NULL,
    total_debits DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    total_credits DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    statement_date DATE NOT NULL,
    due_date DATE,
    is_paid BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create essential indexes only
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_card_number ON public.cards(card_number);
CREATE INDEX IF NOT EXISTS idx_card_transactions_card_id ON public.card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_user_id ON public.card_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_date ON public.card_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_card_freeze_history_card_id ON public.card_freeze_history(card_id);
CREATE INDEX IF NOT EXISTS idx_card_limits_card_id ON public.card_limits(card_id);
CREATE INDEX IF NOT EXISTS idx_card_statements_card_id ON public.card_statements(card_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_cards_updated_at 
    BEFORE UPDATE ON public.cards 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_card_limits_updated_at 
    BEFORE UPDATE ON public.card_limits 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_card_statements_updated_at 
    BEFORE UPDATE ON public.card_statements 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();