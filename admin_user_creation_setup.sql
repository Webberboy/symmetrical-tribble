-- Admin User Creation Setup Script
-- This script enables admin users to create new user accounts through the admin panel
-- Apply this script to your Supabase project via the SQL Editor in the Supabase Dashboard

-- Grant service role permission to use auth.admin.createUser
GRANT CREATE ON auth.users TO service_role;
GRANT USAGE ON SCHEMA auth TO service_role;

-- Grant all permissions on auth schema for user management
GRANT ALL PRIVILEGES ON SCHEMA auth TO service_role;

-- Grant permissions to manage user authentication
GRANT ALL ON auth.users TO service_role;
GRANT ALL ON auth.identities TO service_role;
GRANT ALL ON auth.sessions TO service_role;
GRANT ALL ON auth.refresh_tokens TO service_role;
GRANT ALL ON auth.mfa_factors TO service_role;
GRANT ALL ON auth.mfa_challenges TO service_role;
GRANT ALL ON auth.mfa_amr_claims TO service_role;
GRANT ALL ON auth.audit_log_entries TO service_role;

-- Grant service role permission to create profiles and accounts
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.accounts TO service_role;

-- Create a function that allows admin users to create new accounts
-- This function will be called by the admin panel
CREATE OR REPLACE FUNCTION create_user_account(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_ssn TEXT DEFAULT NULL,
  p_street_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_zip_code TEXT DEFAULT NULL,
  p_country TEXT DEFAULT 'United States',
  p_account_type TEXT DEFAULT 'checking',
  p_initial_deposit DECIMAL DEFAULT 0.00
)
RETURNS TABLE (
  user_id UUID,
  account_number TEXT,
  email TEXT,
  full_name TEXT,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_account_number TEXT;
  v_savings_account_number TEXT;
  v_profile_id UUID;
  v_role_id UUID;
  v_checking_account_id UUID;
  v_savings_account_id UUID;
BEGIN
  -- Set role to service_role for elevated permissions
  SET LOCAL ROLE service_role;
  
  -- Create the auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', p_full_name, 'first_name', split_part(p_full_name, ' ', 1), 'last_name', split_part(p_full_name, ' ', 2)),
    false,
    NOW(),
    NOW(),
    p_phone,
    CASE WHEN p_phone IS NOT NULL THEN NOW() ELSE NULL END,
    '',
    '',
    NULL,
    '',
    0
  ) RETURNING id INTO v_user_id;

  -- Generate account number
  v_account_number := '40125' || LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
  
  -- Ensure account number is unique
  WHILE EXISTS (SELECT 1 FROM profiles WHERE account_number = v_account_number) LOOP
    v_account_number := '40125' || LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
  END LOOP;

  -- Create profile
  INSERT INTO profiles (
    id,
    full_name,
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    ssn,
    street_address,
    city,
    state,
    zip_code,
    country,
    account_type,
    account_number,
    balance,
    account_status,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_full_name,
    split_part(p_full_name, ' ', 1),
    split_part(p_full_name, ' ', 2),
    p_email,
    p_phone,
    p_date_of_birth,
    p_ssn,
    p_street_address,
    p_city,
    p_state,
    p_zip_code,
    p_country,
    p_account_type,
    v_account_number,
    p_initial_deposit,
    'active',
    NOW(),
    NOW()
  ) RETURNING id INTO v_profile_id;

  -- Create user role
  INSERT INTO user_roles (user_id, role) VALUES (v_user_id, 'user') RETURNING id INTO v_role_id;

  -- Create checking account
  INSERT INTO accounts (
    user_id,
    account_number,
    account_type,
    account_name,
    balance,
    available_balance,
    account_status
  ) VALUES (
    v_user_id,
    v_account_number,
    'checking',
    'My Checking Account',
    p_initial_deposit,
    p_initial_deposit,
    'active'
  ) RETURNING id INTO v_checking_account_id;

  -- Generate savings account number
  v_savings_account_number := '40125' || LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
  
  -- Ensure savings account number is unique
  WHILE EXISTS (SELECT 1 FROM accounts WHERE account_number = v_savings_account_number) LOOP
    v_savings_account_number := '40125' || LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
  END LOOP;

  -- Create savings account
  INSERT INTO accounts (
    user_id,
    account_number,
    account_type,
    account_name,
    balance,
    available_balance,
    account_status,
    interest_rate
  ) VALUES (
    v_user_id,
    v_savings_account_number,
    'savings',
    'My Savings Account',
    0.00,
    0.00,
    'active',
    0.01
  ) RETURNING id INTO v_savings_account_id;

  -- Return success result
  RETURN QUERY SELECT v_user_id, v_account_number, p_email, p_full_name, true, 'User account created successfully';

EXCEPTION
  WHEN OTHERS THEN
    -- Return error result
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, p_email, p_full_name, false, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION create_user_account TO service_role;

-- Grant execute permission to authenticated users (admin users)
GRANT EXECUTE ON FUNCTION create_user_account TO authenticated;

-- Create a simpler function for admin user creation via Edge Functions
-- This function will be used by the admin panel
CREATE OR REPLACE FUNCTION admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_initial_deposit DECIMAL DEFAULT 0.00
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Call the main function with basic parameters
  SELECT json_build_object(
    'user_id', user_id,
    'account_number', account_number,
    'email', email,
    'full_name', full_name,
    'success', success,
    'message', message
  ) INTO result
  FROM create_user_account(
    p_email,
    p_password,
    p_full_name,
    p_phone,
    NULL, -- date_of_birth
    NULL, -- ssn
    NULL, -- street_address
    NULL, -- city
    NULL, -- state
    NULL, -- zip_code
    'United States', -- country
    'checking', -- account_type
    p_initial_deposit
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role for the admin function
GRANT EXECUTE ON FUNCTION admin_create_user TO service_role;

-- Grant execute permission to authenticated users for the admin function
GRANT EXECUTE ON FUNCTION admin_create_user TO authenticated;