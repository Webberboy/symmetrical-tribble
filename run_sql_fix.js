// Script to run SQL fix using the Supabase dashboard URL
import fs from 'fs';

// Read the SQL file
const sqlContent = fs.readFileSync('./fix_card_limits_simple.sql', 'utf8');

console.log('🎯 Card Limits Fix SQL Script');
console.log('='.repeat(50));
console.log('');
console.log('To fix the 400 error when creating cards, you need to run this SQL in your Supabase dashboard:');
console.log('');
console.log('📋 SQL to execute:');
console.log('-'.repeat(30));
console.log(sqlContent);
console.log('-'.repeat(30));
console.log('');
console.log('🔗 Steps to run this SQL:');
console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
console.log('2. Navigate to your project: jovrfejbutfrzvclchuf');
console.log('3. Click on "SQL Editor" in the left sidebar');
console.log('4. Paste the SQL above into the editor');
console.log('5. Click "RUN" to execute the SQL');
console.log('');
console.log('Alternatively, you can use the direct URL:');
console.log('https://supabase.com/dashboard/project/jovrfejbutfrzvclchuf/sql');
console.log('');
console.log('✅ After running this SQL, the card creation 400 error should be resolved.');