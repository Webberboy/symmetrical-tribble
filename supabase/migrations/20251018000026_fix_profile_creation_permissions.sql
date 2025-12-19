-- Fix profile creation permissions for signup process
-- This migration allows authenticated users to create their own profiles

-- Allow authenticated users to create their own profile (INSERT)
CREATE POLICY "Users can create own profile" ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow authenticated users to create their own user role (INSERT)
CREATE POLICY "Users can create own role" ON public.user_roles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to create their own accounts (INSERT)
CREATE POLICY "Users can create own accounts" ON public.accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Grant INSERT permissions explicitly
GRANT INSERT ON public.profiles TO authenticated;
GRANT INSERT ON public.user_roles TO authenticated;
GRANT INSERT ON public.accounts TO authenticated;