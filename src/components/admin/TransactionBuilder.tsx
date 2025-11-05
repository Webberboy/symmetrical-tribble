import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  merchant: string;
  category: string;
  status: string;
  created_at: string;
}

interface TransactionBuilderProps {
  user: {
    id: string;
    full_name: string;
    email: string;
    account_number: string;
    balance: number;
  };
  onUpdate: () => void;
}

// Quick Templates
const TRANSACTION_TEMPLATES = [
  { name: 'Salary Deposit', type: 'credit', category: 'Salary', amount: 5000, merchant: 'Payroll Deposit' },
  { name: 'Walmart Purchase', type: 'debit', category: 'Shopping', amount: 150, merchant: 'Walmart' },
  { name: 'Amazon Order', type: 'debit', category: 'Shopping', amount: 89.99, merchant: 'Amazon' },
  { name: 'ATM Withdrawal', type: 'debit', category: 'ATM Withdrawal', amount: 200, merchant: 'ATM' },
  { name: 'Incoming Wire', type: 'credit', category: 'Wire Transfer', amount: 10000, merchant: 'Wire Transfer In' },
  { name: 'Rent Payment', type: 'debit', category: 'Bill Payment', amount: 1500, merchant: 'Rent Payment' },
  { name: 'Restaurant', type: 'debit', category: 'Dining', amount: 75, merchant: 'Restaurant' },
  { name: 'Gas Station', type: 'debit', category: 'Gas', amount: 60, merchant: 'Shell Gas Station' },
];

// Transaction Categories
const DEBIT_CATEGORIES = [
  'POS Purchase',
  'ATM Withdrawal',
  'Bill Payment',
  'Wire Transfer Out',
  'Shopping',
  'Dining',
  'Gas',
  'Groceries',
  'Entertainment',
  'Healthcare',
  'Transfer Out',
  'Online Purchase',
  'Subscription',
  'Other'
];

const CREDIT_CATEGORIES = [
  'Incoming Wire',
  'Salary Deposit',
  'Refund',
  'Wire Transfer In',
  'Deposit',
  'Interest',
  'Transfer In',
  'Cashback',
  'Bonus',
  'Other'
];

const TransactionBuilder: React.FC<TransactionBuilderProps> = ({ user, onUpdate }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'debit',
    amount: '',
    merchant: '',
    category: '',
    status: 'completed',
    date: new Date().toISOString().slice(0, 16), // datetime-local format
  });

  useEffect(() => {
    loadTransactions();
  }, [user.id]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast.error('Failed to load transactions');
    }
  };

  const applyTemplate = (template: typeof TRANSACTION_TEMPLATES[0]) => {
    setFormData({
      ...formData,
      type: template.type,
      amount: template.amount.toString(),
      merchant: template.merchant,
      category: template.category,
    });
    toast.success(`Applied template: ${template.name}`);
  };

  const handleAddTransaction = async () => {
    if (!formData.amount || !formData.merchant || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const amount = parseFloat(formData.amount);
      
      // Insert transaction (NO BALANCE UPDATE - just add to history)
      const { data: newTransaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: formData.type,
          amount: amount,
          merchant: formData.merchant,
          description: formData.merchant, // Use merchant as description
          category: formData.category,
          status: formData.status,
          created_at: new Date(formData.date).toISOString(),
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      toast.success('Transaction added to history successfully');
      loadTransactions();
      onUpdate();
      
      // Reset form
      setFormData({
        type: 'debit',
        amount: '',
        merchant: '',
        category: '',
        status: 'completed',
        date: new Date().toISOString().slice(0, 16),
      });
    } catch (error: any) {
      toast.error('Failed to add transaction: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: string, transactionType: string, transactionAmount: number) => {
    if (!confirm('Are you sure you want to delete this transaction from history?')) {
      return;
    }

    setLoading(true);
    try {
      // Delete transaction (NO BALANCE UPDATE - just remove from history)
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (deleteError) throw deleteError;

      toast.success('Transaction deleted from history successfully');
      loadTransactions();
      onUpdate();
    } catch (error: any) {
      toast.error('Failed to delete transaction: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = formData.type === 'credit' ? CREDIT_CATEGORIES : DEBIT_CATEGORIES;

  return (
    <div className="space-y-6">
      {/* User Info Banner */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 border-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-lg font-semibold">{user.full_name}</h3>
            <p className="text-sm text-blue-100">Account: {user.account_number}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Current Balance</p>
            <p className="text-2xl font-bold">${parseFloat(user.balance?.toString() || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </Card>

      {/* Quick Templates */}
      <Card className="bg-gray-800 border-gray-700 p-4">
        <h3 className="text-white font-semibold mb-3">Quick Templates</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {TRANSACTION_TEMPLATES.map((template, index) => (
            <Button
              key={index}
              size="sm"
              variant="outline"
              onClick={() => applyTemplate(template)}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
            >
              {template.name}
            </Button>
          ))}
        </div>
      </Card>

      {/* Add Transaction Form */}
      <Card className="bg-gray-800 border-gray-700 p-6">
        <h3 className="text-white font-semibold mb-4 text-lg">Add New Transaction</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Transaction Type */}
          <div>
            <Label className="text-gray-300">Transaction Type *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value, category: '' })}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="debit" className="text-white">Debit (Outgoing)</SelectItem>
                <SelectItem value="credit" className="text-white">Credit (Incoming)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div>
            <Label className="text-gray-300">Amount ($) *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white mt-1"
            />
          </div>

          {/* Category */}
          <div>
            <Label className="text-gray-300">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Merchant/Description */}
          <div>
            <Label className="text-gray-300">Merchant/Description *</Label>
            <Input
              placeholder="e.g., Walmart, Amazon, Salary"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white mt-1"
            />
          </div>

          {/* Status */}
          <div>
            <Label className="text-gray-300">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="completed" className="text-white">Completed</SelectItem>
                <SelectItem value="pending" className="text-white">Pending</SelectItem>
                <SelectItem value="failed" className="text-white">Failed</SelectItem>
                <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div>
            <Label className="text-gray-300">Date & Time</Label>
            <Input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white mt-1"
            />
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleAddTransaction}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            {loading ? 'Adding Transaction...' : 'Add Transaction'}
          </Button>
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="bg-gray-800 border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold text-lg">Transaction History</h3>
          <span className="text-sm text-gray-400">{transactions.length} transactions</span>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Date</TableHead>
                <TableHead className="text-gray-300">Type</TableHead>
                <TableHead className="text-gray-300">Category</TableHead>
                <TableHead className="text-gray-300">Merchant</TableHead>
                <TableHead className="text-gray-300">Amount</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                    No transactions found. Add your first transaction above.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="border-gray-700">
                    <TableCell className="text-gray-300 text-sm">
                      {new Date(transaction.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                        transaction.type === 'credit' 
                          ? 'bg-green-900/30 text-green-400 border border-green-700' 
                          : 'bg-red-900/30 text-red-400 border border-red-700'
                      }`}>
                        {transaction.type === 'credit' ? '+ Credit' : '- Debit'}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-300 text-sm">{transaction.category}</TableCell>
                    <TableCell className="text-white font-medium text-sm">{transaction.merchant}</TableCell>
                    <TableCell className={`font-semibold text-sm ${
                      transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}${parseFloat(transaction.amount.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                        transaction.status === 'completed' ? 'bg-blue-900/30 text-blue-400 border border-blue-700' :
                        transaction.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' :
                        transaction.status === 'failed' ? 'bg-red-900/30 text-red-400 border border-red-700' :
                        'bg-gray-700 text-gray-400 border border-gray-600'
                      }`}>
                        {transaction.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteTransaction(transaction.id, transaction.type, parseFloat(transaction.amount.toString()))}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default TransactionBuilder;
