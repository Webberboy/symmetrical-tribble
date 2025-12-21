-- Add last credit and debit columns to profiles table
-- These columns are used by AccountBalances component and admin panels

-- Add checking account columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS checking_last_credit DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS checking_last_debit DECIMAL(10,2) DEFAULT 0.00;

-- Add savings account columns  
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS savings_last_credit DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS savings_last_debit DECIMAL(10,2) DEFAULT 0.00;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_checking_last_credit ON public.profiles(checking_last_credit);
CREATE INDEX IF NOT EXISTS idx_profiles_checking_last_debit ON public.profiles(checking_last_debit);
CREATE INDEX IF NOT EXISTS idx_profiles_savings_last_credit ON public.profiles(savings_last_credit);
CREATE INDEX IF NOT EXISTS idx_profiles_savings_last_debit ON public.profiles(savings_last_debit);

-- Create transactions table for transaction history
-- This table is used by TransactionBuilder component and transaction history displays
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    merchant VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    account_type VARCHAR(20) CHECK (account_type IN ('checking', 'savings')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_account_type ON public.transactions(account_type);

-- Create updated_at trigger for transactions table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_transactions_updated_at') THEN
        CREATE TRIGGER update_transactions_updated_at
            BEFORE UPDATE ON public.transactions
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Enable RLS on transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transactions table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can view own transactions') THEN
        CREATE POLICY "Users can view own transactions" ON public.transactions
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can insert own transactions') THEN
        CREATE POLICY "Users can insert own transactions" ON public.transactions
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can update own transactions') THEN
        CREATE POLICY "Users can update own transactions" ON public.transactions
            FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can delete own transactions') THEN
        CREATE POLICY "Users can delete own transactions" ON public.transactions
            FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;