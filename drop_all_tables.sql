-- ============================================ 
-- DROP ALL TABLES FOR HERITAGE BANKING APPLICATION 
-- ============================================ 

-- Drop tables in reverse order to handle foreign key constraints

-- Drop indexes first (optional, as dropping tables will drop their indexes)
DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_profiles_account_number;
DROP INDEX IF EXISTS idx_transactions_user_id;
DROP INDEX IF EXISTS idx_transactions_created_at;
DROP INDEX IF EXISTS idx_transactions_type;
DROP INDEX IF EXISTS idx_accounts_user_id;
DROP INDEX IF EXISTS idx_accounts_account_type;
DROP INDEX IF EXISTS idx_cards_user_id;
DROP INDEX IF EXISTS idx_cards_card_status;
DROP INDEX IF EXISTS idx_card_transactions_user_id;
DROP INDEX IF EXISTS idx_card_transactions_card_id;
DROP INDEX IF EXISTS idx_bills_user_id;
DROP INDEX IF EXISTS idx_bill_payments_user_id;
DROP INDEX IF EXISTS idx_loans_user_id;
DROP INDEX IF EXISTS idx_loan_applications_user_id;
DROP INDEX IF EXISTS idx_loan_payments_user_id;
DROP INDEX IF EXISTS idx_portfolios_user_id;
DROP INDEX IF EXISTS idx_stock_transactions_user_id;
DROP INDEX IF EXISTS idx_crypto_transactions_user_id;
DROP INDEX IF EXISTS idx_admin_users_user_id;
DROP INDEX IF EXISTS idx_statements_user_id;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS trigger_update_accounts_updated_at ON accounts;
DROP TRIGGER IF EXISTS trigger_update_cards_updated_at ON cards;

-- Drop trigger functions
DROP FUNCTION IF EXISTS update_profiles_updated_at();
DROP FUNCTION IF EXISTS update_accounts_updated_at();
DROP FUNCTION IF EXISTS update_cards_updated_at();
DROP FUNCTION IF EXISTS is_user_admin(UUID);
DROP FUNCTION IF EXISTS generate_monthly_statement(UUID, UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS save_portfolio_snapshot(UUID);

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own cards" ON cards;
DROP POLICY IF EXISTS "Users can update own cards" ON cards;
DROP POLICY IF EXISTS "Users can view own card transactions" ON card_transactions;
DROP POLICY IF EXISTS "Users can view own bills" ON bills;
DROP POLICY IF EXISTS "Users can manage own bills" ON bills;
DROP POLICY IF EXISTS "Users can view own bill payments" ON bill_payments;
DROP POLICY IF EXISTS "Users can create own bill payments" ON bill_payments;
DROP POLICY IF EXISTS "Users can view own loans" ON loans;
DROP POLICY IF EXISTS "Users can create own loans" ON loans;
DROP POLICY IF EXISTS "Users can view own loan applications" ON loan_applications;
DROP POLICY IF EXISTS "Users can create own loan applications" ON loan_applications;
DROP POLICY IF EXISTS "Users can view own loan payments" ON loan_payments;
DROP POLICY IF EXISTS "Users can create own loan payments" ON loan_payments;
DROP POLICY IF EXISTS "Users can view own portfolio" ON portfolios;
DROP POLICY IF EXISTS "Users can manage own portfolio" ON portfolios;
DROP POLICY IF EXISTS "Users can view own stock transactions" ON stock_transactions;
DROP POLICY IF EXISTS "Users can create own stock transactions" ON stock_transactions;
DROP POLICY IF EXISTS "Users can view own crypto transactions" ON crypto_transactions;
DROP POLICY IF EXISTS "Users can create own crypto transactions" ON crypto_transactions;
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS statements CASCADE;
DROP TABLE IF EXISTS auto_pay_setups CASCADE;
DROP TABLE IF EXISTS card_statements CASCADE;
DROP TABLE IF EXISTS card_freeze_history CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS crypto_transactions CASCADE;
DROP TABLE IF EXISTS stock_transactions CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS loan_payments CASCADE;
DROP TABLE IF EXISTS loan_applications CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS bill_payments CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS card_transactions CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Note: CASCADE will automatically drop dependent objects
-- If you want to be more explicit, you can run the above commands individually