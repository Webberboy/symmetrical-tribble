-- Fix crypto_wallet_metadata table by adding missing columns

-- Add user_id column to crypto_wallet_metadata table
ALTER TABLE crypto_wallet_metadata 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add wallet_name column to crypto_wallet_metadata table
ALTER TABLE crypto_wallet_metadata 
ADD COLUMN IF NOT EXISTS wallet_name TEXT DEFAULT 'My Wallet';

-- Update existing records to have user_id if wallet_id exists
UPDATE crypto_wallet_metadata 
SET user_id = (
    SELECT user_id FROM crypto_wallets WHERE crypto_wallets.id = crypto_wallet_metadata.wallet_id LIMIT 1
)
WHERE user_id IS NULL AND wallet_id IS NOT NULL;

-- Create index for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_crypto_wallet_metadata_user_id ON crypto_wallet_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_wallet_metadata_wallet_name ON crypto_wallet_metadata(wallet_name);

-- Update RLS policies to use user_id directly
DROP POLICY IF EXISTS "Users can view their own wallet metadata" ON crypto_wallet_metadata;
DROP POLICY IF EXISTS "Users can insert their own wallet metadata" ON crypto_wallet_metadata;
DROP POLICY IF EXISTS "Users can update their own wallet metadata" ON crypto_wallet_metadata;

-- Create new RLS policies using user_id
CREATE POLICY "Users can view their own wallet metadata" ON crypto_wallet_metadata
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own wallet metadata" ON crypto_wallet_metadata
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own wallet metadata" ON crypto_wallet_metadata
    FOR UPDATE USING (user_id = auth.uid());