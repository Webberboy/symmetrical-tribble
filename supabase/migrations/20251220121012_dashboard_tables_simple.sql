-- Simplified SQL script for dashboard tables
-- Creates only the essential tables needed for dashboard functionality

-- Set search path
SET search_path TO public, auth;

-- 1. PROFILES TABLE (essential for dashboard)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    account_number TEXT UNIQUE NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0.00,
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended')),
    avatar_url TEXT,
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ACCOUNTS TABLE (for account balances)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_number TEXT UNIQUE NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'business')),
    account_name TEXT NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0.00,
    available_balance DECIMAL(12,2) DEFAULT 0.00,
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. NOTIFICATIONS TABLE (for notification panel)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('transaction', 'wire', 'crypto', 'loan', 'investment', 'security', 'success', 'warning', 'error', 'info')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. USER_NOTIFICATIONS TABLE (for global notifications)
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'alert', 'success')),
    display_as TEXT NOT NULL CHECK (display_as IN ('banner', 'card', 'modal')),
    dismissible BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_account_number ON public.profiles(account_number);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON public.accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_accounts_account_type ON public.accounts(account_type);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_active ON public.user_notifications(is_active);
CREATE INDEX IF NOT EXISTS idx_user_notifications_display_as ON public.user_notifications(display_as);
CREATE INDEX IF NOT EXISTS idx_user_notifications_dates ON public.user_notifications(start_date, end_date);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns (with drop if exists for compatibility)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        DROP TRIGGER update_profiles_updated_at ON public.profiles;
    END IF;
    CREATE TRIGGER update_profiles_updated_at 
        BEFORE UPDATE ON public.profiles 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN OTHERS THEN
    CREATE TRIGGER update_profiles_updated_at 
        BEFORE UPDATE ON public.profiles 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_accounts_updated_at') THEN
        DROP TRIGGER update_accounts_updated_at ON public.accounts;
    END IF;
    CREATE TRIGGER update_accounts_updated_at 
        BEFORE UPDATE ON public.accounts 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN OTHERS THEN
    CREATE TRIGGER update_accounts_updated_at 
        BEFORE UPDATE ON public.accounts 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notifications_updated_at') THEN
        DROP TRIGGER update_notifications_updated_at ON public.notifications;
    END IF;
    CREATE TRIGGER update_notifications_updated_at 
        BEFORE UPDATE ON public.notifications 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN OTHERS THEN
    CREATE TRIGGER update_notifications_updated_at 
        BEFORE UPDATE ON public.notifications 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_notifications_updated_at') THEN
        DROP TRIGGER update_user_notifications_updated_at ON public.user_notifications;
    END IF;
    CREATE TRIGGER update_user_notifications_updated_at 
        BEFORE UPDATE ON public.user_notifications 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN OTHERS THEN
    CREATE TRIGGER update_user_notifications_updated_at 
        BEFORE UPDATE ON public.user_notifications 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (with drop if exists for compatibility)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT
        USING (auth.uid() = id);
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
        USING (auth.uid() = id);
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
    CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT
        USING (auth.uid() = user_id);
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
    CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT
        USING (auth.uid() = user_id);
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
    CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE
        USING (auth.uid() = user_id);
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
    CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE
        USING (auth.uid() = user_id);
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own user notifications" ON public.user_notifications;
    CREATE POLICY "Users can view own user notifications" ON public.user_notifications FOR SELECT
        USING (auth.uid() = user_id);
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can update own user notifications" ON public.user_notifications;
    CREATE POLICY "Users can update own user notifications" ON public.user_notifications FOR UPDATE
        USING (auth.uid() = user_id);
END $$;

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.accounts TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.user_notifications TO authenticated;

-- Helper function for account number generation
CREATE OR REPLACE FUNCTION public.generate_unique_account_number()
RETURNS TEXT AS $func$
DECLARE
    new_account_number TEXT;
    attempts INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    WHILE attempts < max_attempts LOOP
        new_account_number := '40125' || LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
        
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE account_number = new_account_number) THEN
            RETURN new_account_number;
        END IF;
        
        attempts := attempts + 1;
    END LOOP;
    
    RAISE EXCEPTION 'Failed to generate unique account number after % attempts', max_attempts;
END;
$func$ LANGUAGE plpgsql;