-- Add wire_transfers_blocked field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wire_transfers_blocked BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.wire_transfers_blocked IS 'Prevents user from initiating new wire transfers when set to TRUE';

-- Update existing profiles to have wire_transfers_blocked = FALSE
UPDATE public.profiles 
SET wire_transfers_blocked = FALSE 
WHERE wire_transfers_blocked IS NULL;