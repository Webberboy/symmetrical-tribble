-- Fix complete signup permissions - comprehensive solution
-- This addresses the "permission denied for schema public" error

-- Ensure RLS is enabled on all critical tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert own pending signup" ON public.pending_signups;
DROP POLICY IF EXISTS "Users can select own pending signup" ON public.pending_signups;
DROP POLICY IF EXISTS "Users can update own pending signup" ON public.pending_signups;
DROP POLICY IF EXISTS "Users can delete own pending signup" ON public.pending_signups;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own role" ON public.user_roles;

DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;

DROP POLICY IF EXISTS "Service role can manage all pending signups" ON public.pending_signups;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage all accounts" ON public.accounts;

-- Create comprehensive policies for authenticated users
CREATE POLICY "Allow authenticated users to manage own pending signups" ON public.pending_signups FOR ALL
    USING (auth.uid() = auth_user_id) WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Allow authenticated users to manage own profiles" ON public.profiles FOR ALL
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to manage own user roles" ON public.user_roles FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to manage own accounts" ON public.accounts FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create service role policies for admin operations
CREATE POLICY "Allow service role to manage all pending signups" ON public.pending_signups FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role') WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role to manage all profiles" ON public.profiles FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role') WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role to manage all user roles" ON public.user_roles FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role') WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role to manage all accounts" ON public.accounts FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role') WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Grant comprehensive permissions at schema level
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT CREATE ON SCHEMA public TO authenticated;

-- Grant permissions on all tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant read permissions to anonymous users for signup validation
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Ensure future objects also get proper permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO anon;