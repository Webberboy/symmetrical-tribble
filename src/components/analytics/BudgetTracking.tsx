import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Edit2, Plus, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface BudgetItem {
  id: string;
  category: string;
  budgetAmount: number;
  spentAmount: number;
  color: string;
  icon: string;
}

interface BudgetTrackingProps {
  budgets: BudgetItem[];
  onEditBudget?: (id: string) => void;
  onAddBudget?: () => void;
}

const BudgetTracking = ({ budgets, onEditBudget, onAddBudget }: BudgetTrackingProps) => {
  const [showAllBudgets, setShowAllBudgets] = useState(false);

  // Calculate overall budget stats
  const totalBudget = budgets.reduce((acc, curr) => acc + curr.budgetAmount, 0);
  const totalSpent = budgets.reduce((acc, curr) => acc + curr.spentAmount, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Filter budgets to show
  const displayedBudgets = showAllBudgets ? budgets : budgets.slice(0, 4);

  // Get status for a budget
  const getBudgetStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return { status: 'exceeded', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    if (percentage >= 90) return { status: 'warning', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
    if (percentage >= 75) return { status: 'caution', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
  };

  // Get progress bar color
  const getProgressColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return 'bg-red-600';
    if (percentage >= 90) return 'bg-orange-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-600';
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Budget Tracking</h3>
          <p className="text-sm text-gray-600 mt-1">Monitor your spending limits</p>
        </div>
        <Button 
          onClick={onAddBudget}
          className="bg-primary text-white hover:bg-primary/90"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Budget
        </Button>
      </div>

      {/* Overall Budget Summary */}
      <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-600">Total Budget</p>
            <p className="text-2xl font-bold text-gray-900">${totalBudget.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Remaining</p>
            <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(totalRemaining).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Spent: ${totalSpent.toLocaleString()}</span>
            <span className="font-semibold text-gray-900">{overallProgress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(totalSpent, totalBudget)}`}
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Individual Budget Items */}
      <div className="space-y-4">
        {displayedBudgets.map((budget) => {
          const percentage = budget.budgetAmount > 0 ? (budget.spentAmount / budget.budgetAmount) * 100 : 0;
          const remaining = budget.budgetAmount - budget.spentAmount;
          const status = getBudgetStatus(budget.spentAmount, budget.budgetAmount);

          return (
            <div 
              key={budget.id}
              className={`p-4 rounded-lg border ${status.borderColor} ${status.bgColor} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: budget.color + '20' }}
                  >
                    <span className="text-lg" style={{ color: budget.color }}>
                      {budget.icon}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{budget.category}</p>
                    <p className="text-xs text-gray-600">
                      ${budget.spentAmount.toLocaleString()} of ${budget.budgetAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {percentage >= 90 && (
                    <AlertCircle className={`w-4 h-4 ${status.color}`} />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditBudget?.(budget.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(budget.spentAmount, budget.budgetAmount)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={status.color}>
                    {percentage >= 100 ? `Over by $${Math.abs(remaining).toLocaleString()}` : `$${remaining.toLocaleString()} remaining`}
                  </span>
                  <span className="font-semibold text-gray-700">{percentage.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More/Less Button */}
      {budgets.length > 4 && (
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={() => setShowAllBudgets(!showAllBudgets)}
            className="text-primary hover:bg-blue-50"
          >
            {showAllBudgets ? 'Show Less' : `Show ${budgets.length - 4} More`}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {budgets.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Budgets Set</h4>
          <p className="text-sm text-gray-600 mb-4">
            Start tracking your spending by creating budgets for different categories
          </p>
          <Button 
            onClick={onAddBudget}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Budget
          </Button>
        </div>
      )}
    </Card>
  );
};

export default BudgetTracking;
