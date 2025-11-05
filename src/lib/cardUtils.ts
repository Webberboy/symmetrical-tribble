import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch all cards for a specific user
 */
export async function fetchUserCards(userId: string) {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch a specific card by ID
 */
export async function fetchCardById(cardId: string) {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch card transactions for a specific card
 */
export async function fetchCardTransactions(cardId: string, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('card_transactions')
      .select('*')
      .eq('card_id', cardId)
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch all card transactions for a user
 */
export async function fetchUserCardTransactions(userId: string, limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('card_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Freeze a card
 */
export async function freezeCard(cardId: string, userId: string, reason?: string) {
  try {
    // Update card status
    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .update({
        is_frozen: true,
        freeze_reason: reason || 'User requested freeze',
        frozen_at: new Date().toISOString(),
        card_status: 'frozen'
      })
      .eq('id', cardId)
      .eq('user_id', userId)
      .select()
      .single();

    if (cardError) {
      throw cardError;
    }

    // Log freeze action in history
    const { error: historyError } = await supabase
      .from('card_freeze_history')
      .insert({
        card_id: cardId,
        user_id: userId,
        action: 'freeze',
        reason: reason || 'User requested freeze',
        freeze_type: 'user_requested',
        initiated_by: 'user'
      });

    if (historyError) {
    }

    return cardData;
  } catch (error) {
    throw error;
  }
}

/**
 * Unfreeze a card
 */
export async function unfreezeCard(cardId: string, userId: string) {
  try {
    // Update card status
    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .update({
        is_frozen: false,
        freeze_reason: null,
        frozen_at: null,
        card_status: 'active'
      })
      .eq('id', cardId)
      .eq('user_id', userId)
      .select()
      .single();

    if (cardError) {
      throw cardError;
    }

    // Log unfreeze action in history
    const { error: historyError } = await supabase
      .from('card_freeze_history')
      .insert({
        card_id: cardId,
        user_id: userId,
        action: 'unfreeze',
        reason: 'User requested unfreeze',
        freeze_type: 'user_requested',
        initiated_by: 'user'
      });

    if (historyError) {
    }

    return cardData;
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch card statements for a specific card
 */
export async function fetchCardStatements(cardId: string, limit: number = 12) {
  try {
    const { data, error } = await supabase
      .from('card_statements')
      .select('*')
      .eq('card_id', cardId)
      .order('statement_date', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch card limits for a specific card
 */
export async function fetchCardLimits(cardId: string) {
  try {
    const { data, error } = await supabase
      .from('card_limits')
      .select('*')
      .eq('card_id', cardId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Update card limits
 */
export async function updateCardLimits(
  cardId: string,
  userId: string,
  limits: {
    daily_purchase_limit?: number;
    daily_withdrawal_limit?: number;
    monthly_limit?: number;
    international_transactions_enabled?: boolean;
    online_transactions_enabled?: boolean;
    contactless_enabled?: boolean;
    atm_withdrawals_enabled?: boolean;
  }
) {
  try {
    const { data, error } = await supabase
      .from('card_limits')
      .update(limits)
      .eq('card_id', cardId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Create a card transaction
 */
export async function createCardTransaction(transaction: {
  card_id: string;
  user_id: string;
  merchant_name: string;
  amount: number;
  transaction_type: string;
  merchant_category?: string;
  description?: string;
  status?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('card_transactions')
      .insert({
        ...transaction,
        transaction_date: new Date().toISOString(),
        posted_date: new Date().toISOString(),
        status: transaction.status || 'completed'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update card balance
    if (data && transaction.transaction_type === 'purchase') {
      await updateCardBalance(transaction.card_id, transaction.amount, 'add');
    } else if (data && transaction.transaction_type === 'payment') {
      await updateCardBalance(transaction.card_id, transaction.amount, 'subtract');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Update card balance
 */
async function updateCardBalance(
  cardId: string,
  amount: number,
  operation: 'add' | 'subtract'
) {
  try {
    // Fetch current card
    const { data: card, error: fetchError } = await supabase
      .from('cards')
      .select('current_balance, credit_limit, card_type')
      .eq('id', cardId)
      .single();

    if (fetchError || !card) {
      throw fetchError || new Error('Card not found');
    }

    // Calculate new balance
    const currentBalance = card.current_balance || 0;
    const newBalance = operation === 'add' 
      ? currentBalance + amount 
      : Math.max(0, currentBalance - amount);

    // Calculate available credit for credit cards
    let availableCredit = null;
    if (card.card_type === 'credit' && card.credit_limit) {
      availableCredit = card.credit_limit - newBalance;
    }

    // Update card
    const { error: updateError } = await supabase
      .from('cards')
      .update({
        current_balance: newBalance,
        available_credit: availableCredit,
        last_used_at: new Date().toISOString()
      })
      .eq('id', cardId);

    if (updateError) {
      throw updateError;
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Format card number for display (mask middle digits)
 */
export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 12) return cardNumber;
  
  const last4 = cardNumber.slice(-4);
  const first4 = cardNumber.slice(0, 4);
  return `${first4} XXXX XXXX ${last4}`;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get card brand from card number
 */
export function getCardBrand(cardNumber: string): string {
  const firstDigit = cardNumber.charAt(0);
  const firstTwo = cardNumber.substring(0, 2);
  
  if (firstDigit === '4') return 'Visa';
  if (['51', '52', '53', '54', '55'].includes(firstTwo)) return 'Mastercard';
  if (['34', '37'].includes(firstTwo)) return 'American Express';
  if (firstTwo === '60' || firstTwo === '65') return 'Discover';
  
  return 'Unknown';
}
