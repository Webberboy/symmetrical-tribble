-- Add missing loan_type column to loan_applications table
-- This addresses the schema cache error for 'loan_type' column

-- Add the loan_type column as TEXT to match application expectations
ALTER TABLE loan_applications 
ADD COLUMN IF NOT EXISTS loan_type VARCHAR(50);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_loan_applications_loan_type ON loan_applications(loan_type);

-- Update existing records to set loan_type based on loan_type_id if possible
-- This assumes you have loan_types table with corresponding data
UPDATE loan_applications 
SET loan_type = (
    SELECT CASE 
        WHEN lt.name = 'Personal Loan' THEN 'personal'
        WHEN lt.name = 'Home Loan' THEN 'home'
        WHEN lt.name = 'Car Loan' THEN 'auto'
        WHEN lt.name = 'Business Loan' THEN 'business'
        WHEN lt.name = 'Education Loan' THEN 'education'
        ELSE 'personal' -- default fallback
    END
    FROM loan_types lt 
    WHERE lt.id = loan_applications.loan_type_id
)
WHERE loan_type IS NULL AND loan_type_id IS NOT NULL;

-- Set default value for new records
ALTER TABLE loan_applications 
ALTER COLUMN loan_type SET DEFAULT 'personal';

-- Add CHECK constraint for valid loan types
ALTER TABLE loan_applications 
ADD CONSTRAINT chk_loan_type_valid 
CHECK (loan_type IN ('personal', 'home', 'auto', 'business', 'education', 'other'));

-- Create a function to automatically set loan_type from loan_type_id if needed
CREATE OR REPLACE FUNCTION sync_loan_type_from_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If loan_type is not provided but loan_type_id is, try to sync it
    IF NEW.loan_type IS NULL AND NEW.loan_type_id IS NOT NULL THEN
        NEW.loan_type := (
            SELECT CASE 
                WHEN lt.name = 'Personal Loan' THEN 'personal'
                WHEN lt.name = 'Home Loan' THEN 'home'
                WHEN lt.name = 'Car Loan' THEN 'auto'
                WHEN lt.name = 'Business Loan' THEN 'business'
                WHEN lt.name = 'Education Loan' THEN 'education'
                ELSE 'personal'
            END
            FROM loan_types lt 
            WHERE lt.id = NEW.loan_type_id
        );
    END IF;
    
    -- If neither is provided, default to 'personal'
    IF NEW.loan_type IS NULL AND NEW.loan_type_id IS NULL THEN
        NEW.loan_type := 'personal';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync loan_type
CREATE TRIGGER sync_loan_type_trigger
    BEFORE INSERT OR UPDATE ON loan_applications
    FOR EACH ROW
    EXECUTE FUNCTION sync_loan_type_from_id();

-- Add comment to document the column
COMMENT ON COLUMN loan_applications.loan_type IS 'Loan type category: personal, home, auto, business, education, other';

-- Verify the changes
SELECT table_name, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'loan_applications' 
AND column_name = 'loan_type';