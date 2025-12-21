-- Cards tables migration - focused on cards functionality only
-- No RLS policies included

-- Create cards table
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    account_id UUID,
    card_number VARCHAR(255) NOT NULL,
    cvv VARCHAR(255) NOT NULL,
    expiry_date VARCHAR(10) NOT NULL,
    card_holder_name VARCHAR(255) NOT NULL,
    card_type VARCHAR(50) NOT NULL DEFAULT 'debit',
    card_status VARCHAR(50) NOT NULL DEFAULT 'active',
    is_frozen BOOLEAN DEFAULT FALSE,
    freeze_reason TEXT,
    frozen_at TIMESTAMP WITH TIME ZONE,
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    available_credit DECIMAL(15,2),
    credit_limit DECIMAL(15,2),
    color VARCHAR(50) DEFAULT 'blue',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create card_transactions table
CREATE TABLE IF NOT EXISTS public.card_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID NOT NULL,
    user_id UUID NOT NULL,
    merchant_name VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    posted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    merchant_category VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'completed'
);

-- Create card_freeze_history table
CREATE TABLE IF NOT EXISTS public.card_freeze_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID NOT NULL,
    user_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    reason TEXT,
    freeze_type VARCHAR(50) NOT NULL,
    initiated_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create card_limits table
CREATE TABLE IF NOT EXISTS public.card_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID NOT NULL,
    user_id UUID NOT NULL,
    daily_purchase_limit DECIMAL(15,2) DEFAULT 5000.00,
    daily_withdrawal_limit DECIMAL(15,2) DEFAULT 1000.00,
    monthly_limit DECIMAL(15,2) DEFAULT 20000.00,
    international_transactions_enabled BOOLEAN DEFAULT TRUE,
    online_transactions_enabled BOOLEAN DEFAULT TRUE,
    contactless_enabled BOOLEAN DEFAULT TRUE,
    atm_withdrawals_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create card_statements table
CREATE TABLE IF NOT EXISTS public.card_statements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID NOT NULL,
    user_id UUID NOT NULL,
    statement_date DATE NOT NULL,
    statement_period_start DATE NOT NULL,
    statement_period_end DATE NOT NULL,
    opening_balance DECIMAL(15,2) NOT NULL,
    closing_balance DECIMAL(15,2) NOT NULL,
    total_credits DECIMAL(15,2) DEFAULT 0.00,
    total_debits DECIMAL(15,2) DEFAULT 0.00,
    minimum_payment DECIMAL(15,2),
    due_date DATE,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_account_id ON public.cards(account_id);
CREATE INDEX IF NOT EXISTS idx_cards_status ON public.cards(card_status);
CREATE INDEX IF NOT EXISTS idx_cards_type ON public.cards(card_type);

CREATE INDEX IF NOT EXISTS idx_card_transactions_card_id ON public.card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_user_id ON public.card_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_date ON public.card_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_card_transactions_type ON public.card_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_card_freeze_history_card_id ON public.card_freeze_history(card_id);
CREATE INDEX IF NOT EXISTS idx_card_freeze_history_user_id ON public.card_freeze_history(user_id);
CREATE INDEX IF NOT EXISTS idx_card_freeze_history_created ON public.card_freeze_history(created_at);

CREATE INDEX IF NOT EXISTS idx_card_limits_card_id ON public.card_limits(card_id);
CREATE INDEX IF NOT EXISTS idx_card_limits_user_id ON public.card_limits(user_id);

CREATE INDEX IF NOT EXISTS idx_card_statements_card_id ON public.card_statements(card_id);
CREATE INDEX IF NOT EXISTS idx_card_statements_user_id ON public.card_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_card_statements_date ON public.card_statements(statement_date);

-- Insert default card limits for existing cards (if any)
INSERT INTO public.card_limits (card_id, user_id)
SELECT id, user_id FROM public.cards
WHERE NOT EXISTS (
    SELECT 1 FROM public.card_limits cl WHERE cl.card_id = public.cards.id
);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_cards_updated_at 
    BEFORE UPDATE ON public.cards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_limits_updated_at 
    BEFORE UPDATE ON public.card_limits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();