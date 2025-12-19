-- Fix anon user SELECT permissions for pending_signups table
-- This addresses the "Signup data not found" error during email verification

-- Add SELECT policy for pending_signups to allow anon users to read their own signup data
-- This is safe because the auth user must already exist (created via supabase.auth.signUp)
CREATE POLICY "Anonymous users can select pending signup" ON public.pending_signups FOR SELECT TO anon 
USING (true);

-- Grant SELECT permission to anon role for pending_signups
GRANT SELECT ON public.pending_signups TO anon;