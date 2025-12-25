import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError } from './errorHandler';

// Bill interfaces
export interface Bill {
  id: string;
  user_id: string;
  bill_name: string;
  provider: string;
  category: 'utilities' | 'insurance' | 'subscription' | 'mortgage' | 'credit' | 'other';
  account_number?: string;
  typical_amount?: number;
  payment_method?: 'checking' | 'savings' | 'credit';
  frequency: 'weekly' | 'monthly' | 'biweekly' | 'quarterly' | 'annually';
  due_day?: number;
  next_due_date?: string;
  provider_address?: string;
  provider_phone?: string;
  provider_email?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillPayment {
  id: string;
  user_id: string;
  bill_id?: string;
  bill_name: string;
  provider: string;
  amount: number;
  due_date?: string;
  paid_date?: string;
  scheduled_date?: string;
  payment_method?: 'checking' | 'savings' | 'credit';
  payment_account?: string;
  category: 'utilities' | 'insurance' | 'subscription' | 'mortgage' | 'credit' | 'other';
  status: 'completed' | 'pending' | 'scheduled' | 'failed';
  confirmation_number?: string;
  transaction_id?: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutoPaySetup {
  id: string;
  user_id: string;
  bill_id?: string;
  bill_name: string;
  provider: string;
  amount: number;
  payment_type: 'full' | 'minimum' | 'custom';
  frequency: 'weekly' | 'monthly' | 'biweekly' | 'quarterly' | 'yearly';
  next_payment_date: string;
  payment_account?: string;
  payment_method?: 'checking' | 'savings' | 'credit';
  status: 'active' | 'paused' | 'failed';
  last_processed_date?: string;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

// Fetch all user bills
export async function getUserBills(userId: string): Promise<Bill[]> {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('next_due_date', { ascending: true });

  if (error) {
    handleSupabaseError(error, 'getUserBills');
    return [];
  }
  return data || [];
}

// Get bills by status (upcoming, overdue)
export async function getBillsByStatus(userId: string, status: 'upcoming' | 'overdue'): Promise<Bill[]> {
  const today = new Date().toISOString().split('T')[0];
  
  let query = supabase
    .from('bills')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (status === 'upcoming') {
    query = query.gte('next_due_date', today);
  } else if (status === 'overdue') {
    query = query.lt('next_due_date', today);
  }

  const { data, error } = await query.order('next_due_date', { ascending: true });

  if (error) {
    handleSupabaseError(error, 'getBillsByStatus');
    return [];
  }
  return data || [];
}

// Create a new bill
export async function createBill(bill: Partial<Bill>): Promise<Bill> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('bills')
    .insert([{ ...bill, user_id: userData.user.id }])
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'createBill');
    throw error; // Re-throw for user-facing components to handle
  }
  return data;
}

// Update a bill
export async function updateBill(billId: string, updates: Partial<Bill>): Promise<Bill> {
  const { data, error } = await supabase
    .from('bills')
    .update(updates)
    .eq('id', billId)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'updateBill');
    throw error; // Re-throw for user-facing components to handle
  }
  return data;
}

// Delete a bill (soft delete by setting is_active to false)
export async function deleteBill(billId: string): Promise<void> {
  const { error } = await supabase
    .from('bills')
    .update({ is_active: false })
    .eq('id', billId);

  if (error) {
    handleSupabaseError(error, 'deleteBill');
    throw error; // Re-throw for user-facing components to handle
  }
}

// Get bill payment history
export async function getBillPaymentHistory(
  userId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    billId?: string;
  }
): Promise<BillPayment[]> {
  let query = supabase
    .from('bill_payments')
    .select('*')
    .eq('user_id', userId);

  if (filters?.startDate) {
    query = query.gte('paid_date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('paid_date', filters.endDate);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.billId) {
    query = query.eq('bill_id', filters.billId);
  }

  const { data, error } = await query.order('paid_date', { ascending: false });

  if (error) {
    handleSupabaseError(error, 'getBillPaymentHistory');
    return [];
  }
  return data || [];
}

// Create a bill payment
export async function createBillPayment(payment: Partial<BillPayment>): Promise<BillPayment> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('User not authenticated');

  // If payment is completed, update account balance
  if (payment.status === 'completed' && payment.amount && payment.payment_method) {
    await deductBillPaymentFromBalance(userData.user.id, payment.amount, payment.payment_method);
  }

  const { data, error } = await supabase
    .from('bill_payments')
    .insert([{ ...payment, user_id: userData.user.id }])
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'createBillPayment');
    throw error; // Re-throw for user-facing components to handle
  }
  return data;
}

// Process bill payment (deduct from balance)
async function deductBillPaymentFromBalance(
  userId: string,
  amount: number,
  paymentMethod: 'checking' | 'savings' | 'credit'
): Promise<void> {
  if (paymentMethod === 'credit') {
    // Skip for credit card payments (handled separately)
    return;
  }

  const field = paymentMethod === 'checking' ? 'checking_balance' : 'savings_balance';

  // Get current balance
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select(field)
    .eq('id', userId)
    .single();

  if (fetchError) throw fetchError;

  const currentBalance = profile[field] || 0;
  if (currentBalance < amount) {
    throw new Error('Insufficient funds');
  }

  // Deduct amount
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ [field]: currentBalance - amount })
    .eq('id', userId);

  if (updateError) throw updateError;

  // Create transaction record
  await supabase.from('transactions').insert([{
    user_id: userId,
    transaction_type: 'debit',
    category: 'bill_payment',
    amount: amount,
    description: 'Bill Payment',
    status: 'completed'
  }]);
}

// Get auto pay setups
export async function getAutoPaySetups(userId: string, status?: string): Promise<AutoPaySetup[]> {
  let query = supabase
    .from('auto_pay_setups')
    .select('*')
    .eq('user_id', userId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('next_payment_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Create auto pay setup
export async function createAutoPaySetup(setup: Partial<AutoPaySetup>): Promise<AutoPaySetup> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('auto_pay_setups')
    .insert([{ ...setup, user_id: userData.user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update auto pay setup
export async function updateAutoPaySetup(setupId: string, updates: Partial<AutoPaySetup>): Promise<AutoPaySetup> {
  const { data, error } = await supabase
    .from('auto_pay_setups')
    .update(updates)
    .eq('id', setupId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete auto pay setup
export async function deleteAutoPaySetup(setupId: string): Promise<void> {
  const { error } = await supabase
    .from('auto_pay_setups')
    .delete()
    .eq('id', setupId);

  if (error) throw error;
}

// Toggle auto pay status (pause/resume)
export async function toggleAutoPayStatus(setupId: string): Promise<AutoPaySetup> {
  // Get current status
  const { data: setup, error: fetchError } = await supabase
    .from('auto_pay_setups')
    .select('status')
    .eq('id', setupId)
    .single();

  if (fetchError) throw fetchError;

  const newStatus = setup.status === 'active' ? 'paused' : 'active';

  const { data, error } = await supabase
    .from('auto_pay_setups')
    .update({ status: newStatus })
    .eq('id', setupId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get bill providers
export async function getBillProviders(category?: string): Promise<any[]> {
  let query = supabase
    .from('bill_providers')
    .select('*')
    .eq('is_active', true);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.order('provider_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Calculate bill statistics
export async function getBillStatistics(userId: string): Promise<{
  totalMonthly: number;
  upcomingCount: number;
  overdueCount: number;
  totalPaidThisMonth: number;
  totalTransactions: number;
}> {
  // Get all active bills
  const bills = await getUserBills(userId);
  const totalMonthly = bills.reduce((sum, bill) => sum + (bill.typical_amount || 0), 0);

  // Get upcoming and overdue counts
  const today = new Date().toISOString().split('T')[0];
  const upcomingCount = bills.filter(b => b.next_due_date && b.next_due_date >= today).length;
  const overdueCount = bills.filter(b => b.next_due_date && b.next_due_date < today).length;

  // Get payments this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const startDate = startOfMonth.toISOString().split('T')[0];

  const payments = await getBillPaymentHistory(userId, { 
    startDate,
    status: 'completed'
  });

  const totalPaidThisMonth = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalTransactions = payments.length;

  return {
    totalMonthly,
    upcomingCount,
    overdueCount,
    totalPaidThisMonth,
    totalTransactions
  };
}
