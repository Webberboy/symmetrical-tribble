-- Comprehensive SQL script to create all dashboard-related tables and columns
-- This script includes checks to skip tables/columns that already exist

-- Create public schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;

-- Set search path to include public schema
SET search_path TO public, auth;

-- 1. PROFILES TABLE (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'profiles') THEN
        CREATE TABLE public.profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            full_name TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            country_code TEXT DEFAULT '+1',
            date_of_birth DATE,
            ssn TEXT,
            street_address TEXT,
            city TEXT,
            state TEXT,
            zip_code TEXT,
            country TEXT DEFAULT 'United States',
            account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'business')),
            account_number TEXT UNIQUE NOT NULL,
            balance DECIMAL(12,2) DEFAULT 0.00,
            account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended')),
            id_document_uploaded BOOLEAN DEFAULT FALSE,
            id_document_data TEXT,
            id_document_filename TEXT,
            id_document_type TEXT,
            id_document_url TEXT,
            avatar_url TEXT,
            is_banned BOOLEAN DEFAULT FALSE,
            banned_at TIMESTAMP WITH TIME ZONE,
            ban_reason TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_profiles_email ON public.profiles(email);
        CREATE INDEX idx_profiles_account_number ON public.profiles(account_number);
        CREATE INDEX idx_profiles_phone ON public.profiles(phone);
        
        -- Create trigger for updated_at
        CREATE OR REPLACE FUNCTION public.update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
        
        CREATE TRIGGER update_profiles_updated_at 
            BEFORE UPDATE ON public.profiles 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
            
        RAISE NOTICE 'Created profiles table';
    ELSE
        RAISE NOTICE 'Profiles table already exists';
    END IF;
END $$;

-- 2. ACCOUNTS TABLE (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'accounts') THEN
        CREATE TABLE public.accounts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            account_number TEXT UNIQUE NOT NULL,
            account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'business')),
            account_name TEXT NOT NULL,
            balance DECIMAL(12,2) DEFAULT 0.00,
            available_balance DECIMAL(12,2) DEFAULT 0.00,
            interest_rate DECIMAL(5,4) DEFAULT 0.0000,
            account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
        CREATE INDEX idx_accounts_account_number ON public.accounts(account_number);
        CREATE INDEX idx_accounts_account_type ON public.accounts(account_type);
        
        -- Create trigger for updated_at
        CREATE TRIGGER update_accounts_updated_at 
            BEFORE UPDATE ON public.accounts 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
            
        RAISE NOTICE 'Created accounts table';
    ELSE
        RAISE NOTICE 'Accounts table already exists';
    END IF;
END $$;

-- 3. NOTIFICATIONS TABLE (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'notifications') THEN
        CREATE TABLE public.notifications (
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
        
        -- Create indexes
        CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
        CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read);
        CREATE INDEX idx_notifications_type ON public.notifications(type);
        CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
        
        -- Create trigger for updated_at
        CREATE TRIGGER update_notifications_updated_at 
            BEFORE UPDATE ON public.notifications 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
            
        RAISE NOTICE 'Created notifications table';
    ELSE
        RAISE NOTICE 'Notifications table already exists';
    END IF;
END $$;

-- 4. USER_NOTIFICATIONS TABLE (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'user_notifications') THEN
        CREATE TABLE public.user_notifications (
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
        
        -- Create indexes
        CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
        CREATE INDEX idx_user_notifications_active ON public.user_notifications(is_active);
        CREATE INDEX idx_user_notifications_display_as ON public.user_notifications(display_as);
        CREATE INDEX idx_user_notifications_dates ON public.user_notifications(start_date, end_date);
        
        -- Create trigger for updated_at
        CREATE TRIGGER update_user_notifications_updated_at 
            BEFORE UPDATE ON public.user_notifications 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
            
        RAISE NOTICE 'Created user_notifications table';
    ELSE
        RAISE NOTICE 'User_notifications table already exists';
    END IF;
END $$;

-- 5. EMAIL_NOTIFICATIONS TABLE (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'email_notifications') THEN
        CREATE TABLE public.email_notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            email_type TEXT NOT NULL CHECK (email_type IN ('welcome', 'otp', 'verification', 'login_notification')),
            recipient_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
            error_message TEXT,
            sent_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_email_notifications_user_id ON public.email_notifications(user_id);
        CREATE INDEX idx_email_notifications_type ON public.email_notifications(email_type);
        CREATE INDEX idx_email_notifications_status ON public.email_notifications(status);
        
        RAISE NOTICE 'Created email_notifications table';
    ELSE
        RAISE NOTICE 'Email_notifications table already exists';
    END IF;
END $$;

-- 6. EMAIL_TEMPLATES TABLE (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'email_templates') THEN
        CREATE TABLE public.email_templates (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            template_type TEXT UNIQUE NOT NULL CHECK (template_type IN ('welcome', 'otp', 'verification', 'login_notification')),
            subject TEXT NOT NULL,
            html_content TEXT NOT NULL,
            text_content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create trigger for updated_at
        CREATE TRIGGER update_email_templates_updated_at 
            BEFORE UPDATE ON public.email_templates 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
            
        RAISE NOTICE 'Created email_templates table';
    ELSE
        RAISE NOTICE 'Email_templates table already exists';
    END IF;
END $$;

-- 7. USER_ROLES TABLE (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'user_roles') THEN
        CREATE TABLE public.user_roles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
        
        -- Create index
        CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
        
        RAISE NOTICE 'Created user_roles table';
    ELSE
        RAISE NOTICE 'User_roles table already exists';
    END IF;
END $$;

-- 8. PENDING_SIGNUPS TABLE (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'pending_signups') THEN
        CREATE TABLE public.pending_signups (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            signup_data JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
            UNIQUE(auth_user_id)
        );
        
        -- Create indexes
        CREATE INDEX idx_pending_signups_auth_user_id ON public.pending_signups(auth_user_id);
        CREATE INDEX idx_pending_signups_email ON public.pending_signups(email);
        CREATE INDEX idx_pending_signups_expires_at ON public.pending_signups(expires_at);
        
        RAISE NOTICE 'Created pending_signups table';
    ELSE
        RAISE NOTICE 'Pending_signups table already exists';
    END IF;
END $$;

-- 9. ADD MISSING COLUMNS TO EXISTING TABLES

-- Add missing columns to profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'profiles' 
                  AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to profiles';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'profiles' 
                  AND column_name = 'is_banned') THEN
        ALTER TABLE public.profiles ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
        ALTER TABLE public.profiles ADD COLUMN banned_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE public.profiles ADD COLUMN ban_reason TEXT;
        RAISE NOTICE 'Added ban columns to profiles';
    END IF;
END $$;

-- 10. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;

-- 11. CREATE RLS POLICIES

-- Profiles policies
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Service role can manage all profiles" ON public.profiles FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Accounts policies
CREATE POLICY IF NOT EXISTS "Users can view own accounts" ON public.accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Service role can manage accounts" ON public.accounts FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Notifications policies
CREATE POLICY IF NOT EXISTS "Users can view own notifications" ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own notifications" ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own notifications" ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- User notifications policies
CREATE POLICY IF NOT EXISTS "Users can view own user notifications" ON public.user_notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own user notifications" ON public.user_notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- User roles policies
CREATE POLICY IF NOT EXISTS "Users can view own role" ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Service role can manage roles" ON public.user_roles FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Pending signups policies
CREATE POLICY IF NOT EXISTS "Users can manage own pending signup" ON public.pending_signups FOR ALL
    USING (auth.uid() = auth_user_id);

CREATE POLICY IF NOT EXISTS "Service role can manage pending signups" ON public.pending_signups FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- 12. GRANT PERMISSIONS
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.accounts TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.user_notifications TO authenticated;
GRANT ALL ON public.email_notifications TO authenticated;
GRANT ALL ON public.email_templates TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.pending_signups TO authenticated;

-- 13. HELPER FUNCTIONS

-- Function to generate unique account numbers
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

-- Function to clean up expired pending signups
CREATE OR REPLACE FUNCTION public.cleanup_expired_pending_signups()
RETURNS VOID AS $func$
BEGIN
    DELETE FROM pending_signups WHERE expires_at < NOW();
END;
$func$ LANGUAGE plpgsql;

-- Function to get user email by account number
CREATE OR REPLACE FUNCTION public.get_email_by_account(account_number_param TEXT)
RETURNS TEXT AS $func$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email 
    FROM public.profiles 
    WHERE account_number = account_number_param;
    
    RETURN user_email;
END;
$func$ LANGUAGE plpgsql;

RAISE NOTICE 'Dashboard tables setup completed successfully!';