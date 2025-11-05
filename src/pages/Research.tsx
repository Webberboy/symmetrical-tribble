import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, TrendingUp, TrendingDown, BarChart3, Globe, Calendar, DollarSign, Users, Building } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';

// Research Page

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  peRatio: number;
  dividend: number;
  high52Week: number;
  low52Week: number;
  sector: string;
  description: string;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
}

const Research = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'analysis'>('overview');
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

  // Mock market indices data
  const marketIndices: MarketIndex[] = [
    { name: 'S&P 500', symbol: 'SPX', value: 4567.89, change: 23.45, changePercent: 0.52 },
    { name: 'Dow Jones', symbol: 'DJI', value: 35234.12, change: -45.67, changePercent: -0.13 },
    { name: 'NASDAQ', symbol: 'IXIC', value: 14123.45, change: 67.89, changePercent: 0.48 },
    { name: 'Russell 2000', symbol: 'RUT', value: 1987.65, change: 12.34, changePercent: 0.62 }
  ];

  // Mock stock data
  const stocksData: StockData[] = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 175.25,
      change: 2.25,
      changePercent: 1.30,
      volume: '45.2M',
      marketCap: '2.8T',
      peRatio: 28.5,
      dividend: 0.96,
      high52Week: 198.23,
      low52Week: 124.17,
      sector: 'Technology',
      description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.'
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: 380.75,
      change: -3.50,
      changePercent: -0.91,
      volume: '28.7M',
      marketCap: '2.9T',
      peRatio: 32.1,
      dividend: 2.72,
      high52Week: 384.30,
      low52Week: 213.43,
      sector: 'Technology',
      description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.'
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 142.50,
      change: 1.75,
      changePercent: 1.24,
      volume: '32.1M',
      marketCap: '1.8T',
      peRatio: 25.8,
      dividend: 0.00,
      high52Week: 151.55,
      low52Week: 83.34,
      sector: 'Technology',
      description: 'Alphabet Inc. provides online advertising services in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.'
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      price: 245.80,
      change: -4.20,
      changePercent: -1.68,
      volume: '89.5M',
      marketCap: '780B',
      peRatio: 65.2,
      dividend: 0.00,
      high52Week: 299.29,
      low52Week: 101.81,
      sector: 'Consumer Cyclical',
      description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.'
    }
  ];

  // Mock news data
  const newsData: NewsItem[] = [
    {
      id: '1',
      title: 'Apple Reports Strong Q4 Earnings, iPhone Sales Exceed Expectations',
      summary: 'Apple Inc. reported better-than-expected quarterly results driven by strong iPhone 15 sales and services revenue growth.',
      source: 'MarketWatch',
      timestamp: '2 hours ago',
      sentiment: 'positive'
    },
    {
      id: '2',
      title: 'Federal Reserve Signals Potential Rate Cuts in 2024',
      summary: 'The Federal Reserve indicated it may consider lowering interest rates next year if inflation continues to decline.',
      source: 'Reuters',
      timestamp: '4 hours ago',
      sentiment: 'positive'
    },
    {
      id: '3',
      title: 'Tech Stocks Face Headwinds Amid Regulatory Concerns',
      summary: 'Major technology companies are facing increased scrutiny from regulators regarding antitrust and data privacy issues.',
      source: 'Bloomberg',
      timestamp: '6 hours ago',
      sentiment: 'negative'
    }
  ];

  const filteredStocks = stocksData.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-4 w-4" />;
      case 'negative': return <TrendingDown className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
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
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/investment')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Research</h1>
            <p className="text-gray-600">Research stocks, analyze market trends, and stay informed</p>
          </div>
        </div>

        {/* Market Indices */}
        <Card className="p-6 bg-white border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {marketIndices.map((index) => (
              <div key={index.symbol} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900">{index.name}</h4>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(index.value)}</p>
                <div className={`flex items-center space-x-1 ${index.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {index.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm">
                    {index.change >= 0 ? '+' : ''}{formatNumber(index.change)} ({index.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stock Search and List */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Search</h3>
              
              {/* Search Input */}
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

              {/* Stock List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredStocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedStock?.symbol === stock.symbol
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedStock(stock)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{stock.symbol}</h4>
                        <p className="text-sm text-gray-600">{stock.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(stock.price)}</p>
                        <p className={`text-sm ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)} ({stock.changePercent.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Stock Details */}
          <div className="lg:col-span-2">
            {selectedStock ? (
              <Card className="p-6 bg-white border-gray-200">
                {/* Stock Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedStock.symbol}</h2>
                    <p className="text-gray-600">{selectedStock.name}</p>
                    <p className="text-sm text-gray-500">{selectedStock.sector}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(selectedStock.price)}</p>
                    <div className={`flex items-center justify-end space-x-1 ${selectedStock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedStock.change >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      <span>
                        {selectedStock.change >= 0 ? '+' : ''}{formatCurrency(selectedStock.change)} ({selectedStock.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 mb-6 border-b border-gray-200">
                  {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'news', label: 'News', icon: Globe },
                    { id: 'analysis', label: 'Analysis', icon: TrendingUp }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => setActiveTab(tab.id as any)}
                    >
                      <tab.icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Key Metrics */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Market Cap</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">{selectedStock.marketCap}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <BarChart3 className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">P/E Ratio</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">{selectedStock.peRatio}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Volume</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">{selectedStock.volume}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Dividend</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedStock.dividend > 0 ? `$${selectedStock.dividend}` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 52-Week Range */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">52-Week Range</h4>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">Low: {formatCurrency(selectedStock.low52Week)}</span>
                          <span className="text-gray-600">High: {formatCurrency(selectedStock.high52Week)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${((selectedStock.price - selectedStock.low52Week) / (selectedStock.high52Week - selectedStock.low52Week)) * 100}%`
                            }}
                          ></div>
                        </div>
                        <div className="text-center mt-2">
                          <span className="text-gray-900 font-semibold">Current: {formatCurrency(selectedStock.price)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Company Description */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">About</h4>
                      <p className="text-gray-600 leading-relaxed">{selectedStock.description}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'news' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Latest News</h4>
                    {newsData.map((news) => (
                      <div key={news.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-gray-900 flex-1">{news.title}</h5>
                          <div className={`flex items-center space-x-1 ml-4 ${getSentimentColor(news.sentiment)}`}>
                            {getSentimentIcon(news.sentiment)}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{news.summary}</p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{news.source}</span>
                          <span>{news.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'analysis' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900">Technical Analysis</h4>
                    
                    {/* Price Targets */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h5 className="font-semibold text-gray-900 mb-4">Analyst Price Targets</h5>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Low</p>
                          <p className="text-lg font-semibold text-red-600">{formatCurrency(selectedStock.price * 0.85)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Average</p>
                          <p className="text-lg font-semibold text-yellow-600">{formatCurrency(selectedStock.price * 1.15)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">High</p>
                          <p className="text-lg font-semibold text-green-600">{formatCurrency(selectedStock.price * 1.35)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h5 className="font-semibold text-gray-900 mb-4">Analyst Recommendations</h5>
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Strong Buy</p>
                            <p className="text-lg font-semibold text-green-600">5</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Buy</p>
                            <p className="text-lg font-semibold text-green-500">8</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Hold</p>
                            <p className="text-lg font-semibold text-yellow-600">3</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Sell</p>
                            <p className="text-lg font-semibold text-red-600">1</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Overall Rating</p>
                          <p className="text-lg font-semibold text-green-600">BUY</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-6 bg-white border-gray-200">
                <div className="text-center py-12">
                  <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Stock to Research</h3>
                  <p className="text-gray-600">Choose a stock from the list to view detailed information, news, and analysis</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Research;
