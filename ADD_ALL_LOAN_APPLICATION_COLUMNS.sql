-- Add all necessary columns for loan applications
-- This script adds all required columns for the loan application form
-- It will skip columns that already exist to avoid errors

-- Function to check if a column exists
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

-- Add basic loan application columns (skip if they exist)
DO $$
BEGIN
    -- Add loan_type column if it doesn't exist
    IF NOT column_exists('loan_applications', 'loan_type') THEN
        ALTER TABLE loan_applications ADD COLUMN loan_type VARCHAR(50);
        CREATE INDEX IF NOT EXISTS idx_loan_applications_loan_type ON loan_applications(loan_type);
    END IF;

    -- Add requested_amount column if it doesn't exist
    IF NOT column_exists('loan_applications', 'requested_amount') THEN
        ALTER TABLE loan_applications ADD COLUMN requested_amount DECIMAL(12,2);
    END IF;

    -- Add purpose column if it doesn't exist
    IF NOT column_exists('loan_applications', 'purpose') THEN
        ALTER TABLE loan_applications ADD COLUMN purpose TEXT;
    END IF;

    -- Add annual_income column if it doesn't exist
    IF NOT column_exists('loan_applications', 'annual_income') THEN
        ALTER TABLE loan_applications ADD COLUMN annual_income DECIMAL(12,2);
        CREATE INDEX IF NOT EXISTS idx_loan_applications_annual_income ON loan_applications(annual_income);
    END IF;

    -- Add employment_status column if it doesn't exist
    IF NOT column_exists('loan_applications', 'employment_status') THEN
        ALTER TABLE loan_applications ADD COLUMN employment_status VARCHAR(50);
        CREATE INDEX IF NOT EXISTS idx_loan_applications_employment_status ON loan_applications(employment_status);
    END IF;

    -- Add application_status column if it doesn't exist
    IF NOT column_exists('loan_applications', 'application_status') THEN
        ALTER TABLE loan_applications ADD COLUMN application_status VARCHAR(50) DEFAULT 'draft';
        CREATE INDEX IF NOT EXISTS idx_loan_applications_application_status ON loan_applications(application_status);
        
        -- Update existing null values
        UPDATE loan_applications SET application_status = 'draft' WHERE application_status IS NULL;
        
        -- Add CHECK constraint for valid statuses
        ALTER TABLE loan_applications 
        ADD CONSTRAINT chk_application_status_valid 
        CHECK (application_status IN ('draft', 'pending', 'under_review', 'approved', 'rejected', 'cancelled'));
    END IF;

    -- Add personal loan specific columns
    IF NOT column_exists('loan_applications', 'credit_score') THEN
        ALTER TABLE loan_applications ADD COLUMN credit_score INTEGER;
        CREATE INDEX IF NOT EXISTS idx_loan_applications_credit_score ON loan_applications(credit_score);
    END IF;

    IF NOT column_exists('loan_applications', 'monthly_expenses') THEN
        ALTER TABLE loan_applications ADD COLUMN monthly_expenses DECIMAL(12,2);
    END IF;

    -- Add home loan specific columns
    IF NOT column_exists('loan_applications', 'property_value') THEN
        ALTER TABLE loan_applications ADD COLUMN property_value DECIMAL(12,2);
    END IF;

    IF NOT column_exists('loan_applications', 'down_payment') THEN
        ALTER TABLE loan_applications ADD COLUMN down_payment DECIMAL(12,2);
    END IF;

    IF NOT column_exists('loan_applications', 'property_type') THEN
        ALTER TABLE loan_applications ADD COLUMN property_type VARCHAR(50);
    END IF;

    IF NOT column_exists('loan_applications', 'property_address') THEN
        ALTER TABLE loan_applications ADD COLUMN property_address TEXT;
    END IF;

    -- Add auto loan specific columns
    IF NOT column_exists('loan_applications', 'vehicle_year') THEN
        ALTER TABLE loan_applications ADD COLUMN vehicle_year INTEGER;
    END IF;

    IF NOT column_exists('loan_applications', 'vehicle_make') THEN
        ALTER TABLE loan_applications ADD COLUMN vehicle_make VARCHAR(100);
    END IF;

    IF NOT column_exists('loan_applications', 'vehicle_model') THEN
        ALTER TABLE loan_applications ADD COLUMN vehicle_model VARCHAR(100);
    END IF;

    IF NOT column_exists('loan_applications', 'vehicle_price') THEN
        ALTER TABLE loan_applications ADD COLUMN vehicle_price DECIMAL(12,2);
    END IF;

    IF NOT column_exists('loan_applications', 'trade_in_value') THEN
        ALTER TABLE loan_applications ADD COLUMN trade_in_value DECIMAL(12,2);
    END IF;

    -- Add education loan specific columns
    IF NOT column_exists('loan_applications', 'school_name') THEN
        ALTER TABLE loan_applications ADD COLUMN school_name VARCHAR(200);
    END IF;

    IF NOT column_exists('loan_applications', 'program') THEN
        ALTER TABLE loan_applications ADD COLUMN program VARCHAR(200);
    END IF;

    IF NOT column_exists('loan_applications', 'graduation_date') THEN
        ALTER TABLE loan_applications ADD COLUMN graduation_date DATE;
    END IF;

    IF NOT column_exists('loan_applications', 'tuition_cost') THEN
        ALTER TABLE loan_applications ADD COLUMN tuition_cost DECIMAL(12,2);
    END IF;

    -- Add system columns if they don't exist
    IF NOT column_exists('loan_applications', 'submitted_date') THEN
        ALTER TABLE loan_applications ADD COLUMN submitted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        CREATE INDEX IF NOT EXISTS idx_loan_applications_submitted_date ON loan_applications(submitted_date);
    END IF;

    IF NOT column_exists('loan_applications', 'approved_amount') THEN
        ALTER TABLE loan_applications ADD COLUMN approved_amount DECIMAL(12,2);
    END IF;

    IF NOT column_exists('loan_applications', 'approved_term_months') THEN
        ALTER TABLE loan_applications ADD COLUMN approved_term_months INTEGER;
    END IF;

END $$;

-- Add constraints and defaults after all columns are added
DO $$
BEGIN
    -- Add CHECK constraint for loan_type if it doesn't exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'loan_applications' AND column_name = 'loan_type'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_loan_type_valid' 
        AND conrelid = 'loan_applications'::regclass
    ) THEN
        ALTER TABLE loan_applications 
        ADD CONSTRAINT chk_loan_type_valid 
        CHECK (loan_type IN ('personal', 'home', 'auto', 'business', 'education', 'other'));
    END IF;

    -- Set default for loan_type if it doesn't have one
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'loan_applications' 
        AND column_name = 'loan_type' 
        AND column_default IS NULL
    ) THEN
        ALTER TABLE loan_applications 
        ALTER COLUMN loan_type SET DEFAULT 'personal';
    END IF;

    -- Set default for application_status if it doesn't have one
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'loan_applications' 
        AND column_name = 'application_status' 
        AND column_default IS NULL
    ) THEN
        ALTER TABLE loan_applications 
        ALTER COLUMN application_status SET DEFAULT 'draft';
    END IF;

END $$;

-- Add comments to document the columns
COMMENT ON COLUMN loan_applications.loan_type IS 'Type of loan: personal, home, auto, business, education, other';
COMMENT ON COLUMN loan_applications.requested_amount IS 'Amount of loan requested by applicant';
COMMENT ON COLUMN loan_applications.purpose IS 'Purpose or reason for the loan';
COMMENT ON COLUMN loan_applications.annual_income IS 'Annual income of the applicant';
COMMENT ON COLUMN loan_applications.employment_status IS 'Current employment status of applicant';
COMMENT ON COLUMN loan_applications.application_status IS 'Current status of application: draft, pending, under_review, approved, rejected, cancelled';
COMMENT ON COLUMN loan_applications.credit_score IS 'Credit score of applicant (personal loans)';
COMMENT ON COLUMN loan_applications.monthly_expenses IS 'Monthly expenses of applicant (personal loans)';
COMMENT ON COLUMN loan_applications.property_value IS 'Value of property being purchased (home loans)';
COMMENT ON COLUMN loan_applications.down_payment IS 'Down payment amount (home loans)';
COMMENT ON COLUMN loan_applications.property_type IS 'Type of property: house, condo, townhouse, etc. (home loans)';
COMMENT ON COLUMN loan_applications.property_address IS 'Address of property being purchased (home loans)';
COMMENT ON COLUMN loan_applications.vehicle_year IS 'Year of vehicle (auto loans)';
COMMENT ON COLUMN loan_applications.vehicle_make IS 'Make/manufacturer of vehicle (auto loans)';
COMMENT ON COLUMN loan_applications.vehicle_model IS 'Model of vehicle (auto loans)';
COMMENT ON COLUMN loan_applications.vehicle_price IS 'Price of vehicle (auto loans)';
COMMENT ON COLUMN loan_applications.trade_in_value IS 'Trade-in value of existing vehicle (auto loans)';
COMMENT ON COLUMN loan_applications.school_name IS 'Name of educational institution (education loans)';
COMMENT ON COLUMN loan_applications.program IS 'Program or degree being pursued (education loans)';
COMMENT ON COLUMN loan_applications.graduation_date IS 'Expected graduation date (education loans)';
COMMENT ON COLUMN loan_applications.tuition_cost IS 'Total tuition cost (education loans)';

-- Verify all columns exist
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'loan_applications' 
ORDER BY ordinal_position;