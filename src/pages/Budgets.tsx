import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ChartPieIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ShoppingCartIcon,
  GlobeAltIcon as RestaurantIcon,
  TruckIcon,
  FilmIcon,
  ShoppingBagIcon,
  BoltIcon,
  BanknotesIcon,
  LightBulbIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Budget {
  id: string;
  category: string;
  budget_amount: number;
  spent_amount: number;
  icon: string;
  color: string;
}

const Budgets = () => {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_year', currentYear)
        .eq('period_month', currentMonth)
        .eq('is_active', true)
        .order('category');

      if (error) {
        throw error;
      }

      setBudgets(data || []);
    } catch (error: any) {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (spent: number, budget: number) => {
    return (spent / budget) * 100;
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 90) return 'text-orange-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 90) return 'bg-orange-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.budget_amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent_amount, 0);
  const totalRemaining = totalBudget - totalSpent;

  const handleAddBudget = async () => {
    if (!newCategory || !newAmount) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      const { error } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          category: newCategory,
          budget_amount: parseFloat(newAmount),
          spent_amount: 0,
          period_year: currentYear,
          period_month: currentMonth,
          icon: 'banknote',
          color: 'bg-gray-500',
          is_active: true,
        });

      if (error) throw error;

      toast.success('Budget created successfully');
      setShowAddDialog(false);
      setNewCategory('');
      setNewAmount('');
      await loadBudgets();
    } catch (error: any) {
      toast.error('Failed to create budget');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Budget deleted');
      await loadBudgets();
    } catch (error: any) {
      toast.error('Failed to delete budget');
    }
  };

  const getBudgetIcon = (iconName: string) => {
    const iconClass = "h-8 w-8";
    switch(iconName) {
      case 'cart': return <ShoppingCartIcon className={iconClass} />;
      case 'restaurant': return <RestaurantIcon className={iconClass} />;
      case 'truck': return <TruckIcon className={iconClass} />;
      case 'film': return <FilmIcon className={iconClass} />;
      case 'shopping': return <ShoppingBagIcon className={iconClass} />;
      case 'bolt': return <BoltIcon className={iconClass} />;
      case 'banknote': return <BanknotesIcon className={iconClass} />;
      default: return <ChartPieIcon className={iconClass} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-20">
        <Header 
          user={{ firstName: '', lastName: '', email: '' }}
          showBackButton={true}
          title="Budget Manager"
          onBackClick={() => navigate('/dashboard')}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading budgets...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-20">
      <Header 
        user={currentUser ? { 
          firstName: currentUser.user_metadata?.first_name || 'User', 
          lastName: currentUser.user_metadata?.last_name || '', 
          email: currentUser.email || '' 
        } : { firstName: '', lastName: '', email: '' }}
        showBackButton={true}
        title="Budget Manager"
        onBackClick={() => navigate('/dashboard')}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-card p-6 border border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-gray-600 mt-1">Track your spending and stay on budget</p>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="bg-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Budget
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-6">
            <p className="text-sm text-blue-700 font-medium mb-2">Total Budget</p>
            <p className="text-3xl font-bold text-blue-900">${totalBudget.toFixed(2)}</p>
            <p className="text-xs text-blue-600 mt-1">Monthly allocation</p>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-6">
            <p className="text-sm text-purple-700 font-medium mb-2">Total Spent</p>
            <p className="text-3xl font-bold text-purple-900">${totalSpent.toFixed(2)}</p>
            <p className="text-xs text-purple-600 mt-1">
              {((totalSpent / totalBudget) * 100).toFixed(1)}% of budget
            </p>
          </Card>

          <Card className={`bg-gradient-to-br ${totalRemaining >= 0 ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'} p-6`}>
            <p className={`text-sm font-medium mb-2 ${totalRemaining >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              Remaining
            </p>
            <p className={`text-3xl font-bold ${totalRemaining >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              ${Math.abs(totalRemaining).toFixed(2)}
            </p>
            <p className={`text-xs mt-1 ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalRemaining >= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </Card>
        </div>

        {/* Budget List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Budget Categories</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {budgets.map((budget) => {
              const percentage = getPercentage(budget.spent_amount, budget.budget_amount);
              const remaining = budget.budget_amount - budget.spent_amount;
              
              return (
                <Card key={budget.id} className="bg-white border-gray-200 shadow-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-gray-700">{getBudgetIcon(budget.icon)}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{budget.category}</h3>
                        <p className="text-sm text-gray-600">
                          ${budget.spent_amount.toFixed(2)} of ${budget.budget_amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.info('Edit functionality coming soon')}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBudget(budget.id)}
                      >
                        <TrashIcon className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={`font-semibold ${getStatusColor(percentage)}`}>
                        {percentage.toFixed(1)}% used
                      </span>
                      <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${Math.abs(remaining).toFixed(2)} {remaining >= 0 ? 'left' : 'over'}
                      </span>
                    </div>
                    
                    <div className="relative">
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className="h-3"
                      />
                      <div 
                        className={`absolute inset-0 h-3 rounded-full ${getProgressColor(percentage)}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {percentage >= 90 && (
                    <div className={`mt-3 p-2 rounded-lg text-xs flex items-center gap-2 ${
                      percentage >= 100 
                        ? 'bg-red-50 text-red-700' 
                        : 'bg-orange-50 text-orange-700'
                    }`}>
                      <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {percentage >= 100 
                          ? 'Budget exceeded! Consider adjusting your spending.'
                          : 'Approaching budget limit. Monitor your spending closely.'
                        }
                      </span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Tips Section */}
        <Card className="bg-blue-50 border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <LightBulbIcon className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Budgeting Tips</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings</li>
            <li>• Review your budgets monthly and adjust as needed</li>
            <li>• Set up alerts when you reach 75% of any budget</li>
            <li>• Track irregular expenses like car maintenance separately</li>
            <li>• Build an emergency fund for unexpected costs</li>
          </ul>
        </Card>
      </div>

      {/* Add Budget Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Budget</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="category">Category Name</Label>
              <Input
                id="category"
                placeholder="e.g., Healthcare, Education"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="budget-amount">Monthly Budget</Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="budget-amount"
                  type="number"
                  placeholder="0.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="pl-8"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddBudget}
                className="flex-1"
              >
                Create Budget
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
};

export default Budgets;
