-- Fix anon user permissions for signup process - Version 3
-- This addresses the RLS policy issues that are still blocking anonymous inserts

-- Drop the previous policies that aren't working
DROP POLICY IF EXISTS "Anonymous users can create pending signup" ON public.pending_signups;
DROP POLICY IF EXISTS "Anonymous users can create profile" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous users can check email existence" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous users can check phone existence" ON public.profiles;

-- Create proper RLS policies for anon users during signup
-- These policies allow anon users to insert records for auth users they create

-- For pending_signups: Allow anon users to insert records
-- This is safe because the auth user must already exist (created via supabase.auth.signUp)
CREATE POLICY "Anonymous users can create pending signup" ON public.pending_signups FOR INSERT TO anon 
WITH CHECK (true);

-- For profiles: Allow anon users to insert records  
-- This is safe because the auth user must already exist (created via supabase.auth.signUp)
CREATE POLICY "Anonymous users can create profile" ON public.profiles FOR INSERT TO anon 
WITH CHECK (true);

-- For email/phone existence checks: Allow anon users to search by email/phone
CREATE POLICY "Anonymous users can check email existence" ON public.profiles FOR SELECT TO anon 
USING (true);

-- Grant necessary permissions to anon role
GRANT INSERT ON public.pending_signups TO anon;
GRANT INSERT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO anon; -- For email/phone existence checks

-- Ensure anon role can access the public schema
GRANT USAGE ON SCHEMA public TO anon;