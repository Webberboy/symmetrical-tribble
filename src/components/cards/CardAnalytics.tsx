import { Card } from '@/components/ui/card';
import { TrendingUp, DollarSign, ShoppingBag, Percent } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Transaction {
  id: string;
  merchant_name: string;
  amount: number;
  transaction_type: string;
  transaction_date: string;
  status: string;
}

interface CardAnalyticsProps {
  transactions: Transaction[];
  cardBalance: number;
  creditLimit: number | null;
}

const CardAnalytics = ({ transactions, cardBalance, creditLimit }: CardAnalyticsProps) => {
  // Calculate monthly spending
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.transaction_date);
    return date.getMonth() === currentMonth && 
           date.getFullYear() === currentYear &&
           t.transaction_type === 'purchase';
  });

  const monthlySpending = monthlyTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const transactionCount = monthlyTransactions.length;
  const avgTransaction = transactionCount > 0 ? monthlySpending / transactionCount : 0;

  // Calculate credit utilization
  const creditUtilization = creditLimit && creditLimit > 0 
    ? ((creditLimit - cardBalance) / creditLimit) * 100 
    : 0;

  // Get top merchants
  const merchantSpending: Record<string, number> = {};
  monthlyTransactions.forEach(t => {
    merchantSpending[t.merchant_name] = (merchantSpending[t.merchant_name] || 0) + Math.abs(t.amount);
  });

  const topMerchants = Object.entries(merchantSpending)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));

  // Category breakdown (simplified - you can enhance this)
  const categories = [
    { name: 'Shopping', value: monthlySpending * 0.3, color: '#0052CC' },
    { name: 'Food', value: monthlySpending * 0.25, color: '#059669' },
    { name: 'Transport', value: monthlySpending * 0.2, color: '#D97706' },
    { name: 'Entertainment', value: monthlySpending * 0.15, color: '#7C3AED' },
    { name: 'Other', value: monthlySpending * 0.1, color: '#6B7280' },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-primary">
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Spending */}
        <Card className="p-4 bg-white border border-gray-200 shadow-card hover:shadow-card-hover transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Monthly Spending</p>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">${monthlySpending.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{transactionCount} transactions</p>
        </Card>

        {/* Average Transaction */}
        <Card className="p-4 bg-white border border-gray-200 shadow-card hover:shadow-card-hover transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Avg Transaction</p>
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">${avgTransaction.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">per purchase</p>
        </Card>

        {/* Card Balance */}
        <Card className="p-4 bg-white border border-gray-200 shadow-card hover:shadow-card-hover transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Available Balance</p>
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">${cardBalance.toFixed(2)}</p>
          {creditLimit && <p className="text-xs text-gray-500 mt-1">of ${creditLimit.toFixed(2)} limit</p>}
        </Card>

        {/* Credit Utilization */}
        {creditLimit && (
          <Card className="p-4 bg-white border border-gray-200 shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Credit Used</p>
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                <Percent className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{creditUtilization.toFixed(0)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  creditUtilization > 80 ? 'bg-red-600' : 
                  creditUtilization > 50 ? 'bg-orange-500' : 'bg-green-600'
                }`}
                style={{ width: `${creditUtilization}%` }}
              />
            </div>
          </Card>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Merchants Bar Chart */}
        <Card className="p-6 bg-white border border-gray-200 shadow-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Merchants</h3>
          {topMerchants.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topMerchants} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#6B7280" 
                  style={{ fontSize: '12px' }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="#0052CC" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No transactions this month</p>
            </div>
          )}
        </Card>

        {/* Category Breakdown Pie Chart */}
        <Card className="p-6 bg-white border border-gray-200 shadow-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
          {monthlySpending > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={250}>
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm text-gray-700">{cat.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      ${cat.value.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No spending data available</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CardAnalytics;
