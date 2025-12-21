import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Bitcoin, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Check,
  AlertCircle,
  Wallet,
  Copy,
  Clock,
  Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sellCrypto } from '@/lib/cryptoUtils';
import Header from '../components/Header';

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  price: number;
  change24h: number;
  icon: React.ComponentType<{ className?: string }>;
}

const SellCrypto = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select' | 'amount' | 'confirm' | 'wallet' | 'success'>('select');
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | null>(null);
  const [usdAmount, setUsdAmount] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('checking');
  const [checkingBalance, setCheckingBalance] = useState(0);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [checkingAccountId, setCheckingAccountId] = useState('');
  const [savingsAccountId, setSavingsAccountId] = useState('');
  const [adminWalletAddress, setAdminWalletAddress] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes in seconds
  const [copied, setCopied] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const [userId, setUserId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Mock crypto assets available for sale (user's holdings)
  const userAssets: CryptoAsset[] = [
    {
      id: 'btc',
      symbol: 'BTC',
      name: 'Bitcoin',
      balance: 0.05432,
      usdValue: 2156.80,
      price: 39700.00,
      change24h: 2.45,
      icon: ({ className }) => (
        <div className={`${className} bg-orange-500 rounded-full flex items-center justify-center`}>
          <Bitcoin className="h-6 w-6 text-white" />
        </div>
      )
    },
    {
      id: 'eth',
      symbol: 'ETH',
      name: 'Ethereum',
      balance: 1.2345,
      usdValue: 2468.90,
      price: 2000.00,
      change24h: -1.23,
      icon: ({ className }) => (
        <div className={`${className} bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs`}>
          Ξ
        </div>
      )
    },
    {
      id: 'ada',
      symbol: 'ADA',
      name: 'Cardano',
      balance: 1000.00,
      usdValue: 450.00,
      price: 0.45,
      change24h: 5.67,
      icon: ({ className }) => (
        <div className={`${className} bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs`}>
          ₳
        </div>
      )
    }
  ];

  useEffect(() => {
    checkCryptoSellStatus();
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

  // Countdown timer effect
  useEffect(() => {
    if (step === 'wallet' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchAdminWallet = async (assetId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_crypto_wallets')
        .select('wallet_address')
        .eq('asset_id', assetId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      
      if (data) {
        setAdminWalletAddress(data.wallet_address);
      }
    } catch (error) {
      toast.error('Failed to load wallet address');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(adminWalletAddress);
    setCopied(true);
    toast.success('Wallet address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const checkCryptoSellStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      setUserId(user.id);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('crypto_sell_enabled, crypto_block_reason')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile && !profile.crypto_sell_enabled) {
        const reason = profile.crypto_block_reason || 'Crypto sales are currently disabled for your account. Please contact support.';
        toast.error(reason, {
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
          navigate('/crypto');
        }, 1500);
        return;
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

      // Set default withdrawal method to checking if available
      if (checkingAccount) {
        setWithdrawMethod('checking');
      } else if (savingsAccount) {
        setWithdrawMethod('savings');
      }
    } catch (error) {
    }
  };  const formatCurrency = (amount: number) => {
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

  const handleConfirmSale = async () => {
    if (selectedAsset) {
      await fetchAdminWallet(selectedAsset.id);
      setTimeRemaining(900); // Reset timer to 15 minutes
      setStep('wallet');
    }
  };

  const handleSentConfirmation = async () => {
    if (!selectedAsset || isProcessing) return;

    setIsProcessing(true);
    
    try {
      const accountId = withdrawMethod === 'checking' ? checkingAccountId : savingsAccountId;
      const processingFee = 1.99;
      const netAmount = parseFloat(usdAmount) - processingFee;

      // Call sellCrypto utility function
      const result = await sellCrypto({
        userId,
        assetId: selectedAsset.id,
        cryptoAmount: parseFloat(cryptoAmount),
        usdAmount: parseFloat(usdAmount),
        pricePerUnit: selectedAsset.price,
        processingFee,
        withdrawMethod: withdrawMethod === 'checking' ? 'checking' : 'savings',
        withdrawAccountLast4: accountId.slice(-4)
      });

      setTransactionId(result.transactionId);

      // Update local balance state
      if (withdrawMethod === 'checking') {
        setCheckingBalance(checkingBalance + netAmount);
      } else {
        setSavingsBalance(savingsBalance + netAmount);
      }

      // Add funds to the selected account
      const currentBalance = withdrawMethod === 'checking' ? checkingBalance : savingsBalance;
      const newBalance = currentBalance + netAmount;

      await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', accountId);

      // Create transaction record in main transactions table
      await supabase.from('transactions').insert([{
        user_id: userId,
        transaction_type: 'credit',
        category: 'crypto_sale',
        amount: netAmount,
        description: `Sold ${cryptoAmount} ${selectedAsset.symbol}`,
        status: 'completed',
        account_id: accountId
      }]);

      setHasSent(true);
      setStep('success');

      toast.success('Crypto sold successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to process sale. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isValidAmount = () => {
    if (!selectedAsset || !cryptoAmount) return false;
    const amount = parseFloat(cryptoAmount);
    return amount > 0; // User sends from external wallet, no balance check needed
  };

  const renderAssetSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Cryptocurrency</h2>
        <p className="text-gray-600">Choose which crypto you'd like to sell</p>
      </div>

      {userAssets.map((asset) => {
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
                  {formatCurrency(asset.usdValue)}
                </p>
                <p className="text-sm text-gray-600">
                  {formatCrypto(asset.balance)} {asset.symbol}
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
          <h2 className="text-2xl font-bold text-gray-900">Sell {selectedAsset?.name}</h2>
        </div>
        <p className="text-gray-600">Enter the amount you want to sell</p>
      </div>

      {/* <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center space-x-2">
          <Wallet className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            Available: {selectedAsset && formatCrypto(selectedAsset.balance)} {selectedAsset?.symbol}
          </span>
        </div>
      </Card> */}

      <Card className="p-6 bg-white border-gray-200">
        <div className="space-y-4">
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
            {/* <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500">
                Max: {selectedAsset && formatCrypto(selectedAsset.balance)} {selectedAsset?.symbol}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectedAsset && handleCryptoAmountChange(selectedAsset.balance.toString())}
                className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
              >
                Use Max
              </Button>
            </div> */}
          </div>

          <div className="text-center text-gray-500">
            <span>≈</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              You'll receive (USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                value={usdAmount}
                onChange={(e) => handleUsdAmountChange(e.target.value)}
                placeholder="0.00"
                className="pl-10 text-lg"
                readOnly
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
        <h3 className="font-medium text-gray-900 mb-3">Withdraw To</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="withdraw"
              value="checking"
              checked={withdrawMethod === 'checking'}
              onChange={(e) => setWithdrawMethod(e.target.value)}
              className="text-gray-800"
            />
            <div className="flex-1">
              <span className="text-gray-700">Checking Account</span>
              <p className="text-sm text-gray-500">Balance: {formatCurrency(checkingBalance)}</p>
            </div>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="withdraw"
              value="savings"
              checked={withdrawMethod === 'savings'}
              onChange={(e) => setWithdrawMethod(e.target.value)}
              className="text-gray-800"
            />
            <div className="flex-1">
              <span className="text-gray-700">Savings Account</span>
              <p className="text-sm text-gray-500">Balance: {formatCurrency(savingsBalance)}</p>
            </div>
          </label>
        </div>
      </Card>

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
          disabled={!isValidAmount()}
          className="flex-1 bg-gray-800 hover:bg-gray-900 text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Sale</h2>
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
              <p className="text-gray-600">≈ {formatCurrency(parseFloat(usdAmount))}</p>
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
              <span className="text-gray-600">Withdraw To:</span>
              <span className="font-medium text-gray-900">
                {withdrawMethod === 'checking' ? 'Checking Account' : 'Savings Account'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Processing Fee:</span>
              <span className="font-medium text-gray-900">$1.99</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span className="text-gray-900">You'll receive:</span>
              <span className="text-gray-900">{formatCurrency(parseFloat(usdAmount) - 1.99)}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Important Notice</p>
            <p>Once you sell your crypto, this transaction cannot be reversed. Funds will be transferred to your selected account within 1-3 business days.</p>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={() => setStep('amount')}
          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Back
        </Button>
        <Button
          onClick={handleConfirmSale}
          className="flex-1 bg-gray-800 hover:bg-gray-900 text-white"
        >
          Confirm Sale
        </Button>
      </div>
    </div>
  );

  const renderWalletAddress = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          {selectedAsset && <selectedAsset.icon className="h-8 w-8" />}
          <h2 className="text-2xl font-bold text-gray-900">Send {selectedAsset?.symbol}</h2>
        </div>
        <p className="text-gray-600">Send your crypto to the wallet address below</p>
      </div>

      {/* Countdown Timer */}
      <Card className={`p-4 ${timeRemaining < 300 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-center justify-center space-x-2">
          <Clock className={`h-5 w-5 ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`} />
          <div className="text-center">
            <p className={`text-sm ${timeRemaining < 300 ? 'text-red-800' : 'text-blue-800'}`}>
              Time Remaining
            </p>
            <p className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`}>
              {formatTime(timeRemaining)}
            </p>
          </div>
        </div>
      </Card>

      {/* Transaction Details */}
      <Card className="p-6 bg-white border-gray-200">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Amount to Send:</span>
            <span className="font-bold text-lg text-gray-900">
              {cryptoAmount} {selectedAsset?.symbol}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Value:</span>
            <span className="font-medium text-gray-900">{formatCurrency(parseFloat(usdAmount))}</span>
          </div>
        </div>
      </Card>

      {/* Wallet Address */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Send className="h-5 w-5 mr-2 text-blue-600" />
              Send {selectedAsset?.symbol} to this address:
            </h3>
          </div>
          
          <div className="bg-white p-4 rounded-lg border-2 border-blue-300">
            <p className="text-sm text-gray-600 mb-2 font-medium">Wallet Address:</p>
            <div className="flex items-center space-x-2">
              <code className="flex-1 text-sm font-mono break-all text-gray-900 bg-gray-50 p-3 rounded">
                {adminWalletAddress || 'Loading...'}
              </code>
              <Button
                onClick={copyToClipboard}
                size="sm"
                variant="outline"
                className="shrink-0 border-blue-300 hover:bg-blue-50"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
              <div className="text-xs text-yellow-800">
                <p className="font-medium mb-1">Important Instructions:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Send EXACTLY {cryptoAmount} {selectedAsset?.symbol}</li>
                  <li>Double-check the wallet address before sending</li>
                  <li>Only send {selectedAsset?.name} to this address</li>
                  <li>Transaction must be completed within the time limit</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleSentConfirmation}
          disabled={timeRemaining === 0 || isProcessing}
          className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
        >
          <Check className="h-5 w-5 mr-2" />
          {isProcessing ? 'Processing...' : `I Have Sent the ${selectedAsset?.symbol}`}
        </Button>

        <Button
          variant="outline"
          onClick={() => setStep('confirm')}
          className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Go Back
        </Button>
      </div>

      {timeRemaining === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800 font-medium">
              Time expired! Please start a new transaction.
            </p>
          </div>
        </div>
      )}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sale Successful!</h2>
        <p className="text-gray-600">Your crypto has been sold and funds are being processed</p>
      </div>

      <Card className="p-6 bg-white border-gray-200">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Sold:</span>
            <span className="font-medium text-gray-900">{cryptoAmount} {selectedAsset?.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">You'll receive:</span>
            <span className="font-medium text-gray-900">{formatCurrency(parseFloat(usdAmount) - 1.99)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Transaction ID:</span>
            <span className="font-medium text-gray-900 text-sm">{transactionId || `TXN-${Date.now()}`}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Expected Transfer:</span>
            <span className="font-medium text-gray-900 text-sm">1-3 business days</span>
          </div>
        </div>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">What's Next?</p>
          <p>You'll receive an email confirmation shortly. Funds will be transferred to your {withdrawMethod === 'checking' ? 'checking account' : 'savings account'} within 1-3 business days.</p>
        </div>
      </div>

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
          Sell More Crypto
        </Button>
      </div>
    </div>
  );

  // Show loader until user profile is loaded
  if (!userData) {
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
        title="Sell Crypto"
        onBackClick={() => navigate('/crypto')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-2xl mx-auto">
          {step === 'select' && renderAssetSelection()}
          {step === 'amount' && renderAmountEntry()}
          {step === 'confirm' && renderConfirmation()}
          {step === 'wallet' && renderWalletAddress()}
          {step === 'success' && renderSuccess()}
        </div>
      </div>
    </div>
  );
};

export default SellCrypto;