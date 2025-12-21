-- Fix accounts table permissions for signup process
-- This resolves "permission denied for table accounts" error

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Authenticated users can manage own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Service role can manage all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;

-- Create simpler, more effective policies
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE
    USING (auth.uid() = user_id);

-- Service role policy for admin operations
CREATE POLICY "Service role can manage all accounts" ON public.accounts FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Grant explicit permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO service_role;

-- Ensure RLS is enabled
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;