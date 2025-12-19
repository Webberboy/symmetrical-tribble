-- Fix schema-level permissions for signup process
-- This addresses the "permission denied for schema public" error

-- Grant usage on the public schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant usage on the public schema to anonymous users (for signup validation)
GRANT USAGE ON SCHEMA public TO anon;

-- Grant create permissions on the public schema to authenticated users
-- This allows them to create tables if needed (though they shouldn't normally)
GRANT CREATE ON SCHEMA public TO authenticated;

-- Ensure the authenticated role has proper default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;

-- Grant specific permissions on all existing tables in public schema
-- This ensures no schema-level permission issues
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences for auto-incrementing IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Ensure RLS is properly enabled on all tables that need it
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;

-- Double-check that our policies are in place
-- These should already exist from previous migrations, but let's ensure they're there
DO $$
BEGIN
    -- Check if the policy exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT
            WITH CHECK (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'pending_signups' AND policyname = 'Users can insert own pending signup'
    ) THEN
        CREATE POLICY "Users can insert own pending signup" ON public.pending_signups FOR INSERT
            WITH CHECK (auth.uid() = auth_user_id);
    END IF;
END
$$;