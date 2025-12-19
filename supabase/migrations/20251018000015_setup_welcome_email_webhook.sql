-- =====================================================
-- WELCOME EMAIL WEBHOOK SETUP
-- =====================================================
-- This migration sets up the webhook to trigger the welcome email edge function

-- Create the webhook function that calls the edge function
CREATE OR REPLACE FUNCTION public.trigger_welcome_email_webhook()
RETURNS TRIGGER AS $$
DECLARE
    webhook_url TEXT;
    payload JSONB;
    result INT;
BEGIN
    -- Only trigger for new profiles with complete data
    IF NEW.full_name IS NOT NULL AND NEW.email IS NOT NULL AND NEW.account_number IS NOT NULL THEN
        -- Build the webhook URL (this will be set in Supabase dashboard)
        webhook_url := COALESCE(current_setting('app.welcome_email_webhook_url', true), 'https://your-project-ref.supabase.co/functions/v1/send-welcome-email');
        
        -- Build the payload
        payload := jsonb_build_object(
            'type', 'INSERT',
            'table', 'profiles',
            'schema', 'public',
            'record', jsonb_build_object(
                'id', NEW.id,
                'email', NEW.email,
                'first_name', NEW.first_name,
                'full_name', NEW.full_name,
                'account_number', NEW.account_number,
                'created_at', NEW.created_at
            ),
            'old_record', NULL
        );
        
        -- Log the webhook call (you can uncomment the actual HTTP call when deploying)
        RAISE NOTICE 'Welcome email webhook would be triggered for user: %', NEW.email;
        
        -- In production, you would make the actual HTTP call here
        -- result := http_post(webhook_url, payload::text, 'application/json');
        
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_welcome_email_webhook ON public.profiles;

-- Create the webhook trigger
CREATE TRIGGER trigger_welcome_email_webhook
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    WHEN (NEW.full_name IS NOT NULL AND NEW.email IS NOT NULL AND NEW.account_number IS NOT NULL)
    EXECUTE FUNCTION public.trigger_welcome_email_webhook();

-- =====================================================
-- WEBHOOK CONFIGURATION INSTRUCTIONS
-- =====================================================
-- After running this migration, you need to set up the webhook in Supabase:
--
-- 1. Go to Supabase Dashboard > Database > Webhooks
-- 2. Create a new webhook:
--    - Table: profiles
--    - Events: INSERT
--    - URL: https://your-project-ref.supabase.co/functions/v1/send-welcome-email
--    - Headers: Add your function secret if needed
--    - Enable: Toggle ON
--
-- 3. The webhook will automatically trigger when a new profile is created
--    with complete user data (full_name, email, account_number)

-- Alternative: You can also set up a database trigger that makes HTTP calls
-- using the pg_http extension (if enabled on your Supabase project)

-- Example of setting the webhook URL as a database setting:
-- ALTER DATABASE your_database_name SET app.welcome_email_webhook_url = 'https://your-project-ref.supabase.co/functions/v1/send-welcome-email';