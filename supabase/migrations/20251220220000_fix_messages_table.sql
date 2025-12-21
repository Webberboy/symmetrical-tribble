-- Fix messages table to match Support page requirements
-- This migration updates the messages table to have the columns expected by the Support page

-- Add missing columns to messages table
DO $$ 
BEGIN 
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'category') THEN
        ALTER TABLE public.messages ADD COLUMN category TEXT;
    END IF;
    
    -- Add subject column if it doesn't exist (rename from title if needed)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'subject') THEN
        ALTER TABLE public.messages ADD COLUMN subject TEXT;
        
        -- Copy data from title to subject if title exists
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'title') THEN
            UPDATE public.messages SET subject = title WHERE subject IS NULL;
        END IF;
    END IF;
    
    -- Add message column if it doesn't exist (rename from content if needed)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'message') THEN
        ALTER TABLE public.messages ADD COLUMN message TEXT;
        
        -- Copy data from content to message if content exists
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'content') THEN
            UPDATE public.messages SET message = content WHERE message IS NULL;
        END IF;
    END IF;
    
    -- Add status column with 'pending' default if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'status') THEN
        ALTER TABLE public.messages ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    
    -- Ensure user_id column exists and references profiles table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'user_id') THEN
        ALTER TABLE public.messages ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
    -- Add created_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'created_at') THEN
        ALTER TABLE public.messages ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'updated_at') THEN
        ALTER TABLE public.messages ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create updated_at trigger for messages table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger 
                  WHERE tgname = 'update_messages_updated_at' AND tgrelid = 'public.messages'::regclass) THEN
        CREATE TRIGGER update_messages_updated_at
            BEFORE UPDATE ON public.messages
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Add RLS policies for messages table if they don't exist
DO $$ 
BEGIN 
    -- Enable RLS if not already enabled
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'messages' AND rowsecurity = true) THEN
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Allow users to view their own messages
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                  WHERE tablename = 'messages' AND policyname = 'Users can view own messages') THEN
        CREATE POLICY "Users can view own messages" ON public.messages 
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    -- Allow users to insert their own messages
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                  WHERE tablename = 'messages' AND policyname = 'Users can insert own messages') THEN
        CREATE POLICY "Users can insert own messages" ON public.messages 
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Allow admins to view all messages
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                  WHERE tablename = 'messages' AND policyname = 'Admins can view all messages') THEN
        CREATE POLICY "Admins can view all messages" ON public.messages 
            FOR SELECT USING (EXISTS ( 
                SELECT 1 FROM public.admin WHERE email = auth.email() AND is_active = true 
            ));
    END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT SELECT ON public.messages TO anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_category ON public.messages(category);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Verify the table structure
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;