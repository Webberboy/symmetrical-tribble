// Test script to verify transactions and wire_transfers tables are accessible
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTableAccess() {
  console.log('Testing transactions table access...');
  
  try {
    // Test 1: Query transactions table
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);
    
    if (transactionsError) {
      console.error('❌ Transactions table error:', transactionsError);
    } else {
      console.log('✅ Transactions table accessible');
      console.log('   Found', transactions?.length || 0, 'transactions');
    }
    
    // Test 2: Query wire_transfers table
    console.log('\nTesting wire_transfers table access...');
    const { data: wireTransfers, error: wireTransfersError } = await supabase
      .from('wire_transfers')
      .select('*')
      .limit(1);
    
    if (wireTransfersError) {
      console.error('❌ Wire transfers table error:', wireTransfersError);
    } else {
      console.log('✅ Wire transfers table accessible');
      console.log('   Found', wireTransfers?.length || 0, 'wire transfers');
    }
    
    // Test 3: Try to insert a test record (this might fail due to constraints, but should not be RLS)
    console.log('\nTesting insert access to transactions...');
    const { error: insertError } = await supabase
      .from('transactions')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        type: 'debit',
        amount: 0.01,
        merchant: 'Test Merchant',
        category: 'Test',
        status: 'completed'
      });
    
    if (insertError) {
      if (insertError.code === '42501') {
        console.error('❌ RLS still blocking inserts:', insertError);
      } else {
        console.log('✅ Insert attempted (failed due to constraints, not RLS):', insertError.message);
      }
    } else {
      console.log('✅ Insert successful');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testTableAccess();