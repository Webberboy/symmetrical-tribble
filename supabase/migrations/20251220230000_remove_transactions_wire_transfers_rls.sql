-- Migration: Remove RLS from transactions and wire_transfers tables
-- Description: Disables Row Level Security on transactions and wire_transfers tables to make them open for all operations

-- Remove RLS policies from transactions table
DO $$
BEGIN
    -- Check and remove each policy individually
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'Users can view own transactions') THEN
        DROP POLICY "Users can view own transactions" ON public.transactions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'Users can insert own transactions') THEN
        DROP POLICY "Users can insert own transactions" ON public.transactions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'Users can update own transactions') THEN
        DROP POLICY "Users can update own transactions" ON public.transactions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'Users can delete own transactions') THEN
        DROP POLICY "Users can delete own transactions" ON public.transactions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'Admins can view all transactions') THEN
        DROP POLICY "Admins can view all transactions" ON public.transactions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'Admins can manage all transactions') THEN
        DROP POLICY "Admins can manage all transactions" ON public.transactions;
    END IF;
END $$;

-- Remove RLS policies from wire_transfers table
DO $$
BEGIN
    -- Check and remove each policy individually
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wire_transfers' AND policyname = 'Users can view own wire transfers') THEN
        DROP POLICY "Users can view own wire transfers" ON public.wire_transfers;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wire_transfers' AND policyname = 'Users can insert own wire transfers') THEN
        DROP POLICY "Users can insert own wire transfers" ON public.wire_transfers;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wire_transfers' AND policyname = 'Users can update own wire transfers') THEN
        DROP POLICY "Users can update own wire transfers" ON public.wire_transfers;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wire_transfers' AND policyname = 'Admins can manage all wire transfers') THEN
        DROP POLICY "Admins can manage all wire transfers" ON public.wire_transfers;
    END IF;
END $$;

-- Disable RLS on both tables
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wire_transfers DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users on both tables
GRANT ALL ON public.transactions TO authenticated;
GRANT ALL ON public.wire_transfers TO authenticated;

-- Grant all permissions to anon users on both tables (for testing)
GRANT ALL ON public.transactions TO anon;
GRANT ALL ON public.wire_transfers TO anon;