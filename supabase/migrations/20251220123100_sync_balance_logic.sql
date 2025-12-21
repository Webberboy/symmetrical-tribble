-- Create a function to sync balances between accounts and profiles tables
-- This ensures consistency between the two balance storage locations

CREATE OR REPLACE FUNCTION public.sync_account_balances_to_profile()
RETURNS TRIGGER AS $func$
BEGIN
    -- Only sync if the balance actually changed
    IF NEW.balance IS DISTINCT FROM OLD.balance THEN
        IF NEW.account_type = 'checking' THEN
            UPDATE public.profiles 
            SET checking_balance = NEW.balance,
                updated_at = NOW()
            WHERE id = NEW.user_id;
        ELSIF NEW.account_type = 'savings' THEN
            UPDATE public.profiles 
            SET savings_balance = NEW.balance,
                updated_at = NOW()
            WHERE id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Create trigger to automatically sync balances when accounts are updated
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_account_balances') THEN
        CREATE TRIGGER sync_account_balances
            AFTER UPDATE OF balance ON public.accounts
            FOR EACH ROW
            EXECUTE FUNCTION public.sync_account_balances_to_profile();
    END IF;
END $$;

-- Create a function to initialize profile balances from existing accounts
-- This is useful for existing users who already have accounts
CREATE OR REPLACE FUNCTION public.initialize_profile_balances()
RETURNS VOID AS $func$
BEGIN
    -- Update checking balance in profiles from checking accounts
    UPDATE public.profiles p
    SET checking_balance = COALESCE(
        (SELECT a.balance 
         FROM public.accounts a 
         WHERE a.user_id = p.id AND a.account_type = 'checking' 
         LIMIT 1), 0.00
    )
    WHERE EXISTS (
        SELECT 1 FROM public.accounts a2 
        WHERE a2.user_id = p.id AND a2.account_type = 'checking'
    );

    -- Update savings balance in profiles from savings accounts
    UPDATE public.profiles p
    SET savings_balance = COALESCE(
        (SELECT a.balance 
         FROM public.accounts a 
         WHERE a.user_id = p.id AND a.account_type = 'savings' 
         LIMIT 1), 0.00
    )
    WHERE EXISTS (
        SELECT 1 FROM public.accounts a2 
        WHERE a2.user_id = p.id AND a2.account_type = 'savings'
    );
END;
$func$ LANGUAGE plpgsql;

-- Run the initialization function for existing data
SELECT public.initialize_profile_balances();