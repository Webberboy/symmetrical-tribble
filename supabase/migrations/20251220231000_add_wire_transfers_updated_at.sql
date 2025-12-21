-- ==============================================
-- ADD UPDATED_AT COLUMN TO WIRE_TRANSFERS TABLE
-- ==============================================

-- Add updated_at column to wire_transfers table
ALTER TABLE public.wire_transfers 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_wire_transfers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_wire_transfers_updated_at_trigger ON public.wire_transfers;

CREATE TRIGGER update_wire_transfers_updated_at_trigger
    BEFORE UPDATE ON public.wire_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_wire_transfers_updated_at();

-- Update existing records to set updated_at to created_at if null
UPDATE public.wire_transfers 
SET updated_at = created_at 
WHERE updated_at IS NULL;