import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PencilIcon, XMarkIcon, CheckIcon, ClockIcon, XCircleIcon, CheckCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WireTransferManagementProps {
  user: any;
  onUpdate: () => void;
}

const WireTransferManagement: React.FC<WireTransferManagementProps> = ({ user, onUpdate }) => {
  // Account balances (from accounts table)
  const [checkingsBalance, setCheckingsBalance] = useState<string>('');
  const [savingsBalance, setSavingsBalance] = useState<string>('');
  
  // Checking account transaction data (from profiles table)
  const [checkingLastCredit, setCheckingLastCredit] = useState<string>('');
  const [checkingLastDebit, setCheckingLastDebit] = useState<string>('');
  
  // Savings account transaction data (from profiles table)
  const [savingsLastCredit, setSavingsLastCredit] = useState<string>('');
  const [savingsLastDebit, setSavingsLastDebit] = useState<string>('');
  
  // Wire transfer control (from profiles table)
  const [wireTransferEnabled, setWireTransferEnabled] = useState<boolean>(true);
  const [wireTransferBlockReason, setWireTransferBlockReason] = useState<string>('');
  
  // Edit states for each section
  const [isEditingBalances, setIsEditingBalances] = useState(false);
  const [isEditingCheckingTxn, setIsEditingCheckingTxn] = useState(false);
  const [isEditingSavingsTxn, setIsEditingSavingsTxn] = useState(false);
  const [isEditingWireTransfer, setIsEditingWireTransfer] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accountsData, setAccountsData] = useState<any>(null);

  // Wire transfer requests state
  const [wireTransfers, setWireTransfers] = useState<any[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [showTransferDetails, setShowTransferDetails] = useState(false);
  const [processingTransferId, setProcessingTransferId] = useState<string | null>(null);

  // Store original values for cancel functionality
  const [originalValues, setOriginalValues] = useState<any>({});

  // Predefined block reason templates
  const blockReasonTemplates = [
    "Your account is currently under review for security purposes. Please contact support.",
    "Wire transfers have been temporarily suspended due to unusual activity. Please contact support.",
    "Your account verification is incomplete. Please contact support.",
    "Wire transfer privileges have been restricted pending documentation. Please contact support.",
    "Your account has exceeded the monthly wire transfer limit. Please contact support.",
    "Wire transfers are temporarily disabled for maintenance. Please contact support.",
    "Additional security verification is required for wire transfers. Please contact support."
  ];

  // Load data from both accounts and profiles tables
  useEffect(() => {
    if (user?.id) {
      loadUserData();
      loadWireTransfers();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);

      // Fetch accounts from accounts table
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .in('account_type', ['checking', 'savings']);

      if (accountsError) {
        throw accountsError;
      }

      // Check if no accounts found
      if (!accounts || accounts.length === 0) {
        toast.error('No accounts found for this user. They may need to be created in the accounts table.');
      }

      // Fetch ALL data from profiles table (balances + transactions + wire transfer)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          checking_balance,
          savings_balance,
          checking_last_credit,
          checking_last_debit,
          savings_last_credit,
          savings_last_debit,
          wire_transfer_enabled,
          wire_transfer_block_reason
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Store accounts data
      setAccountsData(accounts);

      // Set balances - try accounts table first, fallback to profiles table
      const checkingAccount = accounts?.find((acc: any) => acc.account_type === 'checking');
      const savingsAccount = accounts?.find((acc: any) => acc.account_type === 'savings');


      // If no accounts found in accounts table, use profiles table balances
      if (!checkingAccount && !savingsAccount) {
        setCheckingsBalance(profile?.checking_balance?.toString() || '0');
        setSavingsBalance(profile?.savings_balance?.toString() || '0');
      } else {
        setCheckingsBalance(checkingAccount?.balance?.toString() || profile?.checking_balance?.toString() || '0');
        setSavingsBalance(savingsAccount?.balance?.toString() || profile?.savings_balance?.toString() || '0');
      }

      // Set transaction data from profiles table
      setCheckingLastCredit(profile?.checking_last_credit?.toString() || '0');
      setCheckingLastDebit(profile?.checking_last_debit?.toString() || '0');
      setSavingsLastCredit(profile?.savings_last_credit?.toString() || '0');
      setSavingsLastDebit(profile?.savings_last_debit?.toString() || '0');

      // Wire transfer control - explicitly check the value
      const isEnabled = profile?.wire_transfer_enabled === true || profile?.wire_transfer_enabled === null || profile?.wire_transfer_enabled === undefined;
      setWireTransferEnabled(isEnabled);
      setWireTransferBlockReason(profile?.wire_transfer_block_reason || '');

      // Store original values
      setOriginalValues({
        checkingsBalance: checkingAccount?.balance?.toString() || '0',
        savingsBalance: savingsAccount?.balance?.toString() || '0',
        checkingLastCredit: profile?.checking_last_credit?.toString() || '0',
        checkingLastDebit: profile?.checking_last_debit?.toString() || '0',
        savingsLastCredit: profile?.savings_last_credit?.toString() || '0',
        savingsLastDebit: profile?.savings_last_debit?.toString() || '0',
        wireTransferEnabled: profile?.wire_transfer_enabled !== false,
        wireTransferBlockReason: profile?.wire_transfer_block_reason || ''
      });

    } catch (error: any) {
      toast.error('Failed to load user data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
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

  const handleCancelWireTransfer = () => {
    setWireTransferEnabled(originalValues.wireTransferEnabled);
    setWireTransferBlockReason(originalValues.wireTransferBlockReason);
    setIsEditingWireTransfer(false);
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num);
  };

  const handleSaveChanges = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {

      // Update accounts table if accounts exist
      if (accountsData && accountsData.length > 0) {
        // Update checking account
        const checkingAccount = accountsData.find((acc: any) => acc.account_type === 'checking');
        if (checkingAccount) {
          const { error: checkingError } = await supabase
            .from('accounts')
            .update({
              balance: parseFloat(checkingsBalance) || 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', checkingAccount.id);

          if (checkingError) {
            throw checkingError;
          }
        }

        // Update savings account
        const savingsAccount = accountsData.find((acc: any) => acc.account_type === 'savings');
        if (savingsAccount) {
          const { error: savingsError } = await supabase
            .from('accounts')
            .update({
              balance: parseFloat(savingsBalance) || 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', savingsAccount.id);

          if (savingsError) {
            throw savingsError;
          }
        }
      }

      // Always update profiles table
      const profileUpdates: any = {
        checking_last_credit: parseFloat(checkingLastCredit) || 0,
        checking_last_debit: parseFloat(checkingLastDebit) || 0,
        savings_last_credit: parseFloat(savingsLastCredit) || 0,
        savings_last_debit: parseFloat(savingsLastDebit) || 0,
        wire_transfer_enabled: wireTransferEnabled,
        wire_transfer_block_reason: wireTransferEnabled ? null : wireTransferBlockReason,
        updated_at: new Date().toISOString()
      };

      // If no accounts exist, also update profiles table balances
      if (!accountsData || accountsData.length === 0) {
        profileUpdates.checking_balance = parseFloat(checkingsBalance) || 0;
        profileUpdates.savings_balance = parseFloat(savingsBalance) || 0;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Exit all edit modes
      setIsEditingBalances(false);
      setIsEditingCheckingTxn(false);
      setIsEditingSavingsTxn(false);
      setIsEditingWireTransfer(false);

      // Update original values to current values
      setOriginalValues({
        checkingsBalance,
        savingsBalance,
        checkingLastCredit,
        checkingLastDebit,
        savingsLastCredit,
        savingsLastDebit,
        wireTransferEnabled,
        wireTransferBlockReason
      });

      toast.success('Account data updated successfully! ✅');
      
      onUpdate(); // Refresh the user list
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const loadWireTransfers = async () => {
    try {
      setLoadingTransfers(true);
      const { data, error } = await supabase
        .from('wire_transfers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWireTransfers(data || []);
    } catch (error: any) {
      toast.error('Failed to load wire transfers');
    } finally {
      setLoadingTransfers(false);
    }
  };

  const handleUpdateTransferStatus = async (transferId: string, newStatus: string) => {
    try {
      setProcessingTransferId(transferId);
      
      const transfer = wireTransfers.find(t => t.id === transferId);
      
      // Show confirmation for approval (since it deducts money)
      if (newStatus === 'completed' && transfer) {
        const confirmed = window.confirm(
          `⚠️ CONFIRM APPROVAL\n\n` +
          `This will:\n` +
          `• Approve the wire transfer of ${formatCurrency(transfer.total_amount)}\n` +
          `• Automatically deduct ${formatCurrency(transfer.total_amount)} from user's account\n` +
          `• Mark the transfer as completed\n\n` +
          `Are you sure you want to proceed?`
        );
        
        if (!confirmed) {
          setProcessingTransferId(null);
          return;
        }
      }
      
      const { error } = await supabase
        .from('wire_transfers')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', transferId);

      if (error) throw error;

      // Also update the associated transaction if it exists
      if (transfer?.transaction_id) {
        await supabase
          .from('transactions')
          .update({ 
            status: newStatus === 'completed' ? 'completed' : newStatus === 'rejected' ? 'failed' : 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', transfer.transaction_id);
      }

      const statusMessage = newStatus === 'completed' 
        ? 'approved and amount deducted from user account' 
        : newStatus === 'rejected' 
        ? 'declined' 
        : 'set to processing';
      
      toast.success(`Wire transfer ${statusMessage}!`);
      await loadWireTransfers(); // Reload the list
      setShowTransferDetails(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update transfer status');
    } finally {
      setProcessingTransferId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/30 text-green-400 border-green-600';
      case 'processing':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-600';
      case 'rejected':
      case 'failed':
        return 'bg-red-900/30 text-red-400 border-red-600';
      case 'pending':
      default:
        return 'bg-blue-900/30 text-blue-400 border-blue-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading account data...</p>
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
                  {formatCurrency(checkingsBalance)}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">From accounts table</p>
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
                  {formatCurrency(savingsBalance)}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">From accounts table</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checking Account Transactions */}
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
                  {formatCurrency(checkingLastCredit)}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Shows on balance card</p>
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
                  {formatCurrency(checkingLastDebit)}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Shows on balance card</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Savings Account Transactions */}
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
                  {formatCurrency(savingsLastCredit)}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Shows on balance card</p>
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
                  {formatCurrency(savingsLastDebit)}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Shows on balance card</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wire Transfer Access Control */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white text-lg">Wire Transfer Access</CardTitle>
            {!isEditingWireTransfer ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditingWireTransfer(true)}
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
                  onClick={handleCancelWireTransfer}
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
          {isEditingWireTransfer ? (
            <>
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-white text-base">Enable Wire Transfers</Label>
                  <p className="text-sm text-gray-400">
                    Allow this user to send and receive wire transfers
                  </p>
                </div>
                <Switch
                  checked={wireTransferEnabled}
                  onCheckedChange={setWireTransferEnabled}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>

              {!wireTransferEnabled && (
                <div className="space-y-3 p-4 bg-red-900/20 border border-red-800 rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-red-400 text-base">Quick Templates</Label>
                    <Select
                      onValueChange={(value) => setWireTransferBlockReason(value)}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select a reason template..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {blockReasonTemplates.map((template, index) => (
                          <SelectItem 
                            key={index} 
                            value={template}
                            className="text-white hover:bg-gray-700 focus:bg-gray-700"
                          >
                            {template.length > 60 ? template.substring(0, 60) + '...' : template}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-400 italic">
                      Choose a template or write a custom message below
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-red-400 text-base">Block Reason (Required)</Label>
                    <Textarea
                      value={wireTransferBlockReason}
                      onChange={(e) => setWireTransferBlockReason(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                      placeholder="Enter the reason why wire transfers are disabled for this user. This message will be shown to the user when they try to make a transfer."
                    />
                    <p className="text-xs text-gray-400 italic">
                      This message will be displayed to the user when they attempt a wire transfer.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-gray-300">Status</Label>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  wireTransferEnabled 
                    ? 'bg-green-900/30 text-green-400 border border-green-600' 
                    : 'bg-red-900/30 text-red-400 border border-red-600'
                }`}>
                  {wireTransferEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {!wireTransferEnabled && wireTransferBlockReason && (
                <div className="mt-3 p-3 bg-red-900/20 border border-red-800 rounded">
                  <p className="text-sm text-gray-300">
                    <strong className="text-red-400">Block Reason:</strong> {wireTransferBlockReason}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button - Only show if any section is being edited */}
      {(isEditingBalances || isEditingCheckingTxn || isEditingSavingsTxn || isEditingWireTransfer) && (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
          <Button
            onClick={handleSaveChanges}
            disabled={isSaving || (!wireTransferEnabled && !wireTransferBlockReason.trim() && isEditingWireTransfer)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            <CheckIcon className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      )}

      {isEditingWireTransfer && !wireTransferEnabled && !wireTransferBlockReason.trim() && (
        <p className="text-sm text-yellow-500 text-center">
          ⚠️ Please provide a reason for blocking wire transfers before saving
        </p>
      )}

      {/* Wire Transfer Requests Management */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white text-lg">Wire Transfer Requests</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={loadWireTransfers}
              disabled={loadingTransfers}
              className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white"
            >
              {loadingTransfers ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Manage all wire transfer requests from this user
          </p>
          <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-400">
              <strong>⚠️ Important:</strong> When you approve a wire transfer, the total amount (including fees) will be <strong>automatically deducted</strong> from the user's checking account balance. Make sure the user has sufficient funds before approving.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {loadingTransfers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : wireTransfers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No wire transfer requests found</p>
            </div>
          ) : (
            <>
              {/* User's Current Balance Display */}
              <div className="mb-4 p-3 bg-gray-800 border border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">User's Current Checking Balance:</span>
                  <span className="text-lg font-bold text-white">{formatCurrency(checkingsBalance)}</span>
                </div>
              </div>
              
              <div className="space-y-3">
              {wireTransfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-white font-semibold">
                          {formatCurrency(transfer.amount)}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(transfer.status)}`}>
                          {transfer.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        Total with fee: <span className="text-white font-semibold">{formatCurrency(transfer.total_amount)}</span>
                      </p>
                      <p className="text-sm text-gray-400">
                        To: <span className="text-gray-300">{transfer.recipient_name}</span>
                      </p>
                      <p className="text-sm text-gray-400">
                        Bank: <span className="text-gray-300">{transfer.recipient_bank_name}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(transfer.created_at)}
                      </p>
                      
                      {/* Balance Check Warning */}
                      {transfer.status === 'pending' && parseFloat(checkingsBalance) < transfer.total_amount && (
                        <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded text-xs text-red-400">
                          ⚠️ Insufficient funds! User has {formatCurrency(checkingsBalance)} but needs {formatCurrency(transfer.total_amount)}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedTransfer(transfer);
                        setShowTransferDetails(true);
                      }}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>

                  {/* Quick Action Buttons */}
                  {transfer.status === 'pending' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateTransferStatus(transfer.id, 'completed')}
                        disabled={processingTransferId === transfer.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateTransferStatus(transfer.id, 'processing')}
                        disabled={processingTransferId === transfer.id}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        <ClockIcon className="w-4 h-4 mr-1" />
                        Processing
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateTransferStatus(transfer.id, 'rejected')}
                        disabled={processingTransferId === transfer.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                  
                  {transfer.status !== 'pending' && (
                    <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
                      Status last updated: {formatDate(transfer.updated_at || transfer.created_at)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Transfer Details Modal */}
      <Dialog open={showTransferDetails} onOpenChange={setShowTransferDetails}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Wire Transfer Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Complete information about this wire transfer request
            </DialogDescription>
          </DialogHeader>

          {selectedTransfer && (
            <div className="space-y-4 mt-4">
              {/* Amount and Status */}
              <div className="p-4 bg-gray-800 rounded-lg text-center">
                <p className="text-sm text-gray-400 mb-1">Transfer Amount</p>
                <p className="text-3xl font-bold text-white mb-2">
                  {formatCurrency(selectedTransfer.amount)}
                </p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(selectedTransfer.status)}`}>
                  {selectedTransfer.status.toUpperCase()}
                </span>
              </div>

              {/* Transfer Information */}
              <div className="space-y-2">
                <h3 className="font-semibold text-white">Transfer Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400">Transfer ID</p>
                    <p className="text-gray-200 font-mono text-xs">{selectedTransfer.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Confirmation #</p>
                    <p className="text-gray-200">{selectedTransfer.confirmation_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Fee</p>
                    <p className="text-gray-200">{formatCurrency(selectedTransfer.fee || 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Amount</p>
                    <p className="text-gray-200 font-semibold">{formatCurrency(selectedTransfer.total_amount)}</p>
                  </div>
                </div>
              </div>

              {/* Sender Information */}
              <div className="space-y-2 p-3 bg-green-900/20 border border-green-800 rounded-lg">
                <h3 className="font-semibold text-green-400">Sender</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-300">Account: {selectedTransfer.from_account_number}</p>
                </div>
              </div>

              {/* Recipient Information */}
              <div className="space-y-2 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <h3 className="font-semibold text-red-400">Recipient</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-300">Name: {selectedTransfer.recipient_name}</p>
                  <p className="text-gray-300">Bank: {selectedTransfer.recipient_bank_name}</p>
                  <p className="text-gray-300">Account: {selectedTransfer.recipient_account_number}</p>
                  <p className="text-gray-300">Routing: {selectedTransfer.recipient_routing_number}</p>
                  {selectedTransfer.recipient_bank_address && (
                    <p className="text-gray-300">Address: {selectedTransfer.recipient_bank_address}</p>
                  )}
                  {selectedTransfer.reference_message && (
                    <p className="text-gray-300">Reference: {selectedTransfer.reference_message}</p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Created</p>
                  <p className="text-gray-200">{formatDate(selectedTransfer.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Last Updated</p>
                  <p className="text-gray-200">{formatDate(selectedTransfer.updated_at || selectedTransfer.created_at)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedTransfer.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t border-gray-700">
                  <Button
                    onClick={() => handleUpdateTransferStatus(selectedTransfer.id, 'completed')}
                    disabled={processingTransferId === selectedTransfer.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Approve Transfer
                  </Button>
                  <Button
                    onClick={() => handleUpdateTransferStatus(selectedTransfer.id, 'processing')}
                    disabled={processingTransferId === selectedTransfer.id}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                  >
                    <ClockIcon className="w-4 h-4 mr-2" />
                    Set to Processing
                  </Button>
                  <Button
                    onClick={() => handleUpdateTransferStatus(selectedTransfer.id, 'rejected')}
                    disabled={processingTransferId === selectedTransfer.id}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    <XCircleIcon className="w-4 h-4 mr-2" />
                    Decline Transfer
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info Message */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-400">
          <strong>💡 Note:</strong> Click the edit icon on any section to modify values. Changes will reflect immediately on the user's dashboard balance card after saving.
        </p>
      </div>
    </div>
  );
};

export default WireTransferManagement;
