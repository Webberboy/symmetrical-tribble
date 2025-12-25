-- Loans Management Tables for Supabase
-- This script creates the complete loans management system

-- 1. Loan Types Configuration Table
CREATE TABLE loan_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    interest_rate DECIMAL(5,2) NOT NULL,
    min_amount DECIMAL(12,2) NOT NULL,
    max_amount DECIMAL(12,2) NOT NULL,
    min_term_months INTEGER NOT NULL,
    max_term_months INTEGER NOT NULL,
    processing_fee DECIMAL(5,2) DEFAULT 0,
    prepayment_penalty DECIMAL(5,2) DEFAULT 0,
    collateral_required BOOLEAN DEFAULT FALSE,
    eligibility_criteria JSONB,
    documents_required TEXT[],
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Loan Applications Table
CREATE TABLE loan_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    loan_type_id UUID REFERENCES loan_types(id) ON DELETE RESTRICT,
    application_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Loan Details
    requested_amount DECIMAL(12,2) NOT NULL,
    approved_amount DECIMAL(12,2),
    requested_term_months INTEGER NOT NULL,
    approved_term_months INTEGER,
    purpose TEXT,
    
    -- Applicant Information
    employment_status VARCHAR(50),
    monthly_income DECIMAL(12,2),
    employer_name VARCHAR(200),
    years_employed INTEGER,
    
    -- Financial Information
    monthly_expenses DECIMAL(12,2),
    existing_debts DECIMAL(12,2) DEFAULT 0,
    assets_value DECIMAL(12,2),
    credit_score INTEGER,
    
    -- Collateral Information
    collateral_type VARCHAR(100),
    collateral_value DECIMAL(12,2),
    collateral_description TEXT,
    
    -- Application Status
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'cancelled', 'disbursed')),
    
    -- Review Process
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    approval_conditions TEXT,
    
    -- Documents
    documents_submitted JSONB,
    verification_status VARCHAR(30) DEFAULT 'pending',
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Main Loans Table
CREATE TABLE loans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    loan_application_id UUID REFERENCES loan_applications(id) ON DELETE SET NULL,
    loan_type_id UUID REFERENCES loan_types(id) ON DELETE RESTRICT,
    
    -- Loan Details
    loan_number VARCHAR(50) UNIQUE NOT NULL,
    principal_amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    term_months INTEGER NOT NULL,
    
    -- Financial Calculations
    monthly_payment DECIMAL(12,2) NOT NULL,
    total_interest DECIMAL(12,2) NOT NULL,
    total_payment DECIMAL(12,2) NOT NULL,
    
    -- Current Status
    outstanding_principal DECIMAL(12,2) NOT NULL,
    outstanding_interest DECIMAL(12,2) NOT NULL,
    next_payment_date DATE,
    next_payment_amount DECIMAL(12,2),
    
    -- Loan Status
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'defaulted', 'written_off', 'cancelled')),
    disbursement_date DATE,
    first_payment_date DATE,
    maturity_date DATE,
    
    -- Payment Tracking
    payments_made INTEGER DEFAULT 0,
    payments_remaining INTEGER NOT NULL,
    last_payment_date DATE,
    last_payment_amount DECIMAL(12,2),
    
    -- Delinquency Tracking
    days_past_due INTEGER DEFAULT 0,
    late_fees_accrued DECIMAL(12,2) DEFAULT 0,
    
    -- Interest Calculation
    interest_calculation_method VARCHAR(50) DEFAULT 'simple' CHECK (interest_calculation_method IN ('simple', 'compound', 'amortized')),
    interest_accrual_frequency VARCHAR(20) DEFAULT 'monthly' CHECK (interest_accrual_frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
    
    -- Penalties and Fees
    late_payment_fee DECIMAL(12,2) DEFAULT 25.00,
    prepayment_penalty DECIMAL(12,2) DEFAULT 0,
    
    -- Collateral Information
    collateral_id UUID,
    collateral_value DECIMAL(12,2),
    
    -- Metadata
    purpose TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Loan Payments Table
CREATE TABLE loan_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Payment Details
    payment_number INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    -- Payment Amounts
    principal_amount DECIMAL(12,2) NOT NULL,
    interest_amount DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    
    -- Additional Charges
    late_fee DECIMAL(12,2) DEFAULT 0,
    other_charges DECIMAL(12,2) DEFAULT 0,
    
    -- Payment Status
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'late', 'missed', 'waived')),
    
    -- Payment Processing
    paid_date DATE,
    paid_amount DECIMAL(12,2),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    
    -- Overpayment Handling
    overpayment_amount DECIMAL(12,2) DEFAULT 0,
    overpayment_applied_to_principal BOOLEAN DEFAULT FALSE,
    
    -- Notes and Tracking
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX idx_loan_applications_status ON loan_applications(status);
CREATE INDEX idx_loan_applications_loan_type_id ON loan_applications(loan_type_id);
CREATE INDEX idx_loan_applications_application_number ON loan_applications(application_number);

CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_loan_number ON loans(loan_number);
CREATE INDEX idx_loans_loan_type_id ON loans(loan_type_id);
CREATE INDEX idx_loans_next_payment_date ON loans(next_payment_date);
CREATE INDEX idx_loans_days_past_due ON loans(days_past_due);

CREATE INDEX idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX idx_loan_payments_user_id ON loan_payments(user_id);
CREATE INDEX idx_loan_payments_payment_date ON loan_payments(payment_date);
CREATE INDEX idx_loan_payments_status ON loan_payments(status);
CREATE INDEX idx_loan_payments_due_date ON loan_payments(due_date);

-- Row Level Security (RLS) Policies
ALTER TABLE loan_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;

-- Loan Types Policies (Public read access for active loan types)
CREATE POLICY "Public can view active loan types" ON loan_types
    FOR SELECT USING (status = 'active');

-- Loan Applications Policies
CREATE POLICY "Users can view own loan applications" ON loan_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own loan applications" ON loan_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loan applications" ON loan_applications
    FOR UPDATE USING (auth.uid() = user_id);

-- Loans Policies
CREATE POLICY "Users can view own loans" ON loans
    FOR SELECT USING (auth.uid() = user_id);

-- Loan Payments Policies
CREATE POLICY "Users can view own loan payments" ON loan_payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own loan payments" ON loan_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin Policies (Assuming admin users have a role column in auth.users)
CREATE POLICY "Admins can view all loan applications" ON loan_applications
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    ));

CREATE POLICY "Admins can view all loans" ON loans
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    ));

CREATE POLICY "Admins can view all loan payments" ON loan_payments
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    ));

-- Functions for Auto-updating updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_loan_types_updated_at BEFORE UPDATE ON loan_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loan_applications_updated_at BEFORE UPDATE ON loan_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loan_payments_updated_at BEFORE UPDATE ON loan_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique loan numbers
CREATE OR REPLACE FUNCTION generate_loan_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'LN' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique application numbers
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'APP' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Insert sample loan types
INSERT INTO loan_types (name, description, interest_rate, min_amount, max_amount, min_term_months, max_term_months, processing_fee, prepayment_penalty, collateral_required, documents_required) VALUES
('Personal Loan', 'Unsecured personal loan for various purposes', 12.50, 1000, 50000, 6, 60, 2.0, 1.0, false, ARRAY['ID Proof', 'Income Proof', 'Bank Statements']),
('Home Loan', 'Secured loan for purchasing or renovating property', 8.75, 50000, 1000000, 60, 360, 1.5, 2.0, true, ARRAY['ID Proof', 'Income Proof', 'Property Documents', 'Bank Statements']),
('Car Loan', 'Loan for purchasing new or used vehicles', 9.25, 5000, 100000, 12, 84, 1.0, 1.5, true, ARRAY['ID Proof', 'Income Proof', 'Vehicle Documents', 'Insurance']),
('Business Loan', 'Loan for business expansion and working capital', 11.00, 10000, 500000, 6, 120, 2.5, 2.0, false, ARRAY['Business Registration', 'Financial Statements', 'Tax Returns', 'Business Plan']),
('Education Loan', 'Loan for higher education expenses', 7.50, 1000, 100000, 6, 120, 1.0, 0.5, false, ARRAY['Admission Letter', 'Fee Structure', 'Academic Records']);

-- Function to calculate monthly payment (simplified amortization)
CREATE OR REPLACE FUNCTION calculate_monthly_payment(
    principal DECIMAL,
    annual_rate DECIMAL,
    months INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
    monthly_rate DECIMAL;
    monthly_payment DECIMAL;
BEGIN
    IF annual_rate = 0 THEN
        RETURN principal / months;
    END IF;
    
    monthly_rate := annual_rate / 100 / 12;
    monthly_payment := principal * (monthly_rate * POWER(1 + monthly_rate, months)) / (POWER(1 + monthly_rate, months) - 1);
    
    RETURN ROUND(monthly_payment, 2);
END;
$$ LANGUAGE plpgsql;