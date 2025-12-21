-- Migration: Create Admin Modal Tables
-- Description: Creates all necessary tables and columns for the user management modal tabs
-- This migration includes checks to skip existing objects to avoid conflicts

-- ==============================================
-- ACCOUNTS TABLE (for account balances)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    checking_balance DECIMAL(12,2) DEFAULT 0.00,
    savings_balance DECIMAL(12,2) DEFAULT 0.00,
    checking_last_credit TIMESTAMP WITH TIME ZONE,
    checking_last_debit TIMESTAMP WITH TIME ZONE,
    savings_last_credit TIMESTAMP WITH TIME ZONE,
    savings_last_debit TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for accounts
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);

-- ==============================================
-- WIRE TRANSFERS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.wire_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_account VARCHAR(50) NOT NULL,
    recipient_routing VARCHAR(20) NOT NULL,
    recipient_bank VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id)
);

-- Add indexes for wire_transfers
CREATE INDEX IF NOT EXISTS idx_wire_transfers_user_id ON public.wire_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_wire_transfers_status ON public.wire_transfers(status);

-- ==============================================
-- CRYPTO WALLETS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.crypto_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL, -- BTC, ETH, etc.
    balance DECIMAL(18,8) DEFAULT 0.00000000,
    address VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for crypto_wallets
CREATE INDEX IF NOT EXISTS idx_crypto_wallets_user_id ON public.crypto_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_wallets_symbol ON public.crypto_wallets(symbol);

-- ==============================================
-- ADMIN CRYPTO WALLETS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.admin_crypto_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    address VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- CRYPTO PRICES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.crypto_prices (
    symbol VARCHAR(10) PRIMARY KEY,
    price DECIMAL(18,8) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- LOAN APPLICATIONS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.loan_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    loan_type VARCHAR(50) NOT NULL CHECK (loan_type IN ('personal', 'mortgage', 'auto', 'student')),
    requested_amount DECIMAL(12,2) NOT NULL,
    purpose TEXT,
    annual_income DECIMAL(12,2),
    employment_status VARCHAR(50),
    application_status VARCHAR(20) DEFAULT 'pending' CHECK (application_status IN ('pending', 'under_review', 'approved', 'rejected')),
    submitted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_date TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    admin_notes TEXT,
    credit_score INTEGER,
    monthly_expenses DECIMAL(12,2),
    -- Mortgage specific fields
    property_value DECIMAL(12,2),
    down_payment DECIMAL(12,2),
    property_type VARCHAR(50),
    property_address TEXT,
    -- Auto loan specific fields
    vehicle_year INTEGER,
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_price DECIMAL(12,2),
    trade_in_value DECIMAL(12,2),
    -- Student loan specific fields
    school_name VARCHAR(255),
    program VARCHAR(255),
    graduation_date DATE,
    tuition_cost DECIMAL(12,2)
);

-- Add indexes for loan_applications
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON public.loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON public.loan_applications(application_status);

-- ==============================================
-- TRANSACTIONS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('debit', 'credit')),
    amount DECIMAL(12,2) NOT NULL,
    merchant VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);

-- ==============================================
-- PORTFOLIOS TABLE (Investments)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    shares DECIMAL(12,4) NOT NULL,
    average_cost DECIMAL(12,4) NOT NULL,
    current_price DECIMAL(12,4) NOT NULL,
    total_value DECIMAL(12,2) NOT NULL,
    total_cost_basis DECIMAL(12,2) NOT NULL,
    total_return DECIMAL(12,2) DEFAULT 0.00,
    total_return_percent DECIMAL(8,4) DEFAULT 0.0000,
    day_change DECIMAL(12,4) DEFAULT 0.0000,
    day_change_percent DECIMAL(8,4) DEFAULT 0.0000,
    sector VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for portfolios
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_symbol ON public.portfolios(symbol);

-- ==============================================
-- STOCK TRANSACTIONS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.stock_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'dividend')),
    symbol VARCHAR(10) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    shares DECIMAL(12,4) NOT NULL,
    price_per_share DECIMAL(12,4) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled', 'failed')),
    confirmation_number VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for stock_transactions
CREATE INDEX IF NOT EXISTS idx_stock_transactions_user_id ON public.stock_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_symbol ON public.stock_transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON public.stock_transactions(transaction_date);

-- ==============================================
-- USER NOTIFICATIONS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'warning', 'alert', 'success')),
    display_as VARCHAR(20) NOT NULL CHECK (display_as IN ('banner', 'card', 'modal')),
    is_active BOOLEAN DEFAULT true,
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    dismissible BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for user_notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_active ON public.user_notifications(is_active);

-- ==============================================
-- MESSAGE REPLIES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.message_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for message_replies
CREATE INDEX IF NOT EXISTS idx_message_replies_message_id ON public.message_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_message_replies_user_id ON public.message_replies(user_id);

-- ==============================================
-- UPDATE PROFILES TABLE WITH CRYPTO SETTINGS
-- ==============================================
-- Add crypto-related columns to profiles if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'profiles' 
                  AND column_name = 'crypto_buy_enabled') THEN
        ALTER TABLE public.profiles ADD COLUMN crypto_buy_enabled BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'profiles' 
                  AND column_name = 'crypto_sell_enabled') THEN
        ALTER TABLE public.profiles ADD COLUMN crypto_sell_enabled BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'profiles' 
                  AND column_name = 'crypto_block_reason') THEN
        ALTER TABLE public.profiles ADD COLUMN crypto_block_reason TEXT;
    END IF;
END $$;

-- ==============================================
-- RLS POLICIES
-- ==============================================
-- Enable RLS on all new tables (skip if already enabled)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'accounts' AND rowsecurity = false) THEN
        ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wire_transfers' AND rowsecurity = false) THEN
        ALTER TABLE public.wire_transfers ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crypto_wallets' AND rowsecurity = false) THEN
        ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_crypto_wallets' AND rowsecurity = false) THEN
        ALTER TABLE public.admin_crypto_wallets ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crypto_prices' AND rowsecurity = false) THEN
        ALTER TABLE public.crypto_prices ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'loan_applications' AND rowsecurity = false) THEN
        ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'portfolios' AND rowsecurity = false) THEN
        ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stock_transactions' AND rowsecurity = false) THEN
        ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_notifications' AND rowsecurity = false) THEN
        ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'message_replies' AND rowsecurity = false) THEN
        ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Function to check if policy exists
CREATE OR REPLACE FUNCTION public.policy_exists(table_name text, policy_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = table_name 
        AND policyname = policy_name
    );
END;
$$ LANGUAGE plpgsql;

-- Accounts policies (create if not exists)
DO $$
BEGIN
    IF NOT public.policy_exists('accounts', 'Users can view own accounts') THEN
        CREATE POLICY "Users can view own accounts" ON public.accounts
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT public.policy_exists('accounts', 'Admins can view all accounts') THEN
        CREATE POLICY "Admins can view all accounts" ON public.accounts
            FOR SELECT USING (public.is_user_admin(auth.uid()) = true);
    END IF;
END $$;

-- Wire transfers policies
DO $$
BEGIN
    IF NOT public.policy_exists('wire_transfers', 'Users can view own wire transfers') THEN
        CREATE POLICY "Users can view own wire transfers" ON public.wire_transfers
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT public.policy_exists('wire_transfers', 'Admins can manage all wire transfers') THEN
        CREATE POLICY "Admins can manage all wire transfers" ON public.wire_transfers
            FOR ALL USING (public.is_user_admin(auth.uid()) = true);
    END IF;
END $$;

-- Crypto wallets policies
DO $$
BEGIN
    IF NOT public.policy_exists('crypto_wallets', 'Users can view own crypto wallets') THEN
        CREATE POLICY "Users can view own crypto wallets" ON public.crypto_wallets
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT public.policy_exists('crypto_wallets', 'Admins can view all crypto wallets') THEN
        CREATE POLICY "Admins can view all crypto wallets" ON public.crypto_wallets
            FOR SELECT USING (public.is_user_admin(auth.uid()) = true);
    END IF;
END $$;

-- Admin crypto wallets policies (admin only)
DO $$
BEGIN
    IF NOT public.policy_exists('admin_crypto_wallets', 'Only admins can manage admin crypto wallets') THEN
        CREATE POLICY "Only admins can manage admin crypto wallets" ON public.admin_crypto_wallets
            FOR ALL USING (public.is_user_admin(auth.uid()) = true);
    END IF;
END $$;

-- Crypto prices policies (public read)
DO $$
BEGIN
    IF NOT public.policy_exists('crypto_prices', 'Anyone can view crypto prices') THEN
        CREATE POLICY "Anyone can view crypto prices" ON public.crypto_prices
            FOR SELECT USING (true);
    END IF;
END $$;

-- Loan applications policies
DO $$
BEGIN
    IF NOT public.policy_exists('loan_applications', 'Users can view own loan applications') THEN
        CREATE POLICY "Users can view own loan applications" ON public.loan_applications
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT public.policy_exists('loan_applications', 'Admins can manage all loan applications') THEN
        CREATE POLICY "Admins can manage all loan applications" ON public.loan_applications
            FOR ALL USING (public.is_user_admin(auth.uid()) = true);
    END IF;
END $$;

-- Portfolios policies
DO $$
BEGIN
    IF NOT public.policy_exists('portfolios', 'Users can view own portfolios') THEN
        CREATE POLICY "Users can view own portfolios" ON public.portfolios
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT public.policy_exists('portfolios', 'Admins can view all portfolios') THEN
        CREATE POLICY "Admins can view all portfolios" ON public.portfolios
            FOR SELECT USING (public.is_user_admin(auth.uid()) = true);
    END IF;
END $$;

-- Stock transactions policies
DO $$
BEGIN
    IF NOT public.policy_exists('stock_transactions', 'Users can view own stock transactions') THEN
        CREATE POLICY "Users can view own stock transactions" ON public.stock_transactions
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT public.policy_exists('stock_transactions', 'Admins can view all stock transactions') THEN
        CREATE POLICY "Admins can view all stock transactions" ON public.stock_transactions
            FOR SELECT USING (public.is_user_admin(auth.uid()) = true);
    END IF;
END $$;

-- User notifications policies
DO $$
BEGIN
    IF NOT public.policy_exists('user_notifications', 'Users can view own notifications') THEN
        CREATE POLICY "Users can view own notifications" ON public.user_notifications
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT public.policy_exists('user_notifications', 'Admins can manage all notifications') THEN
        CREATE POLICY "Admins can manage all notifications" ON public.user_notifications
            FOR ALL USING (public.is_user_admin(auth.uid()) = true);
    END IF;
END $$;

-- Message replies policies
DO $$
BEGIN
    IF NOT public.policy_exists('message_replies', 'Users can view own message replies') THEN
        CREATE POLICY "Users can view own message replies" ON public.message_replies
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT public.policy_exists('message_replies', 'Admins can manage all message replies') THEN
        CREATE POLICY "Admins can manage all message replies" ON public.message_replies
            FOR ALL USING (public.is_user_admin(auth.uid()) = true);
    END IF;
END $$;

-- ==============================================
-- GRANT PERMISSIONS
-- ==============================================
GRANT SELECT ON public.accounts TO authenticated;
GRANT SELECT ON public.wire_transfers TO authenticated;
GRANT SELECT ON public.crypto_wallets TO authenticated;
GRANT SELECT ON public.admin_crypto_wallets TO authenticated;
GRANT SELECT ON public.crypto_prices TO authenticated;
GRANT SELECT ON public.loan_applications TO authenticated;
GRANT SELECT ON public.portfolios TO authenticated;
GRANT SELECT ON public.stock_transactions TO authenticated;
GRANT SELECT ON public.user_notifications TO authenticated;
GRANT SELECT ON public.message_replies TO authenticated;

-- Grant all permissions to service_role (for admin functions)
GRANT ALL ON public.accounts TO service_role;
GRANT ALL ON public.wire_transfers TO service_role;
GRANT ALL ON public.crypto_wallets TO service_role;
GRANT ALL ON public.admin_crypto_wallets TO service_role;
GRANT ALL ON public.crypto_prices TO service_role;
GRANT ALL ON public.loan_applications TO service_role;
GRANT ALL ON public.portfolios TO service_role;
GRANT ALL ON public.stock_transactions TO service_role;
GRANT ALL ON public.user_notifications TO service_role;
GRANT ALL ON public.message_replies TO service_role;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================
-- These queries can be run to verify the migration was successful

-- Check if all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'accounts', 'wire_transfers', 'crypto_wallets', 'admin_crypto_wallets', 
    'crypto_prices', 'loan_applications', 'portfolios', 'stock_transactions', 
    'user_notifications', 'message_replies'
);

-- Check if crypto columns were added to profiles
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles' 
AND column_name IN ('crypto_buy_enabled', 'crypto_sell_enabled', 'crypto_block_reason');