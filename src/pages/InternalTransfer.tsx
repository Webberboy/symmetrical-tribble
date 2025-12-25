import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  accountNumber: string;
}

type TransferStep = 'account-selection' | 'amount-entry' | 'confirmation' | 'success';

const InternalTransfer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<TransferStep>('account-selection');
  const [fromAccount, setFromAccount] = useState<string>('');
  const [toAccount, setToAccount] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferId, setTransferId] = useState<string>('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  useEffect(() => {
    fetchUserData();
    fetchUserAccounts();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserData({
          firstName: profile.first_name,
          lastName: profile.last_name,
          email: user.email
        });
      }
    } catch (error) {
    }
  };

  const fetchUserAccounts = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive"
        });
        navigate('/signin');
        return;
      }

      setUserId(user.id);

      // Fetch accounts from accounts table
      const { data: accountsData, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .in('account_type', ['checking', 'savings'])
        .order('account_type', { ascending: true });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load account information",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (!accountsData || accountsData.length === 0) {
        setIsLoading(false);
        return;
      }


      // Create account objects with real data from accounts table
      const userAccounts: Account[] = accountsData.map(account => {
        // Get last 4 digits of account number for display
        const lastFourDigits = account.account_number?.slice(-4) || '****';
        
        return {
          id: account.account_type, // 'checking' or 'savings'
          name: account.account_type === 'checking' ? 'My Checking' : 'My Savings',
          type: account.account_type === 'checking' ? 'Checking Account' : 'Savings Account',
          balance: account.account_type === 'checking' 
            ? (account.checking_balance || account.balance || 0.00)
            : (account.savings_balance || account.balance || 0.00),
          accountNumber: `****${lastFourDigits}` // Show last 4 digits
        };
      });

      setAccounts(userAccounts);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getSelectedAccount = (accountId: string) => {
    return accounts.find(acc => acc.id === accountId);
  };

  const handleAccountSelection = () => {
    if (fromAccount && toAccount && fromAccount !== toAccount) {
      setCurrentStep('amount-entry');
    }
  };

  const handleNumberClick = (num: string) => {
    if (num === '.' && amount.includes('.')) return;
    if (amount.includes('.') && amount.split('.')[1].length >= 2) return;
    
    setAmount(prev => prev + num);
  };

  const handleBackspace = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setAmount('');
  };

  const handleAmountNext = () => {
    const fromAccountData = getSelectedAccount(fromAccount);
    const accountBalance = fromAccountData?.balance || 0;
    
    if (amount && parseFloat(amount) > 0 && parseFloat(amount) <= accountBalance) {
      setCurrentStep('confirmation');
    }
  };

  const handleTransfer = async () => {
    console.log('🚀 INTERNAL TRANSFER: Starting transfer process...');
    
    if (!userId || !fromAccount || !toAccount || !amount) {
      console.log('❌ INTERNAL TRANSFER: Missing required fields', { userId, fromAccount, toAccount, amount });
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const transferAmount = parseFloat(amount);
      const fromAccountUI = getSelectedAccount(fromAccount);
      const toAccountUI = getSelectedAccount(toAccount);

      console.log('📋 INTERNAL TRANSFER: Transfer details', {
        userId,
        fromAccount,
        toAccount,
        amount: transferAmount,
        fromAccountUI,
        toAccountUI
      });

      if (!fromAccountUI || !toAccountUI) {
        throw new Error('Account data not found');
      }

      // Generate unique transfer ID
      const newTransferId = `TXN${Date.now()}`;
      console.log('🆔 INTERNAL TRANSFER: Generated transfer ID', newTransferId);

      // Get accounts from database to verify current balances
      console.log('🔍 INTERNAL TRANSFER: Fetching account data from database...');
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .in('account_type', [fromAccount, toAccount]);

      console.log('📊 INTERNAL TRANSFER: Account data fetched', { accountsData, accountsError });
      if (accountsError) throw accountsError;

      const fromAccountData = accountsData.find(acc => acc.account_type === fromAccount);
      const toAccountData = accountsData.find(acc => acc.account_type === toAccount);

      if (!fromAccountData || !toAccountData) {
        throw new Error('Account data not found in database');
      }

      // Calculate new balances based on account type
      const currentFromBalance = fromAccount === 'checking' ? fromAccountData.checking_balance : fromAccountData.savings_balance;
      const currentToBalance = toAccount === 'checking' ? toAccountData.checking_balance : toAccountData.savings_balance;

      console.log('💰 INTERNAL TRANSFER: Current balances', {
        fromAccount: currentFromBalance,
        toAccount: currentToBalance,
        transferAmount
      });

      // Check if sufficient funds
      if (currentFromBalance < transferAmount) {
        console.log('⚠️ INTERNAL TRANSFER: Insufficient funds');
        toast({
          title: "Insufficient Funds",
          description: "You don't have enough balance for this transfer",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      const newFromBalance = currentFromBalance - transferAmount;
      const newToBalance = currentToBalance + transferAmount;

      console.log('🧮 INTERNAL TRANSFER: New balances calculated', {
        newFromBalance,
        newToBalance
      });

      // Step 1: Create debit transaction (from account)
      console.log('📝 INTERNAL TRANSFER: Step 1 - Creating debit transaction...');
      const debitTransactionData = {
        user_id: userId,
        type: 'debit',
        amount: transferAmount,
        merchant: 'Internal Transfer',
        description: `Internal transfer to ${toAccountUI.name}`,
        category: 'Transfer',
        status: 'completed',
        account_type: fromAccount,
        recipient_account: toAccount,
        account_number: fromAccountData.account_number,
        transfer_id: newTransferId
      };
      console.log('📝 INTERNAL TRANSFER: Debit transaction data', debitTransactionData);

      const { data: debitTxn, error: debitError } = await supabase
        .from('transactions')
        .insert(debitTransactionData)
        .select()
        .single();

      console.log('✅ INTERNAL TRANSFER: Debit transaction result', { debitTxn, debitError });
      if (debitError) throw debitError;

      // Step 2: Create credit transaction (to account)
      console.log('📝 INTERNAL TRANSFER: Step 2 - Creating credit transaction...');
      const creditTransactionData = {
        user_id: userId,
        type: 'credit',
        amount: transferAmount,
        merchant: 'Internal Transfer',
        description: `Internal transfer from ${fromAccountUI.name}`,
        category: 'Transfer',
        status: 'completed',
        account_type: toAccount,
        recipient_account: fromAccount,
        account_number: toAccountData.account_number,
        transfer_id: newTransferId
      };
      console.log('📝 INTERNAL TRANSFER: Credit transaction data', creditTransactionData);

      const { data: creditTxn, error: creditError } = await supabase
        .from('transactions')
        .insert(creditTransactionData)
        .select()
        .single();

      console.log('✅ INTERNAL TRANSFER: Credit transaction result', { creditTxn, creditError });
      if (creditError) throw creditError;

      // Step 3: Create internal transfer record
      console.log('📝 INTERNAL TRANSFER: Step 3 - Creating internal transfer record...');
      const internalTransferData = {
        user_id: userId,
        transaction_id: debitTxn.id,
        from_account_type: fromAccount,
        to_account_type: toAccount,
        amount: transferAmount,
        from_account_number: fromAccountData.account_number,
        to_account_number: toAccountData.account_number,
        transfer_id: newTransferId,
        status: 'completed',
        description: `Internal transfer from ${fromAccountUI.name} to ${toAccountUI.name}`
      };
      console.log('📝 INTERNAL TRANSFER: Internal transfer data', internalTransferData);

      const { error: transferError } = await supabase
        .from('internal_transfers')
        .insert(internalTransferData);

      console.log('✅ INTERNAL TRANSFER: Internal transfer result', { transferError });
      if (transferError) throw transferError;

      // Step 4: Update account balances in accounts table
      console.log('📝 INTERNAL TRANSFER: Step 4 - Updating account balances...');
      
      // Determine which balance column to update based on account type
      const fromAccountUpdateData = fromAccount === 'checking' 
        ? { checking_balance: newFromBalance, updated_at: new Date().toISOString() }
        : { savings_balance: newFromBalance, updated_at: new Date().toISOString() };
        
      const toAccountUpdateData = toAccount === 'checking' 
        ? { checking_balance: newToBalance, updated_at: new Date().toISOString() }
        : { savings_balance: newToBalance, updated_at: new Date().toISOString() };

      console.log('📝 INTERNAL TRANSFER: Account update data', {
        fromAccountUpdate: fromAccountUpdateData,
        toAccountUpdate: toAccountUpdateData,
        fromAccountId: fromAccountData.id,
        toAccountId: toAccountData.id
      });

      // Update FROM account
      const { error: fromUpdateError } = await supabase
        .from('accounts')
        .update(fromAccountUpdateData)
        .eq('id', fromAccountData.id);

      console.log('✅ INTERNAL TRANSFER: From account update result', { fromUpdateError });
      if (fromUpdateError) throw fromUpdateError;

      // Update TO account
      const { error: toUpdateError } = await supabase
        .from('accounts')
        .update(toAccountUpdateData)
        .eq('id', toAccountData.id);

      console.log('✅ INTERNAL TRANSFER: To account update result', { toUpdateError });
      if (toUpdateError) throw toUpdateError;

      // Update local state with new balances
      console.log('🔄 INTERNAL TRANSFER: Updating local state with new balances');
      setAccounts(prevAccounts => prevAccounts.map(acc => ({
        ...acc,
        balance: acc.id === fromAccount ? newFromBalance : 
                acc.id === toAccount ? newToBalance : acc.balance
      })));
      
      // Also update the account data in the database format for consistency
      if (fromAccountData) {
        fromAccountData[fromAccount === 'checking' ? 'checking_balance' : 'savings_balance'] = newFromBalance;
      }
      if (toAccountData) {
        toAccountData[toAccount === 'checking' ? 'checking_balance' : 'savings_balance'] = newToBalance;
      }

      setTransferId(newTransferId);
      
      console.log('🎉 INTERNAL TRANSFER: Transfer completed successfully!', {
        transferId: newTransferId,
        amount: transferAmount,
        fromAccount: fromAccountUI.name,
        toAccount: toAccountUI.name
      });
      
      toast({
        title: "Transfer Successful",
        description: `$${amount} transferred successfully`,
      });
      
      setCurrentStep('success');
    } catch (error) {
      console.error('💥 INTERNAL TRANSFER: Transfer failed with error', error);
      console.error('💥 INTERNAL TRANSFER: Error details', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast({
        title: "Transfer Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      console.log('🏁 INTERNAL TRANSFER: Transfer process completed');
      setIsProcessing(false);
    }
  };

  const renderAccountSelection = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Internal Transfer</h2>
        <p className="text-gray-600">Transfer money between your accounts</p>
      </div>

      {/* From Account */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">From Account</h3>
        <div className="space-y-3">
          {accounts.map((account) => (
            <Card 
              key={`from-${account.id}`}
              className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                fromAccount === account.id 
                  ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFromAccount(account.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    fromAccount === account.id 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {fromAccount === account.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{account.name}</h4>
                    <p className="text-sm text-white/80">{account.type}</p>
                    <p className="text-sm text-white/60">{account.accountNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">
                    {formatBalance(account.balance)}
                  </p>
                  <p className="text-sm text-white/60">Available Balance</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* To Account */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">To Account</h3>
        <div className="space-y-3">
          {accounts.filter(acc => acc.id !== fromAccount).map((account) => (
            <Card 
              key={`to-${account.id}`}
              className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                toAccount === account.id 
                  ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setToAccount(account.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    toAccount === account.id 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {toAccount === account.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{account.name}</h4>
                    <p className="text-sm text-white/80">{account.type}</p>
                    <p className="text-sm text-white/60">{account.accountNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">
                    {formatBalance(account.balance)}
                  </p>
                  <p className="text-sm text-white/60">Current Balance</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Validation Message */}
      {fromAccount && toAccount && fromAccount === toAccount && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">
              Please select different accounts for transfer
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="flex-1 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
        >
          CANCEL
        </Button>
        <Button
          onClick={handleAccountSelection}
          disabled={!fromAccount || !toAccount || fromAccount === toAccount}
          className={`flex-1 py-3 font-semibold ${
            fromAccount && toAccount && fromAccount !== toAccount
              ? 'bg-gray-800 hover:bg-gray-900 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          NEXT
        </Button>
      </div>
    </div>
  );

  const renderAmountEntry = () => {
    const selectedFromAccount = getSelectedAccount(fromAccount);
    const isValidAmount = () => {
      const enteredAmount = parseFloat(amount);
      const accountBalance = selectedFromAccount?.balance || 0;
      
      return amount && 
             enteredAmount > 0 && 
             enteredAmount <= accountBalance;
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter amount</h2>
          {selectedFromAccount && (
            <p className="text-sm text-gray-600">
              From {selectedFromAccount.name} • Available {formatBalance(selectedFromAccount.balance)}
            </p>
          )}
        </div>

        {/* Amount Display */}
        <div className="mb-8">
          <Card className="p-6 bg-white border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-8 w-8 text-gray-600 mr-1" />
                <span className="text-4xl font-bold text-gray-900">
                  {amount || '0.00'}
                </span>
              </div>
              <p className="text-sm text-gray-500">Transfer amount</p>
            </div>
          </Card>
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="h-12 bg-white border border-gray-200 rounded-lg text-lg font-medium text-gray-900 hover:bg-gray-50 transition-colors"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleNumberClick('.')}
            className="h-12 bg-white border border-gray-200 rounded-lg text-lg font-medium text-gray-900 hover:bg-gray-50 transition-colors"
          >
            .
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            className="h-12 bg-white border border-gray-200 rounded-lg text-lg font-medium text-gray-900 hover:bg-gray-50 transition-colors"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-12 bg-white border border-gray-200 rounded-lg text-lg font-medium text-gray-900 hover:bg-gray-50 transition-colors"
          >
            ⌫
          </button>
        </div>

        <div className="mb-6">
          <button
            onClick={handleClear}
            className="w-full h-12 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Validation Message */}
        {amount && parseFloat(amount) > (selectedFromAccount?.balance || 0) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              Insufficient funds. Maximum available: {selectedFromAccount ? formatBalance(selectedFromAccount.balance) : '$0.00'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('account-selection')}
            className="flex-1 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          >
            BACK
          </Button>
          <Button
            onClick={handleAmountNext}
            disabled={!isValidAmount}
            className={`flex-1 py-3 font-semibold ${
              isValidAmount
                ? 'bg-gray-800 hover:bg-gray-900 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            NEXT
          </Button>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => {
    const selectedFromAccount = getSelectedAccount(fromAccount);
    const selectedToAccount = getSelectedAccount(toAccount);

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Transfer</h2>
          <p className="text-gray-600">Review your transfer details</p>
        </div>

        {/* Transfer Summary */}
        <Card className="p-6 mb-6 bg-white border-gray-200">
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatBalance(parseFloat(amount))}
            </div>
            <p className="text-gray-600">Transfer Amount</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">From</span>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{selectedFromAccount?.name}</div>
                <div className="text-sm text-gray-500">{selectedFromAccount?.accountNumber}</div>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">To</span>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{selectedToAccount?.name}</div>
                <div className="text-sm text-gray-500">{selectedToAccount?.accountNumber}</div>
              </div>
            </div>

            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">Transfer Fee</span>
              <span className="font-semibold text-gray-900">$0.00</span>
            </div>
          </div>
        </Card>

        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Internal transfers are processed immediately and cannot be reversed.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('amount-entry')}
            disabled={isProcessing}
            className="flex-1 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          >
            BACK
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={isProcessing}
            className="flex-1 py-3 font-semibold bg-gray-800 hover:bg-gray-900 text-white disabled:bg-gray-400"
          >
            {isProcessing ? 'PROCESSING...' : 'CONFIRM TRANSFER'}
          </Button>
        </div>
      </div>
    );
  };

  const renderSuccess = () => {
    const selectedFromAccount = getSelectedAccount(fromAccount);
    const selectedToAccount = getSelectedAccount(toAccount);

    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfer Successful!</h2>
          <p className="text-gray-600">Your money has been transferred successfully</p>
        </div>

        {/* Transfer Details */}
        <Card className="p-6 mb-6 bg-white border-gray-200 text-left">
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatBalance(parseFloat(amount))}
            </div>
            <p className="text-gray-600">Successfully Transferred</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Transfer ID</span>
              <span className="font-semibold text-gray-900">{transferId}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">From</span>
              <span className="font-semibold text-gray-900">{selectedFromAccount?.name}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">To</span>
              <span className="font-semibold text-gray-900">{selectedToAccount?.name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Date</span>
              <span className="font-semibold text-gray-900">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentStep('account-selection');
              setFromAccount('');
              setToAccount('');
              setAmount('');
              setTransferId('');
            }}
            className="flex-1 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          >
            NEW TRANSFER
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            className="flex-1 py-3 font-semibold bg-gray-800 hover:bg-gray-900 text-white"
          >
            DONE
          </Button>
        </div>
      </div>
    );
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'account-selection': return 'Internal Transfer';
      case 'amount-entry': return 'Enter Amount';
      case 'confirmation': return 'Confirm Transfer';
      case 'success': return 'Transfer Complete';
      default: return 'Internal Transfer';
    }
  };

  const handleBackClick = () => {
    switch (currentStep) {
      case 'account-selection':
        navigate('/dashboard');
        break;
      case 'amount-entry':
        setCurrentStep('account-selection');
        break;
      case 'confirmation':
        setCurrentStep('amount-entry');
        break;
      case 'success':
        navigate('/dashboard');
        break;
    }
  };

  // Show loader until both data and user profile are loaded
  if (isLoading || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          user={userData}
          showBackButton={true} 
          title="Internal Transfer"
          onBackClick={() => navigate('/dashboard')}
        />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-600 mb-4">No accounts found</p>
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={userData}
        showBackButton={true} 
        title={getStepTitle()}
        onBackClick={handleBackClick}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <>
            {currentStep === 'account-selection' && renderAccountSelection()}
            {currentStep === 'amount-entry' && renderAmountEntry()}
            {currentStep === 'confirmation' && renderConfirmation()}
            {currentStep === 'success' && renderSuccess()}
          </>
      </div>
    </div>
  );
};

export default InternalTransfer;