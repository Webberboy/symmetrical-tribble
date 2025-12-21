-- Set the welcome email webhook URL for the database
-- This enables the webhook trigger to call the edge function

ALTER DATABASE postgres SET app.welcome_email_webhook_url = 'https://jovrfejbutfrzvclchuf.supabase.co/functions/v1/send-welcome-email';

-- Also set the service role key for authentication
ALTER DATABASE postgres SET app.supabase_service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdnJmZWpidWZyenZjbGNodWYiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzM0NTU5NTk5LCJleHAiOjIwNTAxMzU1OTl9.3I3CQgN5PHb5smnH5l4WiUe0e5KN7b5S6z0gBcTo9So';

-- Verify the settings
SELECT current_setting('app.welcome_email_webhook_url', true) as webhook_url;
SELECT current_setting('app.supabase_service_role_key', true) as service_role_key;