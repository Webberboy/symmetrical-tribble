-- Final fix for accounts table permissions
-- This ensures authenticated users can create their own accounts

-- Drop existing policies on accounts table
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can manage own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Service role can manage all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow authenticated users to insert own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow users to view own accounts" ON public.accounts;

-- Create simplified policies for accounts table
CREATE POLICY "Allow authenticated users to insert own accounts" ON public.accounts
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY "Allow users to view own accounts" ON public.accounts
    FOR SELECT USING (
        auth.uid() = user_id
    );

CREATE POLICY "Allow users to update own accounts" ON public.accounts
    FOR UPDATE USING (
        auth.uid() = user_id
    );

CREATE POLICY "Service role can manage all accounts" ON public.accounts
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Ensure RLS is enabled
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO service_role;