-- Create mobile_deposits table without RLS
CREATE TABLE IF NOT EXISTS public.mobile_deposits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    check_front_image_url TEXT NOT NULL,
    check_back_image_url TEXT NOT NULL,
    check_number TEXT,
    memo TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    deposit_date DATE DEFAULT CURRENT_DATE,
    estimated_clearing_date DATE,
    actual_clearing_date DATE,
    processing_fee DECIMAL(10,2) DEFAULT 0,
    daily_limit_remaining DECIMAL(15,2),
    monthly_limit_remaining DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mobile_deposits_user_id ON public.mobile_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_deposits_account_id ON public.mobile_deposits(account_id);
CREATE INDEX IF NOT EXISTS idx_mobile_deposits_status ON public.mobile_deposits(status);
CREATE INDEX IF NOT EXISTS idx_mobile_deposits_deposit_date ON public.mobile_deposits(deposit_date);
CREATE INDEX IF NOT EXISTS idx_mobile_deposits_created_at ON public.mobile_deposits(created_at);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Create trigger for updated_at column
DROP TRIGGER IF EXISTS update_mobile_deposits_updated_at ON public.mobile_deposits;
CREATE TRIGGER update_mobile_deposits_updated_at 
    BEFORE UPDATE ON public.mobile_deposits 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions (no RLS - leave it open)
GRANT ALL ON public.mobile_deposits TO authenticated;
GRANT ALL ON public.mobile_deposits TO service_role;
GRANT ALL ON public.mobile_deposits TO anon;