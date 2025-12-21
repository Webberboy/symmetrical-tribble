-- Fix message_replies table to match Support page requirements
-- This migration updates the message_replies table to have the columns expected by the Support page

-- Add missing columns to message_replies table
DO $$ 
BEGIN 
    -- Add sender_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'message_replies' AND column_name = 'sender_type') THEN
        ALTER TABLE public.message_replies ADD COLUMN sender_type TEXT DEFAULT 'user';
    END IF;
    
    -- Ensure message_id column exists and references messages table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'message_replies' AND column_name = 'message_id') THEN
        ALTER TABLE public.message_replies ADD COLUMN message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE;
    END IF;
    
    -- Ensure user_id column exists and references profiles table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'message_replies' AND column_name = 'user_id') THEN
        ALTER TABLE public.message_replies ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
    -- Ensure content column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'message_replies' AND column_name = 'content') THEN
        ALTER TABLE public.message_replies ADD COLUMN content TEXT;
    END IF;
    
    -- Add created_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'message_replies' AND column_name = 'created_at') THEN
        ALTER TABLE public.message_replies ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add is_internal if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'message_replies' AND column_name = 'is_internal') THEN
        ALTER TABLE public.message_replies ADD COLUMN is_internal BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add RLS policies for message_replies table if they don't exist
DO $$ 
BEGIN 
    -- Enable RLS if not already enabled
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'message_replies' AND rowsecurity = true) THEN
        ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Allow users to view replies to their own messages
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                  WHERE tablename = 'message_replies' AND policyname = 'Users can view replies to own messages') THEN
        CREATE POLICY "Users can view replies to own messages" ON public.message_replies 
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.messages 
                    WHERE messages.id = message_replies.message_id 
                    AND messages.user_id = auth.uid()
                )
            );
    END IF;
    
    -- Allow users to insert replies to their own messages
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                  WHERE tablename = 'message_replies' AND policyname = 'Users can insert replies to own messages') THEN
        CREATE POLICY "Users can insert replies to own messages" ON public.message_replies 
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.messages 
                    WHERE messages.id = message_replies.message_id 
                    AND messages.user_id = auth.uid()
                )
                AND message_replies.user_id = auth.uid()
            );
    END IF;
    
    -- Allow admins to view all message replies
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                  WHERE tablename = 'message_replies' AND policyname = 'Admins can view all message replies') THEN
        CREATE POLICY "Admins can view all message replies" ON public.message_replies 
            FOR SELECT USING (EXISTS ( 
                SELECT 1 FROM public.admin WHERE email = auth.email() AND is_active = true 
            ));
    END IF;
    
    -- Allow admins to insert replies to any message
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                  WHERE tablename = 'message_replies' AND policyname = 'Admins can reply to any message') THEN
        CREATE POLICY "Admins can reply to any message" ON public.message_replies 
            FOR INSERT WITH CHECK (EXISTS ( 
                SELECT 1 FROM public.admin WHERE email = auth.email() AND is_active = true 
            ));
    END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.message_replies TO authenticated;
GRANT SELECT ON public.message_replies TO anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_replies_message_id ON public.message_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_message_replies_user_id ON public.message_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_message_replies_created_at ON public.message_replies(created_at DESC);

-- Verify the table structure
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'message_replies' 
ORDER BY ordinal_position;