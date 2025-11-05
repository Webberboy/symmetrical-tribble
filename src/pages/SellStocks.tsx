import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingDown, DollarSign, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';

// Sell Stocks Page

interface Stock {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  currentPrice: number;
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
}

interface SellOrder {
  stockId: string;
  symbol: string;
  orderType: 'market' | 'limit';
  shares: number;
  limitPrice?: number;
  estimatedTotal: number;
}

const SellStocks = () => {
  const navigate = useNavigate();
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [sellOrder, setSellOrder] = useState<SellOrder>({
    stockId: '',
    symbol: '',
    orderType: 'market',
    shares: 0,
    estimatedTotal: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
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

  // Mock portfolio data
  const portfolio: Stock[] = [
    {
      id: 'aapl',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      shares: 50,
      currentPrice: 175.25,
      totalValue: 8762.50,
      dayChange: 2.25,
      dayChangePercent: 1.30
    },
    {
      id: 'msft',
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      shares: 25,
      currentPrice: 380.75,
      totalValue: 9518.75,
      dayChange: -3.50,
      dayChangePercent: -0.91
    },
    {
      id: 'googl',
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      shares: 15,
      currentPrice: 142.50,
      totalValue: 2137.50,
      dayChange: 1.75,
      dayChangePercent: 1.24
    },
    {
      id: 'tsla',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      shares: 10,
      currentPrice: 245.80,
      totalValue: 2458.00,
      dayChange: -4.20,
      dayChangePercent: -1.68
    }
  ];

  const filteredPortfolio = portfolio.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateSellOrder = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedStock) {
      newErrors.stock = 'Please select a stock to sell';
    }

    if (!sellOrder.shares || sellOrder.shares <= 0) {
      newErrors.shares = 'Please enter a valid number of shares';
    } else if (selectedStock && sellOrder.shares > selectedStock.shares) {
      newErrors.shares = `You only own ${selectedStock.shares} shares`;
    }

    if (sellOrder.orderType === 'limit') {
      if (!sellOrder.limitPrice || sellOrder.limitPrice <= 0) {
        newErrors.limitPrice = 'Please enter a valid limit price';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateEstimatedTotal = () => {
    if (!selectedStock || !sellOrder.shares) return 0;
    
    const price = sellOrder.orderType === 'limit' && sellOrder.limitPrice 
      ? sellOrder.limitPrice 
      : selectedStock.currentPrice;
    
    return sellOrder.shares * price;
  };

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    setSellOrder({
      stockId: stock.id,
      symbol: stock.symbol,
      orderType: 'market',
      shares: 0,
      estimatedTotal: 0
    });
    setErrors({});
  };

  const handleSellOrderChange = (field: keyof SellOrder, value: any) => {
    const updatedOrder = { ...sellOrder, [field]: value };
    setSellOrder(updatedOrder);
    
    if (field === 'shares' || field === 'limitPrice' || field === 'orderType') {
      updatedOrder.estimatedTotal = calculateEstimatedTotal();
      setSellOrder(updatedOrder);
    }
  };

  const handleSubmitSell = () => {
    if (!validateSellOrder()) return;

    setSellOrder(prev => ({ ...prev, estimatedTotal: calculateEstimatedTotal() }));
    setShowConfirmation(true);
  };

  const confirmSell = () => {
    alert(`Sell order for ${sellOrder.shares} shares of ${sellOrder.symbol} submitted successfully!`);
    
    setSelectedStock(null);
    setSellOrder({
      stockId: '',
      symbol: '',
      orderType: 'market',
      shares: 0,
      estimatedTotal: 0
    });
    setShowConfirmation(false);
    navigate('/investment');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

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
      <Header user={userData} />
      
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/investment')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sell Stocks</h1>
            <p className="text-gray-600">Sell shares from your portfolio</p>
          </div>
        </div>

        {!showConfirmation ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio Selection */}
            <Card className="p-6 bg-white border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Stock to Sell</h3>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900 placeholder-gray-400"
                  placeholder="Search stocks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredPortfolio.map((stock) => (
                  <div
                    key={stock.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedStock?.id === stock.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    onClick={() => handleStockSelect(stock)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{stock.symbol}</h4>
                        <p className="text-sm text-gray-600">{stock.name}</p>
                        <p className="text-sm text-gray-600">{stock.shares} shares owned</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(stock.currentPrice)}</p>
                        <p className={`text-sm ${stock.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.dayChange >= 0 ? '+' : ''}{formatCurrency(stock.dayChange)} ({stock.dayChangePercent.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.stock && (
                <p className="text-red-600 text-sm mt-2">{errors.stock}</p>
              )}
            </Card>

            {/* Sell Order Form */}
            <Card className="p-6 bg-white border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sell Order Details</h3>
              
              {selectedStock ? (
                <div className="space-y-4">
                  {/* Selected Stock Info */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900">{selectedStock.symbol} - {selectedStock.name}</h4>
                    <p className="text-gray-600">Current Price: {formatCurrency(selectedStock.currentPrice)}</p>
                    <p className="text-gray-600">Shares Owned: {selectedStock.shares}</p>
                  </div>

                  {/* Order Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={sellOrder.orderType === 'market' ? 'default' : 'outline'}
                        className={`${sellOrder.orderType === 'market' 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSellOrderChange('orderType', 'market')}
                      >
                        Market Order
                      </Button>
                      <Button
                        variant={sellOrder.orderType === 'limit' ? 'default' : 'outline'}
                        className={`${sellOrder.orderType === 'limit' 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSellOrderChange('orderType', 'limit')}
                      >
                        Limit Order
                      </Button>
                    </div>
                  </div>

                  {/* Number of Shares */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Shares</label>
                    <input
                      type="number"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900 placeholder-gray-400 ${
                        errors.shares ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter number of shares"
                      value={sellOrder.shares || ''}
                      onChange={(e) => handleSellOrderChange('shares', parseInt(e.target.value) || 0)}
                      max={selectedStock.shares}
                    />
                    {errors.shares && (
                      <p className="text-red-600 text-sm mt-1">{errors.shares}</p>
                    )}
                  </div>

                  {/* Limit Price (if limit order) */}
                  {sellOrder.orderType === 'limit' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Limit Price</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900 placeholder-gray-400 ${
                            errors.limitPrice ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter limit price"
                          value={sellOrder.limitPrice || ''}
                          onChange={(e) => handleSellOrderChange('limitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      {errors.limitPrice && (
                        <p className="text-red-600 text-sm mt-1">{errors.limitPrice}</p>
                      )}
                    </div>
                  )}

                  {/* Estimated Total */}
                  {sellOrder.shares > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Order Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Shares to sell:</span>
                          <span>{sellOrder.shares}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Price per share:</span>
                          <span>{formatCurrency(sellOrder.orderType === 'limit' && sellOrder.limitPrice ? sellOrder.limitPrice : selectedStock.currentPrice)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-2">
                          <span>Estimated Total:</span>
                          <span>{formatCurrency(calculateEstimatedTotal())}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmitSell}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    disabled={!selectedStock || sellOrder.shares <= 0}
                  >
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Review Sell Order
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a stock from your portfolio to start selling</p>
                </div>
              )}
            </Card>
          </div>
        ) : (
          /* Confirmation Modal */
          <Card className="p-6 bg-white border-gray-200 max-w-md mx-auto">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Sell Order</h3>
              
              <div className="space-y-3 text-left bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock:</span>
                  <span className="text-gray-900 font-semibold">{sellOrder.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Type:</span>
                  <span className="text-gray-900">{sellOrder.orderType === 'market' ? 'Market Order' : 'Limit Order'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shares:</span>
                  <span className="text-gray-900">{sellOrder.shares}</span>
                </div>
                {sellOrder.orderType === 'limit' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Limit Price:</span>
                    <span className="text-gray-900">{formatCurrency(sellOrder.limitPrice || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-600">Estimated Total:</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(sellOrder.estimatedTotal)}</span>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmSell}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Sell
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SellStocks;
