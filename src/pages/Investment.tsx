import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Target, Plus, Eye, EyeOff, RefreshCw, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  getPortfolio,
  calculatePortfolioStatistics,
  getStockTransactions,
  formatCurrency as formatCurrencyUtil,
  formatPercent as formatPercentUtil
} from '@/lib/investmentUtils';

interface Investment {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  current_price: number;
  total_value: number;
  day_change: number;
  day_change_percent: number;
  total_return: number;
  total_return_percent: number;
  average_cost: number;
  sector: string;
}

interface Transaction {
  id: string;
  transaction_type: 'buy' | 'sell' | 'dividend';
  symbol: string;
  shares: number;
  price_per_share: number;
  total_amount: number;
  transaction_date: string;
  status: 'completed' | 'pending' | 'cancelled' | 'failed';
  confirmation_number: string;
}

interface PortfolioStats {
  totalValue: number;
  totalDayChange: number;
  totalDayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  numberOfHoldings: number;
}

const Investment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'transactions'>('portfolio');
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats>({
    totalValue: 0,
    totalDayChange: 0,
    totalDayChangePercent: 0,
    totalReturn: 0,
    totalReturnPercent: 0,
    numberOfHoldings: 0
  });
  const [userData, setUserData] = useState<any>(null);

  // Fetch investment data
  useEffect(() => {
    fetchUserData();
    fetchInvestmentData();
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

  const fetchInvestmentData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view your investments.",
          variant: "destructive"
        });
        navigate('/signin');
        return;
      }

      // Fetch portfolio
      const portfolioResult = await getPortfolio(user.id);
      if (portfolioResult.success && portfolioResult.data) {
        setInvestments(portfolioResult.data as any);
      }

      // Fetch statistics
      const statsResult = await calculatePortfolioStatistics(user.id);
      if (statsResult.success && statsResult.data) {
        setPortfolioStats({
          totalValue: statsResult.data.totalValue,
          totalDayChange: statsResult.data.totalDayChange,
          totalDayChangePercent: statsResult.data.totalDayChangePercent,
          totalReturn: statsResult.data.totalReturn,
          totalReturnPercent: statsResult.data.totalReturnPercent,
          numberOfHoldings: statsResult.data.numberOfHoldings
        });
      }

      // Fetch recent transactions
      const transactionsResult = await getStockTransactions(user.id, 20);
      if (transactionsResult.success && transactionsResult.data) {
        setTransactions(transactionsResult.data as any);
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load investment data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInvestmentData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Portfolio data updated successfully.",
    });
  };



  const formatCurrency = formatCurrencyUtil;
  const formatPercent = formatPercentUtil;

  const renderPortfolioOverview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      );
    }

    if (investments.length === 0) {
      return (
        <Card className="p-6 bg-white border-gray-200">
          <div className="text-center py-12">
            <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Investments Yet</h3>
            <p className="text-gray-600 mb-6">
              Start building your portfolio by purchasing your first stocks.
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => navigate('/buy-stocks')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Buy Your First Stock
            </Button>
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Portfolio Summary */}
        <Card className="p-6 bg-white border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Portfolio Overview</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="text-gray-600 hover:text-gray-900"
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 hover:text-gray-900"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {showBalance ? formatCurrency(portfolioStats.totalValue) : '••••••'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Change</p>
              <p className={`text-2xl font-bold ${portfolioStats.totalDayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {showBalance ? (
                  <>
                    {portfolioStats.totalDayChange >= 0 ? '+' : ''}{formatCurrency(portfolioStats.totalDayChange)}
                    <span className="text-sm ml-2">({formatPercent(portfolioStats.totalDayChangePercent)})</span>
                  </>
                ) : '••••••'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Return</p>
              <p className={`text-2xl font-bold ${portfolioStats.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {showBalance ? (
                  <>
                    {portfolioStats.totalReturn >= 0 ? '+' : ''}{formatCurrency(portfolioStats.totalReturn)}
                    <span className="text-sm ml-2">({formatPercent(portfolioStats.totalReturnPercent)})</span>
                  </>
                ) : '••••••'}
              </p>
            </div>
          </div>
        </Card>

      {/* Quick Actions */}
      <Card className="p-6 bg-white border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            className="flex flex-col items-center p-4 h-auto bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => navigate('/buy-stocks')}
          >
            <Plus className="h-5 w-5 mb-2" />
            <span className="text-sm">Buy Stocks</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex flex-col items-center p-4 h-auto border-gray-300 text-white hover:bg-gray-50 hover:text-gray-700"
            onClick={() => navigate('/sell-stocks')}
          >
            <TrendingDown className="h-5 w-5 mb-2" />
            <span className="text-sm">Sell Stocks</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex flex-col items-center p-4 h-auto border-gray-300 text-white hover:bg-gray-50 hover:text-gray-700"
            onClick={() => navigate('/research')}
          >
            <BarChart3 className="h-5 w-5 mb-2" />
            <span className="text-sm">Research</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex flex-col items-center p-4 h-auto border-gray-300 text-white hover:bg-gray-50 hover:text-gray-700"
            onClick={() => navigate('/set-goals')}
          >
            <Target className="h-5 w-5 mb-2" />
            <span className="text-sm">Set Goals</span>
          </Button>
        </div>
      </Card>

      {/* Holdings */}
      <Card className="p-6 bg-white border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Holdings</h3>
        <div className="space-y-4">
          {investments.map((investment) => (
            <div key={investment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">{investment.symbol}</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{investment.symbol}</h4>
                  <p className="text-sm text-gray-600">{investment.name}</p>
                  <p className="text-xs text-gray-500">{Number(investment.shares).toFixed(2)} shares</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {showBalance ? formatCurrency(Number(investment.total_value)) : '••••••'}
                </p>
                <p className={`text-sm ${Number(investment.day_change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {showBalance ? (
                    <>
                      {Number(investment.day_change) >= 0 ? '+' : ''}{formatCurrency(Number(investment.day_change))}
                      <span className="ml-1">({formatPercent(Number(investment.day_change_percent))})</span>
                    </>
                  ) : '••••••'}
                </p>
                <p className="text-xs text-gray-500">
                  {showBalance ? `@${formatCurrency(Number(investment.current_price))}` : '••••••'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
    );
  };

  const renderTransactions = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <Card className="p-6 bg-white border-gray-200">
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Yet</h3>
            <p className="text-gray-600">
              Your transaction history will appear here once you start trading.
            </p>
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-6 bg-white border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.transaction_type === 'buy' ? 'bg-green-100' :
                  transaction.transaction_type === 'sell' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {transaction.transaction_type === 'buy' ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : transaction.transaction_type === 'sell' ? (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  ) : (
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">
                    {transaction.transaction_type} {transaction.symbol}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {Number(transaction.shares).toFixed(2)} shares @ {formatCurrency(Number(transaction.price_per_share))}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(transaction.transaction_date).toLocaleDateString()} • {transaction.confirmation_number}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.transaction_type === 'buy' ? 'text-red-600' :
                  transaction.transaction_type === 'sell' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {transaction.transaction_type === 'buy' ? '-' : '+'}
                  {formatCurrency(Number(transaction.total_amount))}
                </p>
                <p className={`text-xs px-2 py-1 rounded-full inline-block ${
                  transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                  transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  transaction.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {transaction.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const renderResearch = () => (
    <Card className="p-6 bg-white border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Research</h3>
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">Research Tools Coming Soon</h4>
        <p className="text-gray-600 mb-6">
          Advanced market analysis, stock screeners, and research reports will be available here.
        </p>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          Get Notified
        </Button>
      </div>
    </Card>
  );

  // Show loader until both data and user profile are loaded
  if (loading || !userData) {
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
        title="Investments"
        onBackClick={() => navigate('/dashboard')}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
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

        {/* Tab Content */}
        {activeTab === 'portfolio' && renderPortfolioOverview()}
        {activeTab === 'transactions' && renderTransactions()}
      </div>
    </div>
  );
};

export default Investment;