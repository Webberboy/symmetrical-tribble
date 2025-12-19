-- Fix signup permissions for email/phone validation during registration
-- This migration allows anonymous users to check for existing emails and phone numbers during signup

-- Allow anonymous users to check for existing emails (read-only)
CREATE POLICY "Anonymous users can check email existence" ON public.profiles FOR SELECT
    USING (true);

-- Allow anonymous users to check for existing phone numbers (read-only)  
CREATE POLICY "Anonymous users can check phone existence" ON public.profiles FOR SELECT
    USING (phone IS NOT NULL);

-- Allow anonymous users to check for existing account numbers (read-only)
CREATE POLICY "Anonymous users can check account number existence" ON public.accounts FOR SELECT
    USING (true);

-- Grant SELECT permission to anon role for signup validation
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.accounts TO anon;

-- Ensure authenticated users can still perform their operations
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.accounts TO authenticated;
GRANT ALL ON public.pending_signups TO authenticated;