import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

interface Portfolio {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  shares: number;
  average_cost: number;
  current_price: number;
  total_value: number;
  total_cost_basis: number;
  total_return: number;
  total_return_percent: number;
  day_change: number;
  day_change_percent: number;
  sector: string;
  created_at: string;
  updated_at: string;
}

interface StockTransaction {
  id: string;
  user_id: string;
  transaction_type: 'buy' | 'sell' | 'dividend';
  symbol: string;
  company_name: string;
  shares: number;
  price_per_share: number;
  total_amount: number;
  transaction_date: string;
  status: 'completed' | 'pending' | 'cancelled' | 'failed';
  confirmation_number: string;
  created_at: string;
}

interface InvestmentManagementProps {
  user: any;
}

const InvestmentManagement: React.FC<InvestmentManagementProps> = ({ user }) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadInvestmentData();
    }
  }, [user]);

  const loadInvestmentData = async () => {
    try {
      setIsLoading(true);

      // Fetch portfolio holdings
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .order('total_value', { ascending: false });

      if (portfolioError) {
        throw portfolioError;
      }

      setPortfolios(portfolioData || []);

      // Fetch stock transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('stock_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (transactionError) {
        throw transactionError;
      }

      setTransactions(transactionData || []);
    } catch (error: any) {
      toast.error('Failed to load investment data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
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

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'buy':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sell':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'dividend':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateTotalPortfolioValue = () => {
    return portfolios.reduce((sum, portfolio) => sum + Number(portfolio.total_value), 0);
  };

  const calculateTotalReturn = () => {
    return portfolios.reduce((sum, portfolio) => sum + Number(portfolio.total_return), 0);
  };

  const calculateTotalReturnPercent = () => {
    const totalCostBasis = portfolios.reduce((sum, portfolio) => sum + Number(portfolio.total_cost_basis), 0);
    const totalReturn = calculateTotalReturn();
    return totalCostBasis > 0 ? (totalReturn / totalCostBasis) * 100 : 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading investment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs for Portfolio and Transactions */}
      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="bg-gray-700">
          <TabsTrigger value="portfolio" className="data-[state=active]:bg-blue-600">
            Portfolio Holdings
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-blue-600">
            Transaction History
          </TabsTrigger>
        </TabsList>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Current Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              {portfolios.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No portfolio holdings found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Symbol</TableHead>
                        <TableHead className="text-gray-300">Company</TableHead>
                        <TableHead className="text-gray-300 text-right">Shares</TableHead>
                        <TableHead className="text-gray-300 text-right">Avg Cost</TableHead>
                        <TableHead className="text-gray-300 text-right">Current Price</TableHead>
                        <TableHead className="text-gray-300 text-right">Total Value</TableHead>
                        <TableHead className="text-gray-300 text-right">Return</TableHead>
                        <TableHead className="text-gray-300 text-right">Day Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portfolios.map((portfolio) => (
                        <TableRow key={portfolio.id} className="border-gray-700">
                          <TableCell className="font-mono font-semibold text-blue-400">
                            {portfolio.symbol}
                          </TableCell>
                          <TableCell className="text-white">{portfolio.name}</TableCell>
                          <TableCell className="text-right text-white">
                            {portfolio.shares.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-gray-300">
                            {formatCurrency(portfolio.average_cost)}
                          </TableCell>
                          <TableCell className="text-right text-white">
                            {formatCurrency(portfolio.current_price)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-white">
                            {formatCurrency(portfolio.total_value)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={portfolio.total_return >= 0 ? 'text-green-500' : 'text-red-500'}>
                              <div className="font-semibold">
                                {formatCurrency(portfolio.total_return)}
                              </div>
                              <div className="text-xs">
                                {formatPercent(portfolio.total_return_percent)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={portfolio.day_change >= 0 ? 'text-green-500' : 'text-red-500'}>
                              <div className="font-semibold">
                                {formatCurrency(portfolio.day_change)}
                              </div>
                              <div className="text-xs">
                                {formatPercent(portfolio.day_change_percent)}
                              </div>
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
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No transactions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Date</TableHead>
                        <TableHead className="text-gray-300">Type</TableHead>
                        <TableHead className="text-gray-300">Symbol</TableHead>
                        <TableHead className="text-gray-300">Company</TableHead>
                        <TableHead className="text-gray-300 text-right">Shares</TableHead>
                        <TableHead className="text-gray-300 text-right">Price/Share</TableHead>
                        <TableHead className="text-gray-300 text-right">Total Amount</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Confirmation #</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id} className="border-gray-700">
                          <TableCell className="text-gray-300">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              {new Date(transaction.transaction_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
                              <div className="flex items-center gap-1">
                                {transaction.transaction_type === 'buy' ? (
                                  <ArrowDownRight className="h-3 w-3" />
                                ) : transaction.transaction_type === 'sell' ? (
                                  <ArrowUpRight className="h-3 w-3" />
                                ) : (
                                  <DollarSign className="h-3 w-3" />
                                )}
                                {transaction.transaction_type.toUpperCase()}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono font-semibold text-blue-400">
                            {transaction.symbol}
                          </TableCell>
                          <TableCell className="text-white">{transaction.company_name}</TableCell>
                          <TableCell className="text-right text-white">
                            {transaction.shares.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-gray-300">
                            {formatCurrency(transaction.price_per_share)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-white">
                            {formatCurrency(transaction.total_amount)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-400">
                            {transaction.confirmation_number}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvestmentManagement;
