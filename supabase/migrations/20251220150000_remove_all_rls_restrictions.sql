-- Remove ALL RLS restrictions - Make everything completely open
-- This migration removes all Row Level Security policies and restrictions

-- Function to disable RLS on all tables
create or replace function public.disable_all_rls()
returns void as $$
declare
    tbl record;
begin
    -- Loop through all tables in public schema and disable RLS
    for tbl in 
        select table_name 
        from information_schema.tables 
        where table_schema = 'public' 
        and table_type = 'BASE TABLE'
    loop
        execute format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', tbl.table_name);
        raise notice 'Disabled RLS on table: %', tbl.table_name;
    end loop;
end;
$$ language plpgsql security definer;

-- Execute the function to disable RLS on all tables
select public.disable_all_rls();

-- Drop all existing policies
do $$
declare
    pol record;
begin
    -- Loop through all policies and drop them
    for pol in 
        select schemaname, tablename, policyname
        from pg_policies
        where schemaname = 'public'
    loop
        execute format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
        raise notice 'Dropped policy: % on table: %', pol.policyname, pol.tablename;
    end loop;
end $$;

-- Grant ALL permissions to public (anon) and authenticated users
-- This ensures complete open access

-- Grant all privileges on all tables
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- Grant usage on schema
grant usage on schema public to anon, authenticated, service_role;

-- Set default privileges for future objects
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- Verification queries to confirm everything is open
select 
    table_name,
    (select count(*) from pg_policies where tablename = t.table_name and schemaname = 'public') as policy_count
from information_schema.tables t
where table_schema = 'public' 
and table_type = 'BASE TABLE'
order by table_name;