// Script to run the card migration directly through Supabase
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running card limits migration...');
    
    // Add missing columns to card_limits table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.card_limits 
        ADD COLUMN IF NOT EXISTS daily_purchase_limit DECIMAL(10,2) DEFAULT 5000.00,
        ADD COLUMN IF NOT EXISTS daily_withdrawal_limit DECIMAL(10,2) DEFAULT 1000.00,
        ADD COLUMN IF NOT EXISTS monthly_limit DECIMAL(10,2) DEFAULT 50000.00,
        ADD COLUMN IF NOT EXISTS daily_spent DECIMAL(10,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS daily_withdrawn DECIMAL(10,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS monthly_spent DECIMAL(10,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS international_transactions_enabled BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS online_transactions_enabled BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS contactless_enabled BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS atm_withdrawals_enabled BOOLEAN DEFAULT TRUE;

        ALTER TABLE public.cards
        ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
      `
    });

    if (alterError) {
      console.error('Error altering tables:', alterError);
      throw alterError;
    }

    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();