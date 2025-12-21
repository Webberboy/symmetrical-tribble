-- Remove ALL RLS restrictions for testing
-- This migration disables Row Level Security completely on existing tables

-- Disable RLS on existing tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_signups DISABLE ROW LEVEL SECURITY;

-- Grant ALL permissions to all roles (no restrictions)
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.user_roles TO anon, authenticated, service_role;
GRANT ALL ON public.accounts TO anon, authenticated, service_role;
GRANT ALL ON public.pending_signups TO anon, authenticated, service_role;
GRANT ALL ON public.email_notifications TO anon, authenticated, service_role;
GRANT ALL ON public.email_templates TO anon, authenticated, service_role;

-- Grant ALL permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Grant ALL permissions on functions
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Ensure future tables also have no restrictions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;