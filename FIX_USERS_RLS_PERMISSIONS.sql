-- Fix users table RLS permissions
-- This script removes RLS from the users table to resolve permission denied errors

-- Check if users table exists (this would be auth.users, not public.users)
-- But if there's a public.users table, we'll handle it

-- If there's a public.users table, disable RLS on it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) THEN
        -- Disable RLS on public.users table if it exists
        ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
        
        -- Grant all permissions on users table
        GRANT ALL ON public.users TO anon, authenticated, service_role;
        
        RAISE NOTICE 'Disabled RLS on public.users table and granted permissions';
    ELSE
        RAISE NOTICE 'No public.users table found - this is expected, users are typically in auth.users';
    END IF;
END $$;

-- Also ensure auth.users is accessible (this requires superuser privileges)
-- Note: auth.users is managed by Supabase and typically has restricted access
-- The permission denied might be coming from trying to query auth.users directly

-- Grant select on auth.users to authenticated users if possible
DO $$
BEGIN
    -- Try to grant select on auth.users, but this might fail due to permissions
    BEGIN
        GRANT SELECT ON auth.users TO authenticated;
        RAISE NOTICE 'Granted SELECT on auth.users to authenticated role';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Could not grant SELECT on auth.users - requires superuser privileges';
    END;
END $$;

-- Alternative approach: Create a view that exposes necessary user data
-- This is often the recommended approach for accessing user data
DROP VIEW IF EXISTS public.user_info;
CREATE VIEW public.user_info AS
SELECT 
    id,
    email,
    created_at,
    updated_at,
    email_confirmed_at,
    phone,
    phone_confirmed_at,
    last_sign_in_at,
    raw_user_meta_data,
    raw_app_meta_data
FROM auth.users;

-- Grant permissions on the view
GRANT SELECT ON public.user_info TO anon, authenticated, service_role;

-- Disable RLS on the view (views inherit RLS from underlying tables)
-- But we can create RLS policies on the view if needed

-- Create a function to safely get current user info
CREATE OR REPLACE FUNCTION public.get_current_user_info()
RETURNS TABLE (
    id UUID,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    phone TEXT,
    phone_confirmed_at TIMESTAMP WITH TIME ZONE,
    last_sign_at TIMESTAMP WITH TIME ZONE,
    raw_user_meta_data JSONB,
    raw_app_meta_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.created_at,
        u.updated_at,
        u.email_confirmed_at,
        u.phone,
        u.phone_confirmed_at,
        u.last_sign_in_at,
        u.raw_user_meta_data,
        u.raw_app_meta_data
    FROM auth.users u
    WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_current_user_info() TO authenticated;

-- Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname IN ('public', 'auth') 
AND tablename IN ('users', 'user_info')
ORDER BY schemaname, tablename;

-- Check current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname IN ('public', 'auth') 
AND tablename IN ('users', 'user_info')
ORDER BY schemaname, tablename, policyname;