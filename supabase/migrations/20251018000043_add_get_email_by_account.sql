-- Add the missing get_email_by_account function to fix login 404 error
-- This function retrieves a user's email based on their account number

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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_email_by_account(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_by_account(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_by_account(TEXT) TO service_role;