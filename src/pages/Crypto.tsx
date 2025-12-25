import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Bitcoin, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  EyeOff, 
  Send, 
  Download,
  Plus,
  Minus,
  DollarSign
} from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'send' | 'receive';
  asset: string;
  amount: number;
  usdValue: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

const Crypto = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showBalances, setShowBalances] = useState(true);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'transactions'>('portfolio');
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [hasWallet, setHasWallet] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [walletName, setWalletName] = useState<string>('My Wallet');

  useEffect(() => {
    console.log('🎯 Crypto page useEffect triggered - starting data fetch');
    fetchCryptoData();
  }, []);

  const fetchCryptoData = async () => {
    try {
      console.log('🔄 Starting crypto data fetch...');
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 Auth check result:', { user: user?.id, authError });
      
      if (!user) {
        console.log('❌ No user found, redirecting to signin');
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive"
        });
        navigate('/signin');
        return;
      }

      setUserId(user.id);

      // Fetch user profile data
      console.log('👤 Fetching user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      console.log('📋 Profile result:', { profile, profileError });

      if (profile) {
        setUserData({
          firstName: profile.first_name,
          lastName: profile.last_name,
          email: user.email
        });
      }

      // Fetch user's crypto wallets
      console.log('💰 Fetching user crypto wallets...');
      const { data: wallets, error: walletsError } = await supabase
        .from('crypto_wallets')
        .select('*')
        .eq('user_id', user.id);
      
      console.log('💼 Wallets result:', { wallets, walletsError });

      if (walletsError) {
        console.log('❌ Wallets error details:', walletsError.message);
        throw walletsError;
      }

      // Check if user has any wallets
      setHasWallet(wallets && wallets.length > 0);
      console.log('🔍 Has wallet check:', wallets && wallets.length > 0);

      // Fetch wallet name from metadata if user has wallets
      if (wallets && wallets.length > 0) {
        console.log('📝 Fetching wallet metadata...');
        const { data: walletMetadata, error: metadataError } = await supabase
          .from('crypto_wallet_metadata')
          .select('wallet_name')
          .eq('user_id', user.id)
          .single();
        
        console.log('📊 Wallet metadata result:', { walletMetadata, metadataError });

        if (!metadataError && walletMetadata) {
          setWalletName(walletMetadata.wallet_name || 'My Wallet');
        }
      }

      // Fetch all crypto assets
      console.log('🪙 Fetching crypto assets...');
      const { data: assets, error: assetsError} = await supabase
        .from('crypto_assets')
        .select('*');
      
      console.log('📊 Assets result:', { assets, assetsError });

      if (assetsError) {
        console.log('❌ Assets error details:', assetsError.message);
        throw assetsError;
      }

      // Fetch current prices
      console.log('💵 Fetching crypto prices...');
      const { data: prices, error: pricesError } = await supabase
        .from('crypto_prices')
        .select('*');
      
      console.log('💰 Prices result:', { prices, pricesError });

      if (pricesError) {
        console.log('❌ Prices error details:', pricesError.message);
        throw pricesError;
      }

      // Combine wallet data with assets and prices
      console.log('🔄 Combining wallet data with assets and prices...');
      const assetsWithPrices: CryptoAsset[] = (wallets || [])
        .filter(wallet => {
          const balance = parseFloat(wallet.balance?.toString() || '0');
          return balance > 0; // Only show wallets with non-zero balance
        })
        .map(wallet => {
          const assetInfo = assets?.find(a => a.asset_id === wallet.asset_id);
          const priceData = prices?.find(p => p.asset_id === wallet.asset_id);
          const balance = parseFloat(wallet.balance?.toString() || '0');
          const price = parseFloat(priceData?.price_usd?.toString() || '0');
          const usdValue = balance * price;

          console.log(`📈 Processing ${wallet.asset_id}:`, { balance, price, usdValue });

          return {
            id: wallet.asset_id,
            symbol: assetInfo?.symbol || '',
            name: assetInfo?.name || '',
            balance: balance,
            usdValue: usdValue,
            price: price,
            change24h: parseFloat(priceData?.change_24h?.toString() || '0'),
            icon: getIconForAsset(wallet.asset_id)
          };
        });

      console.log('📊 Final crypto assets (filtered for non-zero balances):', assetsWithPrices);
      setCryptoAssets(assetsWithPrices);

      // Fetch transactions
      console.log('📄 Fetching crypto transactions...');
      const { data: txns, error: txnsError } = await supabase
        .from('crypto_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(50);
      
      console.log('📋 Transactions result:', { txns, txnsError });

      if (txnsError) {
        console.log('❌ Transactions error details:', txnsError.message);
        throw txnsError;
      }

      const formattedTransactions: Transaction[] = (txns || []).map(txn => ({
        id: txn.id,
        type: txn.transaction_type as any,
        asset: txn.asset_id.toUpperCase(),
        amount: parseFloat(txn.amount?.toString() || '0'),
        usdValue: parseFloat(txn.usd_amount?.toString() || '0'),
        timestamp: txn.transaction_date || '',
        status: txn.status as any
      }));

      console.log('📊 Formatted transactions:', formattedTransactions);
      setTransactions(formattedTransactions);

      console.log('✅ Crypto data fetch completed successfully!');

    } catch (error: any) {
      console.log('💥 Crypto data fetch failed:', error);
      console.log('📋 Error details:', error.message || error);
      toast({
        title: "Error",
        description: "Failed to load crypto data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      console.log('🏁 Crypto data fetch process completed');
    }
  };

  const getIconForAsset = (assetId: string) => {
    switch (assetId) {
      case 'btc':
        return ({ className }: { className?: string }) => (
          <div className={`${className} bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs`}>
            ₿
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

  const totalPortfolioValue = cryptoAssets.reduce((sum, asset) => sum + asset.usdValue, 0);

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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return Plus;
      case 'sell':
        return Minus;
      case 'send':
        return Send;
      case 'receive':
        return Download;
      default:
        return DollarSign;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'buy':
      case 'receive':
        return 'text-green-600';
      case 'sell':
      case 'send':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Show loader until both data and user profile are loaded
  if (isLoading || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading crypto wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={userData}
        showBackButton={true} 
        title="Crypto Wallet"
        onBackClick={() => navigate('/dashboard')}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
              {/* Portfolio Overview */}
              <Card className="p-5 bg-white border-gray-200">
            <div className="flex items-center justify-end mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalances(!showBalances)}
                className="text-gray-600 hover:text-gray-900"
              >
                {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="text-center mb-5">
              {hasWallet && (
                <h2 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-wide">{walletName}</h2>
              )}
              <p className="text-sm text-gray-600 mb-2">Total Portfolio Value</p>
              <p className="text-3xl font-bold text-gray-900">
                {showBalances ? formatCurrency(totalPortfolioValue) : '••••••'}
              </p>
            </div>

            {/* Quick Actions */}
            {hasWallet ? (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => navigate('/buy-crypto')}
                  className="py-3 bg-gray-800 hover:bg-gray-900 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buy Crypto
                </Button>
                <Button 
                  onClick={() => navigate('/sell-crypto')}
                  variant="outline" 
                  className="py-3 border-gray-300 text-white hover:bg-gray-700 hover:text-white hover:border-gray-500"
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Sell Crypto
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => navigate('/create-crypto-wallet')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Crypto Wallet
              </Button>
            )}
          </Card>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'portfolio'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Transactions
            </button>
          </div>

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              {cryptoAssets.length === 0 ? (
                <Card className="p-8 bg-white border-gray-200 text-center">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                      <DollarSign className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Crypto Assets Yet</h3>
                    <p className="text-gray-600 mb-4">Your portfolio is empty. Buy some crypto to get started!</p>
                    <Button 
                      onClick={() => navigate('/buy-crypto')}
                      className="bg-gray-800 hover:bg-gray-900 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Buy Crypto
                    </Button>
                  </div>
                </Card>
              ) : (
                cryptoAssets.map((asset) => {
                const IconComponent = asset.icon;
                return (
                  <Card key={asset.id} className="p-4 bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-10 w-10" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                          <p className="text-sm text-gray-600">{asset.symbol}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {showBalances ? formatCurrency(asset.usdValue) : '••••••'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {showBalances ? `${formatCrypto(asset.balance)} ${asset.symbol}` : '••••••'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm text-gray-600">
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
                  </Card>
                );
              })
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <Card className="p-8 bg-white border-gray-200 text-center">
                  <p className="text-gray-600">No transactions yet</p>
                </Card>
              ) : (
                transactions.map((transaction) => {
                const IconComponent = getTransactionIcon(transaction.type);
                return (
                  <Card key={transaction.id} className="p-4 bg-white border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <IconComponent className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 capitalize">
                            {transaction.type} {transaction.asset}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(transaction.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'buy' || transaction.type === 'receive' ? '+' : '-'}
                          {formatCrypto(transaction.amount)} {transaction.asset}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(transaction.usdValue)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex justify-end">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                  </Card>
                );
              })
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Crypto;