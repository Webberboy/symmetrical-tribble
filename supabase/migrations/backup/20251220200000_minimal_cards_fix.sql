-- Minimal cards fix - add missing columns and ensure cards functionality

-- Add user_id column to card_transactions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_transactions' 
                  AND column_name = 'user_id') THEN
        ALTER TABLE public.card_transactions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add user_id column to card_freeze_history if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_freeze_history' 
                  AND column_name = 'user_id') THEN
        ALTER TABLE public.card_freeze_history ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add user_id column to card_statements if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_statements' 
                  AND column_name = 'user_id') THEN
        ALTER TABLE public.card_statements ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_card_transactions_user_id ON public.card_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_card_freeze_history_user_id ON public.card_freeze_history(user_id);
CREATE INDEX IF NOT EXISTS idx_card_statements_user_id ON public.card_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_card_statements_card_id ON public.card_statements(card_id);
CREATE INDEX IF NOT EXISTS idx_card_limits_card_id ON public.card_limits(card_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at columns if they don't exist and create triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'cards' 
                  AND column_name = 'updated_at') THEN
        ALTER TABLE public.cards ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        CREATE TRIGGER update_cards_updated_at 
            BEFORE UPDATE ON public.cards 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_limits' 
                  AND column_name = 'updated_at') THEN
        ALTER TABLE public.card_limits ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        CREATE TRIGGER update_card_limits_updated_at 
            BEFORE UPDATE ON public.card_limits 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'card_statements' 
                  AND column_name = 'updated_at') THEN
        ALTER TABLE public.card_statements ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        CREATE TRIGGER update_card_statements_updated_at 
            BEFORE UPDATE ON public.card_statements 
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;