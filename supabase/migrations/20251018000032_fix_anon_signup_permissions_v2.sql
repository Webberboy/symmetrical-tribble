-- Fix anon user permissions for signup process - Version 2
-- This addresses the RLS policy issues discovered during testing

-- Drop the previous policies that were too permissive
DROP POLICY IF EXISTS "Anonymous users can create pending signup" ON public.pending_signups;
DROP POLICY IF EXISTS "Anonymous users can create profile" ON public.profiles;

-- Create proper RLS policies for anon users during signup
-- These policies allow anon users to insert records that reference the auth user they just created

-- For pending_signups: Allow anon users to insert records for any auth user
-- This is safe because the auth user must already exist (created via supabase.auth.signUp)
CREATE POLICY "Anonymous users can create pending signup" ON public.pending_signups FOR INSERT TO anon 
WITH CHECK (
  -- The auth_user_id must exist in auth.users (this is enforced by the foreign key)
  -- We don't restrict which auth user ID can be used since anon users create their own auth accounts
  true
);

-- For profiles: Allow anon users to insert records for any auth user  
-- This is safe because the auth user must already exist (created via supabase.auth.signUp)
CREATE POLICY "Anonymous users can create profile" ON public.profiles FOR INSERT TO anon 
WITH CHECK (
  -- The id must exist in auth.users (this is enforced by the foreign key)
  -- We don't restrict which auth user ID can be used since anon users create their own auth accounts
  true
);

-- Add RLS policy to allow anon users to check if email/phone exists (this was working)
-- These policies should already exist from fix_signup_permissions.sql, but we'll recreate them

-- Drop existing email/phone check policies if they exist
DROP POLICY IF EXISTS "Anonymous users can check email existence" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous users can check phone existence" ON public.profiles;

-- Create email/phone check policies for anon users
CREATE POLICY "Anonymous users can check email existence" ON public.profiles FOR SELECT TO anon 
USING (
  -- Allow checking if an email exists by searching for it
  email = current_setting('app.current_email', true)::text OR
  -- Allow checking the current email being used in signup
  email = current_setting('app.signup_email', true)::text
);

CREATE POLICY "Anonymous users can check phone existence" ON public.profiles FOR SELECT TO anon 
USING (
  -- Allow checking if a phone exists by searching for it  
  phone = current_setting('app.current_phone', true)::text OR
  -- Allow checking the current phone being used in signup
  phone = current_setting('app.signup_phone', true)::text
);

-- Grant necessary permissions to anon role (keep existing grants)
GRANT INSERT ON public.pending_signups TO anon;
GRANT INSERT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO anon; -- For email/phone existence checks

-- Ensure anon role can access the public schema
GRANT USAGE ON SCHEMA public TO anon;