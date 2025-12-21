-- Add missing columns to crypto tables

-- Add transaction_date column to crypto_transactions table
ALTER TABLE crypto_transactions 
ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add recovery_phrase_hash column to crypto_wallet_metadata table  
ALTER TABLE crypto_wallet_metadata 
ADD COLUMN IF NOT EXISTS recovery_phrase_hash TEXT;

-- Update existing records to have transaction_date if missing
UPDATE crypto_transactions 
SET transaction_date = created_at 
WHERE transaction_date IS NULL;

-- Create index for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_transaction_date ON crypto_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_wallet_metadata_recovery_phrase_hash ON crypto_wallet_metadata(recovery_phrase_hash);