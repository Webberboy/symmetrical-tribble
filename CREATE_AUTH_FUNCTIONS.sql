-- Authentication Functions for Heritage Banking
-- This file contains the missing RPC functions needed for authentication

-- Function to get email by account number
CREATE OR REPLACE FUNCTION public.get_email_by_account(account_num TEXT)
RETURNS TEXT AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Get email from profiles table based on account number
    SELECT email INTO user_email
    FROM public.profiles 
    WHERE account_number = account_num
    LIMIT 1;
    
    RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN := FALSE;
BEGIN
    -- Check if user has admin role
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = user_id_param 
        AND role = 'admin'
    ) INTO is_admin;
    
    RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_email_by_account(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_by_account(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO anon;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION public.get_email_by_account(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO service_role;