-- Comprehensive SQL Script for Banking Application Tables
-- This script creates all necessary tables for Loans, Investments, Mobile Deposit, Budgets, Bills, Request Money, Documents & Reports, and Statements
-- No RLS policies - all tables are open for read/write access

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(p_table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if a column exists in a table
CREATE OR REPLACE FUNCTION column_exists(p_table_name TEXT, p_column_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name
        AND column_name = p_column_name
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- LOANS TABLES
-- ============================================

-- loans table
DO $$
BEGIN
    IF NOT table_exists('loans') THEN
        CREATE TABLE public.loans (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            loan_type TEXT NOT NULL, -- 'personal', 'home', 'auto', 'education'
            amount DECIMAL(15,2) NOT NULL,
            interest_rate DECIMAL(5,2) NOT NULL,
            term_months INTEGER NOT NULL,
            monthly_payment DECIMAL(15,2) NOT NULL,
            status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'active', 'paid', 'defaulted'
            purpose TEXT,
            application_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            approval_date TIMESTAMP WITH TIME ZONE,
            disbursement_date TIMESTAMP WITH TIME ZONE,
            first_payment_date DATE,
            next_payment_date DATE,
            remaining_balance DECIMAL(15,2),
            total_paid DECIMAL(15,2) DEFAULT 0,
            late_fee_amount DECIMAL(10,2) DEFAULT 0,
            collateral_value DECIMAL(15,2),
            collateral_description TEXT,
            employment_status TEXT,
            annual_income DECIMAL(15,2),
            credit_score INTEGER,
            debt_to_income_ratio DECIMAL(5,2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- loan_applications table
DO $$
BEGIN
    IF NOT table_exists('loan_applications') THEN
        CREATE TABLE public.loan_applications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            loan_type TEXT NOT NULL, -- 'personal', 'home', 'auto', 'education'
            amount DECIMAL(15,2) NOT NULL,
            interest_rate DECIMAL(5,2),
            term_months INTEGER NOT NULL,
            purpose TEXT,
            status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
            employment_status TEXT,
            annual_income DECIMAL(15,2),
            monthly_expenses DECIMAL(15,2),
            credit_score INTEGER,
            debt_to_income_ratio DECIMAL(5,2),
            collateral_value DECIMAL(15,2),
            collateral_description TEXT,
            property_address TEXT, -- For home loans
            property_type TEXT, -- For home loans
            vehicle_make TEXT, -- For auto loans
            vehicle_model TEXT, -- For auto loans
            vehicle_year INTEGER, -- For auto loans
            vehicle_vin TEXT, -- For auto loans
            school_name TEXT, -- For education loans
            program_name TEXT, -- For education loans
            expected_graduation DATE, -- For education loans
            co_signer_name TEXT,
            co_signer_email TEXT,
            co_signer_phone TEXT,
            additional_notes TEXT,
            rejection_reason TEXT,
            reviewed_by UUID REFERENCES auth.users(id),
            reviewed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            principal_amount DECIMAL(15,2) NOT NULL,
            interest_amount DECIMAL(15,2) NOT NULL,
            payment_date DATE NOT NULL,
            payment_method TEXT, -- 'bank_account', 'debit_card', 'wire_transfer'
            status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'refunded'
            reference_number TEXT,
            notes TEXT,
            late_fee DECIMAL(10,2) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- loan_types table (configuration)
DO $$
BEGIN
    IF NOT table_exists('loan_types') THEN
        CREATE TABLE public.loan_types (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            loan_type TEXT UNIQUE NOT NULL, -- 'personal', 'home', 'auto', 'education'
            min_amount DECIMAL(15,2) DEFAULT 1000,
            max_amount DECIMAL(15,2) DEFAULT 50000,
            min_term_months INTEGER DEFAULT 12,
            max_term_months INTEGER DEFAULT 60,
            min_interest_rate DECIMAL(5,2) DEFAULT 5.0,
            max_interest_rate DECIMAL(5,2) DEFAULT 25.0,
            requires_collateral BOOLEAN DEFAULT FALSE,
            min_credit_score INTEGER DEFAULT 600,
            max_debt_to_income_ratio DECIMAL(5,2) DEFAULT 0.43,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- ============================================
-- INVESTMENTS TABLES
-- ============================================

-- portfolios table
DO $$
BEGIN
    IF NOT table_exists('portfolios') THEN
        CREATE TABLE public.portfolios (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            portfolio_name TEXT DEFAULT 'My Portfolio',
            total_value DECIMAL(15,2) DEFAULT 0,
            total_cost_basis DECIMAL(15,2) DEFAULT 0,
            total_gain_loss DECIMAL(15,2) DEFAULT 0,
            total_gain_loss_percentage DECIMAL(8,4) DEFAULT 0,
            daily_change DECIMAL(15,2) DEFAULT 0,
            daily_change_percentage DECIMAL(8,4) DEFAULT 0,
            cash_balance DECIMAL(15,2) DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- stock_transactions table
DO $$
BEGIN
    IF NOT table_exists('stock_transactions') THEN
        CREATE TABLE public.stock_transactions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
            symbol TEXT NOT NULL,
            transaction_type TEXT NOT NULL, -- 'buy', 'sell', 'dividend'
            shares DECIMAL(15,6) NOT NULL,
            price_per_share DECIMAL(15,4) NOT NULL,
            total_amount DECIMAL(15,2) NOT NULL,
            fees DECIMAL(10,2) DEFAULT 0,
            transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            settlement_date DATE,
            status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'cancelled'
            order_type TEXT DEFAULT 'market', -- 'market', 'limit', 'stop'
            limit_price DECIMAL(15,4),
            stop_price DECIMAL(15,4),
            notes TEXT,
            reference_number TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- stock_holdings table (current positions)
DO $$
BEGIN
    IF NOT table_exists('stock_holdings') THEN
        CREATE TABLE public.stock_holdings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
            symbol TEXT NOT NULL,
            shares DECIMAL(15,6) NOT NULL,
            average_cost_basis DECIMAL(15,4) NOT NULL,
            total_cost_basis DECIMAL(15,2) NOT NULL,
            current_price DECIMAL(15,4),
            current_value DECIMAL(15,2),
            unrealized_gain_loss DECIMAL(15,2),
            unrealized_gain_loss_percentage DECIMAL(8,4),
            daily_change DECIMAL(15,2),
            daily_change_percentage DECIMAL(8,4),
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, portfolio_id, symbol)
        );
    END IF;
END $$;

-- stock_market_data table
DO $$
BEGIN
    IF NOT table_exists('stock_market_data') THEN
        CREATE TABLE public.stock_market_data (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            symbol TEXT UNIQUE NOT NULL,
            company_name TEXT NOT NULL,
            current_price DECIMAL(15,4) NOT NULL,
            previous_close DECIMAL(15,4),
            daily_change DECIMAL(15,4),
            daily_change_percentage DECIMAL(8,4),
            market_cap BIGINT,
            volume BIGINT,
            day_high DECIMAL(15,4),
            day_low DECIMAL(15,4),
            fifty_two_week_high DECIMAL(15,4),
            fifty_two_week_low DECIMAL(15,4),
            pe_ratio DECIMAL(8,2),
            dividend_yield DECIMAL(5,2),
            sector TEXT,
            industry TEXT,
            exchange TEXT,
            currency TEXT DEFAULT 'USD',
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- dividends table
DO $$
BEGIN
    IF NOT table_exists('dividends') THEN
        CREATE TABLE public.dividends (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
            symbol TEXT NOT NULL,
            shares_on_record_date DECIMAL(15,6) NOT NULL,
            dividend_per_share DECIMAL(15,4) NOT NULL,
            total_dividend DECIMAL(15,2) NOT NULL,
            ex_dividend_date DATE NOT NULL,
            record_date DATE NOT NULL,
            payment_date DATE NOT NULL,
            dividend_type TEXT DEFAULT 'regular', -- 'regular', 'special', 'stock'
            status TEXT DEFAULT 'pending', -- 'pending', 'paid'
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- ============================================
-- MOBILE DEPOSIT TABLES
-- ============================================

-- mobile_deposits table
DO $$
BEGIN
    IF NOT table_exists('mobile_deposits') AND table_exists('accounts') THEN
        CREATE TABLE public.mobile_deposits (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            check_front_image_url TEXT NOT NULL,
            check_back_image_url TEXT NOT NULL,
            check_number TEXT,
            memo TEXT,
            status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
            rejection_reason TEXT,
            reviewed_by UUID REFERENCES auth.users(id),
            reviewed_at TIMESTAMP WITH TIME ZONE,
            deposit_date DATE DEFAULT CURRENT_DATE,
            estimated_clearing_date DATE,
            actual_clearing_date DATE,
            processing_fee DECIMAL(10,2) DEFAULT 0,
            daily_limit_remaining DECIMAL(15,2),
            monthly_limit_remaining DECIMAL(15,2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- ============================================
-- BUDGETS TABLES
-- ============================================

-- budgets table
DO $$
BEGIN
    IF NOT table_exists('budgets') THEN
        CREATE TABLE public.budgets (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            category TEXT NOT NULL,
            budget_amount DECIMAL(15,2) NOT NULL,
            spent_amount DECIMAL(15,2) DEFAULT 0,
            remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (budget_amount - spent_amount) STORED,
            icon TEXT DEFAULT 'banknote',
            color TEXT DEFAULT 'bg-gray-500',
            period_year INTEGER NOT NULL,
            period_month INTEGER NOT NULL,
            period_type TEXT DEFAULT 'monthly', -- 'weekly', 'monthly', 'yearly'
            is_active BOOLEAN DEFAULT TRUE,
            alert_threshold_percentage DECIMAL(5,2) DEFAULT 75.0,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- budget_transactions table (to track spending against budgets)
DO $$
BEGIN
    IF NOT table_exists('budget_transactions') AND table_exists('transactions') THEN
        CREATE TABLE public.budget_transactions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
            amount DECIMAL(15,2) NOT NULL,
            merchant_name TEXT,
            transaction_date DATE NOT NULL,
            category TEXT,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- ============================================
-- BILLS TABLES
-- ============================================

-- bills table
DO $$
BEGIN
    IF NOT table_exists('bills') THEN
        CREATE TABLE public.bills (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            bill_name TEXT NOT NULL,
            provider TEXT NOT NULL,
            category TEXT NOT NULL, -- 'utilities', 'internet', 'phone', 'insurance', 'loan', 'credit_card', 'other'
            account_number TEXT NOT NULL,
            typical_amount DECIMAL(15,2),
            currency TEXT DEFAULT 'USD',
            frequency TEXT DEFAULT 'monthly', -- 'weekly', 'monthly', 'quarterly', 'yearly', 'one_time'
            next_due_date DATE,
            payment_method TEXT, -- 'bank_account', 'debit_card', 'credit_card', 'wire_transfer'
            auto_pay_enabled BOOLEAN DEFAULT FALSE,
            auto_pay_account_id UUID,
            reminder_days_before INTEGER DEFAULT 5,
            is_active BOOLEAN DEFAULT TRUE,
            billing_address TEXT,
            contact_email TEXT,
            contact_phone TEXT,
            website_url TEXT,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add foreign key constraint separately if accounts table exists
        IF table_exists('accounts') THEN
            ALTER TABLE public.bills 
            ADD CONSTRAINT bills_auto_pay_account_id_fkey 
            FOREIGN KEY (auto_pay_account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- bill_payments table
DO $$
BEGIN
    IF NOT table_exists('bill_payments') THEN
        CREATE TABLE public.bill_payments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE NOT NULL,
            bill_name TEXT NOT NULL,
            provider TEXT NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            payment_date DATE NOT NULL,
            paid_date DATE DEFAULT CURRENT_DATE,
            payment_method TEXT NOT NULL,
            account_id UUID,
            status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'refunded'
            confirmation_number TEXT,
            reference_number TEXT,
            notes TEXT,
            processing_fee DECIMAL(10,2) DEFAULT 0,
            is_scheduled BOOLEAN DEFAULT FALSE,
            scheduled_date DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add foreign key constraint separately if accounts table exists
        IF table_exists('accounts') THEN
            ALTER TABLE public.bill_payments 
            ADD CONSTRAINT bill_payments_account_id_fkey 
            FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- bill_providers table (for autocomplete and validation)
DO $$
BEGIN
    IF NOT table_exists('bill_providers') THEN
        CREATE TABLE public.bill_providers (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            provider_name TEXT NOT NULL,
            category TEXT NOT NULL,
            website_url TEXT,
            customer_service_phone TEXT,
            customer_service_email TEXT,
            billing_address TEXT,
            is_popular BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- ============================================
-- REQUEST MONEY TABLES
-- ============================================

-- money_requests table
DO $$
BEGIN
    IF NOT table_exists('money_requests') THEN
        CREATE TABLE public.money_requests (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            requester_email TEXT NOT NULL,
            requester_name TEXT NOT NULL,
            recipient_email TEXT NOT NULL,
            recipient_name TEXT,
            amount DECIMAL(15,2) NOT NULL,
            currency TEXT DEFAULT 'USD',
            description TEXT,
            status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled', 'expired'
            expiration_date DATE DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
            payment_method TEXT, -- 'bank_account', 'debit_card', 'credit_card'
            paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            paid_at TIMESTAMP WITH TIME ZONE,
            confirmation_number TEXT,
            reference_number TEXT,
            is_anonymous BOOLEAN DEFAULT FALSE,
            reminder_sent BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- ============================================
-- STATEMENTS TABLES
-- ============================================

-- account_statements table
DO $$
BEGIN
    IF NOT table_exists('account_statements') THEN
        CREATE TABLE public.account_statements (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
            account_name TEXT NOT NULL,
            account_number TEXT NOT NULL,
            account_type TEXT NOT NULL,
            statement_month INTEGER NOT NULL,
            statement_year INTEGER NOT NULL,
            statement_date DATE NOT NULL,
            opening_balance DECIMAL(15,2) NOT NULL,
            closing_balance DECIMAL(15,2) NOT NULL,
            total_deposits DECIMAL(15,2) DEFAULT 0,
            total_withdrawals DECIMAL(15,2) DEFAULT 0,
            total_fees DECIMAL(15,2) DEFAULT 0,
            total_interest DECIMAL(15,2) DEFAULT 0,
            transaction_count INTEGER DEFAULT 0,
            statement_url TEXT,
            is_generated BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, account_id, statement_month, statement_year)
        );
    END IF;
END $$;

-- card_statements table
DO $$
BEGIN
    IF NOT table_exists('card_statements') THEN
        CREATE TABLE public.card_statements (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            card_id UUID REFERENCES public.user_cards(id) ON DELETE CASCADE NOT NULL,
            card_number_masked TEXT NOT NULL,
            statement_month INTEGER NOT NULL,
            statement_year INTEGER NOT NULL,
            statement_date DATE NOT NULL,
            statement_period_start DATE NOT NULL,
            statement_period_end DATE NOT NULL,
            previous_balance DECIMAL(15,2) NOT NULL,
            new_balance DECIMAL(15,2) NOT NULL,
            minimum_payment DECIMAL(15,2) NOT NULL,
            payment_due_date DATE NOT NULL,
            total_purchases DECIMAL(15,2) DEFAULT 0,
            total_cash_advances DECIMAL(15,2) DEFAULT 0,
            total_payments DECIMAL(15,2) DEFAULT 0,
            total_interest_charged DECIMAL(15,2) DEFAULT 0,
            total_fees_charged DECIMAL(15,2) DEFAULT 0,
            transaction_count INTEGER DEFAULT 0,
            rewards_earned DECIMAL(15,2) DEFAULT 0,
            rewards_redeemed DECIMAL(15,2) DEFAULT 0,
            statement_url TEXT,
            is_generated BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- ============================================
-- DOCUMENTS & STORAGE TABLES
-- ============================================

-- user_documents table (for ID verification and other documents)
DO $$
BEGIN
    IF NOT table_exists('user_documents') THEN
        CREATE TABLE public.user_documents (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            document_type TEXT NOT NULL, -- 'id_document', 'proof_of_address', 'income_proof', 'tax_document', 'other'
            document_category TEXT NOT NULL, -- 'verification', 'loan_application', 'tax', 'compliance'
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            file_type TEXT,
            original_file_name TEXT,
            description TEXT,
            status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
            rejection_reason TEXT,
            reviewed_by UUID REFERENCES auth.users(id),
            reviewed_at TIMESTAMP WITH TIME ZONE,
            expiration_date DATE,
            is_active BOOLEAN DEFAULT TRUE,
            uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Loans indexes
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_type ON public.loans(loan_type);
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON public.loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON public.loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON public.loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_user_id ON public.loan_payments(user_id);

-- Investments indexes
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_user_id ON public.stock_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_symbol ON public.stock_transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON public.stock_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_stock_holdings_user_id ON public.stock_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_holdings_symbol ON public.stock_holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_dividends_user_id ON public.dividends(user_id);
CREATE INDEX IF NOT EXISTS idx_dividends_symbol ON public.dividends(symbol);

-- Mobile Deposit indexes
CREATE INDEX IF NOT EXISTS idx_mobile_deposits_user_id ON public.mobile_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_deposits_status ON public.mobile_deposits(status);
CREATE INDEX IF NOT EXISTS idx_mobile_deposits_date ON public.mobile_deposits(deposit_date);

-- Budgets indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON public.budgets(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_budget_id ON public.budget_transactions(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_user_id ON public.budget_transactions(user_id);

-- Bills indexes
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON public.bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(is_active);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON public.bills(next_due_date);
CREATE INDEX IF NOT EXISTS idx_bill_payments_user_id ON public.bill_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_bill_id ON public.bill_payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_date ON public.bill_payments(payment_date);

-- Request Money indexes
CREATE INDEX IF NOT EXISTS idx_money_requests_requester_id ON public.money_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_money_requests_recipient_email ON public.money_requests(recipient_email);
CREATE INDEX IF NOT EXISTS idx_money_requests_status ON public.money_requests(status);

-- Statements indexes
CREATE INDEX IF NOT EXISTS idx_account_statements_user_id ON public.account_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_account_statements_account_id ON public.account_statements(account_id);
CREATE INDEX IF NOT EXISTS idx_account_statements_period ON public.account_statements(statement_month, statement_year);
CREATE INDEX IF NOT EXISTS idx_card_statements_user_id ON public.card_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_card_statements_card_id ON public.card_statements(card_id);
CREATE INDEX IF NOT EXISTS idx_card_statements_date ON public.card_statements(statement_date);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_type ON public.user_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_user_documents_status ON public.user_documents(status);

-- ============================================
-- TRIGGERS FOR UPDATED_AT COLUMNS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns (only if they don't exist)
DO $$
DECLARE
    tables_to_update TEXT[] := ARRAY[
        'loans', 'loan_applications', 'loan_payments', 'loan_types',
        'portfolios', 'stock_transactions', 'stock_holdings', 'stock_market_data', 'dividends',
        'mobile_deposits',
        'budgets', 'budget_transactions',
        'bills', 'bill_payments', 'bill_providers',
        'money_requests',
        'account_statements', 'card_statements',
        'user_documents'
    ];
    table_name TEXT;
    trigger_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY tables_to_update
    LOOP
        trigger_name := 'update_' || table_name || '_updated_at';
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = trigger_name) THEN
            EXECUTE format('
                CREATE TRIGGER %I
                BEFORE UPDATE ON public.%I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
            ', trigger_name, table_name);
        END IF;
    END LOOP;
END $$;

-- ============================================
-- DISABLE RLS (Row Level Security) - OPEN ACCESS
-- ============================================

-- Disable RLS for all tables
ALTER TABLE public.loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_holdings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_market_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividends DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_deposits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_statements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_statements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents DISABLE ROW LEVEL SECURITY;

-- ============================================
-- DEFAULT DATA INSERTION
-- ============================================

-- Insert default loan types if they don't exist
INSERT INTO public.loan_types (loan_type, min_amount, max_amount, min_term_months, max_term_months, min_interest_rate, max_interest_rate, requires_collateral, min_credit_score, max_debt_to_income_ratio, description) VALUES
    ('personal', 1000, 50000, 12, 60, 8.0, 25.0, FALSE, 650, 0.40, 'Unsecured personal loans for various purposes'),
    ('home', 10000, 500000, 120, 360, 4.0, 8.0, TRUE, 680, 0.36, 'Mortgage loans for home purchases'),
    ('auto', 5000, 100000, 24, 84, 5.0, 12.0, TRUE, 650, 0.45, 'Auto loans for vehicle purchases'),
    ('education', 2000, 100000, 12, 120, 6.0, 15.0, FALSE, 600, 0.50, 'Student loans for education expenses')
ON CONFLICT (loan_type) DO NOTHING;

-- Insert default bill providers if they don't exist
INSERT INTO public.bill_providers (provider_name, category, website_url, customer_service_phone, is_popular) VALUES
    ('Electric Company', 'utilities', 'https://electriccompany.com', '1-800-ELECTRIC', TRUE),
    ('Water Department', 'utilities', 'https://waterdept.gov', '1-800-WATER', TRUE),
    ('Gas Company', 'utilities', 'https://gascompany.com', '1-800-GAS-CO', TRUE),
    ('Internet Provider', 'internet', 'https://internetprovider.com', '1-800-INTERNET', TRUE),
    ('Mobile Carrier', 'phone', 'https://mobilecarrier.com', '1-800-MOBILE', TRUE),
    ('Insurance Company', 'insurance', 'https://insurance.com', '1-800-INSURE', TRUE),
    ('Credit Card Company', 'credit_card', 'https://creditcard.com', '1-800-CREDIT', TRUE)
ON CONFLICT DO NOTHING;

-- Insert sample stock market data if table is empty
INSERT INTO public.stock_market_data (symbol, company_name, current_price, sector, industry, exchange) VALUES
    ('AAPL', 'Apple Inc.', 150.00, 'Technology', 'Consumer Electronics', 'NASDAQ'),
    ('GOOGL', 'Alphabet Inc.', 2500.00, 'Technology', 'Internet Services', 'NASDAQ'),
    ('MSFT', 'Microsoft Corporation', 300.00, 'Technology', 'Software', 'NASDAQ'),
    ('TSLA', 'Tesla Inc.', 800.00, 'Automotive', 'Electric Vehicles', 'NASDAQ'),
    ('AMZN', 'Amazon.com Inc.', 3200.00, 'Consumer Discretionary', 'E-commerce', 'NASDAQ')
ON CONFLICT (symbol) DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT 'All banking application tables created successfully!' AS status;