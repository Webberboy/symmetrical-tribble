-- Comprehensive fix for signup permissions
-- This migration addresses all the 401 Unauthorized errors during signup

-- Fix pending_signups permissions
-- Drop existing restrictive policies and create more permissive ones
DROP POLICY IF EXISTS "Users can manage own pending signup" ON public.pending_signups;
DROP POLICY IF EXISTS "Users can create own pending signup" ON public.pending_signups;

-- Allow authenticated users to insert their own pending signup
CREATE POLICY "Users can insert own pending signup" ON public.pending_signups FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

-- Allow authenticated users to select their own pending signup
CREATE POLICY "Users can select own pending signup" ON public.pending_signups FOR SELECT
    USING (auth.uid() = auth_user_id);

-- Allow authenticated users to update their own pending signup
CREATE POLICY "Users can update own pending signup" ON public.pending_signups FOR UPDATE
    USING (auth.uid() = auth_user_id);

-- Allow authenticated users to delete their own pending signup
CREATE POLICY "Users can delete own pending signup" ON public.pending_signups FOR DELETE
    USING (auth.uid() = auth_user_id);

-- Fix profiles permissions
-- Drop existing restrictive policies and create more permissive ones
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;

-- Allow authenticated users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Allow authenticated users to delete their own profile (if needed)
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- Fix user_roles permissions
-- Drop existing restrictive policies and create more permissive ones
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can create own role" ON public.user_roles;

-- Allow authenticated users to view their own role
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own role
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own role
CREATE POLICY "Users can update own role" ON public.user_roles FOR UPDATE
    USING (auth.uid() = user_id);

-- Fix accounts permissions
-- Drop existing restrictive policies and create more permissive ones
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can create own accounts" ON public.accounts;

-- Allow authenticated users to view their own accounts
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT
    USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own accounts
CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own accounts
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE
    USING (auth.uid() = user_id);

-- Grant comprehensive permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_signups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;

-- Keep service role policies for admin operations
DROP POLICY IF EXISTS "Service role can manage all pending signups" ON public.pending_signups;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage all accounts" ON public.accounts;

CREATE POLICY "Service role can manage all pending signups" ON public.pending_signups FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all profiles" ON public.profiles FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all user roles" ON public.user_roles FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all accounts" ON public.accounts FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');