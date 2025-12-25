// Simple script to fix card limits table
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials:');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
  console.log('VITE_SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✅ Found' : '❌ Missing');
  process.exit(1);
}

console.log('🚀 Connecting to Supabase...');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    }
  }
});

async function fixCardLimits() {
  try {
    console.log('🔧 Fixing card_limits table...');
    
    // Add missing columns to card_limits table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE public.card_limits 
        ADD COLUMN IF NOT EXISTS daily_purchase_limit DECIMAL(10,2) DEFAULT 5000.00,
        ADD COLUMN IF NOT EXISTS daily_withdrawal_limit DECIMAL(10,2) DEFAULT 1000.00,
        ADD COLUMN IF NOT EXISTS monthly_limit DECIMAL(10,2) DEFAULT 20000.00,
        ADD COLUMN IF NOT EXISTS daily_spent DECIMAL(10,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS daily_withdrawn DECIMAL(10,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS monthly_spent DECIMAL(10,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS international_transactions_enabled BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS online_transactions_enabled BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS contactless_enabled BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS atm_withdrawals_enabled BOOLEAN DEFAULT true;
      `
    });

    if (alterError) {
      console.error('❌ Error adding columns to card_limits:', alterError);
      return;
    }

    console.log('✅ Successfully added columns to card_limits table');

    // Fix cards table
    console.log('🔧 Fixing cards table...');
    
    const { error: cardsError } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE public.cards 
        ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 years');
      `
    });

    if (cardsError) {
      console.error('❌ Error adding columns to cards:', cardsError);
      return;
    }

    console.log('✅ Successfully added columns to cards table');
    
    console.log('🎉 Migration completed successfully!');
    console.log('The card creation 400 error should now be resolved.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixCardLimits();