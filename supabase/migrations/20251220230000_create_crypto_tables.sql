-- Create crypto_wallet_metadata table
CREATE TABLE IF NOT EXISTS crypto_wallet_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id UUID REFERENCES crypto_wallets(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    private_key_encrypted TEXT,
    mnemonic_encrypted TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create crypto_assets table
CREATE TABLE IF NOT EXISTS crypto_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    decimals INTEGER NOT NULL DEFAULT 18,
    contract_address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create crypto_transactions table
CREATE TABLE IF NOT EXISTS crypto_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES crypto_wallets(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES crypto_assets(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'transfer', 'receive')),
    amount DECIMAL(30, 18) NOT NULL,
    price_at_transaction DECIMAL(20, 8) NOT NULL,
    total_value DECIMAL(20, 8) NOT NULL,
    transaction_hash TEXT,
    from_address TEXT,
    to_address TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    network_fee DECIMAL(20, 18) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default crypto assets
INSERT INTO crypto_assets (symbol, name, decimals, contract_address) VALUES
    ('BTC', 'Bitcoin', 8, NULL),
    ('ETH', 'Ethereum', 18, NULL),
    ('USDT', 'Tether', 6, NULL),
    ('BNB', 'Binance Coin', 18, NULL),
    ('SOL', 'Solana', 9, NULL),
    ('ADA', 'Cardano', 6, NULL),
    ('XRP', 'Ripple', 6, NULL),
    ('DOGE', 'Dogecoin', 8, NULL),
    ('MATIC', 'Polygon', 18, NULL),
    ('USDC', 'USD Coin', 6, NULL)
ON CONFLICT (symbol) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crypto_wallet_metadata_wallet_id ON crypto_wallet_metadata(wallet_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_user_id ON crypto_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_wallet_id ON crypto_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_asset_id ON crypto_transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_created_at ON crypto_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_assets_symbol ON crypto_assets(symbol);

-- Enable RLS
ALTER TABLE crypto_wallet_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for crypto_wallet_metadata
CREATE POLICY "Users can view their own wallet metadata" ON crypto_wallet_metadata
    FOR SELECT USING (
        wallet_id IN (
            SELECT id FROM crypto_wallets WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own wallet metadata" ON crypto_wallet_metadata
    FOR INSERT WITH CHECK (
        wallet_id IN (
            SELECT id FROM crypto_wallets WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own wallet metadata" ON crypto_wallet_metadata
    FOR UPDATE USING (
        wallet_id IN (
            SELECT id FROM crypto_wallets WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for crypto_assets (read-only for users)
CREATE POLICY "Users can view all active crypto assets" ON crypto_assets
    FOR SELECT USING (is_active = true);

-- Create RLS policies for crypto_transactions
CREATE POLICY "Users can view their own crypto transactions" ON crypto_transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own crypto transactions" ON crypto_transactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own crypto transactions" ON crypto_transactions
    FOR UPDATE USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT ON crypto_wallet_metadata TO authenticated;
GRANT INSERT ON crypto_wallet_metadata TO authenticated;
GRANT UPDATE ON crypto_wallet_metadata TO authenticated;
GRANT SELECT ON crypto_assets TO authenticated;
GRANT SELECT ON crypto_transactions TO authenticated;
GRANT INSERT ON crypto_transactions TO authenticated;
GRANT UPDATE ON crypto_transactions TO authenticated;