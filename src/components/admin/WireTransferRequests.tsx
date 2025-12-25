import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckIcon, XMarkIcon, EyeIcon, ArrowPathIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';

interface WireTransfer {
  id: string;
  user_id: string;
  transaction_id: string;
  amount: number;
  fee: number;
  total_amount: number;
  from_account_number: string;
  recipient_name: string;
  recipient_bank_name: string;
  recipient_routing_number: string;
  recipient_account_number: string;
  recipient_bank_address: string;
  account_type: string;
  reference_message: string | null;
  swift_code: string | null;
  confirmation_number: string;
  status: string;
  processing_time: string;
  authorized_at: string;
  created_at: string;
  updated_at: string;
}

interface WireTransferRequestsProps {
  user: any;
  onUpdate: () => void;
}

const WireTransferRequests: React.FC<WireTransferRequestsProps> = ({ user, onUpdate }) => {
  const [wireTransfers, setWireTransfers] = useState<WireTransfer[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<WireTransfer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWireTransfersBlocked, setIsWireTransfersBlocked] = useState(false);
  const [wireTransferBlockReason, setWireTransferBlockReason] = useState<string>('');
  const [showBlockReasonModal, setShowBlockReasonModal] = useState(false);

  // Predefined block reason templates
  const blockReasonTemplates = [
    "You have reached your daily wire transfer limit. Please contact support.",
    "Your account is currently under review for security purposes. Please contact support.",
    "Wire transfers have been temporarily suspended due to unusual activity. Please contact support.",
    "Your account verification is incomplete. Please contact support.",
    "Wire transfer privileges have been restricted pending documentation. Please contact support.",
    "Your account has exceeded the monthly wire transfer limit. Please contact support.",
    "Wire transfers are temporarily disabled for maintenance. Please contact support.",
    "Additional security verification is required for wire transfers. Please contact support."
  ];
  const [isUpdatingBlockStatus, setIsUpdatingBlockStatus] = useState(false);

  // Balance editing states
  const [checkingsBalance, setCheckingsBalance] = useState<string>('');
  const [savingsBalance, setSavingsBalance] = useState<string>('');
  const [checkingLastCredit, setCheckingLastCredit] = useState<string>('');
  const [checkingLastDebit, setCheckingLastDebit] = useState<string>('');
  const [savingsLastCredit, setSavingsLastCredit] = useState<string>('');
  const [savingsLastDebit, setSavingsLastDebit] = useState<string>('');
  const [isEditingBalances, setIsEditingBalances] = useState(false);
  const [isEditingCheckingTxn, setIsEditingCheckingTxn] = useState(false);
  const [isEditingSavingsTxn, setIsEditingSavingsTxn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [accountsData, setAccountsData] = useState<any>(null);
  const [originalValues, setOriginalValues] = useState<any>({});

  useEffect(() => {
    if (user?.id) {
      loadWireTransfers();
      loadUserData();
      loadWireTransferBlockStatus();
    }
  }, [user]);

  const loadWireTransfers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('wire_transfers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWireTransfers(data || []);
    } catch (error: any) {
      toast.error('Failed to load wire transfers: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      // Fetch accounts from accounts table
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .in('account_type', ['checking', 'savings']);

      if (accountsError) {
        throw accountsError;
      }

      // Fetch data from profiles table (only for transaction data, not balances)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          checking_last_credit,
          checking_last_debit,
          savings_last_credit,
          savings_last_debit
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        // If profile doesn't have these columns, set defaults
        console.warn('Profile transaction columns not found, using defaults');
      }

      // Store accounts data
      setAccountsData(accounts);

      // Set balances from accounts table
      const checkingAccount = accounts?.find((acc: any) => acc.account_type === 'checking');
      const savingsAccount = accounts?.find((acc: any) => acc.account_type === 'savings');

      if (!checkingAccount && !savingsAccount) {
        setCheckingsBalance('0');
        setSavingsBalance('0');
      } else {
        setCheckingsBalance(checkingAccount?.checking_balance?.toString() || checkingAccount?.balance?.toString() || '0');
        setSavingsBalance(savingsAccount?.savings_balance?.toString() || savingsAccount?.balance?.toString() || '0');
      }

      // Set transaction data from profile (with fallbacks)
      setCheckingLastCredit(profile?.checking_last_credit?.toString() || '0');
      setCheckingLastDebit(profile?.checking_last_debit?.toString() || '0');
      setSavingsLastCredit(profile?.savings_last_credit?.toString() || '0');
      setSavingsLastDebit(profile?.savings_last_debit?.toString() || '0');

      // Store original values
      setOriginalValues({
        checkingsBalance: checkingAccount?.checking_balance?.toString() || checkingAccount?.balance?.toString() || '0',
        savingsBalance: savingsAccount?.savings_balance?.toString() || savingsAccount?.balance?.toString() || '0',
        checkingLastCredit: profile?.checking_last_credit?.toString() || '0',
        checkingLastDebit: profile?.checking_last_debit?.toString() || '0',
        savingsLastCredit: profile?.savings_last_credit?.toString() || '0',
        savingsLastDebit: profile?.savings_last_debit?.toString() || '0'
      });

    } catch (error: any) {
      toast.error('Failed to load user data: ' + error.message);
    }
  };

  const loadWireTransferBlockStatus = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('wire_transfers_blocked')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setIsWireTransfersBlocked(profile?.wire_transfers_blocked || false);
    } catch (error: any) {
      console.error('Failed to load wire transfer block status:', error);
    }
  };

  const toggleWireTransferBlock = async () => {
    if (!user?.id) return;

    // If blocking and no reason provided yet, show the modal
    if (!isWireTransfersBlocked && !wireTransferBlockReason.trim()) {
      setShowBlockReasonModal(true);
      return;
    }

    // If unblocking, proceed directly
    if (isWireTransfersBlocked) {
      await executeBlockToggle(false);
    } else {
      // If blocking and reason is provided, proceed
      await executeBlockToggle(true);
    }
  };

  const executeBlockToggle = async (block: boolean) => {
    if (!user?.id) return;

    setIsUpdatingBlockStatus(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          wire_transfers_blocked: block,
          wire_transfer_block_reason: block ? wireTransferBlockReason : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setIsWireTransfersBlocked(block);
      if (!block) {
        setWireTransferBlockReason(''); // Clear reason when unblocking
      }
      toast.success(`Wire transfers ${block ? 'blocked' : 'unblocked'} successfully!`);
      onUpdate();
    } catch (error: any) {
      toast.error('Failed to update wire transfer block status: ' + error.message);
    } finally {
      setIsUpdatingBlockStatus(false);
    }
  };

  const handleConfirmBlock = async () => {
    if (!wireTransferBlockReason.trim()) {
      toast.error('Please provide a reason for blocking wire transfers');
      return;
    }
    
    setShowBlockReasonModal(false);
    await executeBlockToggle(true);
  };

  const handleCancelBlock = () => {
    setShowBlockReasonModal(false);
    setWireTransferBlockReason('');
  };

  const handleCancelBalances = () => {
    setCheckingsBalance(originalValues.checkingsBalance);
    setSavingsBalance(originalValues.savingsBalance);
    setIsEditingBalances(false);
  };

  const handleCancelCheckingTxn = () => {
    setCheckingLastCredit(originalValues.checkingLastCredit);
    setCheckingLastDebit(originalValues.checkingLastDebit);
    setIsEditingCheckingTxn(false);
  };

  const handleCancelSavingsTxn = () => {
    setSavingsLastCredit(originalValues.savingsLastCredit);
    setSavingsLastDebit(originalValues.savingsLastDebit);
    setIsEditingSavingsTxn(false);
  };

  const handleSaveChanges = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {

      // Update accounts table if accounts exist
      let checkingAccount: any = null;
      let savingsAccount: any = null;

      if (accountsData && accountsData.length > 0) {
        checkingAccount = accountsData.find((acc: any) => acc.account_type === 'checking');
        if (checkingAccount) {
          const { error: checkingError } = await supabase
            .from('accounts')
            .update({
              balance: parseFloat(checkingsBalance) || 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', checkingAccount.id);

          if (checkingError) throw checkingError;
        }

        savingsAccount = accountsData.find((acc: any) => acc.account_type === 'savings');
        if (savingsAccount) {
          const { error: savingsError } = await supabase
            .from('accounts')
            .update({
              balance: parseFloat(savingsBalance) || 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', savingsAccount.id);

          if (savingsError) throw savingsError;
        }
      }

      // Update profiles table
      const profileUpdates: any = {
        checking_last_credit: parseFloat(checkingLastCredit) || 0,
        checking_last_debit: parseFloat(checkingLastDebit) || 0,
        savings_last_credit: parseFloat(savingsLastCredit) || 0,
        savings_last_debit: parseFloat(savingsLastDebit) || 0,
        updated_at: new Date().toISOString()
      };

      // Update checking_balance and savings_balance columns in accounts table
      if (checkingAccount) {
        const { error: checkingBalanceError } = await supabase
          .from('accounts')
          .update({
            checking_balance: parseFloat(checkingsBalance) || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', checkingAccount.id);

        if (checkingBalanceError) {
          console.error('Checking balance update error:', checkingBalanceError);
          throw checkingBalanceError;
        }
      }

      if (savingsAccount) {
        const { error: savingsBalanceError } = await supabase
          .from('accounts')
          .update({
            savings_balance: parseFloat(savingsBalance) || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', savingsAccount.id);

        if (savingsBalanceError) {
          console.error('Savings balance update error:', savingsBalanceError);
          throw savingsBalanceError;
        }
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Exit all edit modes
      setIsEditingBalances(false);
      setIsEditingCheckingTxn(false);
      setIsEditingSavingsTxn(false);

      // Update original values
      setOriginalValues({
        checkingsBalance,
        savingsBalance,
        checkingLastCredit,
        checkingLastDebit,
        savingsLastCredit,
        savingsLastDebit
      });

      toast.success('Account data updated successfully! ✅');
      onUpdate();
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAccept = async (transfer: WireTransfer) => {
    setIsProcessing(true);
    try {
      // Update wire transfer status
      const { error: wireError } = await supabase
        .from('wire_transfers')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', transfer.id);

      if (wireError) throw wireError;

      // Update transaction status
      const { error: txnError } = await supabase
        .from('transactions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', transfer.transaction_id);

      if (txnError) throw txnError;

      // Deduct from user's account balance
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('account_type', 'checking');

      if (accountsError) {
      } else if (accounts && accounts.length > 0) {
        const account = accounts[0];
        const currentBalance = account.checking_balance || account.balance || 0;
        
        // Calculate the amount to deduct - use total_amount if available, otherwise calculate from amount + fees
        const amountToDeduct = transfer.total_amount > 0 ? transfer.total_amount : (transfer.amount + (transfer.fees || 0));
        const newBalance = currentBalance - amountToDeduct;
        
        const { error: balanceError } = await supabase
          .from('accounts')
          .update({ 
            checking_balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', account.id);

        if (balanceError) {
        }
      }

      toast.success('Wire transfer approved! ✅');
      setShowDetailsModal(false);
      await loadWireTransfers();
      onUpdate();
    } catch (error: any) {
      toast.error('Failed to approve: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async (transfer: WireTransfer) => {
    setIsProcessing(true);
    try {
      // Update wire transfer status
      const { error: wireError } = await supabase
        .from('wire_transfers')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', transfer.id);

      if (wireError) throw wireError;

      // Update transaction status
      const { error: txnError } = await supabase
        .from('transactions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', transfer.transaction_id);

      if (txnError) throw txnError;

      // Refund to user's account balance (if money was held)
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('account_type', 'checking');

      if (accountsError) {
      } else if (accounts && accounts.length > 0) {
        const account = accounts[0];
        const currentBalance = account.checking_balance || account.balance || 0;
        
        // Calculate the amount to refund - use total_amount if available, otherwise calculate from amount + fees
        const amountToRefund = transfer.total_amount > 0 ? transfer.total_amount : (transfer.amount + (transfer.fees || 0));
        const newBalance = currentBalance + amountToRefund;
        
        const { error: balanceError } = await supabase
          .from('accounts')
          .update({ 
            checking_balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', account.id);

        if (balanceError) {
        }
      }

      toast.success('Wire transfer declined and funds restored! 💰');
      setShowDetailsModal(false);
      await loadWireTransfers();
      onUpdate();
    } catch (error: any) {
      toast.error('Failed to decline: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading wire transfer requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Balances */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white text-lg">Account Balances</CardTitle>
            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                variant={isWireTransfersBlocked ? "default" : "outline"}
                onClick={toggleWireTransferBlock}
                disabled={isUpdatingBlockStatus}
                className={isWireTransfersBlocked 
                  ? "bg-red-600 hover:bg-red-700 text-white border-red-600" 
                  : "text-orange-400 border-orange-400 hover:bg-orange-400 hover:text-white"
                }
              >
                {isUpdatingBlockStatus ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : isWireTransfersBlocked ? (
                  <CheckIcon className="w-4 h-4 mr-1" />
                ) : (
                  <XMarkIcon className="w-4 h-4 mr-1" />
                )}
                {isWireTransfersBlocked ? 'Wire Transfers Paused' : 'Pause Wire Transfers'}
              </Button>
              {!isEditingBalances ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingBalances(true)}
                  className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white"
                >
                  <PencilIcon className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelBalances}
                    className="text-gray-400 border-gray-400 hover:bg-gray-400 hover:text-white"
                  >
                    <XMarkIcon className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-300">Checking Balance</Label>
              {isEditingBalances ? (
                <div className="flex gap-2 mt-1">
                  <span className="text-white text-2xl">$</span>
                  <Input
                    type="number"
                    step="any"
                    value={checkingsBalance}
                    onChange={(e) => setCheckingsBalance(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white text-lg font-semibold"
                    placeholder="0.00"
                  />
                </div>
              ) : (
                <div className="mt-1 text-2xl font-bold text-white">
                  {formatCurrency(parseFloat(checkingsBalance))}
                </div>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Savings Balance</Label>
              {isEditingBalances ? (
                <div className="flex gap-2 mt-1">
                  <span className="text-white text-2xl">$</span>
                  <Input
                    type="number"
                    step="any"
                    value={savingsBalance}
                    onChange={(e) => setSavingsBalance(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white text-lg font-semibold"
                    placeholder="0.00"
                  />
                </div>
              ) : (
                <div className="mt-1 text-2xl font-bold text-white">
                  {formatCurrency(parseFloat(savingsBalance))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checking Account Transactions - COMMENTED OUT
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white text-lg">Checking - Last Transactions</CardTitle>
            {!isEditingCheckingTxn ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditingCheckingTxn(true)}
                className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white"
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelCheckingTxn}
                  className="text-gray-400 border-gray-400 hover:bg-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-300">Last Credit</Label>
              {isEditingCheckingTxn ? (
                <div className="flex gap-2 mt-1">
                  <span className="text-white text-xl">$</span>
                  <Input
                    type="number"
                    step="any"
                    value={checkingLastCredit}
                    onChange={(e) => setCheckingLastCredit(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="0.00"
                  />
                </div>
              ) : (
                <div className="mt-1 text-xl font-semibold text-green-400">
                  {formatCurrency(parseFloat(checkingLastCredit))}
                </div>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Last Debit</Label>
              {isEditingCheckingTxn ? (
                <div className="flex gap-2 mt-1">
                  <span className="text-white text-xl">$</span>
                  <Input
                    type="number"
                    step="any"
                    value={checkingLastDebit}
                    onChange={(e) => setCheckingLastDebit(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="0.00"
                  />
                </div>
              ) : (
                <div className="mt-1 text-xl font-semibold text-red-400">
                  {formatCurrency(parseFloat(checkingLastDebit))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      */}

      {/* Savings Account Transactions - COMMENTED OUT
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white text-lg">Savings - Last Transactions</CardTitle>
            {!isEditingSavingsTxn ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditingSavingsTxn(true)}
                className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white"
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelSavingsTxn}
                  className="text-gray-400 border-gray-400 hover:bg-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-300">Last Credit</Label>
              {isEditingSavingsTxn ? (
                <div className="flex gap-2 mt-1">
                  <span className="text-white text-xl">$</span>
                  <Input
                    type="number"
                    step="any"
                    value={savingsLastCredit}
                    onChange={(e) => setSavingsLastCredit(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="0.00"
                  />
                </div>
              ) : (
                <div className="mt-1 text-xl font-semibold text-green-400">
                  {formatCurrency(parseFloat(savingsLastCredit))}
                </div>
              )}
            </div>
            <div>
              <Label className="text-gray-300">Last Debit</Label>
              {isEditingSavingsTxn ? (
                <div className="flex gap-2 mt-1">
                  <span className="text-white text-xl">$</span>
                  <Input
                    type="number"
                    step="any"
                    value={savingsLastDebit}
                    onChange={(e) => setSavingsLastDebit(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="0.00"
                  />
                </div>
              ) : (
                <div className="mt-1 text-xl font-semibold text-red-400">
                  {formatCurrency(parseFloat(savingsLastDebit))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      */}

      {/* Save Button - Only show if any section is being edited */}
      {(isEditingBalances || isEditingCheckingTxn || isEditingSavingsTxn) && (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
          <Button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            <CheckIcon className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      )}

      {/* Wire Transfer Requests */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white text-lg">Wire Transfer Requests</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={loadWireTransfers}
              className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {wireTransfers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No wire transfer requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-300">Recipient</TableHead>
                    <TableHead className="text-gray-300">Bank</TableHead>
                    <TableHead className="text-gray-300 text-right">Amount</TableHead>
                    <TableHead className="text-gray-300 text-right">Fee</TableHead>
                    <TableHead className="text-gray-300 text-right">Total</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Confirmation #</TableHead>
                    <TableHead className="text-gray-300 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wireTransfers.map((transfer) => (
                    <TableRow key={transfer.id} className="border-gray-700">
                      <TableCell className="text-gray-300">
                        {new Date(transfer.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-white">{transfer.recipient_name}</TableCell>
                      <TableCell className="text-gray-300">{transfer.recipient_bank_name}</TableCell>
                      <TableCell className="text-right text-white">
                        {formatCurrency(transfer.amount)}
                      </TableCell>
                      <TableCell className="text-right text-gray-300">
                        {formatCurrency(transfer.fee)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-white">
                        {formatCurrency(transfer.total_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transfer.status)}>
                          {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-400">
                        {transfer.confirmation_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTransfer(transfer);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                          {(transfer.status === 'pending' || transfer.status === 'processing') && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAccept(transfer)}
                                disabled={isProcessing}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDecline(transfer)}
                                disabled={isProcessing}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[600px] bg-gray-800 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Wire Transfer Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Complete information about this wire transfer request
            </DialogDescription>
          </DialogHeader>

          {selectedTransfer && (
            <div className="space-y-6 mt-4">
              {/* Amount Section */}
              <div className="text-center py-6 bg-gray-900 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Total Amount</p>
                <p className="text-4xl font-bold text-white">
                  {formatCurrency(selectedTransfer.total_amount)}
                </p>
                <div className="mt-2 text-sm text-gray-400">
                  <span>Amount: {formatCurrency(selectedTransfer.amount)}</span>
                  <span className="mx-2">+</span>
                  <span>Fee: {formatCurrency(selectedTransfer.fee)}</span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Status</span>
                  <Badge className={getStatusColor(selectedTransfer.status)}>
                    {selectedTransfer.status.charAt(0).toUpperCase() + selectedTransfer.status.slice(1)}
                  </Badge>
                </div>

                <div className="flex justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">From Account</span>
                  <span className="text-white font-mono">{selectedTransfer.from_account_number}</span>
                </div>

                <div className="flex justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Recipient Name</span>
                  <span className="text-white font-semibold">{selectedTransfer.recipient_name}</span>
                </div>

                <div className="flex justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Recipient Bank</span>
                  <span className="text-white">{selectedTransfer.recipient_bank_name}</span>
                </div>

                <div className="flex justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Routing Number</span>
                  <span className="text-white font-mono">{selectedTransfer.recipient_routing_number}</span>
                </div>

                <div className="flex justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Account Number</span>
                  <span className="text-white font-mono">{selectedTransfer.recipient_account_number}</span>
                </div>

                <div className="flex justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Account Type</span>
                  <span className="text-white capitalize">{selectedTransfer.account_type}</span>
                </div>

                {selectedTransfer.recipient_bank_address && (
                  <div className="flex justify-between py-3 border-b border-gray-700">
                    <span className="text-gray-400">Bank Address</span>
                    <span className="text-white text-right">{selectedTransfer.recipient_bank_address}</span>
                  </div>
                )}

                {selectedTransfer.swift_code && (
                  <div className="flex justify-between py-3 border-b border-gray-700">
                    <span className="text-gray-400">SWIFT Code</span>
                    <span className="text-white font-mono">{selectedTransfer.swift_code}</span>
                  </div>
                )}

                {selectedTransfer.reference_message && (
                  <div className="flex justify-between py-3 border-b border-gray-700">
                    <span className="text-gray-400">Reference Message</span>
                    <span className="text-white text-right">{selectedTransfer.reference_message}</span>
                  </div>
                )}

                <div className="flex justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Processing Time</span>
                  <span className="text-white">{selectedTransfer.processing_time}</span>
                </div>

                <div className="flex justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Confirmation Number</span>
                  <span className="text-white font-mono">{selectedTransfer.confirmation_number}</span>
                </div>

                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Request Date</span>
                  <span className="text-white">
                    {new Date(selectedTransfer.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-gray-700">
                {(selectedTransfer.status === 'pending' || selectedTransfer.status === 'processing') && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleDecline(selectedTransfer)}
                      disabled={isProcessing}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <XMarkIcon className="w-4 h-4 mr-2" />
                          Decline Transfer
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleAccept(selectedTransfer)}
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="w-4 h-4 mr-2" />
                          Accept Transfer
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full border-gray-500 bg-gray-700 hover:bg-gray-600 text-white font-semibold"
                  onClick={() => setShowDetailsModal(false)}
                  disabled={isProcessing}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Block Reason Modal */}
      <Dialog open={showBlockReasonModal} onOpenChange={setShowBlockReasonModal}>
        <DialogContent className="sm:max-w-[500px] bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Block Wire Transfers</DialogTitle>
            <DialogDescription className="text-gray-400">
              Please select a reason for blocking wire transfers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="space-y-3">
              <Label className="text-white">Select a reason:</Label>
              <div className="space-y-2">
                {blockReasonTemplates.map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={`w-full justify-start text-left ${
                      wireTransferBlockReason === template 
                        ? "bg-blue-600 text-white border-blue-600" 
                        : "text-gray-300 border-gray-600 hover:bg-gray-700"
                    }`}
                    onClick={() => setWireTransferBlockReason(template)}
                  >
                    {template}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-white">Or type your own reason:</Label>
              <Input
                placeholder="Enter custom reason..."
                value={wireTransferBlockReason}
                onChange={(e) => setWireTransferBlockReason(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-700">
              <Button
                variant="outline"
                className="flex-1 border-gray-500 bg-gray-700 hover:bg-gray-600 text-white"
                onClick={handleCancelBlock}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleConfirmBlock}
                disabled={!wireTransferBlockReason.trim()}
              >
                Block Transfers
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WireTransferRequests;
