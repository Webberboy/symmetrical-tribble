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
import { PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

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
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      console.log('Loading data for user:', user.id);

      // Fetch accounts from accounts table
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .in('account_type', ['checking', 'savings']);

      if (accountsError) {
        console.error('Accounts query error:', accountsError);
        throw accountsError;
      }
      console.log('Accounts data:', accounts);
      console.log('Number of accounts found:', accounts?.length);

      // Check if no accounts found
      if (!accounts || accounts.length === 0) {
        console.warn('⚠️ No accounts found for user in accounts table');
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
        console.error('Profiles query error:', profileError);
        throw profileError;
      }
      console.log('Profile data:', profile);

      // Store accounts data
      setAccountsData(accounts);

      // Set balances - try accounts table first, fallback to profiles table
      const checkingAccount = accounts?.find((acc: any) => acc.account_type === 'checking');
      const savingsAccount = accounts?.find((acc: any) => acc.account_type === 'savings');

      console.log('Checking account found:', checkingAccount);
      console.log('Savings account found:', savingsAccount);

      // Use account balances from accounts table (checking_balance and savings_balance columns)
      if (!checkingAccount && !savingsAccount) {
        console.log('⚠️ No accounts found, using default 0 balance');
        setCheckingsBalance('0');
        setSavingsBalance('0');
      } else {
        setCheckingsBalance(checkingAccount?.checking_balance?.toString() || checkingAccount?.balance?.toString() || '0');
        setSavingsBalance(savingsAccount?.savings_balance?.toString() || savingsAccount?.balance?.toString() || '0');
      }

      // Set transaction data from profiles table
      setCheckingLastCredit(profile?.checking_last_credit?.toString() || '0');
      setCheckingLastDebit(profile?.checking_last_debit?.toString() || '0');
      setSavingsLastCredit(profile?.savings_last_credit?.toString() || '0');
      setSavingsLastDebit(profile?.savings_last_debit?.toString() || '0');

      // Wire transfer control - explicitly check the value
      const isEnabled = profile?.wire_transfer_enabled === true || profile?.wire_transfer_enabled === null || profile?.wire_transfer_enabled === undefined;
      console.log('Wire transfer enabled from DB:', profile?.wire_transfer_enabled, '→ Setting to:', isEnabled);
      setWireTransferEnabled(isEnabled);
      setWireTransferBlockReason(profile?.wire_transfer_block_reason || '');

      // Store original values
      setOriginalValues({
        checkingsBalance: checkingAccount?.checking_balance?.toString() || checkingAccount?.balance?.toString() || '0',
      savingsBalance: savingsAccount?.savings_balance?.toString() || savingsAccount?.balance?.toString() || '0',
        checkingLastCredit: profile?.checking_last_credit?.toString() || '0',
        checkingLastDebit: profile?.checking_last_debit?.toString() || '0',
        savingsLastCredit: profile?.savings_last_credit?.toString() || '0',
        savingsLastDebit: profile?.savings_last_debit?.toString() || '0',
        wireTransferEnabled: profile?.wire_transfer_enabled !== false,
        wireTransferBlockReason: profile?.wire_transfer_block_reason || ''
      });

    } catch (error: any) {
      console.error('Error loading user data:', error);
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

  const formatCurrency = (value: string) => {
    const num = parseFloat(value) || 0;
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
      console.log('💾 Starting save operation...');

      // Update accounts table if accounts exist
      if (accountsData && accountsData.length > 0) {
        // Update checking account
        const checkingAccount = accountsData.find((acc: any) => acc.account_type === 'checking');
        if (checkingAccount) {
          console.log('Updating checking account:', checkingAccount.id, 'with balance:', checkingsBalance);
          const { error: checkingError } = await supabase
            .from('accounts')
            .update({
              checking_balance: parseFloat(checkingsBalance) || 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', checkingAccount.id);

          if (checkingError) {
            console.error('Checking update error:', checkingError);
            throw checkingError;
          }
          console.log('✅ Checking account updated');
        }

        // Update savings account
        const savingsAccount = accountsData.find((acc: any) => acc.account_type === 'savings');
        if (savingsAccount) {
          console.log('Updating savings account:', savingsAccount.id, 'with balance:', savingsBalance);
          const { error: savingsError } = await supabase
            .from('accounts')
            .update({
              savings_balance: parseFloat(savingsBalance) || 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', savingsAccount.id);

          if (savingsError) {
            console.error('Savings update error:', savingsError);
            throw savingsError;
          }
          console.log('✅ Savings account updated');
        }
      }

      // Always update profiles table
      console.log('Updating profiles table...');
      console.log('💾 Wire transfer values being saved:', {
        wire_transfer_enabled: wireTransferEnabled,
        wire_transfer_block_reason: wireTransferEnabled ? null : wireTransferBlockReason
      });
      const profileUpdates: any = {
        checking_last_credit: parseFloat(checkingLastCredit) || 0,
        checking_last_debit: parseFloat(checkingLastDebit) || 0,
        savings_last_credit: parseFloat(savingsLastCredit) || 0,
        savings_last_debit: parseFloat(savingsLastDebit) || 0,
        wire_transfer_enabled: wireTransferEnabled,
        wire_transfer_block_reason: wireTransferEnabled ? null : wireTransferBlockReason,
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }
      console.log('✅ Profiles table updated');

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
      console.log('✅ Save operation complete');
      
      onUpdate(); // Refresh the user list
    } catch (error: any) {
      console.error('❌ Error updating account data:', error);
      toast.error('Failed to update: ' + error.message);
    } finally {
      setIsSaving(false);
    }
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
