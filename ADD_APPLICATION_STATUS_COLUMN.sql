-- Add application_status column to loan_applications table
ALTER TABLE loan_applications 
ADD COLUMN IF NOT EXISTS application_status VARCHAR(50) DEFAULT 'draft' 
CHECK (application_status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn', 'cancelled'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_loan_applications_application_status ON loan_applications(application_status);

-- Update existing records to set default status if null
UPDATE loan_applications 
SET application_status = 'draft' 
WHERE application_status IS NULL;