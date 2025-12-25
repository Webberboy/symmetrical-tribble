-- =====================================================
-- WIRE TRANSFER BLOCKING FUNCTIONALITY - COMPLETE SQL
-- =====================================================

-- 1. Add wire_transfers_blocked field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wire_transfers_blocked BOOLEAN DEFAULT FALSE;

-- 2. Add comment for documentation
COMMENT ON COLUMN public.profiles.wire_transfers_blocked IS 'Prevents user from initiating new wire transfers when set to TRUE';

-- 3. Update existing profiles to have wire_transfers_blocked = FALSE
UPDATE public.profiles 
SET wire_transfers_blocked = FALSE 
WHERE wire_transfers_blocked IS NULL;

-- 4. Create index for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_profiles_wire_transfers_blocked 
ON public.profiles(wire_transfers_blocked) 
WHERE wire_transfers_blocked = TRUE;

-- =====================================================
-- ADMIN QUERIES FOR WIRE TRANSFER MANAGEMENT
-- =====================================================

-- Block wire transfers for a specific user
-- UPDATE public.profiles 
-- SET wire_transfers_blocked = TRUE 
-- WHERE id = 'user-id-here';

-- Unblock wire transfers for a user
-- UPDATE public.profiles 
-- SET wire_transfers_blocked = FALSE 
-- WHERE id = 'user-id-here';

-- Get all users with blocked wire transfers
SELECT id, email, first_name, last_name, wire_transfers_blocked 
FROM public.profiles 
WHERE wire_transfers_blocked = TRUE
ORDER BY last_name, first_name;

-- Get wire transfer status summary
SELECT 
    CASE 
        WHEN wire_transfers_blocked = TRUE THEN 'BLOCKED'
        ELSE 'ALLOWED'
    END as wire_transfer_status,
    COUNT(*) as user_count
FROM public.profiles 
GROUP BY wire_transfers_blocked
ORDER BY user_count DESC;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify column exists and has correct default
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'wire_transfers_blocked';

-- Check for any NULL values (should be 0 after running the update)
SELECT COUNT(*) as null_count 
FROM public.profiles 
WHERE wire_transfers_blocked IS NULL;

-- Sample user data with wire transfer status
SELECT 
    id, 
    email, 
    first_name, 
    last_name,
    CASE 
        WHEN wire_transfers_blocked = TRUE THEN 'BLOCKED'
        ELSE 'ALLOWED'
    END as wire_transfer_status,
    updated_at
FROM public.profiles 
LIMIT 10;