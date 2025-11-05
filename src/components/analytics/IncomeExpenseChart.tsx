import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, DollarSign } from 'lucide-react';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface IncomeExpenseChartProps {
  data: MonthlyData[];
}

const IncomeExpenseChart = ({ data }: IncomeExpenseChartProps) => {
  // Calculate totals
  const totalIncome = data.reduce((acc, curr) => acc + curr.income, 0);
  const totalExpenses = data.reduce((acc, curr) => acc + curr.expenses, 0);
  const netIncome = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : '0';

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const net = payload[0].payload.income - payload[0].payload.expenses;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 mb-2">{payload[0].payload.month}</p>
          <div className="space-y-1">
            <p className="text-sm text-green-600">
              Income: <span className="font-semibold">${payload[0].payload.income.toLocaleString()}</span>
            </p>
            <p className="text-sm text-red-600">
              Expenses: <span className="font-semibold">${payload[0].payload.expenses.toLocaleString()}</span>
            </p>
            <div className="pt-1 mt-1 border-t border-gray-200">
              <p className={`text-sm font-semibold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Net: ${net.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Income vs Expenses</h3>
        <p className="text-sm text-gray-600 mt-1">Monthly comparison</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
            iconType="rect"
          />
          <Bar 
            dataKey="income" 
            fill="#059669" 
            radius={[4, 4, 0, 0]}
            name="Income"
          />
          <Bar 
            dataKey="expenses" 
            fill="#DC2626" 
            radius={[4, 4, 0, 0]}
            name="Expenses"
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center p-4 rounded-lg bg-green-50 border border-green-100">
          <div className="flex items-center justify-center mb-2">
            <ArrowUpCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-xs text-gray-600 mb-1">Total Income</p>
          <p className="text-xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
        </div>

        <div className="text-center p-4 rounded-lg bg-red-50 border border-red-100">
          <div className="flex items-center justify-center mb-2">
            <ArrowDownCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-xs text-gray-600 mb-1">Total Expenses</p>
          <p className="text-xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
        </div>

        <div className={`text-center p-4 rounded-lg ${
          netIncome >= 0 
            ? 'bg-blue-50 border border-blue-100' 
            : 'bg-red-50 border border-red-100'
        }`}>
          <div className="flex items-center justify-center mb-2">
            <DollarSign className={`w-5 h-5 ${
              netIncome >= 0 ? 'text-blue-600' : 'text-red-600'
            }`} />
          </div>
          <p className="text-xs text-gray-600 mb-1">Net Income</p>
          <p className={`text-xl font-bold ${
            netIncome >= 0 ? 'text-blue-600' : 'text-red-600'
          }`}>
            ${Math.abs(netIncome).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Savings Rate */}
      <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Savings Rate</p>
            <p className="text-xs text-gray-500 mt-0.5">Percentage of income saved</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{savingsRate}%</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(parseFloat(savingsRate), 100)}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default IncomeExpenseChart;
