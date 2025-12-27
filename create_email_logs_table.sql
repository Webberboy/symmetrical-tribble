-- Create email_logs table for tracking email sending history
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id),
    recipients TEXT[] NOT NULL,
    subject TEXT NOT NULL,
    content_preview TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'partial', 'failed')),
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_email_logs_admin_id ON public.email_logs(admin_id);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);

-- Grant permissions
GRANT ALL ON public.email_logs TO authenticated;
GRANT SELECT ON public.email_logs TO service_role;

-- Add RLS policies
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all email logs
CREATE POLICY "Admins can view all email logs" ON public.email_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin 
            WHERE public.admin.id = auth.uid()
        )
    );

-- Allow admins to insert email logs
CREATE POLICY "Admins can insert email logs" ON public.email_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin 
            WHERE public.admin.id = auth.uid()
        )
    );

-- Allow admins to update email logs
CREATE POLICY "Admins can update email logs" ON public.email_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admin 
            WHERE public.admin.id = auth.uid()
        )
    );