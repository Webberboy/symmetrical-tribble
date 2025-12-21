-- Remove RLS policies for crypto tables to make them open access

-- Disable RLS on crypto_wallet_metadata
ALTER TABLE crypto_wallet_metadata DISABLE ROW LEVEL SECURITY;

-- Disable RLS on crypto_wallets
ALTER TABLE crypto_wallets DISABLE ROW LEVEL SECURITY;

-- Disable RLS on crypto_assets
ALTER TABLE crypto_assets DISABLE ROW LEVEL SECURITY;

-- Disable RLS on crypto_transactions
ALTER TABLE crypto_transactions DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies on crypto tables
DROP POLICY IF EXISTS "Users can view their own wallet metadata" ON crypto_wallet_metadata;
DROP POLICY IF EXISTS "Users can insert their own wallet metadata" ON crypto_wallet_metadata;
DROP POLICY IF EXISTS "Users can update their own wallet metadata" ON crypto_wallet_metadata;

DROP POLICY IF EXISTS "Users can view their own crypto wallets" ON crypto_wallets;
DROP POLICY IF EXISTS "Users can insert their own crypto wallets" ON crypto_wallets;
DROP POLICY IF EXISTS "Users can update their own crypto wallets" ON crypto_wallets;

DROP POLICY IF EXISTS "Users can view all active crypto assets" ON crypto_assets;

DROP POLICY IF EXISTS "Users can view their own crypto transactions" ON crypto_transactions;
DROP POLICY IF EXISTS "Users can insert their own crypto transactions" ON crypto_transactions;
DROP POLICY IF EXISTS "Users can update their own crypto transactions" ON crypto_transactions;

-- Grant all permissions to authenticated users
GRANT ALL ON crypto_wallet_metadata TO authenticated;
GRANT ALL ON crypto_wallets TO authenticated;
GRANT ALL ON crypto_assets TO authenticated;
GRANT ALL ON crypto_transactions TO authenticated;

-- Grant all permissions to anon users (if needed for testing)
GRANT ALL ON crypto_wallet_metadata TO anon;
GRANT ALL ON crypto_wallets TO anon;
GRANT ALL ON crypto_assets TO anon;
GRANT ALL ON crypto_transactions TO anon;