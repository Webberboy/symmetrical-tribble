-- Migration: Create all necessary tables with open access (no RLS)
-- This migration creates all tables needed for cards, support, profile, and notifications features
-- with functions to skip existing tables and no RLS policies

-- Function to check if table exists
CREATE OR REPLACE FUNCTION table_exists(p_table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if column exists in table
CREATE OR REPLACE FUNCTION column_exists(p_table_name TEXT, p_column_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name 
        AND column_name = p_column_name
    );
END;
$$ LANGUAGE plpgsql;

-- Core User Tables

-- profiles table (extended with notification preferences)
DO $$
BEGIN
    IF NOT table_exists('profiles') THEN
        CREATE TABLE public.profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT,
            full_name TEXT,
            avatar_url TEXT,
            phone TEXT,
            date_of_birth DATE,
            address JSONB,
            notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}'::jsonb,
            kyc_status TEXT DEFAULT 'pending',
            kyc_verified BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    ELSE
        -- Add missing columns to existing profiles table
        IF NOT column_exists('profiles', 'notification_preferences') THEN
            ALTER TABLE public.profiles ADD COLUMN notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}'::jsonb;
        END IF;
        IF NOT column_exists('profiles', 'kyc_status') THEN
            ALTER TABLE public.profiles ADD COLUMN kyc_status TEXT DEFAULT 'pending';
        END IF;
        IF NOT column_exists('profiles', 'kyc_verified') THEN
            ALTER TABLE public.profiles ADD COLUMN kyc_verified BOOLEAN DEFAULT false;
        END IF;
    END IF;
END $$;

-- accounts table
DO $$
BEGIN
    IF NOT table_exists('accounts') THEN
        CREATE TABLE public.accounts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            account_number TEXT UNIQUE NOT NULL,
            account_type TEXT DEFAULT 'checking',
            balance DECIMAL(15,2) DEFAULT 0.00,
            available_balance DECIMAL(15,2) DEFAULT 0.00,
            status TEXT DEFAULT 'active',
            is_primary BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;
END $$;

-- user_roles table
DO $$
BEGIN
    IF NOT table_exists('user_roles') THEN
        CREATE TABLE public.user_roles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            role TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            UNIQUE(user_id, role)
        );
    END IF;
END $$;

-- Cards Feature Tables

-- cards table
DO $$
BEGIN
    IF NOT table_exists('cards') THEN
        CREATE TABLE public.cards (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
            card_number TEXT UNIQUE NOT NULL,
            cardholder_name TEXT NOT NULL,
            expiry_date DATE NOT NULL,
            cvv TEXT NOT NULL,
            card_type TEXT DEFAULT 'debit',
            brand TEXT DEFAULT 'visa',
            status TEXT DEFAULT 'active',
            credit_limit DECIMAL(10,2) DEFAULT 0.00,
            available_credit DECIMAL(10,2) DEFAULT 0.00,
            pin TEXT,
            is_virtual BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    ELSE
        -- Add missing columns to existing cards table
        IF NOT column_exists('cards', 'account_id') THEN
            -- Add column as nullable first, then update existing records, then make it NOT NULL
            ALTER TABLE public.cards ADD COLUMN account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
            -- Update existing records with a default account (this is a simplified approach)
            UPDATE public.cards 
            SET account_id = (SELECT id FROM public.accounts WHERE user_id = cards.user_id LIMIT 1)
            WHERE account_id IS NULL;
            -- Now make it NOT NULL if all records have been updated
            ALTER TABLE public.cards ALTER COLUMN account_id SET NOT NULL;
        END IF;
        IF NOT column_exists('cards', 'credit_limit') THEN
            ALTER TABLE public.cards ADD COLUMN credit_limit DECIMAL(10,2) DEFAULT 0.00;
        END IF;
        IF NOT column_exists('cards', 'available_credit') THEN
            ALTER TABLE public.cards ADD COLUMN available_credit DECIMAL(10,2) DEFAULT 0.00;
        END IF;
        IF NOT column_exists('cards', 'pin') THEN
            ALTER TABLE public.cards ADD COLUMN pin TEXT;
        END IF;
        IF NOT column_exists('cards', 'is_virtual') THEN
            ALTER TABLE public.cards ADD COLUMN is_virtual BOOLEAN DEFAULT false;
        END IF;
    END IF;
END $$;

-- card_transactions table
DO $$
BEGIN
    IF NOT table_exists('card_transactions') THEN
        CREATE TABLE public.card_transactions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
            merchant_name TEXT NOT NULL,
            merchant_category TEXT,
            amount DECIMAL(10,2) NOT NULL,
            currency TEXT DEFAULT 'USD',
            transaction_type TEXT DEFAULT 'purchase',
            status TEXT DEFAULT 'completed',
            authorization_code TEXT,
            reference_number TEXT UNIQUE NOT NULL,
            transaction_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            settlement_date DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    ELSE
        -- Add missing columns to existing card_transactions table
        IF NOT column_exists('card_transactions', 'merchant_category') THEN
            ALTER TABLE public.card_transactions ADD COLUMN merchant_category TEXT;
        END IF;
        IF NOT column_exists('card_transactions', 'currency') THEN
            ALTER TABLE public.card_transactions ADD COLUMN currency TEXT DEFAULT 'USD';
        END IF;
        IF NOT column_exists('card_transactions', 'authorization_code') THEN
            ALTER TABLE public.card_transactions ADD COLUMN authorization_code TEXT;
        END IF;
        IF NOT column_exists('card_transactions', 'settlement_date') THEN
            ALTER TABLE public.card_transactions ADD COLUMN settlement_date DATE;
        END IF;
    END IF;
END $$;

-- card_freeze_history table
DO $$
BEGIN
    IF NOT table_exists('card_freeze_history') THEN
        CREATE TABLE public.card_freeze_history (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
            action TEXT NOT NULL, -- 'freeze' or 'unfreeze'
            reason TEXT,
            performed_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    ELSE
        -- Add missing columns to existing card_freeze_history table
        IF NOT column_exists('card_freeze_history', 'performed_by') THEN
            ALTER TABLE public.card_freeze_history ADD COLUMN performed_by UUID REFERENCES auth.users(id);
        END IF;
    END IF;
END $$;

-- card_statements table (missing table)
DO $$
BEGIN
    IF NOT table_exists('card_statements') THEN
        CREATE TABLE public.card_statements (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
            statement_period_start DATE NOT NULL,
            statement_period_end DATE NOT NULL,
            opening_balance DECIMAL(10,2) NOT NULL,
            closing_balance DECIMAL(10,2) NOT NULL,
            total_debits DECIMAL(10,2) DEFAULT 0.00,
            total_credits DECIMAL(10,2) DEFAULT 0.00,
            statement_url TEXT,
            is_generated BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;
END $$;

-- card_limits table (missing table)
DO $$
BEGIN
    IF NOT table_exists('card_limits') THEN
        CREATE TABLE public.card_limits (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
            daily_purchase_limit DECIMAL(10,2) DEFAULT 2500.00,
            daily_withdrawal_limit DECIMAL(10,2) DEFAULT 500.00,
            monthly_purchase_limit DECIMAL(10,2) DEFAULT 10000.00,
            single_transaction_limit DECIMAL(10,2) DEFAULT 2500.00,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;
END $$;

-- Support Feature Tables

-- messages table
DO $$
BEGIN
    IF NOT table_exists('messages') THEN
        CREATE TABLE public.messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            subject TEXT NOT NULL,
            content TEXT NOT NULL,
            message_type TEXT DEFAULT 'support',
            priority TEXT DEFAULT 'medium',
            status TEXT DEFAULT 'open',
            assigned_to UUID REFERENCES auth.users(id),
            category TEXT,
            tags TEXT[],
            is_read BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    ELSE
        -- Add missing columns to existing messages table
        IF NOT column_exists('messages', 'message_type') THEN
            ALTER TABLE public.messages ADD COLUMN message_type TEXT DEFAULT 'support';
        END IF;
        IF NOT column_exists('messages', 'priority') THEN
            ALTER TABLE public.messages ADD COLUMN priority TEXT DEFAULT 'medium';
        END IF;
        IF NOT column_exists('messages', 'assigned_to') THEN
            ALTER TABLE public.messages ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
        END IF;
        IF NOT column_exists('messages', 'category') THEN
            ALTER TABLE public.messages ADD COLUMN category TEXT;
        END IF;
        IF NOT column_exists('messages', 'tags') THEN
            ALTER TABLE public.messages ADD COLUMN tags TEXT[];
        END IF;
        IF NOT column_exists('messages', 'is_read') THEN
            ALTER TABLE public.messages ADD COLUMN is_read BOOLEAN DEFAULT false;
        END IF;
    END IF;
END $$;

-- message_replies table
DO $$
BEGIN
    IF NOT table_exists('message_replies') THEN
        CREATE TABLE public.message_replies (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            content TEXT NOT NULL,
            is_internal BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    ELSE
        -- Add missing columns to existing message_replies table
        IF NOT column_exists('message_replies', 'is_internal') THEN
            ALTER TABLE public.message_replies ADD COLUMN is_internal BOOLEAN DEFAULT false;
        END IF;
    END IF;
END $$;

-- Notification Tables

-- notifications table (for system notifications)
DO $$
BEGIN
    IF NOT table_exists('notifications') THEN
        CREATE TABLE public.notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            priority TEXT DEFAULT 'medium',
            target_audience TEXT DEFAULT 'all',
            is_active BOOLEAN DEFAULT true,
            expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    ELSE
        -- Add missing columns to existing notifications table
        IF NOT column_exists('notifications', 'type') THEN
            ALTER TABLE public.notifications ADD COLUMN type TEXT DEFAULT 'info';
        END IF;
        IF NOT column_exists('notifications', 'priority') THEN
            ALTER TABLE public.notifications ADD COLUMN priority TEXT DEFAULT 'medium';
        END IF;
        IF NOT column_exists('notifications', 'target_audience') THEN
            ALTER TABLE public.notifications ADD COLUMN target_audience TEXT DEFAULT 'all';
        END IF;
        IF NOT column_exists('notifications', 'is_active') THEN
            ALTER TABLE public.notifications ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
        IF NOT column_exists('notifications', 'expires_at') THEN
            ALTER TABLE public.notifications ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
        END IF;
    END IF;
END $$;

-- user_notifications table (for user-specific notifications)
DO $$
BEGIN
    IF NOT table_exists('user_notifications') THEN
        CREATE TABLE public.user_notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            priority TEXT DEFAULT 'medium',
            is_read BOOLEAN DEFAULT false,
            read_at TIMESTAMP WITH TIME ZONE,
            action_url TEXT,
            action_text TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    ELSE
        -- Add missing columns to existing user_notifications table
        IF NOT column_exists('user_notifications', 'type') THEN
            ALTER TABLE public.user_notifications ADD COLUMN type TEXT DEFAULT 'info';
        END IF;
        IF NOT column_exists('user_notifications', 'priority') THEN
            ALTER TABLE public.user_notifications ADD COLUMN priority TEXT DEFAULT 'medium';
        END IF;
        IF NOT column_exists('user_notifications', 'is_read') THEN
            ALTER TABLE public.user_notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
        END IF;
        IF NOT column_exists('user_notifications', 'read_at') THEN
            ALTER TABLE public.user_notifications ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
        END IF;
        IF NOT column_exists('user_notifications', 'action_url') THEN
            ALTER TABLE public.user_notifications ADD COLUMN action_url TEXT;
        END IF;
        IF NOT column_exists('user_notifications', 'action_text') THEN
            ALTER TABLE public.user_notifications ADD COLUMN action_text TEXT;
        END IF;
    END IF;
END $$;

-- email_notifications table
DO $$
BEGIN
    IF NOT table_exists('email_notifications') THEN
        CREATE TABLE public.email_notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            email_type TEXT NOT NULL,
            subject TEXT NOT NULL,
            content TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            sent_at TIMESTAMP WITH TIME ZONE,
            error_message TEXT,
            retry_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    ELSE
        -- Add missing columns to existing email_notifications table
        IF NOT column_exists('email_notifications', 'status') THEN
            ALTER TABLE public.email_notifications ADD COLUMN status TEXT DEFAULT 'pending';
        END IF;
        IF NOT column_exists('email_notifications', 'sent_at') THEN
            ALTER TABLE public.email_notifications ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE;
        END IF;
        IF NOT column_exists('email_notifications', 'error_message') THEN
            ALTER TABLE public.email_notifications ADD COLUMN error_message TEXT;
        END IF;
        IF NOT column_exists('email_notifications', 'retry_count') THEN
            ALTER TABLE public.email_notifications ADD COLUMN retry_count INTEGER DEFAULT 0;
        END IF;
    END IF;
END $$;

-- email_templates table
DO $$
BEGIN
    IF NOT table_exists('email_templates') THEN
        CREATE TABLE public.email_templates (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            template_name TEXT UNIQUE NOT NULL,
            subject TEXT NOT NULL,
            html_content TEXT NOT NULL,
            text_content TEXT,
            variables TEXT[],
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    ELSE
        -- Add missing columns to existing email_templates table
        IF NOT column_exists('email_templates', 'variables') THEN
            ALTER TABLE public.email_templates ADD COLUMN variables TEXT[];
        END IF;
        IF NOT column_exists('email_templates', 'is_active') THEN
            ALTER TABLE public.email_templates ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
    END IF;
END $$;

-- Transaction & Financial Tables

-- transactions table
DO $$
BEGIN
    IF NOT table_exists('transactions') THEN
        CREATE TABLE public.transactions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            reference_number TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'completed',
            metadata JSONB,
            related_transaction_id UUID REFERENCES public.transactions(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    ELSE
        -- Add missing columns to existing transactions table
        IF NOT column_exists('transactions', 'account_id') THEN
            -- Add column as nullable first, then update existing records, then make it NOT NULL
            ALTER TABLE public.transactions ADD COLUMN account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
            -- Update existing records with a default account (this is a simplified approach)
            -- In a real scenario, you might want to map these to actual accounts
            UPDATE public.transactions 
            SET account_id = (SELECT id FROM public.accounts WHERE user_id = transactions.user_id LIMIT 1)
            WHERE account_id IS NULL;
            -- Now make it NOT NULL if all records have been updated
            ALTER TABLE public.transactions ALTER COLUMN account_id SET NOT NULL;
        END IF;
        IF NOT column_exists('transactions', 'metadata') THEN
            ALTER TABLE public.transactions ADD COLUMN metadata JSONB;
        END IF;
        IF NOT column_exists('transactions', 'related_transaction_id') THEN
            ALTER TABLE public.transactions ADD COLUMN related_transaction_id UUID REFERENCES public.transactions(id);
        END IF;
    END IF;
END $$;

-- wire_transfers table
DO $$
BEGIN
    IF NOT table_exists('wire_transfers') THEN
        CREATE TABLE public.wire_transfers (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            currency TEXT DEFAULT 'USD',
            recipient_name TEXT NOT NULL,
            recipient_account TEXT NOT NULL,
            recipient_routing TEXT NOT NULL,
            recipient_bank_name TEXT NOT NULL,
            recipient_bank_address TEXT,
            reference TEXT,
            status TEXT DEFAULT 'pending',
            fees DECIMAL(10,2) DEFAULT 0.00,
            processed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    ELSE
        -- Add missing columns to existing wire_transfers table
        IF NOT column_exists('wire_transfers', 'currency') THEN
            ALTER TABLE public.wire_transfers ADD COLUMN currency TEXT DEFAULT 'USD';
        END IF;
        IF NOT column_exists('wire_transfers', 'recipient_bank_address') THEN
            ALTER TABLE public.wire_transfers ADD COLUMN recipient_bank_address TEXT;
        END IF;
        IF NOT column_exists('wire_transfers', 'reference') THEN
            ALTER TABLE public.wire_transfers ADD COLUMN reference TEXT;
        END IF;
        IF NOT column_exists('wire_transfers', 'fees') THEN
            ALTER TABLE public.wire_transfers ADD COLUMN fees DECIMAL(10,2) DEFAULT 0.00;
        END IF;
        IF NOT column_exists('wire_transfers', 'processed_at') THEN
            ALTER TABLE public.wire_transfers ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
        END IF;
    END IF;
END $$;

-- Bills & Loans Tables (missing tables)

-- bills table
DO $$
BEGIN
    IF NOT table_exists('bills') THEN
        CREATE TABLE public.bills (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
            biller_name TEXT NOT NULL,
            biller_account_number TEXT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            due_date DATE NOT NULL,
            frequency TEXT DEFAULT 'monthly',
            category TEXT,
            is_autopay_enabled BOOLEAN DEFAULT false,
            autopay_account_id UUID REFERENCES public.accounts(id),
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;
END $$;

-- bill_payments table
DO $$
BEGIN
    IF NOT table_exists('bill_payments') THEN
        CREATE TABLE public.bill_payments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE NOT NULL,
            account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            payment_date DATE NOT NULL,
            reference_number TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'completed',
            confirmation_number TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;
END $$;

-- loans table
DO $$
BEGIN
    IF NOT table_exists('loans') THEN
        CREATE TABLE public.loans (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
            loan_number TEXT UNIQUE NOT NULL,
            loan_type TEXT NOT NULL,
            principal_amount DECIMAL(15,2) NOT NULL,
            interest_rate DECIMAL(5,2) NOT NULL,
            term_months INTEGER NOT NULL,
            monthly_payment DECIMAL(10,2) NOT NULL,
            outstanding_balance DECIMAL(15,2) NOT NULL,
            next_payment_date DATE,
            status TEXT DEFAULT 'active',
            purpose TEXT,
            collateral TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;
END $$;

-- loan_payments table
DO $$
BEGIN
    IF NOT table_exists('loan_payments') THEN
        CREATE TABLE public.loan_payments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            loan_id UUID REFERENCES public.loans(id) ON DELETE CASCADE NOT NULL,
            account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            principal_amount DECIMAL(10,2) NOT NULL,
            interest_amount DECIMAL(10,2) NOT NULL,
            payment_date DATE NOT NULL,
            reference_number TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'completed',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;
END $$;

-- Additional Supporting Tables

-- pending_signups table
DO $$
BEGIN
    IF NOT table_exists('pending_signups') THEN
        CREATE TABLE public.pending_signups (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            verification_code TEXT NOT NULL,
            verification_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            user_data JSONB,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    ELSE
        -- Add missing columns to existing pending_signups table
        IF NOT column_exists('pending_signups', 'user_data') THEN
            ALTER TABLE public.pending_signups ADD COLUMN user_data JSONB;
        END IF;
        IF NOT column_exists('pending_signups', 'status') THEN
            ALTER TABLE public.pending_signups ADD COLUMN status TEXT DEFAULT 'pending';
        END IF;
    END IF;
END $$;

-- admin table
DO $$
BEGIN
    IF NOT table_exists('admin') THEN
        CREATE TABLE public.admin (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
            role TEXT DEFAULT 'admin',
            permissions TEXT[],
            is_super_admin BOOLEAN DEFAULT false,
            last_login TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    ELSE
        -- Add missing columns to existing admin table
        IF NOT column_exists('admin', 'permissions') THEN
            ALTER TABLE public.admin ADD COLUMN permissions TEXT[];
        END IF;
        IF NOT column_exists('admin', 'is_super_admin') THEN
            ALTER TABLE public.admin ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
        END IF;
        IF NOT column_exists('admin', 'last_login') THEN
            ALTER TABLE public.admin ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
        END IF;
    END IF;
END $$;

-- Create indexes for better performance (with existence checks)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON public.accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_card_number ON public.cards(card_number);
CREATE INDEX IF NOT EXISTS idx_card_transactions_card_id ON public.card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_transaction_date ON public.card_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_card_freeze_history_card_id ON public.card_freeze_history(card_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_assigned_to ON public.messages(assigned_to);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);
CREATE INDEX IF NOT EXISTS idx_message_replies_message_id ON public.message_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON public.email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wire_transfers_user_id ON public.wire_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON public.bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_bill_id ON public.bill_payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON public.loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_pending_signups_email ON public.pending_signups(email);
-- CREATE INDEX IF NOT EXISTS idx_admin_user_id ON public.admin(user_id); -- SKIPPED: user_id column doesn't exist in admin table

-- Add conditional indexes for columns that might not exist
DO $$
BEGIN
    IF column_exists('cards', 'account_id') THEN
        CREATE INDEX IF NOT EXISTS idx_cards_account_id ON public.cards(account_id);
    END IF;
END $$;

DO $$
BEGIN
    IF column_exists('transactions', 'account_id') THEN
        CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
    END IF;
END $$;

-- Grant all privileges to all users (open access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Ensure no RLS is enabled on any table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_freeze_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_statements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_limits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_replies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wire_transfers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_signups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin DISABLE ROW LEVEL SECURITY;

-- Insert default email templates
INSERT INTO public.email_templates (template_name, subject, html_content, text_content, variables) VALUES
('welcome_email', 'Welcome to Bank Weave!', '<h1>Welcome to Bank Weave!</h1><p>Hello {{full_name}},</p><p>Welcome to your new banking experience. We''re excited to have you as part of our community.</p><p>Your account is now active and ready to use.</p><p>Best regards,<br>The Bank Weave Team</p>', 'Welcome to Bank Weave! Hello {{full_name}}, Welcome to your new banking experience. Your account is now active.', ARRAY['full_name']),
('transaction_alert', 'Transaction Alert', '<h1>Transaction Alert</h1><p>Hello {{full_name}},</p><p>A transaction has been made on your account:</p><p><strong>Amount:</strong> ${{amount}}</p><p><strong>Description:</strong> {{description}}</p><p><strong>Date:</strong> {{transaction_date}}</p><p>If you did not authorize this transaction, please contact us immediately.</p>', 'Transaction Alert: A ${{amount}} transaction was made on your account on {{transaction_date}}.', ARRAY['full_name', 'amount', 'description', 'transaction_date']),
('security_alert', 'Security Alert', '<h1>Security Alert</h1><p>Hello {{full_name}},</p><p>We have detected unusual activity on your account.</p><p><strong>Alert Type:</strong> {{alert_type}}</p><p><strong>Time:</strong> {{alert_time}}</p><p>Please review your account activity and contact us if you have any concerns.</p>', 'Security Alert: Unusual activity detected on your account. Alert type: {{alert_type}}', ARRAY['full_name', 'alert_type', 'alert_time'])
ON CONFLICT (template_name) DO NOTHING;