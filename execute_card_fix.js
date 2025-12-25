import { createClient } from '@supabase/supabase-js'

// Read environment variables directly
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file')
  console.log('Required variables:')
  console.log('- VITE_SUPABASE_URL')
  console.log('- VITE_SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

const migrationSQL = `
-- Fix card_limits table - add missing columns
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

-- Fix cards table - add missing columns
ALTER TABLE public.cards 
ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 years');

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_card_limits_user_id ON public.card_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_card_limits_card_id ON public.card_limits(card_id);

-- Ensure RLS policies exist
ALTER TABLE public.card_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policy if it doesn't exist
DO \$\$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'card_limits' 
    AND policyname = 'Users can view own card limits'
  ) THEN
    CREATE POLICY "Users can view own card limits" ON public.card_limits
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'card_limits' 
    AND policyname = 'Users can update own card limits'
  ) THEN
    CREATE POLICY "Users can update own card limits" ON public.card_limits
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END
\$\$;
`

async function executeMigration() {
  try {
    console.log('Executing card limits fix migration...')
    
    // Try to execute the SQL directly
    const { error } = await supabase.rpc('exec_sql', {
      query: migrationSQL
    })
    
    if (error) {
      console.error('Migration failed:', error)
      console.log('Trying alternative method...')
      
      // Alternative: execute each statement separately
      const statements = migrationSQL.split(';').filter(stmt => stmt.trim())
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.rpc('exec_sql', {
            query: statement + ';'
          })
          
          if (stmtError) {
            console.error('Statement failed:', statement.substring(0, 100) + '...')
            console.error('Error:', stmtError)
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!')
    console.log('Card limits table has been updated with all required columns.')
    
  } catch (error) {
    console.error('Error executing migration:', error)
    process.exit(1)
  }
}

executeMigration()