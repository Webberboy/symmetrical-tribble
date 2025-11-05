import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SpendingData {
  month: string;
  spending: number;
  income: number;
}

interface SpendingTrendsChartProps {
  data: SpendingData[];
}

const SpendingTrendsChart = ({ data }: SpendingTrendsChartProps) => {
  // Calculate percentage change from previous month
  const currentMonthSpending = data[data.length - 1]?.spending || 0;
  const previousMonthSpending = data[data.length - 2]?.spending || 0;
  const percentageChange = previousMonthSpending !== 0 
    ? ((currentMonthSpending - previousMonthSpending) / previousMonthSpending) * 100 
    : 0;

  const isIncrease = percentageChange > 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 mb-2">{payload[0].payload.month}</p>
          <p className="text-sm text-red-600">
            Spending: <span className="font-semibold">${payload[0].value.toLocaleString()}</span>
          </p>
          {payload[1] && (
            <p className="text-sm text-green-600">
              Income: <span className="font-semibold">${payload[1].value.toLocaleString()}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Spending Trends</h3>
          <p className="text-sm text-gray-600 mt-1">Last 6 months</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
          isIncrease ? 'bg-red-50' : 'bg-green-50'
        }`}>
          {isIncrease ? (
            <TrendingUp className="w-4 h-4 text-red-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-green-600" />
          )}
          <span className={`text-sm font-semibold ${
            isIncrease ? 'text-red-600' : 'text-green-600'
          }`}>
            {Math.abs(percentageChange).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-600">vs last month</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="month" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="spending" 
            stroke="#DC2626" 
            strokeWidth={2.5}
            dot={{ fill: '#DC2626', r: 4 }}
            activeDot={{ r: 6 }}
            name="Spending"
          />
          <Line 
            type="monotone" 
            dataKey="income" 
            stroke="#059669" 
            strokeWidth={2.5}
            dot={{ fill: '#059669', r: 4 }}
            activeDot={{ r: 6 }}
            name="Income"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default SpendingTrendsChart;
