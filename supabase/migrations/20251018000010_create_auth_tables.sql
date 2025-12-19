-- =====================================================
-- HERITAGE BANKING APPLICATION - AUTHENTICATION TABLES
-- =====================================================
-- This migration creates all necessary tables for signup and login functionality

-- =====================================================
-- PROFILES TABLE - Main user profile
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    date_of_birth DATE,
    ssn TEXT,
    street_address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'United States',
    account_type TEXT NOT NULL,
    account_number TEXT UNIQUE NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    account_status TEXT DEFAULT 'active',
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    id_document_uploaded BOOLEAN DEFAULT false,
    id_document_data TEXT,
    id_document_filename TEXT,
    id_document_type TEXT,
    id_document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_account_number ON public.profiles(account_number);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- =====================================================
-- ACCOUNTS TABLE - Bank accounts (checking/savings)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    account_number TEXT UNIQUE NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings')),
    account_name TEXT NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    available_balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    account_status TEXT DEFAULT 'active' NOT NULL,
    interest_rate DECIMAL(5,4) DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for accounts table
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_type ON public.accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON public.accounts(account_number);

-- =====================================================
-- USER_ROLES TABLE - User role assignment
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for user_roles table
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- =====================================================
-- PENDING_SIGNUPS TABLE - Temporary signup data storage
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pending_signups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    signup_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for pending_signups table
CREATE INDEX IF NOT EXISTS idx_pending_signups_auth_user_id ON public.pending_signups(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_pending_signups_email ON public.pending_signups(email);

-- =====================================================
-- ADMIN_USERS TABLE - Admin user management
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'admin' NOT NULL,
    permissions JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for admin_users table
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);

-- =====================================================
-- TRIGGER FUNCTIONS - Auto-update timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS - Auto-update timestamps
-- =====================================================
DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

DROP TRIGGER IF EXISTS trigger_update_accounts_updated_at ON public.accounts;
CREATE TRIGGER trigger_update_accounts_updated_at
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_accounts_updated_at();

DROP TRIGGER IF EXISTS trigger_update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trigger_update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_users_updated_at();

-- =====================================================
-- RPC FUNCTION - Get email by account number
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_email_by_account(account_num TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT email FROM public.profiles WHERE account_number = account_num LIMIT 1;
$$;

-- =====================================================
-- RPC FUNCTION - Check if user is admin
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = user_id_param AND is_active = true
    );
$$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Accounts policies
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
CREATE POLICY "Users can view own accounts" ON public.accounts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
CREATE POLICY "Users can update own accounts" ON public.accounts
    FOR UPDATE USING (auth.uid() = user_id);

-- User roles policies
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Pending signups policies
DROP POLICY IF EXISTS "Users can manage own pending signup" ON public.pending_signups;
CREATE POLICY "Users can manage own pending signup" ON public.pending_signups
    FOR ALL USING (auth.uid() = auth_user_id);

-- Admin users policies
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
CREATE POLICY "Admins can view admin users" ON public.admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- =====================================================
-- PROFILE CREATION TRIGGER - Auto-create profile on auth signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create empty profile when new user signs up
    INSERT INTO public.profiles (id, email, full_name, first_name, last_name, phone, account_number)
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'account_number', 'TEMP_' || gen_random_uuid()::text)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.accounts TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.pending_signups TO authenticated;
GRANT ALL ON public.admin_users TO authenticated;

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.accounts TO anon;
GRANT SELECT ON public.user_roles TO anon;
GRANT SELECT ON public.pending_signups TO anon;
GRANT SELECT ON public.admin_users TO anon;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- WELCOME EMAIL TRIGGER - Send email when profile is created
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger for new profiles with complete data
    IF NEW.full_name IS NOT NULL AND NEW.email IS NOT NULL AND NEW.account_number IS NOT NULL THEN
        -- This will trigger the edge function
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_welcome_email ON public.profiles;
CREATE TRIGGER trigger_welcome_email
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    WHEN (NEW.full_name IS NOT NULL AND NEW.email IS NOT NULL AND NEW.account_number IS NOT NULL)
    EXECUTE FUNCTION public.handle_welcome_email();