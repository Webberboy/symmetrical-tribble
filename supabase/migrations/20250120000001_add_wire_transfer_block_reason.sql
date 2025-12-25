-- Add wire_transfer_block_reason field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wire_transfer_block_reason TEXT DEFAULT NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.wire_transfer_block_reason IS 'Reason for blocking wire transfers, stored when wire_transfers_blocked is set to TRUE';

-- Update existing profiles to have wire_transfer_block_reason = NULL (already default)
UPDATE public.profiles 
SET wire_transfer_block_reason = NULL 
WHERE wire_transfer_block_reason IS NULL;

-- Create index for efficient querying of blocked accounts with reasons
CREATE INDEX IF NOT EXISTS idx_profiles_wire_transfer_block_reason 
ON public.profiles(wire_transfer_block_reason) 
WHERE wire_transfer_block_reason IS NOT NULL;

-- Example queries for testing and verification
-- View all blocked accounts with their reasons
SELECT id, email, first_name, last_name, wire_transfers_blocked, wire_transfer_block_reason 
FROM public.profiles 
WHERE wire_transfers_blocked = TRUE;

-- View accounts blocked with specific reasons
SELECT id, email, first_name, last_name, wire_transfer_block_reason 
FROM public.profiles 
WHERE wire_transfer_block_reason IS NOT NULL 
ORDER BY wire_transfer_block_reason;

-- Verify column exists and has correct properties
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'wire_transfer_block_reason';

-- Grant necessary permissions (assuming RLS is already set up)
-- This ensures the column can be updated by authenticated users with proper permissions
GRANT UPDATE (wire_transfer_block_reason) ON public.profiles TO authenticated;
GRANT SELECT (wire_transfer_block_reason) ON public.profiles TO authenticated;