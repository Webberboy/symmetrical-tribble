-- Add ban columns to profiles table immediately 
-- This will fix the admin dashboard user loading issue 

-- Add is_banned and ban_reason columns to profiles table 
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE, 
ADD COLUMN IF NOT EXISTS ban_reason TEXT DEFAULT NULL; 

-- Update existing profiles to ensure they have the new columns 
UPDATE public.profiles 
SET is_banned = FALSE, ban_reason = NULL WHERE is_banned IS NULL; 

-- Also add the messages table if it doesn't exist 
CREATE TABLE IF NOT EXISTS public.messages ( 
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, 
    title TEXT NOT NULL, 
    content TEXT NOT NULL, 
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'pending')), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() 
); 

-- Add RLS policies for messages table 
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY; 

-- Allow users to see their own messages 
CREATE POLICY "Users can view own messages" ON public.messages 
    FOR SELECT USING (auth.uid() = user_id); 

-- Allow admins to see all messages 
CREATE POLICY "Admins can view all messages" ON public.messages 
    FOR SELECT USING (EXISTS ( 
        SELECT 1 FROM public.admin WHERE email = auth.email() AND is_active = true 
    )); 

-- Grant necessary permissions 
GRANT SELECT ON public.messages TO anon, authenticated; 
GRANT INSERT ON public.messages TO authenticated; 

-- Verify the changes 
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name IN ('is_banned', 'ban_reason'); 

SELECT COUNT(*) as total_profiles, 
       COUNT(CASE WHEN is_banned = true THEN 1 END) as banned_profiles 
FROM public.profiles;