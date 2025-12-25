-- Fix RLS permissions for loan applications and related tables
-- This script ensures proper access to loan application tables

-- Disable RLS on loan_applications table to allow open access
ALTER TABLE public.loan_applications DISABLE ROW LEVEL SECURITY;

-- Grant all permissions on loan_applications table
GRANT ALL ON public.loan_applications TO anon, authenticated, service_role;

-- Also disable RLS on related loan tables
ALTER TABLE public.loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_types DISABLE ROW LEVEL SECURITY;

-- Grant permissions on all loan-related tables
GRANT ALL ON public.loans TO anon, authenticated, service_role;
GRANT ALL ON public.loan_payments TO anon, authenticated, service_role;
GRANT ALL ON public.loan_types TO anon, authenticated, service_role;

-- If there are any RLS policies that might be causing issues, drop them
-- Drop all existing RLS policies on loan_applications
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'loan_applications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.loan_applications', policy_record.policyname);
        RAISE NOTICE 'Dropped policy % on loan_applications', policy_record.policyname;
    END LOOP;
END $$;

-- Drop all existing RLS policies on loans table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'loans'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.loans', policy_record.policyname);
        RAISE NOTICE 'Dropped policy % on loans', policy_record.policyname;
    END LOOP;
END $$;

-- Drop all existing RLS policies on loan_payments table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'loan_payments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.loan_payments', policy_record.policyname);
        RAISE NOTICE 'Dropped policy % on loan_payments', policy_record.policyname;
    END LOOP;
END $$;

-- Drop all existing RLS policies on loan_types table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'loan_types'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.loan_types', policy_record.policyname);
        RAISE NOTICE 'Dropped policy % on loan_types', policy_record.policyname;
    END LOOP;
END $$;

-- Grant permissions on sequences for auto-incrementing IDs
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('loan_applications', 'loans', 'loan_payments', 'loan_types')
ORDER BY tablename;

-- Verify permissions
SELECT 
    table_schema,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('loan_applications', 'loans', 'loan_payments', 'loan_types')
AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;