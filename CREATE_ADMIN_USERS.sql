-- Admin Creation Helper Script
-- Use this script to create new admin users in the admin table

-- Create a new admin user
INSERT INTO public.admin (email, password_hash, role, is_active)
VALUES (
    'admin@yourdomain.com',  -- Change this to your desired email
    crypt('YourSecurePassword123!', gen_salt('bf')),  -- Change this to your desired password
    'super_admin',  -- Role can be 'admin' or 'super_admin'
    true
) ON CONFLICT (email) DO NOTHING;

-- Example: Create multiple admins
-- INSERT INTO public.admin (email, password_hash, role, is_active)
-- VALUES 
--     ('admin1@yourdomain.com', crypt('Admin123!', gen_salt('bf')), 'admin', true),
--     ('admin2@yourdomain.com', crypt('Admin456!', gen_salt('bf')), 'super_admin', true)
-- ON CONFLICT (email) DO NOTHING;

-- List all existing admins
SELECT id, email, role, is_active, last_login, created_at 
FROM public.admin 
ORDER BY created_at DESC;

-- Update admin password
-- UPDATE public.admin 
-- SET password_hash = crypt('NewPassword123!', gen_salt('bf'))
-- WHERE email = 'admin@yourdomain.com';

-- Deactivate an admin
-- UPDATE public.admin 
-- SET is_active = false
-- WHERE email = 'admin@yourdomain.com';

-- Delete an admin
-- DELETE FROM public.admin 
-- WHERE email = 'admin@yourdomain.com';