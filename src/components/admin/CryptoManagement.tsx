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
import { PencilIcon, XMarkIcon, CheckIcon, WalletIcon } from '@heroicons/react/24/outline';

interface CryptoManagementProps {
  user: any;
  onUpdate: () => void;
}

const CryptoManagement: React.FC<CryptoManagementProps> = ({ user, onUpdate }) => {
  // Crypto wallet balances
  const [btcBalance, setBtcBalance] = useState<string>('');
  const [ethBalance, setEthBalance] = useState<string>('');
  const [adaBalance, setAdaBalance] = useState<string>('');
  
  // Crypto USD values
  const [btcUsdValue, setBtcUsdValue] = useState<string>('');
  const [ethUsdValue, setEthUsdValue] = useState<string>('');
  const [adaUsdValue, setAdaUsdValue] = useState<string>('');
  
  // Crypto trading control
  const [cryptoBuyEnabled, setCryptoBuyEnabled] = useState<boolean>(true);
  const [cryptoSellEnabled, setCryptoSellEnabled] = useState<boolean>(true);
  const [cryptoBlockReason, setCryptoBlockReason] = useState<string>('');
  
  // Admin wallet addresses for sell transactions
  const [btcWalletAddress, setBtcWalletAddress] = useState<string>('');
  const [ethWalletAddress, setEthWalletAddress] = useState<string>('');
  const [adaWalletAddress, setAdaWalletAddress] = useState<string>('');
  
  // Edit states for each section
  const [isEditingBalances, setIsEditingBalances] = useState(false);
  const [isEditingCryptoControl, setIsEditingCryptoControl] = useState(false);
  const [isEditingWalletAddresses, setIsEditingWalletAddresses] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Store original values for cancel functionality
  const [originalValues, setOriginalValues] = useState<any>({});

  // Predefined block reason templates
  const blockReasonTemplates = [
    "Crypto trading has been temporarily suspended for security verification. Please contact support.",
    "Your account is under review for unusual crypto activity. Please contact support.",
    "Crypto trading privileges have been restricted pending documentation. Please contact support.",
    "Your account has exceeded the monthly crypto trading limit. Please contact support.",
    "Crypto trading is temporarily disabled for maintenance. Please contact support.",
    "Additional identity verification is required for crypto trading. Please contact support.",
    "Your crypto trading has been restricted due to regulatory compliance. Please contact support."
  ];

  // Load data from crypto_wallets table and profiles table
  useEffect(() => {
    if (user?.id) {
      loadUserData();
      loadAdminWalletAddresses();
    }
  }, [user]);

  const loadAdminWalletAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_crypto_wallets')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const btcWallet = data?.find(w => w.asset_id === 'btc');
      const ethWallet = data?.find(w => w.asset_id === 'eth');
      const adaWallet = data?.find(w => w.asset_id === 'ada');

      setBtcWalletAddress(btcWallet?.wallet_address || '');
      setEthWalletAddress(ethWallet?.wallet_address || '');
      setAdaWalletAddress(adaWallet?.wallet_address || '');

      setOriginalValues(prev => ({
        ...prev,
        btcWalletAddress: btcWallet?.wallet_address || '',
        ethWalletAddress: ethWallet?.wallet_address || '',
        adaWalletAddress: adaWallet?.wallet_address || ''
      }));
    } catch (error) {
      toast.error('Failed to load wallet addresses');
    }
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);

      // Fetch crypto wallets
      const { data: wallets, error: walletsError } = await supabase
        .from('crypto_wallets')
        .select('*')
        .eq('user_id', user.id);

      if (walletsError) {
        throw walletsError;
      }


      // Parse wallet balances
      const btcWallet = wallets?.find(w => w.asset_id === 'btc');
      const ethWallet = wallets?.find(w => w.asset_id === 'eth');
      const adaWallet = wallets?.find(w => w.asset_id === 'ada');

      const btcBal = btcWallet?.balance?.toString() || '0';
      const ethBal = ethWallet?.balance?.toString() || '0';
      const adaBal = adaWallet?.balance?.toString() || '0';

      // Fetch current crypto prices
      const { data: prices, error: pricesError } = await supabase
        .from('crypto_prices')
        .select('*');

      if (pricesError) {
        throw pricesError;
      }


      // Calculate USD values based on current prices
      const btcPrice = prices?.find(p => p.asset_id === 'btc')?.price_usd || 0;
      const ethPrice = prices?.find(p => p.asset_id === 'eth')?.price_usd || 0;
      const adaPrice = prices?.find(p => p.asset_id === 'ada')?.price_usd || 0;

      const btcUsd = (parseFloat(btcBal) * parseFloat(btcPrice.toString())).toFixed(2);
      const ethUsd = (parseFloat(ethBal) * parseFloat(ethPrice.toString())).toFixed(2);
      const adaUsd = (parseFloat(adaBal) * parseFloat(adaPrice.toString())).toFixed(2);

      // Fetch crypto control settings from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          crypto_buy_enabled,
          crypto_sell_enabled,
          crypto_block_reason
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }


      // Set states
      setBtcBalance(btcBal);
      setEthBalance(ethBal);
      setAdaBalance(adaBal);
      setBtcUsdValue(btcUsd);
      setEthUsdValue(ethUsd);
      setAdaUsdValue(adaUsd);
      setCryptoBuyEnabled(profile?.crypto_buy_enabled ?? true);
      setCryptoSellEnabled(profile?.crypto_sell_enabled ?? true);
      setCryptoBlockReason(profile?.crypto_block_reason || '');

      // Store original values
      setOriginalValues({
        btcBalance: btcBal,
        ethBalance: ethBal,
        adaBalance: adaBal,
        btcUsdValue: btcUsd,
        ethUsdValue: ethUsd,
        adaUsdValue: adaUsd,
        cryptoBuyEnabled: profile?.crypto_buy_enabled ?? true,
        cryptoSellEnabled: profile?.crypto_sell_enabled ?? true,
        cryptoBlockReason: profile?.crypto_block_reason || ''
      });

    } catch (error) {
      toast.error('Failed to load crypto data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBalances = async () => {
    try {
      setIsSaving(true);

      // Update or insert BTC wallet
      const btcValue = parseFloat(btcBalance) || 0;
      const { data: existingBtc, error: btcSelectError } = await supabase
        .from('crypto_wallets')
        .select('id')
        .eq('user_id', user.id)
        .eq('asset_id', 'btc')
        .single();

      if (btcSelectError && btcSelectError.code !== 'PGRST116') {
        throw btcSelectError;
      }

      if (existingBtc) {
        const { error: btcUpdateError } = await supabase
          .from('crypto_wallets')
          .update({ balance: btcValue, updated_at: new Date().toISOString() })
          .eq('id', existingBtc.id);
        
        if (btcUpdateError) {
          throw btcUpdateError;
        }
      } else {
        const { error: btcInsertError } = await supabase
          .from('crypto_wallets')
          .insert({
            user_id: user.id,
            asset_id: 'btc',
            balance: btcValue
          });
        
        if (btcInsertError) {
          throw btcInsertError;
        }
      }

      // Update or insert ETH wallet
      const ethValue = parseFloat(ethBalance) || 0;
      const { data: existingEth, error: ethSelectError } = await supabase
        .from('crypto_wallets')
        .select('id')
        .eq('user_id', user.id)
        .eq('asset_id', 'eth')
        .single();

      if (ethSelectError && ethSelectError.code !== 'PGRST116') {
        throw ethSelectError;
      }

      if (existingEth) {
        const { error: ethUpdateError } = await supabase
          .from('crypto_wallets')
          .update({ balance: ethValue, updated_at: new Date().toISOString() })
          .eq('id', existingEth.id);
        
        if (ethUpdateError) {
          throw ethUpdateError;
        }
      } else {
        const { error: ethInsertError } = await supabase
          .from('crypto_wallets')
          .insert({
            user_id: user.id,
            asset_id: 'eth',
            balance: ethValue
          });
        
        if (ethInsertError) {
          throw ethInsertError;
        }
      }

      // Update or insert ADA wallet
      const adaValue = parseFloat(adaBalance) || 0;
      const { data: existingAda, error: adaSelectError } = await supabase
        .from('crypto_wallets')
        .select('id')
        .eq('user_id', user.id)
        .eq('asset_id', 'ada')
        .single();

      if (adaSelectError && adaSelectError.code !== 'PGRST116') {
        throw adaSelectError;
      }

      if (existingAda) {
        const { error: adaUpdateError } = await supabase
          .from('crypto_wallets')
          .update({ balance: adaValue, updated_at: new Date().toISOString() })
          .eq('id', existingAda.id);
        
        if (adaUpdateError) {
          throw adaUpdateError;
        }
      } else {
        const { error: adaInsertError } = await supabase
          .from('crypto_wallets')
          .insert({
            user_id: user.id,
            asset_id: 'ada',
            balance: adaValue
          });
        
        if (adaInsertError) {
          throw adaInsertError;
        }
      }

      // Update crypto prices based on the USD values you entered
      // This ensures the user sees exactly the portfolio value you set
      if (btcValue > 0 && parseFloat(btcUsdValue) > 0) {
        const btcPrice = parseFloat(btcUsdValue) / btcValue;
        const { error: btcPriceError } = await supabase
          .from('crypto_prices')
          .update({ 
            price_usd: btcPrice,
            updated_at: new Date().toISOString()
          })
          .eq('asset_id', 'btc');
        
        if (btcPriceError) {
        } else {
        }
      }

      if (ethValue > 0 && parseFloat(ethUsdValue) > 0) {
        const ethPrice = parseFloat(ethUsdValue) / ethValue;
        const { error: ethPriceError } = await supabase
          .from('crypto_prices')
          .update({ 
            price_usd: ethPrice,
            updated_at: new Date().toISOString()
          })
          .eq('asset_id', 'eth');
        
        if (ethPriceError) {
        } else {
        }
      }

      if (adaValue > 0 && parseFloat(adaUsdValue) > 0) {
        const adaPrice = parseFloat(adaUsdValue) / adaValue;
        const { error: adaPriceError } = await supabase
          .from('crypto_prices')
          .update({ 
            price_usd: adaPrice,
            updated_at: new Date().toISOString()
          })
          .eq('asset_id', 'ada');
        
        if (adaPriceError) {
        } else {
        }
      }

      toast.success('Crypto balances and USD values saved exactly as entered! ✅');
      setIsEditingBalances(false);
      setOriginalValues(prev => ({
        ...prev,
        btcBalance,
        ethBalance,
        adaBalance,
        btcUsdValue,
        ethUsdValue,
        adaUsdValue
      }));
      
      // Don't reload data - keep the values admin entered
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update crypto balances');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCryptoControl = async () => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          crypto_buy_enabled: cryptoBuyEnabled,
          crypto_sell_enabled: cryptoSellEnabled,
          crypto_block_reason: cryptoBlockReason
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Crypto trading controls updated successfully');
      setIsEditingCryptoControl(false);
      setOriginalValues(prev => ({
        ...prev,
        cryptoBuyEnabled,
        cryptoSellEnabled,
        cryptoBlockReason
      }));
      onUpdate();
    } catch (error) {
      toast.error('Failed to update crypto trading controls');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelBalances = () => {
    setBtcBalance(originalValues.btcBalance);
    setEthBalance(originalValues.ethBalance);
    setAdaBalance(originalValues.adaBalance);
    setBtcUsdValue(originalValues.btcUsdValue);
    setEthUsdValue(originalValues.ethUsdValue);
    setAdaUsdValue(originalValues.adaUsdValue);
    setIsEditingBalances(false);
  };

  const handleCancelCryptoControl = () => {
    setCryptoBuyEnabled(originalValues.cryptoBuyEnabled);
    setCryptoSellEnabled(originalValues.cryptoSellEnabled);
    setCryptoBlockReason(originalValues.cryptoBlockReason);
    setIsEditingCryptoControl(false);
  };

  const handleSaveWalletAddresses = async () => {
    try {
      setIsSaving(true);

      // Update BTC wallet address
      const { error: btcError } = await supabase
        .from('admin_crypto_wallets')
        .upsert({
          asset_id: 'btc',
          wallet_address: btcWalletAddress,
          wallet_name: 'Unity Capital BTC Wallet',
          is_active: true
        }, { onConflict: 'asset_id' });

      if (btcError) throw btcError;

      // Update ETH wallet address
      const { error: ethError } = await supabase
        .from('admin_crypto_wallets')
        .upsert({
          asset_id: 'eth',
          wallet_address: ethWalletAddress,
          wallet_name: 'Unity Capital ETH Wallet',
          is_active: true
        }, { onConflict: 'asset_id' });

      if (ethError) throw ethError;

      // Update ADA wallet address
      const { error: adaError } = await supabase
        .from('admin_crypto_wallets')
        .upsert({
          asset_id: 'ada',
          wallet_address: adaWalletAddress,
          wallet_name: 'Unity Capital ADA Wallet',
          is_active: true
        }, { onConflict: 'asset_id' });

      if (adaError) throw adaError;

      toast.success('Wallet addresses updated successfully');
      setIsEditingWalletAddresses(false);
      setOriginalValues(prev => ({
        ...prev,
        btcWalletAddress,
        ethWalletAddress,
        adaWalletAddress
      }));
    } catch (error) {
      toast.error('Failed to update wallet addresses');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelWalletAddresses = () => {
    setBtcWalletAddress(originalValues.btcWalletAddress);
    setEthWalletAddress(originalValues.ethWalletAddress);
    setAdaWalletAddress(originalValues.adaWalletAddress);
    setIsEditingWalletAddresses(false);
  };

  const formatCrypto = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00000000';
    return num.toFixed(8);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading crypto data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Crypto Wallet Balances */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-lg">Crypto Wallet Balances</CardTitle>
          {!isEditingBalances ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingBalances(true)}
              className="flex items-center gap-2"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelBalances}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <XMarkIcon className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveBalances}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <CheckIcon className="h-4 w-4" />
                Save
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bitcoin Balance */}
          <div className="space-y-2">
            <Label className="text-gray-300">Bitcoin (BTC) Balance</Label>
            {isEditingBalances ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="any"
                    value={btcBalance}
                    onChange={(e) => setBtcBalance(e.target.value)}
                    className="font-mono bg-gray-700 border-gray-600 text-white text-lg font-semibold"
                    placeholder="0.00000000"
                  />
                  <span className="text-sm text-gray-400 whitespace-nowrap">BTC</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={btcUsdValue}
                    onChange={(e) => setBtcUsdValue(e.target.value)}
                    className="font-mono bg-gray-700 border-gray-600 text-white text-lg font-semibold"
                    placeholder="0.00"
                  />
                  <span className="text-sm text-gray-400 whitespace-nowrap">USD</span>
                </div>
              </div>
            ) : (
              <div className="mt-1">
                <div className="text-2xl font-bold text-white font-mono">
                  {formatCrypto(btcBalance)} BTC
                </div>
                <div className="text-lg font-semibold text-green-400 mt-1">
                  ${parseFloat(btcUsdValue || '0').toFixed(2)} USD
                </div>
              </div>
            )}
          </div>

          {/* Ethereum Balance */}
          <div className="space-y-2">
            <Label className="text-gray-300">Ethereum (ETH) Balance</Label>
            {isEditingBalances ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="any"
                    value={ethBalance}
                    onChange={(e) => setEthBalance(e.target.value)}
                    className="font-mono bg-gray-700 border-gray-600 text-white text-lg font-semibold"
                    placeholder="0.00000000"
                  />
                  <span className="text-sm text-gray-400 whitespace-nowrap">ETH</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={ethUsdValue}
                    onChange={(e) => setEthUsdValue(e.target.value)}
                    className="font-mono bg-gray-700 border-gray-600 text-white text-lg font-semibold"
                    placeholder="0.00"
                  />
                  <span className="text-sm text-gray-400 whitespace-nowrap">USD</span>
                </div>
              </div>
            ) : (
              <div className="mt-1">
                <div className="text-2xl font-bold text-white font-mono">
                  {formatCrypto(ethBalance)} ETH
                </div>
                <div className="text-lg font-semibold text-green-400 mt-1">
                  ${parseFloat(ethUsdValue || '0').toFixed(2)} USD
                </div>
              </div>
            )}
          </div>

          {/* Cardano Balance */}
          <div className="space-y-2">
            <Label className="text-gray-300">Cardano (ADA) Balance</Label>
            {isEditingBalances ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="any"
                    value={adaBalance}
                    onChange={(e) => setAdaBalance(e.target.value)}
                    className="font-mono bg-gray-700 border-gray-600 text-white text-lg font-semibold"
                    placeholder="0.00000000"
                  />
                  <span className="text-sm text-gray-400 whitespace-nowrap">ADA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={adaUsdValue}
                    onChange={(e) => setAdaUsdValue(e.target.value)}
                    className="font-mono bg-gray-700 border-gray-600 text-white text-lg font-semibold"
                    placeholder="0.00"
                  />
                  <span className="text-sm text-gray-400 whitespace-nowrap">USD</span>
                </div>
              </div>
            ) : (
              <div className="mt-1">
                <div className="text-2xl font-bold text-white font-mono">
                  {formatCrypto(adaBalance)} ADA
                </div>
                <div className="text-lg font-semibold text-green-400 mt-1">
                  ${parseFloat(adaUsdValue || '0').toFixed(2)} USD
                </div>
              </div>
            )}
          </div>

          {/* Total Portfolio Value */}
          <div className="pt-4 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <Label className="text-gray-300 text-base">Total Portfolio Value</Label>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400">
                  ${(parseFloat(btcUsdValue || '0') + parseFloat(ethUsdValue || '0') + parseFloat(adaUsdValue || '0')).toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Sum of all crypto USD values</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crypto Trading Controls */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-lg">Crypto Trading Controls</CardTitle>
          {!isEditingCryptoControl ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingCryptoControl(true)}
              className="flex items-center gap-2"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelCryptoControl}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <XMarkIcon className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveCryptoControl}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <CheckIcon className="h-4 w-4" />
                Save
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Buy Crypto Control */}
          <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800">
            <div>
              <Label className="text-base font-medium text-gray-300">Allow Buy Crypto</Label>
              <p className="text-sm text-gray-400 mt-1">
                Enable or disable the ability to purchase cryptocurrency
              </p>
            </div>
            <Switch
              checked={cryptoBuyEnabled}
              onCheckedChange={setCryptoBuyEnabled}
              disabled={!isEditingCryptoControl}
            />
          </div>

          {/* Sell Crypto Control */}
          <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800">
            <div>
              <Label className="text-base font-medium text-gray-300">Allow Sell Crypto</Label>
              <p className="text-sm text-gray-400 mt-1">
                Enable or disable the ability to sell cryptocurrency
              </p>
            </div>
            <Switch
              checked={cryptoSellEnabled}
              onCheckedChange={setCryptoSellEnabled}
              disabled={!isEditingCryptoControl}
            />
          </div>

          {/* Block Reason */}
          {(!cryptoBuyEnabled || !cryptoSellEnabled) && (
            <div className="space-y-2">
              <Label className="text-gray-300">Block Reason (shown to user)</Label>
              <Select
                value={cryptoBlockReason}
                onValueChange={setCryptoBlockReason}
                disabled={!isEditingCryptoControl}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select a reason template..." />
                </SelectTrigger>
                <SelectContent>
                  {blockReasonTemplates.map((template, index) => (
                    <SelectItem key={index} value={template}>
                      {template.substring(0, 60)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                value={cryptoBlockReason}
                onChange={(e) => setCryptoBlockReason(e.target.value)}
                disabled={!isEditingCryptoControl}
                placeholder="Enter custom reason or select from templates above..."
                rows={4}
                className="mt-2 bg-gray-800 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400">
                This message will be displayed to the user when they attempt to buy or sell crypto.
              </p>
            </div>
          )}

          {/* Status Summary */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-2 border border-gray-700">
            <h4 className="font-medium text-sm text-gray-300">Current Status</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Buy Crypto:</span>
                <span className={cryptoBuyEnabled ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                  {cryptoBuyEnabled ? '✓ Enabled' : '✗ Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sell Crypto:</span>
                <span className={cryptoSellEnabled ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                  {cryptoSellEnabled ? '✓ Enabled' : '✗ Disabled'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Wallet Addresses for Sell Transactions */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-white text-lg">Sell Transaction Wallet Addresses</CardTitle>
          </div>
          {!isEditingWalletAddresses ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingWalletAddresses(true)}
              className="flex items-center gap-2"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelWalletAddresses}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <XMarkIcon className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveWalletAddresses}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <CheckIcon className="h-4 w-4" />
                Save
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-300">
              💡 These are the wallet addresses shown to users when they sell crypto. Users will send their crypto to these addresses.
            </p>
          </div>

          {/* Bitcoin Wallet Address */}
          <div className="space-y-2">
            <Label className="text-gray-300">Bitcoin (BTC) Wallet Address</Label>
            <Input
              type="text"
              value={btcWalletAddress}
              onChange={(e) => setBtcWalletAddress(e.target.value)}
              disabled={!isEditingWalletAddresses}
              className="font-mono text-sm bg-gray-800 border-gray-600 text-white"
              placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
            />
            {!isEditingWalletAddresses && btcWalletAddress && (
              <p className="text-xs text-gray-400">
                Users will send Bitcoin to this address when selling BTC
              </p>
            )}
          </div>

          {/* Ethereum Wallet Address */}
          <div className="space-y-2">
            <Label className="text-gray-300">Ethereum (ETH) Wallet Address</Label>
            <Input
              type="text"
              value={ethWalletAddress}
              onChange={(e) => setEthWalletAddress(e.target.value)}
              disabled={!isEditingWalletAddresses}
              className="font-mono text-sm bg-gray-800 border-gray-600 text-white"
              placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
            />
            {!isEditingWalletAddresses && ethWalletAddress && (
              <p className="text-xs text-gray-400">
                Users will send Ethereum to this address when selling ETH
              </p>
            )}
          </div>

          {/* Cardano Wallet Address */}
          <div className="space-y-2">
            <Label className="text-gray-300">Cardano (ADA) Wallet Address</Label>
            <Input
              type="text"
              value={adaWalletAddress}
              onChange={(e) => setAdaWalletAddress(e.target.value)}
              disabled={!isEditingWalletAddresses}
              className="font-mono text-sm bg-gray-800 border-gray-600 text-white"
              placeholder="addr1qxy8z9k3j4z5m6n7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e"
            />
            {!isEditingWalletAddresses && adaWalletAddress && (
              <p className="text-xs text-gray-400">
                Users will send Cardano to this address when selling ADA
              </p>
            )}
          </div>

          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 mt-4">
            <p className="text-xs text-yellow-300">
              ⚠️ <strong>Important:</strong> Make sure these wallet addresses are correct. Users will send crypto to these addresses during sell transactions. Double-check before saving!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CryptoManagement;
