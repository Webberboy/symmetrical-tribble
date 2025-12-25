-- Complete Wire Transfer Blocking System with Reasons
-- This file contains all SQL needed for wire transfer blocking with reasons

-- 1. Add wire_transfers_blocked field to profiles table (if not exists)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wire_transfers_blocked BOOLEAN DEFAULT FALSE;

-- 2. Add wire_transfer_block_reason field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wire_transfer_block_reason TEXT DEFAULT NULL;

-- 3. Add comments to document the columns
COMMENT ON COLUMN public.profiles.wire_transfers_blocked IS 'Prevents user from initiating new wire transfers when set to TRUE';
COMMENT ON COLUMN public.profiles.wire_transfer_block_reason IS 'Reason for blocking wire transfers, stored when wire_transfers_blocked is set to TRUE';

-- 4. Update existing profiles to have proper defaults
UPDATE public.profiles 
SET wire_transfers_blocked = FALSE, wire_transfer_block_reason = NULL 
WHERE wire_transfers_blocked IS NULL OR wire_transfer_block_reason IS NULL;

-- 5. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_wire_transfers_blocked
ON public.profiles(wire_transfers_blocked)
WHERE wire_transfers_blocked = TRUE;

CREATE INDEX IF NOT EXISTS idx_profiles_wire_transfer_block_reason 
ON public.profiles(wire_transfer_block_reason) 
WHERE wire_transfer_block_reason IS NOT NULL;

-- 6. Grant necessary permissions for authenticated users
GRANT UPDATE (wire_transfers_blocked, wire_transfer_block_reason) ON public.profiles TO authenticated;
GRANT SELECT (wire_transfers_blocked, wire_transfer_block_reason) ON public.profiles TO authenticated;

-- 7. Create a function to safely block/unblock wire transfers with reasons
CREATE OR REPLACE FUNCTION public.set_wire_transfer_block_status(
    user_id UUID,
    block_status BOOLEAN,
    block_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles 
    SET 
        wire_transfers_blocked = block_status,
        wire_transfer_block_reason = CASE 
            WHEN block_status = TRUE THEN block_reason 
            ELSE NULL 
        END
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.set_wire_transfer_block_status(UUID, BOOLEAN, TEXT) TO authenticated;

-- 9. Example usage queries

-- Block wire transfers with reason
-- SELECT public.set_wire_transfer_block_status('user-uuid-here', TRUE, 'Reached daily limit');

-- Unblock wire transfers (reason will be automatically cleared)
-- SELECT public.set_wire_transfer_block_status('user-uuid-here', FALSE);

-- View all blocked accounts with their reasons
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    wire_transfers_blocked, 
    wire_transfer_block_reason,
    created_at,
    updated_at
FROM public.profiles 
WHERE wire_transfers_blocked = TRUE
ORDER BY updated_at DESC;

-- View accounts blocked with specific reasons
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    wire_transfer_block_reason,
    updated_at
FROM public.profiles 
WHERE wire_transfer_block_reason IS NOT NULL 
ORDER BY wire_transfer_block_reason, updated_at DESC;

-- Get statistics on block reasons
SELECT 
    wire_transfer_block_reason,
    COUNT(*) as blocked_count,
    MAX(updated_at) as last_blocked
FROM public.profiles 
WHERE wire_transfer_block_reason IS NOT NULL 
GROUP BY wire_transfer_block_reason
ORDER BY blocked_count DESC;

-- Verify the complete setup
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('wire_transfers_blocked', 'wire_transfer_block_reason')
ORDER BY column_name;

-- Check if indexes exist
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'profiles' 
AND (indexname LIKE '%wire_transfers_blocked%' OR indexname LIKE '%wire_transfer_block_reason%');