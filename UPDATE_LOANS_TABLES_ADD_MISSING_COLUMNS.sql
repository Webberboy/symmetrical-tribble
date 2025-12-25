-- Add missing columns to loan_applications table
ALTER TABLE loan_applications 
ADD COLUMN IF NOT EXISTS annual_income DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS employer_address TEXT,
ADD COLUMN IF NOT EXISTS job_title VARCHAR(100),
ADD COLUMN IF NOT EXISTS work_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS years_at_current_job INTEGER,
ADD COLUMN IF NOT EXISTS previous_employer VARCHAR(200),
ADD COLUMN IF NOT EXISTS housing_status VARCHAR(30) CHECK (housing_status IN ('own', 'rent', 'mortgage', 'live_with_family')),
ADD COLUMN IF NOT EXISTS monthly_housing_payment DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS dependents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
ADD COLUMN IF NOT EXISTS education_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS bankruptcy_history BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bankruptcy_date DATE,
ADD COLUMN IF NOT EXISTS co_applicant_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS co_applicant_income DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS co_applicant_credit_score INTEGER,
ADD COLUMN IF NOT EXISTS loan_use_description TEXT,
ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'sms')),
ADD COLUMN IF NOT EXISTS application_source VARCHAR(50) DEFAULT 'web' CHECK (application_source IN ('web', 'mobile', 'branch', 'phone', 'partner')),
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS privacy_policy_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Add missing columns to loans table
ALTER TABLE loans
ADD COLUMN IF NOT EXISTS original_loan_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approval_date DATE,
ADD COLUMN IF NOT EXISTS loan_officer_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS risk_rating VARCHAR(20) CHECK (risk_rating IN ('low', 'medium', 'high', 'very_high')),
ADD COLUMN IF NOT EXISTS interest_rate_type VARCHAR(20) DEFAULT 'fixed' CHECK (interest_rate_type IN ('fixed', 'variable', 'hybrid')),
ADD COLUMN IF NOT EXISTS base_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS margin_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS rate_adjustment_frequency INTEGER,
ADD COLUMN IF NOT EXISTS next_rate_adjustment_date DATE,
ADD COLUMN IF NOT EXISTS payment_due_day INTEGER CHECK (payment_due_day BETWEEN 1 AND 31),
ADD COLUMN IF NOT EXISTS automatic_payment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_account_id UUID,
ADD COLUMN IF NOT EXISTS insurance_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS insurance_premium DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS escrow_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS escrow_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_monthly_payment DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS amortization_schedule_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS remaining_payments INTEGER;

-- Add missing columns to loan_payments table
ALTER TABLE loan_payments
ADD COLUMN IF NOT EXISTS principal_balance_before DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS principal_balance_after DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS interest_balance_before DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS interest_balance_after DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS escrow_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS insurance_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS principal_paid DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS interest_paid DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS days_accrual INTEGER,
ADD COLUMN IF NOT EXISTS interest_rate_applied DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS payment_reference_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_status_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS reversal_date DATE,
ADD COLUMN IF NOT EXISTS reversed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reversal_reason TEXT,
ADD COLUMN IF NOT EXISTS is_reversed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES auth.users(id);

-- Add missing columns to loan_types table
ALTER TABLE loan_types
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50),
ADD COLUMN IF NOT EXISTS risk_weight DECIMAL(5,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS regulatory_capital_weight DECIMAL(5,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS minimum_credit_score INTEGER,
ADD COLUMN IF NOT EXISTS maximum_debt_to_income_ratio DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS minimum_employment_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS minimum_annual_income DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS maximum_loan_to_value_ratio DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS insurance_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS guarantor_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS minimum_age INTEGER DEFAULT 18,
ADD COLUMN IF NOT EXISTS maximum_age INTEGER DEFAULT 70,
ADD COLUMN IF NOT EXISTS citizenship_required VARCHAR(50) DEFAULT 'citizen',
ADD COLUMN IF NOT EXISTS residency_required VARCHAR(50) DEFAULT 'resident',
ADD COLUMN IF NOT EXISTS income_verification_required BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS employment_verification_required BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS asset_verification_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS appraisal_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS legal_review_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS compliance_review_required BOOLEAN DEFAULT FALSE;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_loan_applications_annual_income ON loan_applications(annual_income);
CREATE INDEX IF NOT EXISTS idx_loan_applications_employment_status ON loan_applications(employment_status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_housing_status ON loan_applications(housing_status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_credit_score ON loan_applications(credit_score);
CREATE INDEX IF NOT EXISTS idx_loan_applications_bankruptcy_history ON loan_applications(bankruptcy_history);

CREATE INDEX IF NOT EXISTS idx_loans_approved_by ON loans(approved_by);
CREATE INDEX IF NOT EXISTS idx_loans_loan_officer_id ON loans(loan_officer_id);
CREATE INDEX IF NOT EXISTS idx_loans_risk_rating ON loans(risk_rating);
CREATE INDEX IF NOT EXISTS idx_loans_interest_rate_type ON loans(interest_rate_type);
CREATE INDEX IF NOT EXISTS idx_loans_automatic_payment ON loans(automatic_payment);

CREATE INDEX IF NOT EXISTS idx_loan_payments_payment_reference ON loan_payments(payment_reference_number);
CREATE INDEX IF NOT EXISTS idx_loan_payments_bank_reference ON loan_payments(bank_reference);
CREATE INDEX IF NOT EXISTS idx_loan_payments_payment_gateway ON loan_payments(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_loan_payments_is_reversed ON loan_payments(is_reversed);

-- Update RLS policies to include new columns if needed
-- (Existing policies should still work, but we can add more specific ones if needed)

-- Add new RLS policies for enhanced security
CREATE POLICY "Users can only update their own loan applications before approval" ON loan_applications
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND status IN ('pending', 'under_review')
    );

-- Function to validate loan application data before submission
CREATE OR REPLACE FUNCTION validate_loan_application()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate required fields
    IF NEW.annual_income IS NULL THEN
        RAISE EXCEPTION 'Annual income is required';
    END IF;
    
    IF NEW.monthly_income IS NULL THEN
        RAISE EXCEPTION 'Monthly income is required';
    END IF;
    
    IF NEW.employment_status IS NULL THEN
        RAISE EXCEPTION 'Employment status is required';
    END IF;
    
    IF NEW.requested_amount IS NULL OR NEW.requested_amount <= 0 THEN
        RAISE EXCEPTION 'Valid requested amount is required';
    END IF;
    
    IF NEW.requested_term_months IS NULL OR NEW.requested_term_months <= 0 THEN
        RAISE EXCEPTION 'Valid loan term is required';
    END IF;
    
    -- Validate terms acceptance
    IF NEW.terms_accepted = FALSE THEN
        RAISE EXCEPTION 'You must accept the terms and conditions';
    END IF;
    
    IF NEW.privacy_policy_accepted = FALSE THEN
        RAISE EXCEPTION 'You must accept the privacy policy';
    END IF;
    
    -- Generate application number if not provided
    IF NEW.application_number IS NULL THEN
        NEW.application_number := generate_application_number();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for loan application validation
CREATE TRIGGER validate_loan_application_trigger
    BEFORE INSERT OR UPDATE ON loan_applications
    FOR EACH ROW
    EXECUTE FUNCTION validate_loan_application();

-- Function to automatically calculate debt-to-income ratio
CREATE OR REPLACE FUNCTION calculate_debt_to_income_ratio()
RETURNS TRIGGER AS $$
DECLARE
    monthly_debt DECIMAL(12,2);
    dti_ratio DECIMAL(5,2);
BEGIN
    -- Calculate total monthly debt (existing debts + new loan payment)
    monthly_debt := COALESCE(NEW.existing_debts, 0) + COALESCE(NEW.monthly_housing_payment, 0);
    
    -- Calculate debt-to-income ratio
    IF NEW.monthly_income > 0 THEN
        dti_ratio := (monthly_debt / NEW.monthly_income) * 100;
        
        -- Store in a JSONB field for additional data
        NEW.eligibility_criteria := jsonb_set(
            COALESCE(NEW.eligibility_criteria, '{}'::jsonb),
            '{debt_to_income_ratio}',
            to_jsonb(dti_ratio)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for debt-to-income calculation
CREATE TRIGGER calculate_dti_trigger
    BEFORE INSERT OR UPDATE ON loan_applications
    FOR EACH ROW
    EXECUTE FUNCTION calculate_debt_to_income_ratio();

-- Function to generate amortization schedule when loan is created
CREATE OR REPLACE FUNCTION generate_amortization_schedule(loan_id_param UUID)
RETURNS VOID AS $$
DECLARE
    loan_record RECORD;
    monthly_rate DECIMAL(12,6);
    remaining_principal DECIMAL(12,2);
    monthly_payment DECIMAL(12,2);
    interest_payment DECIMAL(12,2);
    principal_payment DECIMAL(12,2);
    payment_date DATE;
    i INTEGER;
BEGIN
    -- Get loan details
    SELECT * INTO loan_record FROM loans WHERE id = loan_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan not found';
    END IF;
    
    monthly_rate := loan_record.interest_rate / 100 / 12;
    remaining_principal := loan_record.principal_amount;
    monthly_payment := loan_record.monthly_payment;
    payment_date := loan_record.first_payment_date;
    
    -- Generate payment schedule
    FOR i IN 1..loan_record.term_months LOOP
        -- Calculate interest portion
        interest_payment := ROUND(remaining_principal * monthly_rate, 2);
        
        -- Calculate principal portion
        principal_payment := monthly_payment - interest_payment;
        
        -- Handle final payment adjustment
        IF i = loan_record.term_months THEN
            principal_payment := remaining_principal;
            interest_payment := monthly_payment - principal_payment;
        END IF;
        
        -- Insert payment record
        INSERT INTO loan_payments (
            loan_id,
            user_id,
            payment_number,
            payment_date,
            due_date,
            principal_amount,
            interest_amount,
            total_amount,
            principal_balance_before,
            principal_balance_after,
            interest_balance_before,
            interest_balance_after,
            principal_paid,
            interest_paid
        ) VALUES (
            loan_id_param,
            loan_record.user_id,
            i,
            payment_date,
            payment_date,
            principal_payment,
            interest_payment,
            monthly_payment,
            remaining_principal,
            remaining_principal - principal_payment,
            interest_payment,
            0,
            principal_payment,
            interest_payment
        );
        
        -- Update remaining principal
        remaining_principal := remaining_principal - principal_payment;
        
        -- Move to next payment date
        payment_date := payment_date + INTERVAL '1 month';
    END LOOP;
    
    -- Update loan record
    UPDATE loans SET 
        amortization_schedule_generated = TRUE,
        remaining_payments = loan_record.term_months,
        next_payment_date = loan_record.first_payment_date,
        next_payment_amount = monthly_payment
    WHERE id = loan_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create payment schedule when loan is approved
CREATE OR REPLACE FUNCTION create_loan_payment_schedule()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate schedule when loan becomes active
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
        PERFORM generate_amortization_schedule(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic payment schedule generation
CREATE TRIGGER create_payment_schedule_trigger
    AFTER UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION create_loan_payment_schedule();