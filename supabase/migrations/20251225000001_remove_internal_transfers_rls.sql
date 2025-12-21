-- Remove RLS policies from internal_transfers table to fix 401 Unauthorized error

-- Remove existing RLS policies
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internal_transfers' AND policyname = 'Users can view own internal transfers') THEN
        DROP POLICY "Users can view own internal transfers" ON public.internal_transfers;
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internal_transfers' AND policyname = 'Users can insert own internal transfers') THEN
        DROP POLICY "Users can insert own internal transfers" ON public.internal_transfers;
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internal_transfers' AND policyname = 'Users can update own internal transfers') THEN
        DROP POLICY "Users can update own internal transfers" ON public.internal_transfers;
    END IF;
END $$;

-- Disable RLS on internal_transfers table
ALTER TABLE public.internal_transfers DISABLE ROW LEVEL SECURITY;