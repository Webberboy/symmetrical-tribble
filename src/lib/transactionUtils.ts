/**
 * Transaction Utilities
 * 
 * Comprehensive utility functions for fetching and managing all types of transactions
 * including general transactions, bill payments, loan payments, stock transactions, and crypto transactions.
 */

import { supabase } from "@/integrations/supabase/client";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface UnifiedTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'wire_transfer' | 'bill_payment' | 'loan_payment' | 'stock_buy' | 'stock_sell' | 'stock_dividend' | 'crypto_buy' | 'crypto_sell' | 'admin_credit' | 'admin_debit' | 'debit' | 'credit';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  created_at: string;
  recipient_account?: string | null;
  category?: string | null;
  reference_number?: string | null;
  // Additional fields for specific transaction types
  symbol?: string; // For stock/crypto
  shares?: number; // For stock
  price_per_share?: number; // For stock
  bill_name?: string; // For bills
  loan_name?: string; // For loans
}

// ============================================
// FETCH ALL TRANSACTIONS
// ============================================

/**
 * Get all transactions for a user from all sources
 * Combines general transactions, bill payments, loan payments, stock transactions, and crypto transactions
 */
export async function getAllTransactions(userId: string): Promise<{ success: boolean; data?: UnifiedTransaction[]; error?: string }> {
  try {
    // Fetch all transaction types in parallel
    const [
      generalResult,
      billPaymentsResult,
      loanPaymentsResult,
      stockTransactionsResult,
      cryptoTransactionsResult
    ] = await Promise.all([
      getGeneralTransactions(userId),
      getBillPaymentTransactions(userId),
      getLoanPaymentTransactions(userId),
      getStockTransactions(userId),
      getCryptoTransactions(userId)
    ]);

    // Combine all transactions
    const allTransactions: UnifiedTransaction[] = [
      ...(generalResult.data || []),
      ...(billPaymentsResult.data || []),
      ...(loanPaymentsResult.data || []),
      ...(stockTransactionsResult.data || []),
      ...(cryptoTransactionsResult.data || [])
    ];

    // Sort by date (newest first)
    allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { success: true, data: allTransactions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// GENERAL TRANSACTIONS
// ============================================

/**
 * Get general transactions (deposits, withdrawals, transfers, etc.)
 */
export async function getGeneralTransactions(userId: string): Promise<{ success: boolean; data?: UnifiedTransaction[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const transactions: UnifiedTransaction[] = (data || []).map((txn: any) => ({
      id: txn.id,
      user_id: txn.user_id,
      type: txn.type as UnifiedTransaction['type'],
      amount: Number(txn.amount),
      description: txn.description || `${txn.type.charAt(0).toUpperCase() + txn.type.slice(1)} Transaction`,
      status: txn.status as UnifiedTransaction['status'],
      created_at: txn.created_at,
      recipient_account: txn.recipient_account,
      category: txn.category,
      reference_number: txn.reference_number
    }));

    return { success: true, data: transactions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// BILL PAYMENT TRANSACTIONS
// ============================================

/**
 * Get bill payment transactions
 */
export async function getBillPaymentTransactions(userId: string): Promise<{ success: boolean; data?: UnifiedTransaction[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('bill_payments' as any)
      .select(`
        *,
        bills (
          bill_name,
          provider
        )
      `)
      .eq('user_id', userId)
      .order('paid_date', { ascending: false });

    if (error) throw error;

    const transactions: UnifiedTransaction[] = (data || []).map((payment: any) => ({
      id: payment.id,
      user_id: payment.user_id,
      type: 'bill_payment',
      amount: Number(payment.amount),
      description: `Bill Payment - ${payment.bills?.bill_name || payment.bills?.provider || payment.bill_name || payment.provider || 'Bill'}`,
      status: payment.status,
      created_at: payment.paid_date || payment.created_at,
      reference_number: payment.confirmation_number,
      bill_name: payment.bills?.bill_name || payment.bill_name
    }));

    return { success: true, data: transactions };
  } catch (error: any) {
    return { success: false, data: [] };
  }
}

// ============================================
// LOAN PAYMENT TRANSACTIONS
// ============================================

/**
 * Get loan payment transactions
 */
export async function getLoanPaymentTransactions(userId: string): Promise<{ success: boolean; data?: UnifiedTransaction[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('loan_payments' as any)
      .select(`
        *,
        loans (
          loan_type
        )
      `)
      .eq('user_id', userId)
      .order('payment_date', { ascending: false });

    if (error) throw error;

    const transactions: UnifiedTransaction[] = (data || []).map((payment: any) => ({
      id: payment.id,
      user_id: payment.user_id,
      type: 'loan_payment',
      amount: Number(payment.payment_amount),
      description: `Loan Payment - ${payment.loans?.loan_type ? payment.loans.loan_type.charAt(0).toUpperCase() + payment.loans.loan_type.slice(1) : 'Loan'}`,
      status: payment.payment_status || payment.status,
      created_at: payment.payment_date,
      reference_number: payment.confirmation_number,
      loan_name: payment.loans?.loan_type
    }));

    return { success: true, data: transactions };
  } catch (error: any) {
    return { success: false, data: [] };
  }
}

// ============================================
// STOCK TRANSACTIONS
// ============================================

/**
 * Get stock transactions (buy, sell, dividend)
 */
export async function getStockTransactions(userId: string): Promise<{ success: boolean; data?: UnifiedTransaction[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('stock_transactions' as any)
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (error) throw error;

    const transactions: UnifiedTransaction[] = (data || []).map((txn: any) => {
      let type: UnifiedTransaction['type'];
      let description: string;

      switch (txn.transaction_type) {
        case 'buy':
          type = 'stock_buy';
          description = `Buy ${Number(txn.shares).toFixed(2)} shares of ${txn.symbol}`;
          break;
        case 'sell':
          type = 'stock_sell';
          description = `Sell ${Number(txn.shares).toFixed(2)} shares of ${txn.symbol}`;
          break;
        case 'dividend':
          type = 'stock_dividend';
          description = `Dividend from ${txn.symbol}`;
          break;
        default:
          type = 'stock_buy';
          description = `Stock Transaction - ${txn.symbol}`;
      }

      return {
        id: txn.id,
        user_id: txn.user_id,
        type,
        amount: Number(txn.net_amount),
        description,
        status: txn.status,
        created_at: txn.transaction_date,
        reference_number: txn.confirmation_number,
        symbol: txn.symbol,
        shares: Number(txn.shares),
        price_per_share: Number(txn.price_per_share)
      };
    });

    return { success: true, data: transactions };
  } catch (error: any) {
    return { success: false, data: [] };
  }
}

// ============================================
// CRYPTO TRANSACTIONS
// ============================================

/**
 * Get crypto transactions (buy, sell)
 */
export async function getCryptoTransactions(userId: string): Promise<{ success: boolean; data?: UnifiedTransaction[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('crypto_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const transactions: UnifiedTransaction[] = (data || []).map((txn: any) => {
      const type: UnifiedTransaction['type'] = txn.transaction_type === 'buy' ? 'crypto_buy' : 'crypto_sell';
      const description = `${txn.transaction_type === 'buy' ? 'Buy' : 'Sell'} ${Number(txn.crypto_amount).toFixed(4)} ${txn.asset_id}`;

      return {
        id: txn.id,
        user_id: txn.user_id,
        type,
        amount: Number(txn.usd_amount),
        description,
        status: txn.status as UnifiedTransaction['status'],
        created_at: txn.created_at,
        symbol: txn.asset_id
      };
    });

    return { success: true, data: transactions };
  } catch (error: any) {
    return { success: false, data: [] };
  }
}

// ============================================
// FILTER TRANSACTIONS
// ============================================

/**
 * Filter transactions by type
 */
export function filterTransactionsByType(transactions: UnifiedTransaction[], types: UnifiedTransaction['type'][]): UnifiedTransaction[] {
  return transactions.filter(txn => types.includes(txn.type));
}

/**
 * Filter transactions by status
 */
export function filterTransactionsByStatus(transactions: UnifiedTransaction[], statuses: UnifiedTransaction['status'][]): UnifiedTransaction[] {
  return transactions.filter(txn => statuses.includes(txn.status));
}

/**
 * Filter transactions by date range
 */
export function filterTransactionsByDateRange(transactions: UnifiedTransaction[], startDate: Date, endDate: Date): UnifiedTransaction[] {
  return transactions.filter(txn => {
    const txnDate = new Date(txn.created_at);
    return txnDate >= startDate && txnDate <= endDate;
  });
}

/**
 * Search transactions by description
 */
export function searchTransactions(transactions: UnifiedTransaction[], searchTerm: string): UnifiedTransaction[] {
  const term = searchTerm.toLowerCase();
  return transactions.filter(txn => 
    txn.description.toLowerCase().includes(term) ||
    txn.type.toLowerCase().includes(term) ||
    txn.symbol?.toLowerCase().includes(term) ||
    txn.reference_number?.toLowerCase().includes(term)
  );
}

// ============================================
// TRANSACTION STATISTICS
// ============================================

/**
 * Calculate total income (credits) for a period
 */
export function calculateTotalIncome(transactions: UnifiedTransaction[]): number {
  const incomeTypes: UnifiedTransaction['type'][] = ['deposit', 'credit', 'admin_credit', 'stock_dividend', 'stock_sell', 'crypto_sell'];
  return transactions
    .filter(txn => incomeTypes.includes(txn.type) && txn.status === 'completed')
    .reduce((sum, txn) => sum + txn.amount, 0);
}

/**
 * Calculate total expenses (debits) for a period
 */
export function calculateTotalExpenses(transactions: UnifiedTransaction[]): number {
  const expenseTypes: UnifiedTransaction['type'][] = ['withdrawal', 'transfer', 'wire_transfer', 'bill_payment', 'loan_payment', 'stock_buy', 'crypto_buy', 'admin_debit', 'debit'];
  return transactions
    .filter(txn => expenseTypes.includes(txn.type) && txn.status === 'completed')
    .reduce((sum, txn) => sum + txn.amount, 0);
}

/**
 * Get transaction count by type
 */
export function getTransactionCountByType(transactions: UnifiedTransaction[]): Record<string, number> {
  return transactions.reduce((counts, txn) => {
    counts[txn.type] = (counts[txn.type] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
}

/**
 * Get transaction count by status
 */
export function getTransactionCountByStatus(transactions: UnifiedTransaction[]): Record<string, number> {
  return transactions.reduce((counts, txn) => {
    counts[txn.status] = (counts[txn.status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format time
 */
export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Check if transaction is a credit (incoming money)
 */
export function isCredit(type: UnifiedTransaction['type']): boolean {
  const creditTypes: UnifiedTransaction['type'][] = ['deposit', 'credit', 'admin_credit', 'stock_dividend', 'stock_sell', 'crypto_sell'];
  return creditTypes.includes(type);
}

/**
 * Check if transaction is a debit (outgoing money)
 */
export function isDebit(type: UnifiedTransaction['type']): boolean {
  return !isCredit(type);
}
