-- Fix crypto_wallet_metadata table structure to match application expectations

-- Make wallet_address nullable since the app doesn't provide it during wallet creation
ALTER TABLE crypto_wallet_metadata 
ALTER COLUMN wallet_address DROP NOT NULL;

-- Add recovery_phrase_hash column that the app expects
ALTER TABLE crypto_wallet_metadata 
ADD COLUMN IF NOT EXISTS recovery_phrase_hash TEXT;

-- Create index for recovery_phrase_hash for better performance
CREATE INDEX IF NOT EXISTS idx_crypto_wallet_metadata_recovery_phrase_hash ON crypto_wallet_metadata(recovery_phrase_hash);