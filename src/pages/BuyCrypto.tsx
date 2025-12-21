import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Bitcoin, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Check,
  AlertCircle,
  Mail,
  ShieldCheck
} from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { getCryptoPrice, getCryptoFee, buyCrypto } from '@/lib/cryptoUtils';

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: React.ComponentType<{ className?: string }>;
}

const BuyCrypto = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<'select' | 'amount' | 'confirm' | 'success'>('select');
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | null>(null);
  const [usdAmount, setUsdAmount] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('checking');
  const [availableAssets, setAvailableAssets] = useState<CryptoAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFee, setProcessingFee] = useState(0);
  const [userId, setUserId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [checkingBalance, setCheckingBalance] = useState(0);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [checkingAccountId, setCheckingAccountId] = useState('');
  const [savingsAccountId, setSavingsAccountId] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [sentOtpCode, setSentOtpCode] = useState('');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetchAvailableAssets();
    checkCryptoTradingStatus();
    fetchAccountBalances();
    fetchUserData();
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

  const fetchAccountBalances = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch checking account
      const { data: checkingAccount } = await supabase
        .from('accounts')
        .select('id, checking_balance, savings_balance')
        .eq('user_id', user.id)
        .eq('account_type', 'checking')
        .single();

      if (checkingAccount) {
        setCheckingAccountId(checkingAccount.id);
        setCheckingBalance(parseFloat(checkingAccount.checking_balance || checkingAccount.balance || '0'));
      }

      // Fetch savings account
      const { data: savingsAccount } = await supabase
        .from('accounts')
        .select('id, checking_balance, savings_balance')
        .eq('user_id', user.id)
        .eq('account_type', 'savings')
        .single();

      if (savingsAccount) {
        setSavingsAccountId(savingsAccount.id);
        setSavingsBalance(parseFloat(savingsAccount.savings_balance || savingsAccount.balance || '0'));
      }

      // Set default payment method to checking if available
      if (checkingAccount) {
        setPaymentMethod('checking');
      } else if (savingsAccount) {
        setPaymentMethod('savings');
      }
    } catch (error) {
    }
  };

  const checkCryptoTradingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('crypto_buy_enabled, crypto_block_reason')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile && !profile.crypto_buy_enabled) {
        const reason = profile.crypto_block_reason || 'Crypto purchases are currently disabled for your account. Please contact support.';
        sonnerToast.error(reason, {
          duration: 8000,
          style: {
            background: '#7f1d1d',
            color: '#fecaca',
            border: '1px solid #991b1b',
            fontSize: '15px',
            fontWeight: '500'
          }
        });
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
        return;
      }
    } catch (error) {
    }
  };

  const fetchAvailableAssets = async () => {
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

      // Fetch active crypto assets
      const { data: assets, error: assetsError } = await supabase
        .from('crypto_assets')
        .select('*')
        .eq('is_active', true);

      if (assetsError) throw assetsError;

      // Fetch current prices
      const { data: prices, error: pricesError } = await supabase
        .from('crypto_prices')
        .select('*');

      if (pricesError) throw pricesError;

      // Combine assets with prices
      const assetsWithPrices: CryptoAsset[] = (assets || []).map(asset => {
        const priceData = prices?.find(p => p.asset_id === asset.asset_id);
        return {
          id: asset.asset_id,
          symbol: asset.symbol,
          name: asset.name,
          price: parseFloat(priceData?.price_usd?.toString() || '0'),
          change24h: parseFloat(priceData?.change_24h?.toString() || '0'),
          icon: getIconForAsset(asset.asset_id)
        };
      });

      setAvailableAssets(assetsWithPrices);

      // Fetch buy fee
      const feeData = await getCryptoFee('buy');
      setProcessingFee(feeData.flatFee);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load crypto assets",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getIconForAsset = (assetId: string) => {
    switch (assetId) {
      case 'btc':
        return ({ className }: { className?: string }) => (
          <div className={`${className} bg-orange-500 rounded-full flex items-center justify-center`}>
            <Bitcoin className="h-6 w-6 text-white" />
          </div>
        );
      case 'eth':
        return ({ className }: { className?: string }) => (
          <div className={`${className} bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs`}>
            Ξ
          </div>
        );
      case 'ada':
        return ({ className }: { className?: string }) => (
          <div className={`${className} bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs`}>
            ₳
          </div>
        );
      default:
        return ({ className }: { className?: string }) => (
          <div className={`${className} bg-gray-500 rounded-full flex items-center justify-center text-white font-bold text-xs`}>
            $
          </div>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatCrypto = (amount: number, decimals: number = 8) => {
    return amount.toFixed(decimals).replace(/\.?0+$/, '');
  };

  const handleAssetSelect = (asset: CryptoAsset) => {
    setSelectedAsset(asset);
    setStep('amount');
  };

  const handleUsdAmountChange = (value: string) => {
    setUsdAmount(value);
    if (selectedAsset && value) {
      const crypto = parseFloat(value) / selectedAsset.price;
      setCryptoAmount(formatCrypto(crypto));
    } else {
      setCryptoAmount('');
    }
  };

  const handleCryptoAmountChange = (value: string) => {
    setCryptoAmount(value);
    if (selectedAsset && value) {
      const usd = parseFloat(value) * selectedAsset.price;
      setUsdAmount(usd.toFixed(2));
    } else {
      setUsdAmount('');
    }
  };

  const handleInitiatePurchase = async () => {
    setIsProcessing(true);
    try {
      // Generate and send OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOtpCode(otp);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User email not found');

      // Send OTP email
      const { error: emailError } = await supabase.functions.invoke('send-crypto-otp', {
        body: {
          email: user.email,
          otpCode: otp,
          cryptoAmount: cryptoAmount,
          cryptoSymbol: selectedAsset?.symbol || '',
          totalAmount: formatCurrency(parseFloat(usdAmount) + processingFee)
        }
      });

      if (emailError) {
        // Continue anyway for demo purposes
      }

      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${user.email}`,
      });

      setShowOtpModal(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);
    setOtpError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    setIsVerifyingOtp(true);
    setOtpError('');

    try {
      const enteredOtp = otpCode.join('');
      
      if (enteredOtp !== sentOtpCode) {
        setOtpError('Invalid verification code. Please try again.');
        setIsVerifyingOtp(false);
        return;
      }

      // OTP verified, proceed with purchase
      await completePurchase();
    } catch (error: any) {
      setOtpError('Verification failed. Please try again.');
      setIsVerifyingOtp(false);
    }
  };

  const completePurchase = async () => {
    try {
      if (!selectedAsset) throw new Error('No asset selected');

      const totalAmount = parseFloat(usdAmount) + processingFee;
      const selectedBalance = paymentMethod === 'checking' ? checkingBalance : savingsBalance;
      const accountId = paymentMethod === 'checking' ? checkingAccountId : savingsAccountId;

      // Validate sufficient funds
      if (totalAmount > selectedBalance) {
        throw new Error('Insufficient funds in selected account');
      }

      if (!accountId) {
        throw new Error('No account selected');
      }

      // Deduct from account balance
      const newBalance = selectedBalance - totalAmount;
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', accountId);

      if (updateError) throw updateError;

      // Buy crypto
      const result = await buyCrypto({
        userId,
        assetId: selectedAsset.id,
        cryptoAmount: parseFloat(cryptoAmount),
        usdAmount: parseFloat(usdAmount),
        pricePerUnit: selectedAsset.price,
        processingFee,
        paymentMethod,
        paymentAccountLast4: accountId.slice(-4)
      });

      setTransactionId(result.transactionId);
      
      // Update local balance state
      if (paymentMethod === 'checking') {
        setCheckingBalance(newBalance);
      } else {
        setSavingsBalance(newBalance);
      }

      // Close OTP modal
      setShowOtpModal(false);
      setOtpCode(['', '', '', '', '', '']);
      
      toast({
        title: "Purchase Successful",
        description: `You bought ${cryptoAmount} ${selectedAsset?.symbol}`,
      });
      
      setStep('success');
    } catch (error: any) {
      setShowOtpModal(false);
      toast({
        title: "Purchase Failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const renderAssetSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Cryptocurrency</h2>
        <p className="text-gray-600">Choose which crypto you'd like to buy</p>
      </div>

      {availableAssets.map((asset) => {
        const IconComponent = asset.icon;
        return (
          <Card 
            key={asset.id} 
            className="p-4 bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer hover:border-gray-300"
            onClick={() => handleAssetSelect(asset)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <IconComponent className="h-12 w-12" />
                <div>
                  <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                  <p className="text-sm text-gray-600">{asset.symbol}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {formatCurrency(asset.price)}
                </p>
                <div className={`flex items-center text-sm ${
                  asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {asset.change24h >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(asset.change24h).toFixed(2)}%
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  const renderAmountEntry = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          {selectedAsset && <selectedAsset.icon className="h-8 w-8" />}
          <h2 className="text-2xl font-bold text-gray-900">Buy {selectedAsset?.name}</h2>
        </div>
        <p className="text-gray-600">Enter the amount you want to purchase</p>
      </div>

      <Card className="p-6 bg-white border-gray-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount in USD
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                value={usdAmount}
                onChange={(e) => handleUsdAmountChange(e.target.value)}
                placeholder="0.00"
                className="pl-10 text-lg"
              />
            </div>
          </div>

          <div className="text-center text-gray-500">
            <span>≈</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount in {selectedAsset?.symbol}
            </label>
            <div className="relative">
              {selectedAsset && <selectedAsset.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />}
              <Input
                type="number"
                value={cryptoAmount}
                onChange={(e) => handleCryptoAmountChange(e.target.value)}
                placeholder="0.00000000"
                className="pl-10 text-lg"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Price:</span>
              <span className="font-medium">{selectedAsset && formatCurrency(selectedAsset.price)}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-white border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3">Payment Method</h3>
        <div className="space-y-3">
          {checkingAccountId && (
            <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
              paymentMethod === 'checking' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="payment"
                  value="checking"
                  checked={paymentMethod === 'checking'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-blue-600"
                />
                <div>
                  <span className="text-gray-900 font-medium">Checking Account</span>
                  <p className="text-sm text-gray-600">Available: {formatCurrency(checkingBalance)}</p>
                </div>
              </div>
              {paymentMethod === 'checking' && (
                <Check className="h-5 w-5 text-blue-600" />
              )}
            </label>
          )}
          
          {savingsAccountId && (
            <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
              paymentMethod === 'savings' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="payment"
                  value="savings"
                  checked={paymentMethod === 'savings'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-blue-600"
                />
                <div>
                  <span className="text-gray-900 font-medium">Savings Account</span>
                  <p className="text-sm text-gray-600">Available: {formatCurrency(savingsBalance)}</p>
                </div>
              </div>
              {paymentMethod === 'savings' && (
                <Check className="h-5 w-5 text-blue-600" />
              )}
            </label>
          )}

          {!checkingAccountId && !savingsAccountId && (
            <div className="text-center py-4 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No accounts available for payment</p>
            </div>
          )}
        </div>
      </Card>

      {usdAmount && parseFloat(usdAmount) > 0 && (
        <div>
          {(() => {
            const totalAmount = parseFloat(usdAmount) + processingFee;
            const selectedBalance = paymentMethod === 'checking' ? checkingBalance : savingsBalance;
            const isInsufficient = totalAmount > selectedBalance;
            
            if (isInsufficient) {
              return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-1">Insufficient Funds</p>
                      <p>
                        You need {formatCurrency(totalAmount)} but only have {formatCurrency(selectedBalance)} in your {paymentMethod} account.
                        Please reduce the amount or choose a different payment method.
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={() => setStep('select')}
          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Back
        </Button>
        <Button
          onClick={() => setStep('confirm')}
          disabled={(() => {
            if (!usdAmount || parseFloat(usdAmount) <= 0) return true;
            const totalAmount = parseFloat(usdAmount) + processingFee;
            const selectedBalance = paymentMethod === 'checking' ? checkingBalance : savingsBalance;
            return totalAmount > selectedBalance;
          })()}
          className="flex-1 bg-gray-800 hover:bg-gray-900 text-white disabled:bg-gray-400"
        >
          Continue
        </Button>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Purchase</h2>
        <p className="text-gray-600">Review your transaction details</p>
      </div>

      <Card className="p-6 bg-white border-gray-200">
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {selectedAsset && <selectedAsset.icon className="h-12 w-12" />}
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {cryptoAmount} {selectedAsset?.symbol}
              </p>
              <p className="text-gray-600">{formatCurrency(parseFloat(usdAmount))}</p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Asset:</span>
              <span className="font-medium text-gray-900">{selectedAsset?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Price per {selectedAsset?.symbol}:</span>
              <span className="font-medium text-gray-900">{selectedAsset && formatCurrency(selectedAsset.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium text-gray-900">
                {paymentMethod === 'checking' ? 'Checking Account' : 'Savings Account'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Available Balance:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(paymentMethod === 'checking' ? checkingBalance : savingsBalance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Processing Fee:</span>
              <span className="font-medium text-gray-900">${processingFee.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span className="text-gray-700">Total:</span>
              <span className="text-gray-900">{formatCurrency(parseFloat(usdAmount) + processingFee)}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Important Notice</p>
            <p>Your crypto will be available in your wallet immediately after purchase. Transaction fees may apply.</p>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={() => setStep('amount')}
          disabled={isProcessing}
          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Back
        </Button>
        <Button
          onClick={handleInitiatePurchase}
          disabled={isProcessing}
          className="flex-1 bg-gray-800 hover:bg-gray-900 text-white disabled:bg-gray-400"
        >
          {isProcessing ? 'SENDING CODE...' : 'Confirm Purchase'}
        </Button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Purchase Successful!</h2>
        <p className="text-gray-600">Your crypto has been added to your wallet</p>
      </div>

      <Card className="p-6 bg-white border-gray-200">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Purchased:</span>
            <span className="font-medium text-gray-900">{cryptoAmount} {selectedAsset?.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Paid:</span>
            <span className="font-medium text-gray-900">{formatCurrency(parseFloat(usdAmount) + processingFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Transaction ID:</span>
            <span className="font-medium text-sm text-gray-900">{transactionId}</span>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <Button
          onClick={() => navigate('/crypto')}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white"
        >
          View Wallet
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setStep('select');
            setSelectedAsset(null);
            setUsdAmount('');
            setCryptoAmount('');
          }}
          className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Buy More Crypto
        </Button>
      </div>
    </div>
  );

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={userData}
        showBackButton={true} 
        title="Buy Crypto"
        onBackClick={() => navigate('/crypto')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-2xl mx-auto">
          {step === 'select' && renderAssetSelection()}
          {step === 'amount' && renderAmountEntry()}
          {step === 'confirm' && renderConfirmation()}
          {step === 'success' && renderSuccess()}
        </div>
      </div>

      {/* OTP Verification Modal */}
      <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Verify Your Purchase</DialogTitle>
            <DialogDescription className="text-center">
              We've sent a 6-digit verification code to your email address
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center space-y-1 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Check your email for the code</span>
              </div>
              <p className="text-xs text-gray-500">If not in inbox, please check your spam folder</p>
            </div>

            <div className="flex justify-center space-x-2">
              {otpCode.map((digit, index) => (
                <Input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-semibold border-gray-300 focus:border-blue-500"
                />
              ))}
            </div>

            {otpError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-800">{otpError}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp || otpCode.some(d => !d)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
              >
                {isVerifyingOtp ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  'Verify & Complete Purchase'
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowOtpModal(false);
                  setOtpCode(['', '', '', '', '', '']);
                  setOtpError('');
                }}
                disabled={isVerifyingOtp}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>

            <button
              onClick={handleInitiatePurchase}
              disabled={isVerifyingOtp}
              className="text-sm text-blue-600 hover:text-blue-700 w-full text-center"
            >
              Didn't receive the code? Resend
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuyCrypto;