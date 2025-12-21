-- Fix internal transfer functionality
-- Add missing columns to transactions table and create internal_transfers table

-- Add missing columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS recipient_account VARCHAR(50),
ADD COLUMN IF NOT EXISTS recipient_account_type VARCHAR(20) CHECK (recipient_account_type IN ('checking', 'savings')),
ADD COLUMN IF NOT EXISTS account_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS transfer_id VARCHAR(100);

-- Create internal_transfers table
CREATE TABLE IF NOT EXISTS public.internal_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    from_account_type VARCHAR(20) NOT NULL CHECK (from_account_type IN ('checking', 'savings')),
    to_account_type VARCHAR(20) NOT NULL CHECK (to_account_type IN ('checking', 'savings')),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    from_account_number VARCHAR(50),
    to_account_number VARCHAR(50),
    transfer_id VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for internal_transfers
CREATE INDEX IF NOT EXISTS idx_internal_transfers_user_id ON public.internal_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_internal_transfers_transaction_id ON public.internal_transfers(transaction_id);
CREATE INDEX IF NOT EXISTS idx_internal_transfers_transfer_id ON public.internal_transfers(transfer_id);
CREATE INDEX IF NOT EXISTS idx_internal_transfers_created_at ON public.internal_transfers(created_at DESC);

-- Create updated_at trigger for internal_transfers table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_internal_transfers_updated_at') THEN
        CREATE TRIGGER update_internal_transfers_updated_at
            BEFORE UPDATE ON public.internal_transfers
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Enable RLS on internal_transfers table
ALTER TABLE public.internal_transfers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for internal_transfers table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internal_transfers' AND policyname = 'Users can view own internal transfers') THEN
        CREATE POLICY "Users can view own internal transfers" ON public.internal_transfers
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internal_transfers' AND policyname = 'Users can insert own internal transfers') THEN
        CREATE POLICY "Users can insert own internal transfers" ON public.internal_transfers
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internal_transfers' AND policyname = 'Users can update own internal transfers') THEN
        CREATE POLICY "Users can update own internal transfers" ON public.internal_transfers
            FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
END $$;