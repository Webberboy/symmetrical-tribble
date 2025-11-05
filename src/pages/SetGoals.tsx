import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Calendar, DollarSign, TrendingUp, PlusCircle, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';

// Set Goals Page

interface InvestmentGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'retirement' | 'house' | 'education' | 'vacation' | 'emergency' | 'other';
  priority: 'high' | 'medium' | 'low';
  monthlyContribution: number;
  description: string;
  status: 'on-track' | 'behind' | 'ahead' | 'completed';
}

interface GoalForm {
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  priority: string;
  monthlyContribution: number;
  description: string;
}

const SetGoals = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [goals, setGoals] = useState<InvestmentGoal[]>([
    {
      id: '1',
      name: 'Retirement Fund',
      targetAmount: 1000000,
      currentAmount: 250000,
      targetDate: '2045-12-31',
      category: 'retirement',
      priority: 'high',
      monthlyContribution: 2000,
      description: 'Build a comfortable retirement fund for financial independence',
      status: 'on-track'
    },
    {
      id: '2',
      name: 'House Down Payment',
      targetAmount: 100000,
      currentAmount: 35000,
      targetDate: '2026-06-30',
      category: 'house',
      priority: 'high',
      monthlyContribution: 1500,
      description: 'Save for a 20% down payment on a new home',
      status: 'behind'
    },
    {
      id: '3',
      name: 'Emergency Fund',
      targetAmount: 50000,
      currentAmount: 45000,
      targetDate: '2024-12-31',
      category: 'emergency',
      priority: 'medium',
      monthlyContribution: 500,
      description: '6 months of living expenses for emergencies',
      status: 'ahead'
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<InvestmentGoal | null>(null);
  const [formData, setFormData] = useState<GoalForm>({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: '',
    category: 'other',
    priority: 'medium',
    monthlyContribution: 0,
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const categoryOptions = [
    { value: 'retirement', label: 'Retirement', icon: '🏖️' },
    { value: 'house', label: 'House/Property', icon: '🏠' },
    { value: 'education', label: 'Education', icon: '🎓' },
    { value: 'vacation', label: 'Vacation/Travel', icon: '✈️' },
    { value: 'emergency', label: 'Emergency Fund', icon: '🚨' },
    { value: 'other', label: 'Other', icon: '🎯' }
  ];

  const priorityOptions = [
    { value: 'high', label: 'High', color: 'text-red-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'low', label: 'Low', color: 'text-green-600' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Goal name is required';
    }

    if (!formData.targetAmount || formData.targetAmount <= 0) {
      newErrors.targetAmount = 'Target amount must be greater than 0';
    }

    if (formData.currentAmount < 0) {
      newErrors.currentAmount = 'Current amount cannot be negative';
    }

    if (formData.currentAmount >= formData.targetAmount) {
      newErrors.currentAmount = 'Current amount must be less than target amount';
    }

    if (!formData.targetDate) {
      newErrors.targetDate = 'Target date is required';
    } else {
      const targetDate = new Date(formData.targetDate);
      const today = new Date();
      if (targetDate <= today) {
        newErrors.targetDate = 'Target date must be in the future';
      }
    }

    if (formData.monthlyContribution < 0) {
      newErrors.monthlyContribution = 'Monthly contribution cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateProgress = (goal: InvestmentGoal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const calculateMonthsRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return Math.max(diffMonths, 0);
  };

  const calculateRequiredMonthlyContribution = (goal: InvestmentGoal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    const monthsLeft = calculateMonthsRemaining(goal.targetDate);
    return monthsLeft > 0 ? remaining / monthsLeft : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-blue-600';
      case 'behind': return 'text-red-600';
      case 'ahead': return 'text-green-600';
      case 'completed': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track': return <Target className="h-4 w-4" />;
      case 'behind': return <AlertCircle className="h-4 w-4" />;
      case 'ahead': return <TrendingUp className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const determineGoalStatus = (goal: InvestmentGoal): InvestmentGoal['status'] => {
    const progress = calculateProgress(goal);
    const monthsRemaining = calculateMonthsRemaining(goal.targetDate);
    const totalMonths = calculateMonthsRemaining(goal.targetDate) + 
      Math.ceil((new Date().getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24 * 30));
    const expectedProgress = ((totalMonths - monthsRemaining) / totalMonths) * 100;

    if (progress >= 100) return 'completed';
    if (progress >= expectedProgress + 10) return 'ahead';
    if (progress < expectedProgress - 10) return 'behind';
    return 'on-track';
  };

  const handleFormSubmit = () => {
    if (!validateForm()) return;

    const newGoal: InvestmentGoal = {
      id: editingGoal ? editingGoal.id : Date.now().toString(),
      ...formData,
      status: 'on-track'
    };

    newGoal.status = determineGoalStatus(newGoal);

    if (editingGoal) {
      setGoals(goals.map(goal => goal.id === editingGoal.id ? newGoal : goal));
    } else {
      setGoals([...goals, newGoal]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      targetDate: '',
      category: 'other',
      priority: 'medium',
      monthlyContribution: 0,
      description: ''
    });
    setEditingGoal(null);
    setShowForm(false);
    setErrors({});
  };

  const handleEdit = (goal: InvestmentGoal) => {
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate,
      category: goal.category,
      priority: goal.priority,
      monthlyContribution: goal.monthlyContribution,
      description: goal.description
    });
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleDelete = (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      setGoals(goals.filter(goal => goal.id !== goalId));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    const option = categoryOptions.find(opt => opt.value === category);
    return option ? option.icon : '🎯';
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
      
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/investment')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Investment Goals</h1>
              <p className="text-gray-600">Set and track your financial objectives</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Goal
          </Button>
        </div>

        {/* Goals Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Goals</p>
                <p className="text-2xl font-bold text-gray-900">{goals.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-white border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Target</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(goals.reduce((sum, goal) => sum + goal.targetAmount, 0))}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-white border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(goals.reduce((sum, goal) => sum + goal.currentAmount, 0))}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = calculateProgress(goal);
            const monthsRemaining = calculateMonthsRemaining(goal.targetDate);
            const requiredMonthly = calculateRequiredMonthlyContribution(goal);
            
            return (
              <Card key={goal.id} className="p-6 bg-white border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl">{getCategoryIcon(goal.category)}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                      <p className="text-gray-600 text-sm">{goal.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className={`flex items-center space-x-1 ${getStatusColor(goal.status)}`}>
                          {getStatusIcon(goal.status)}
                          <span className="text-sm capitalize">{goal.status.replace('-', ' ')}</span>
                        </div>
                        <div className={`text-sm ${priorityOptions.find(p => p.value === goal.priority)?.color}`}>
                          {priorityOptions.find(p => p.value === goal.priority)?.label} Priority
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(goal)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(goal.id)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Amount</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(goal.currentAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Target Amount</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(goal.targetAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Target Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(goal.targetDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Contribution</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(goal.monthlyContribution)}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-semibold text-gray-900">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        progress >= 100 ? 'bg-purple-500' :
                        progress >= 75 ? 'bg-green-500' :
                        progress >= 50 ? 'bg-blue-500' :
                        progress >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      {monthsRemaining} months remaining
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      Required monthly: {formatCurrency(requiredMonthly)}
                      {requiredMonthly > goal.monthlyContribution && (
                        <span className="text-red-600 ml-1">
                          (+{formatCurrency(requiredMonthly - goal.monthlyContribution)} needed)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Goal Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  {editingGoal ? 'Edit Goal' : 'Add New Goal'}
                </h3>

                <div className="space-y-4">
                  {/* Goal Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Goal Name</label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900 placeholder-gray-400 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter goal name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                  </div>

                  {/* Category and Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        {categoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.icon} {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      >
                        {priorityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Target Amount and Current Amount */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900 placeholder-gray-400 ${
                            errors.targetAmount ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter target amount"
                          value={formData.targetAmount || ''}
                          onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      {errors.targetAmount && <p className="text-red-600 text-sm mt-1">{errors.targetAmount}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Amount</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900 placeholder-gray-400 ${
                            errors.currentAmount ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter current amount"
                          value={formData.currentAmount || ''}
                          onChange={(e) => setFormData({ ...formData, currentAmount: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      {errors.currentAmount && <p className="text-red-600 text-sm mt-1">{errors.currentAmount}</p>}
                    </div>
                  </div>

                  {/* Target Date and Monthly Contribution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
                      <input
                        type="date"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900 ${
                          errors.targetDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={formData.targetDate}
                        onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                      />
                      {errors.targetDate && <p className="text-red-600 text-sm mt-1">{errors.targetDate}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Contribution</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900 placeholder-gray-400 ${
                            errors.monthlyContribution ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter monthly contribution"
                          value={formData.monthlyContribution || ''}
                          onChange={(e) => setFormData({ ...formData, monthlyContribution: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      {errors.monthlyContribution && <p className="text-red-600 text-sm mt-1">{errors.monthlyContribution}</p>}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900 placeholder-gray-400"
                      placeholder="Enter goal description"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex space-x-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleFormSubmit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {editingGoal ? 'Update Goal' : 'Create Goal'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetGoals;
