import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { ShoppingBag, Home, Utensils, Car, Heart, Zap, MoreHorizontal } from 'lucide-react';

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  icon: string;
}

interface CategoryBreakdownChartProps {
  data: CategoryData[];
}

const CategoryBreakdownChart = ({ data }: CategoryBreakdownChartProps) => {
  const totalSpending = data.reduce((acc, curr) => acc + curr.value, 0);

  // Get icon component based on category
  const getCategoryIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      shopping: ShoppingBag,
      housing: Home,
      food: Utensils,
      transport: Car,
      health: Heart,
      utilities: Zap,
      other: MoreHorizontal,
    };
    const Icon = icons[iconName] || MoreHorizontal;
    return <Icon className="w-4 h-4" />;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 mb-1">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            ${payload[0].value.toLocaleString()} ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Spending by Category</h3>
        <p className="text-sm text-gray-600 mt-1">This month's breakdown</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category List */}
        <div className="space-y-3">
          {data.map((category, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <span style={{ color: category.color }}>
                    {getCategoryIcon(category.icon)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{category.name}</p>
                  <p className="text-xs text-gray-600">{category.percentage}% of total</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">${category.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total Spending */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">Total Monthly Spending</p>
          <p className="text-2xl font-bold text-gray-900">${totalSpending.toLocaleString()}</p>
        </div>
      </div>
    </Card>
  );
};

export default CategoryBreakdownChart;
