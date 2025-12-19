-- Fix pending_signups permissions for the signup process
-- This migration allows authenticated users to create their own pending signup records

-- Allow authenticated users to insert their own pending signup (INSERT)
CREATE POLICY "Users can create own pending signup" ON public.pending_signups FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

-- Grant INSERT permissions explicitly for pending_signups
GRANT INSERT ON public.pending_signups TO authenticated;