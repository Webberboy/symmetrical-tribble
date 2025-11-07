-- =====================================================
-- DISABLE EMAIL CONFIRMATION FOR TESTING (OPTIONAL)
-- =====================================================

-- This allows users to sign up without email confirmation
-- ONLY USE THIS FOR DEVELOPMENT/TESTING

-- To disable email confirmation, go to:
-- Supabase Dashboard > Authentication > Settings > Email Auth
-- Toggle "Confirm email" to OFF

-- Alternatively, you can run this SQL to check auth settings:
SELECT * FROM auth.config;

-- To allow auto-confirm in development, you can set this in your Supabase dashboard
-- or use the dashboard UI to toggle email confirmation off.

-- NOTE: In production, you should always require email confirmation for security!
