-- Create investment-related tables for the dashboard
-- These tables are used by the Investment component and stock trading features

-- Create stock_market_data table
CREATE TABLE IF NOT EXISTS public.stock_market_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    current_price DECIMAL(10,2) NOT NULL,
    day_change DECIMAL(10,2) DEFAULT 0.00,
    day_change_percent DECIMAL(5,2) DEFAULT 0.00,
    volume BIGINT DEFAULT 0,
    market_cap BIGINT,
    sector VARCHAR(100),
    industry VARCHAR(100),
    exchange VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'USD',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create stock_transactions table
CREATE TABLE IF NOT EXISTS public.stock_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'dividend')),
    symbol VARCHAR(10) NOT NULL,
    shares DECIMAL(10,4) NOT NULL CHECK (shares > 0),
    price_per_share DECIMAL(10,2) NOT NULL CHECK (price_per_share > 0),
    total_amount DECIMAL(12,2) NOT NULL,
    fees DECIMAL(10,2) DEFAULT 0.00,
    net_amount DECIMAL(12,2) NOT NULL,
    order_type VARCHAR(20) DEFAULT 'market' CHECK (order_type IN ('market', 'limit', 'stop')),
    limit_price DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_stock_portfolio table (for current holdings)
CREATE TABLE IF NOT EXISTS public.user_stock_portfolio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    shares DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    average_cost_basis DECIMAL(10,2) DEFAULT 0.00,
    total_invested DECIMAL(12,2) DEFAULT 0.00,
    current_value DECIMAL(12,2) DEFAULT 0.00,
    unrealized_gain_loss DECIMAL(12,2) DEFAULT 0.00,
    unrealized_gain_loss_percent DECIMAL(5,2) DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, symbol)
);

-- Create indexes for stock_market_data table
CREATE INDEX IF NOT EXISTS idx_stock_market_data_symbol ON public.stock_market_data(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_market_data_sector ON public.stock_market_data(sector);
CREATE INDEX IF NOT EXISTS idx_stock_market_data_last_updated ON public.stock_market_data(last_updated DESC);

-- Create indexes for stock_transactions table
CREATE INDEX IF NOT EXISTS idx_stock_transactions_user_id ON public.stock_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_symbol ON public.stock_transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_transaction_date ON public.stock_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_transaction_type ON public.stock_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_status ON public.stock_transactions(status);

-- Create indexes for user_stock_portfolio table
CREATE INDEX IF NOT EXISTS idx_user_stock_portfolio_user_id ON public.user_stock_portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stock_portfolio_symbol ON public.user_stock_portfolio(symbol);
CREATE INDEX IF NOT EXISTS idx_user_stock_portfolio_last_updated ON public.user_stock_portfolio(last_updated DESC);

-- Create updated_at triggers
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_stock_market_data_updated_at') THEN
        CREATE TRIGGER update_stock_market_data_updated_at
            BEFORE UPDATE ON public.stock_market_data
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_stock_transactions_updated_at') THEN
        CREATE TRIGGER update_stock_transactions_updated_at
            BEFORE UPDATE ON public.stock_transactions
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_stock_portfolio_updated_at') THEN
        CREATE TRIGGER update_user_stock_portfolio_updated_at
            BEFORE UPDATE ON public.user_stock_portfolio
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.stock_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stock_portfolio ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stock_market_data table (public read access)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_market_data' AND policyname = 'Anyone can view market data') THEN
        CREATE POLICY "Anyone can view market data" ON public.stock_market_data
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- Create RLS policies for stock_transactions table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_transactions' AND policyname = 'Users can view own stock transactions') THEN
        CREATE POLICY "Users can view own stock transactions" ON public.stock_transactions
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_transactions' AND policyname = 'Users can insert own stock transactions') THEN
        CREATE POLICY "Users can insert own stock transactions" ON public.stock_transactions
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Create RLS policies for user_stock_portfolio table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stock_portfolio' AND policyname = 'Users can view own portfolio') THEN
        CREATE POLICY "Users can view own portfolio" ON public.user_stock_portfolio
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stock_portfolio' AND policyname = 'Users can insert own portfolio') THEN
        CREATE POLICY "Users can insert own portfolio" ON public.user_stock_portfolio
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stock_portfolio' AND policyname = 'Users can update own portfolio') THEN
        CREATE POLICY "Users can update own portfolio" ON public.user_stock_portfolio
            FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
END $$;