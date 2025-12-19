-- Fix accounts RLS permissions to ensure authenticated users can create their own accounts
-- This addresses the "permission denied for table accounts" error

-- Drop existing accounts policies to ensure clean state
DROP POLICY IF EXISTS "Allow authenticated users to manage own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow service role to manage all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;

-- Create a comprehensive policy that allows authenticated users to manage their own accounts
CREATE POLICY "Authenticated users can manage own accounts" ON public.accounts FOR ALL
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_number = accounts.account_number
        )
    )
    WITH CHECK (auth.uid() = user_id);

-- Ensure service role can manage all accounts
CREATE POLICY "Service role can manage all accounts" ON public.accounts FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Grant explicit permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO service_role;

-- Ensure RLS is enabled
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;