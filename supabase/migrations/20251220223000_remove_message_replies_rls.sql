-- Remove RLS policies from message_replies table to fix authorization issues
-- This migration removes all RLS policies that are preventing message replies from being inserted

-- Remove existing RLS policies from message_replies table
DO $$
BEGIN
    -- Remove "Users can view replies to own messages" policy
    IF EXISTS (SELECT 1 FROM pg_policies 
              WHERE tablename = 'message_replies' AND policyname = 'Users can view replies to own messages') THEN
        DROP POLICY "Users can view replies to own messages" ON public.message_replies;
    END IF;
    
    -- Remove "Users can insert replies to own messages" policy
    IF EXISTS (SELECT 1 FROM pg_policies 
              WHERE tablename = 'message_replies' AND policyname = 'Users can insert replies to own messages') THEN
        DROP POLICY "Users can insert replies to own messages" ON public.message_replies;
    END IF;
    
    -- Remove "Admins can view all message replies" policy
    IF EXISTS (SELECT 1 FROM pg_policies 
              WHERE tablename = 'message_replies' AND policyname = 'Admins can view all message replies') THEN
        DROP POLICY "Admins can view all message replies" ON public.message_replies;
    END IF;
    
    -- Remove "Admins can reply to any message" policy
    IF EXISTS (SELECT 1 FROM pg_policies 
              WHERE tablename = 'message_replies' AND policyname = 'Admins can reply to any message') THEN
        DROP POLICY "Admins can reply to any message" ON public.message_replies;
    END IF;
END $$;

-- Disable RLS on message_replies table
ALTER TABLE public.message_replies DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to authenticated users
GRANT ALL ON public.message_replies TO authenticated;
GRANT SELECT ON public.message_replies TO anon;

-- Verify the changes
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'message_replies';

SELECT policyname 
FROM pg_policies 
WHERE tablename = 'message_replies';