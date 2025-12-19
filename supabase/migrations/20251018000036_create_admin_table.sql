-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- Create new admin table with email/password authentication
CREATE TABLE IF NOT EXISTS public.admin (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;

-- Create policies for admin table
-- Allow admins to read their own record
CREATE POLICY admin_self_read ON public.admin
FOR SELECT USING (auth.uid() = id);

-- Allow admins to update their own record (for last_login)
CREATE POLICY admin_self_update ON public.admin
FOR UPDATE USING (auth.uid() = id);

-- Allow service role to manage admins (for backend operations)
CREATE POLICY admin_service_role_all ON public.admin
FOR ALL USING (current_setting('role', true) = 'service_role');

-- Grant permissions
GRANT SELECT ON public.admin TO authenticated;
GRANT UPDATE ON public.admin TO authenticated;
GRANT ALL ON public.admin TO service_role;

-- Create function to verify admin login
CREATE OR REPLACE FUNCTION public.verify_admin_login(
    p_email TEXT,
    p_password TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    admin_id UUID,
    admin_email TEXT,
    admin_role TEXT,
    message TEXT
) AS $$
BEGIN
    -- Check if admin exists and is active
    IF EXISTS (
        SELECT 1 FROM public.admin 
        WHERE email = p_email 
        AND is_active = true
        AND password_hash = extensions.crypt(p_password, password_hash)
    ) THEN
        RETURN QUERY
        SELECT true, id, email, role, 'Login successful'::TEXT
        FROM public.admin
        WHERE email = p_email
        AND is_active = true
        AND password_hash = extensions.crypt(p_password, password_hash);
        
        -- Update last login
        UPDATE public.admin
        SET last_login = NOW()
        WHERE email = p_email;
    ELSE
        RETURN QUERY
        SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, 'Invalid credentials or inactive account'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.verify_admin_login TO anon;
GRANT EXECUTE ON FUNCTION public.verify_admin_login TO authenticated;

-- Insert a default admin for testing
INSERT INTO public.admin (email, password_hash, role, is_active)
VALUES (
    'admin@unitycapital.com',
    extensions.crypt('Admin123!', extensions.gen_salt('bf')),
    'super_admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert another test admin
INSERT INTO public.admin (email, password_hash, role, is_active)
VALUES (
    'testadmin@unitycapital.com',
    extensions.crypt('TestAdmin123!', extensions.gen_salt('bf')),
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;