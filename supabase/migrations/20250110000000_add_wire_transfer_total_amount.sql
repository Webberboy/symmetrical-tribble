-- Migration: Add total_amount field to wire_transfers table
-- Description: Adds total_amount field to store the total amount including fees

-- First, ensure fees column exists (it might be missing in some table versions)
ALTER TABLE public.wire_transfers 
ADD COLUMN IF NOT EXISTS fees DECIMAL(10,2) DEFAULT 0.00;

-- Add total_amount field to wire_transfers table
ALTER TABLE public.wire_transfers 
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0.00;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_wire_transfers_total_amount ON public.wire_transfers(total_amount);

-- Update existing wire transfers to calculate total_amount from amount + fees
UPDATE public.wire_transfers 
SET total_amount = COALESCE(amount, 0) + COALESCE(fees, 0)
WHERE total_amount = 0.00 OR total_amount IS NULL;

-- Add comment to document the field
COMMENT ON COLUMN public.wire_transfers.total_amount IS 'Total amount including wire transfer fees';

-- Create function to automatically calculate total_amount when amount or fees change
CREATE OR REPLACE FUNCTION calculate_wire_transfer_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount = COALESCE(NEW.amount, 0) + COALESCE(NEW.fees, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate total_amount on inserts and updates
DROP TRIGGER IF EXISTS calculate_wire_transfer_total_trigger ON public.wire_transfers;

CREATE TRIGGER calculate_wire_transfer_total_trigger
    BEFORE INSERT OR UPDATE OF amount, fees ON public.wire_transfers
    FOR EACH ROW
    EXECUTE FUNCTION calculate_wire_transfer_total();