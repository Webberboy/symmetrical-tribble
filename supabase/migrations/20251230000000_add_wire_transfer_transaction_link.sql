-- Migration: Add wire transfer transaction link
-- Description: Adds transaction_id field to wire_transfers table to link wire transfers with their corresponding transaction records

-- Add transaction_id field to wire_transfers table
ALTER TABLE public.wire_transfers 
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_wire_transfers_transaction_id ON public.wire_transfers(transaction_id);

-- Update existing wire transfers to link to their corresponding transactions
-- This assumes the transaction was created with the same user_id, amount, and around the same time
UPDATE public.wire_transfers wt
SET transaction_id = (
    SELECT t.id 
    FROM public.transactions t 
    WHERE t.user_id = wt.user_id 
    AND t.amount = wt.amount 
    AND t.category = 'wire_transfer'
    AND t.created_at BETWEEN wt.created_at - INTERVAL '5 minutes' AND wt.created_at + INTERVAL '5 minutes'
    ORDER BY t.created_at DESC 
    LIMIT 1
)
WHERE wt.transaction_id IS NULL;