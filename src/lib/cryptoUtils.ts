// Crypto utility functions for buying/selling crypto
import { supabase } from '@/integrations/supabase/client';

/**
 * Get current price for a crypto asset
 */
export const getCryptoPrice = async (assetId: string) => {
  const { data, error } = await supabase
    .from('crypto_prices')
    .select('price_usd, change_24h')
    .eq('asset_id', assetId)
    .single();

  if (error) throw error;
  return {
    price: parseFloat(data.price_usd?.toString() || '0'),
    change24h: parseFloat(data.change_24h?.toString() || '0')
  };
};

/**
 * Get fee for a transaction type
 */
export const getCryptoFee = async (transactionType: 'buy' | 'sell' | 'send') => {
  const { data, error } = await supabase
    .from('crypto_fees')
    .select('*')
    .eq('transaction_type', transactionType)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  
  return {
    flatFee: parseFloat(data?.flat_fee?.toString() || '0'),
    percentageFee: parseFloat(data?.percentage_fee?.toString() || '0'),
    minimumFee: parseFloat(data?.minimum_fee?.toString() || '0'),
    maximumFee: parseFloat(data?.maximum_fee?.toString() || '0')
  };
};

/**
 * Get or create user's crypto wallet for an asset
 */
export const getOrCreateWallet = async (userId: string, assetId: string) => {
  // Try to get existing wallet
  const { data: existing, error: fetchError } = await supabase
    .from('crypto_wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('asset_id', assetId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    return existing;
  }

  // Create new wallet if doesn't exist
  const { data: newWallet, error: createError } = await supabase
    .from('crypto_wallets')
    .insert({
      user_id: userId,
      asset_id: assetId,
      balance: 0
    })
    .select()
    .single();

  if (createError) throw createError;
  return newWallet;
};

/**
 * Buy crypto - complete transaction flow
 */
export const buyCrypto = async ({
  userId,
  assetId,
  cryptoAmount,
  usdAmount,
  pricePerUnit,
  processingFee,
  paymentMethod,
  paymentAccountLast4
}: {
  userId: string;
  assetId: string;
  cryptoAmount: number;
  usdAmount: number;
  pricePerUnit: number;
  processingFee: number;
  paymentMethod: string;
  paymentAccountLast4: string;
}) => {
  const transactionId = `TXN${Date.now()}`;

  // Step 1: Create transaction record
  const { data: transaction, error: txnError } = await supabase
    .from('crypto_transactions')
    .insert({
      user_id: userId,
      asset_id: assetId,
      transaction_type: 'buy',
      amount: cryptoAmount,
      usd_amount: usdAmount,
      price_per_unit: pricePerUnit,
      processing_fee: processingFee,
      payment_method: paymentMethod,
      payment_account_last4: paymentAccountLast4,
      status: 'processing',
      transaction_id: transactionId
    })
    .select()
    .single();

  if (txnError) throw txnError;

  try {
    // Step 2: Get or create wallet
    const wallet = await getOrCreateWallet(userId, assetId);

    // Step 3: Update wallet balance
    const newBalance = parseFloat(wallet.balance?.toString() || '0') + cryptoAmount;
    
    const { error: walletError } = await supabase
      .from('crypto_wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    if (walletError) throw walletError;

    // Step 4: Mark transaction as completed
    const { error: completedError } = await supabase
      .from('crypto_transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    if (completedError) throw completedError;

    return { transactionId, transaction };
  } catch (error) {
    // Mark transaction as failed
    await supabase
      .from('crypto_transactions')
      .update({ status: 'failed' })
      .eq('id', transaction.id);

    throw error;
  }
};

/**
 * Sell crypto - complete transaction flow
 */
export const sellCrypto = async ({
  userId,
  assetId,
  cryptoAmount,
  usdAmount,
  pricePerUnit,
  processingFee,
  withdrawMethod,
  withdrawAccountLast4
}: {
  userId: string;
  assetId: string;
  cryptoAmount: number;
  usdAmount: number;
  pricePerUnit: number;
  processingFee: number;
  withdrawMethod: string;
  withdrawAccountLast4: string;
}) => {
  const transactionId = `TXN${Date.now()}`;

  // Step 1: Verify user has sufficient crypto balance
  const { data: wallet, error: walletError } = await supabase
    .from('crypto_wallets')
    .select('balance')
    .eq('user_id', userId)
    .eq('asset_id', assetId)
    .single();

  if (walletError) throw walletError;

  const currentBalance = parseFloat(wallet.balance?.toString() || '0');
  if (currentBalance < cryptoAmount) {
    throw new Error('Insufficient crypto balance');
  }

  // Step 2: Create transaction record
  const { data: transaction, error: txnError } = await supabase
    .from('crypto_transactions')
    .insert({
      user_id: userId,
      asset_id: assetId,
      transaction_type: 'sell',
      amount: cryptoAmount,
      usd_amount: usdAmount,
      price_per_unit: pricePerUnit,
      processing_fee: processingFee,
      payment_method: withdrawMethod,
      payment_account_last4: withdrawAccountLast4,
      status: 'processing',
      transaction_id: transactionId
    })
    .select()
    .single();

  if (txnError) throw txnError;

  try {
    // Step 3: Update wallet balance (deduct crypto)
    const newBalance = currentBalance - cryptoAmount;

    const { error: updateWalletError } = await supabase
      .from('crypto_wallets')
      .update({ balance: newBalance })
      .eq('user_id', userId)
      .eq('asset_id', assetId);

    if (updateWalletError) throw updateWalletError;

    // Step 4: Mark transaction as completed
    const { error: completedError } = await supabase
      .from('crypto_transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    if (completedError) throw completedError;

    return { transactionId, transaction };
  } catch (error) {
    // Mark transaction as failed
    await supabase
      .from('crypto_transactions')
      .update({ status: 'failed' })
      .eq('id', transaction.id);

    throw error;
  }
};
