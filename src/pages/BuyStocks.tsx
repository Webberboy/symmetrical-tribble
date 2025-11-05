import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Search, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  getAllStocks,
  searchStocks,
  createBuyOrder,
  getStockPosition,
  formatCurrency
} from '@/lib/investmentUtils';

// Buy Stocks Page

interface Stock {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  day_change: number;
  day_change_percent: number;
  sector: string;
  market_cap: string;
}

interface BuyOrder {
  stockId: string;
  symbol: string;
  name: string;
  orderType: 'market' | 'limit';
  shares: number;
  currentPrice: number;
  limitPrice?: number;
  estimatedTotal: number;
}

const BuyStocks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [buyOrder, setBuyOrder] = useState<BuyOrder>({
    stockId: '',
    symbol: '',
    name: '',
    orderType: 'market',
    shares: 0,
    currentPrice: 0,
    estimatedTotal: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
    fetchStocks();
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

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStocks(stocks);
    } else {
      const filtered = stocks.filter(stock =>
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStocks(filtered);
    }
  }, [searchTerm, stocks]);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const result = await getAllStocks();
      
      if (result.success && result.data) {
        setStocks(result.data as any);
        setFilteredStocks(result.data as any);
      } else {
        toast({
          title: "Error",
          description: "Failed to load stocks. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load stocks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateBuyOrder = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedStock) {
      newErrors.stock = 'Please select a stock to buy';
    }

    if (!buyOrder.shares || buyOrder.shares <= 0) {
      newErrors.shares = 'Please enter a valid number of shares';
    }

    if (buyOrder.orderType === 'limit') {
      if (!buyOrder.limitPrice || buyOrder.limitPrice <= 0) {
        newErrors.limitPrice = 'Please enter a valid limit price';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateEstimatedTotal = () => {
    if (!selectedStock || !buyOrder.shares) return 0;
    
    const price = buyOrder.orderType === 'limit' && buyOrder.limitPrice 
      ? buyOrder.limitPrice 
      : selectedStock.current_price;
    
    return buyOrder.shares * price;
  };

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    setBuyOrder({
      stockId: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      orderType: 'market',
      shares: 0,
      currentPrice: Number(stock.current_price),
      estimatedTotal: 0
    });
    setErrors({});
  };

  const handleBuyOrderChange = (field: keyof BuyOrder, value: any) => {
    const updatedOrder = { ...buyOrder, [field]: value };
    setBuyOrder(updatedOrder);
    
    // Update estimated total
    if (field === 'shares' || field === 'limitPrice' || field === 'orderType') {
      updatedOrder.estimatedTotal = calculateEstimatedTotal();
      setBuyOrder(updatedOrder);
    }
  };

  const handleSubmitBuy = () => {
    if (!validateBuyOrder()) return;

    setBuyOrder(prev => ({ ...prev, estimatedTotal: calculateEstimatedTotal() }));
    setShowConfirmation(true);
  };

  const confirmBuy = async () => {
    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to buy stocks.",
          variant: "destructive"
        });
        navigate('/signin');
        return;
      }

      const result = await createBuyOrder({
        userId: user.id,
        symbol: buyOrder.symbol,
        shares: buyOrder.shares,
        pricePerShare: buyOrder.orderType === 'limit' && buyOrder.limitPrice 
          ? buyOrder.limitPrice 
          : buyOrder.currentPrice,
        orderType: buyOrder.orderType,
        limitPrice: buyOrder.limitPrice,
        fees: 0
      });

      if (result.success) {
        toast({
          title: "Success!",
          description: `Buy order for ${buyOrder.shares} shares of ${buyOrder.symbol} placed successfully!`,
        });
        
        setSelectedStock(null);
        setBuyOrder({
          stockId: '',
          symbol: '',
          name: '',
          orderType: 'market',
          shares: 0,
          currentPrice: 0,
          estimatedTotal: 0
        });
        setShowConfirmation(false);
        
        setTimeout(() => navigate('/investment'), 1500);
      } else {
        throw new Error(result.error || 'Failed to place order');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Buy Stocks</h1>
            <p className="text-gray-600">Purchase shares to build your portfolio</p>
          </div>
        </div>

        {!showConfirmation ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock Selection */}
            <Card className="p-6 bg-white border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Stock to Buy</h3>
              
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
                {filteredStocks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No stocks found
                  </div>
                ) : (
                  filteredStocks.map((stock) => (
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
                          <p className="text-xs text-gray-500">{stock.sector}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(Number(stock.current_price))}</p>
                          <p className={`text-sm ${Number(stock.day_change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Number(stock.day_change) >= 0 ? '+' : ''}{formatCurrency(Number(stock.day_change))} ({Number(stock.day_change_percent).toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {errors.stock && (
                <p className="text-red-600 text-sm mt-2">{errors.stock}</p>
              )}
            </Card>

            {/* Buy Order Form */}
            <Card className="p-6 bg-white border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Buy Order Details</h3>
              
              {selectedStock ? (
                <div className="space-y-4">
                  {/* Selected Stock Info */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900">{selectedStock.symbol} - {selectedStock.name}</h4>
                    <p className="text-gray-600">Current Price: {formatCurrency(Number(selectedStock.current_price))}</p>
                    <p className="text-gray-600">Market Cap: {selectedStock.market_cap}</p>
                  </div>

                  {/* Order Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={buyOrder.orderType === 'market' ? 'default' : 'outline'}
                        className={`${buyOrder.orderType === 'market' 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => handleBuyOrderChange('orderType', 'market')}
                      >
                        Market Order
                      </Button>
                      <Button
                        variant={buyOrder.orderType === 'limit' ? 'default' : 'outline'}
                        className={`${buyOrder.orderType === 'limit' 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => handleBuyOrderChange('orderType', 'limit')}
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
                      value={buyOrder.shares || ''}
                      onChange={(e) => handleBuyOrderChange('shares', parseInt(e.target.value) || 0)}
                      min="1"
                    />
                    {errors.shares && (
                      <p className="text-red-600 text-sm mt-1">{errors.shares}</p>
                    )}
                  </div>

                  {/* Limit Price (if limit order) */}
                  {buyOrder.orderType === 'limit' && (
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
                          value={buyOrder.limitPrice || ''}
                          onChange={(e) => handleBuyOrderChange('limitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      {errors.limitPrice && (
                        <p className="text-red-600 text-sm mt-1">{errors.limitPrice}</p>
                      )}
                    </div>
                  )}

                  {/* Estimated Total */}
                  {buyOrder.shares > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Order Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Shares to buy:</span>
                          <span>{buyOrder.shares}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Price per share:</span>
                          <span>{formatCurrency(buyOrder.orderType === 'limit' && buyOrder.limitPrice ? buyOrder.limitPrice : Number(selectedStock.current_price))}</span>
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
                    onClick={handleSubmitBuy}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={!selectedStock || buyOrder.shares <= 0}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Review Buy Order
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a stock to start buying</p>
                </div>
              )}
            </Card>
          </div>
        ) : (
          /* Confirmation Modal */
          <Card className="p-6 bg-white border-gray-200 max-w-md mx-auto">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Buy Order</h3>
              
              <div className="space-y-3 text-left bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock:</span>
                  <span className="text-gray-900 font-semibold">{buyOrder.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Type:</span>
                  <span className="text-gray-900">{buyOrder.orderType === 'market' ? 'Market Order' : 'Limit Order'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shares:</span>
                  <span className="text-gray-900">{buyOrder.shares}</span>
                </div>
                {buyOrder.orderType === 'limit' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Limit Price:</span>
                    <span className="text-gray-900">{formatCurrency(buyOrder.limitPrice || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-600">Estimated Total:</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(buyOrder.estimatedTotal)}</span>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmBuy}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Buy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BuyStocks;
