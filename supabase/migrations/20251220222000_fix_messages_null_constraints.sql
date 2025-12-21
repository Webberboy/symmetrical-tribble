-- Fix messages table null constraints to work with Support page
-- This migration fixes the NOT NULL constraints that are causing insert failures

-- Make title column nullable since we're using subject instead
ALTER TABLE public.messages ALTER COLUMN title DROP NOT NULL;

-- Make content column nullable since we're using message instead  
ALTER TABLE public.messages ALTER COLUMN content DROP NOT NULL;

-- Ensure the new columns have proper constraints
ALTER TABLE public.messages ALTER COLUMN subject SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN message SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN user_id SET NOT NULL;

-- Set default values for existing records that might be missing data
UPDATE public.messages SET 
    subject = COALESCE(subject, title, 'No Subject'),
    message = COALESCE(message, content, 'No Message'),
    category = COALESCE(category, 'General'),
    status = COALESCE(status, 'pending'),
    user_id = COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)
WHERE subject IS NULL OR message IS NULL OR category IS NULL OR status IS NULL OR user_id IS NULL;

-- Create a trigger to automatically copy subject to title if title is needed for backward compatibility
CREATE OR REPLACE FUNCTION sync_subject_to_title()
RETURNS TRIGGER AS $$
BEGIN
    -- If title is null but subject exists, copy subject to title
    IF NEW.title IS NULL AND NEW.subject IS NOT NULL THEN
        NEW.title := NEW.subject;
    END IF;
    
    -- If content is null but message exists, copy message to content
    IF NEW.content IS NULL AND NEW.message IS NOT NULL THEN
        NEW.content := NEW.message;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger 
                  WHERE tgname = 'sync_subject_to_title' AND tgrelid = 'public.messages'::regclass) THEN
        CREATE TRIGGER sync_subject_to_title
            BEFORE INSERT OR UPDATE ON public.messages
            FOR EACH ROW
            EXECUTE FUNCTION sync_subject_to_title();
    END IF;
END $$;

-- Verify the fix
SELECT column_name, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;