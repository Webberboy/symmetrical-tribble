-- Welcome Email Webhook Trigger Setup
-- This migration creates a trigger that calls the welcome email edge function when a new profile is created

-- Create function to trigger welcome email webhook
CREATE OR REPLACE FUNCTION public.trigger_welcome_email_webhook()
RETURNS TRIGGER AS $$
DECLARE
    webhook_url text;
    payload jsonb;
    response text;
BEGIN
    -- Get the webhook URL from environment or use default
    webhook_url := COALESCE(current_setting('app.welcome_email_webhook_url', true), 'https://jovrfejbutfrzvclchuf.supabase.co/functions/v1/send-welcome-email');
    
    -- Prepare the webhook payload
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
        'old_record', null
    );
    
    -- Log the webhook call
    RAISE NOTICE 'Sending welcome email webhook for user: %', NEW.email;
    
    -- Call the webhook (asynchronous - doesn't block the insert)
    BEGIN
        PERFORM net.http_post(
            url := webhook_url,
            body := payload::text,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || COALESCE(current_setting('app.supabase_service_role_key', true), '')
            ),
            timeout_milliseconds := 10000
        );
        
        RAISE NOTICE 'Welcome email webhook sent successfully for user: %', NEW.email;
    EXCEPTION
        WHEN OTHERS THEN
            -- Log error but don't fail the profile creation
            RAISE WARNING 'Failed to send welcome email webhook for user %: %', NEW.email, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_welcome_email_webhook ON public.profiles;

-- Create the trigger
CREATE TRIGGER trigger_welcome_email_webhook
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_welcome_email_webhook();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.trigger_welcome_email_webhook() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_welcome_email_webhook() TO anon;
GRANT EXECUTE ON FUNCTION public.trigger_welcome_email_webhook() TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.trigger_welcome_email_webhook() IS 'Triggers welcome email edge function when a new profile is created';
COMMENT ON TRIGGER trigger_welcome_email_webhook ON public.profiles IS 'Automatically sends welcome email when a new profile is inserted';

-- Set the webhook URL for this project
-- ALTER DATABASE postgres SET app.welcome_email_webhook_url = 'https://jovrfejbutfrzvclchuf.supabase.co/functions/v1/send-welcome-email';