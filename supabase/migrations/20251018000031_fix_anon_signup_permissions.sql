-- Fix anon user permissions for signup process
-- This addresses the 401 Unauthorized errors during user registration

-- Add RLS policies for anon users on pending_signups table
CREATE POLICY "Anonymous users can create pending signup" ON public.pending_signups FOR INSERT TO anon WITH CHECK (true);

-- Add RLS policies for anon users on profiles table  
CREATE POLICY "Anonymous users can create profile" ON public.profiles FOR INSERT TO anon WITH CHECK (true);

-- Grant necessary permissions to anon role
GRANT INSERT ON public.pending_signups TO anon;
GRANT INSERT ON public.profiles TO anon;

-- Ensure anon role can access the public schema
GRANT USAGE ON SCHEMA public TO anon;