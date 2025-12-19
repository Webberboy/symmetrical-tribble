-- Unity Capital Member Signup Tables
-- Based on actual code analysis from SignUp.tsx, VerifyEmailOTP.tsx, and accountUtils.ts

-- Main user profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    country_code TEXT DEFAULT '+1',
    date_of_birth DATE,
    ssn TEXT,
    street_address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'United States',
    account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'business')),
    account_number TEXT UNIQUE NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0.00,
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended')),
    id_document_uploaded BOOLEAN DEFAULT FALSE,
    id_document_data TEXT, -- Base64 encoded document data
    id_document_filename TEXT,
    id_document_type TEXT,
    id_document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles table
CREATE TABLE user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Bank accounts table
CREATE TABLE accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_number TEXT UNIQUE NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'business')),
    account_name TEXT NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0.00,
    available_balance DECIMAL(12,2) DEFAULT 0.00,
    interest_rate DECIMAL(5,4) DEFAULT 0.0000,
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Temporary signup data storage for email verification
CREATE TABLE pending_signups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    signup_data JSONB NOT NULL, -- Stores complete signup form data including ID documents
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
    UNIQUE(auth_user_id)
);

-- Indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_account_number ON profiles(account_number);
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_account_number ON accounts(account_number);
CREATE INDEX idx_accounts_account_type ON accounts(account_type);
CREATE INDEX idx_pending_signups_auth_user_id ON pending_signups(auth_user_id);
CREATE INDEX idx_pending_signups_email ON pending_signups(email);
CREATE INDEX idx_pending_signups_expires_at ON pending_signups(expires_at);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_signups ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON profiles FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- User roles policies
CREATE POLICY "Users can view own role" ON user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage roles" ON user_roles FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Accounts policies
CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage accounts" ON accounts FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Pending signups policies
CREATE POLICY "Users can manage own pending signup" ON pending_signups FOR ALL
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Service role can manage pending signups" ON pending_signups FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON user_roles TO authenticated;
GRANT ALL ON accounts TO authenticated;
GRANT ALL ON pending_signups TO authenticated;

-- Function to generate unique account numbers (Unity Capital format: 401-25-XXXXXXX)
CREATE OR REPLACE FUNCTION generate_unique_account_number()
RETURNS TEXT AS $$
DECLARE
    new_account_number TEXT;
    attempts INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    WHILE attempts < max_attempts LOOP
        -- Unity Capital format: 401 (bank) + 25 (branch) + 7 random digits
        new_account_number := '40125' || LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
        
        -- Check if account number already exists in profiles
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE account_number = new_account_number) THEN
            RETURN new_account_number;
        END IF;
        
        attempts := attempts + 1;
    END LOOP;
    
    RAISE EXCEPTION 'Failed to generate unique account number after % attempts', max_attempts;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired pending signups
CREATE OR REPLACE FUNCTION cleanup_expired_pending_signups()
RETURNS VOID AS $$
BEGIN
    DELETE FROM pending_signups WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Scheduled cleanup job (run this periodically)
-- SELECT cron.schedule('cleanup-pending-signups', '0 2 * * *', 'SELECT cleanup_expired_pending_signups();');

-- Optional: Email notification tracking (recommended)
CREATE TABLE email_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL CHECK (email_type IN ('welcome', 'otp', 'verification', 'login_notification')),
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_type TEXT UNIQUE NOT NULL CHECK (template_type IN ('welcome', 'otp', 'verification', 'login_notification')),
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions for email tables
GRANT ALL ON email_notifications TO authenticated;
GRANT ALL ON email_templates TO authenticated;

-- Insert default email templates
INSERT INTO email_templates (template_type, subject, html_content, text_content) VALUES
('welcome', 'Welcome to Unity Capital!', 
'<h1>Welcome to Unity Capital!</h1><p>Dear {{first_name}},</p><p>Your account has been successfully created. Your account number is: <strong>{{account_number}}</strong></p><p>Thank you for choosing Unity Capital!</p>',
'Welcome to Unity Capital! Dear {{first_name}}, Your account has been successfully created. Your account number is: {{account_number}}. Thank you for choosing Unity Capital!');