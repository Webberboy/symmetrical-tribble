// Analytics utility functions for processing transaction and account data

interface Transaction {
  id: string;
  amount: number;
  type: 'debit' | 'credit';
  category?: string;
  created_at: string;
  description?: string;
}

// Get last N months of data
export const getLastNMonths = (n: number): string[] => {
  const months: string[] = [];
  const date = new Date();
  
  for (let i = n - 1; i >= 0; i--) {
    const month = new Date(date.getFullYear(), date.getMonth() - i, 1);
    months.push(month.toLocaleDateString('en-US', { month: 'short' }));
  }
  
  return months;
};

// Process transactions for spending trends chart
export const processSpendingTrends = (transactions: Transaction[]) => {
  const months = getLastNMonths(6);
  const data = months.map(month => ({ month, spending: 0, income: 0 }));
  
  transactions.forEach(transaction => {
    const transactionDate = new Date(transaction.created_at);
    const monthName = transactionDate.toLocaleDateString('en-US', { month: 'short' });
    const monthIndex = months.indexOf(monthName);
    
    if (monthIndex !== -1) {
      if (transaction.type === 'debit') {
        data[monthIndex].spending += Math.abs(transaction.amount);
      } else if (transaction.type === 'credit') {
        data[monthIndex].income += transaction.amount;
      }
    }
  });
  
  return data;
};

// Process transactions for category breakdown
export const processCategoryBreakdown = (transactions: Transaction[]) => {
  const categoryMap: Record<string, { value: number; icon: string; color: string }> = {};
  const categoryConfig: Record<string, { icon: string; color: string }> = {
    'Shopping': { icon: 'shopping', color: '#0052CC' },
    'Food & Dining': { icon: 'food', color: '#059669' },
    'Transportation': { icon: 'transport', color: '#D97706' },
    'Housing': { icon: 'housing', color: '#DC2626' },
    'Healthcare': { icon: 'health', color: '#7C3AED' },
    'Utilities': { icon: 'utilities', color: '#EC4899' },
    'Entertainment': { icon: 'other', color: '#14B8A6' },
    'Other': { icon: 'other', color: '#6B7280' },
  };
  
  // Get current month transactions only
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthTransactions = transactions.filter(t => {
    const date = new Date(t.created_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear && t.type === 'debit';
  });
  
  currentMonthTransactions.forEach(transaction => {
    const category = transaction.category || 'Other';
    if (!categoryMap[category]) {
      categoryMap[category] = { 
        value: 0, 
        icon: categoryConfig[category]?.icon || 'other',
        color: categoryConfig[category]?.color || '#6B7280'
      };
    }
    categoryMap[category].value += Math.abs(transaction.amount);
  });
  
  const total = Object.values(categoryMap).reduce((acc, curr) => acc + curr.value, 0);
  
  return Object.entries(categoryMap)
    .map(([name, data]) => ({
      name,
      value: data.value,
      percentage: total > 0 ? Math.round((data.value / total) * 100) : 0,
      color: data.color,
      icon: data.icon,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 categories
};

// Process transactions for income vs expense chart
export const processIncomeExpense = (transactions: Transaction[]) => {
  const months = getLastNMonths(6);
  const data = months.map(month => ({ month, income: 0, expenses: 0, net: 0 }));
  
  transactions.forEach(transaction => {
    const transactionDate = new Date(transaction.created_at);
    const monthName = transactionDate.toLocaleDateString('en-US', { month: 'short' });
    const monthIndex = months.indexOf(monthName);
    
    if (monthIndex !== -1) {
      if (transaction.type === 'debit') {
        data[monthIndex].expenses += Math.abs(transaction.amount);
      } else if (transaction.type === 'credit') {
        data[monthIndex].income += transaction.amount;
      }
    }
  });
  
  // Calculate net for each month
  data.forEach(month => {
    month.net = month.income - month.expenses;
  });
  
  return data;
};

// Generate sample budget data (in a real app, this would come from database)
export const generateSampleBudgets = () => {
  return [
    {
      id: '1',
      category: 'Food & Dining',
      budgetAmount: 800,
      spentAmount: 650,
      color: '#059669',
      icon: '🍽️',
    },
    {
      id: '2',
      category: 'Shopping',
      budgetAmount: 500,
      spentAmount: 520,
      color: '#0052CC',
      icon: '🛍️',
    },
    {
      id: '3',
      category: 'Transportation',
      budgetAmount: 300,
      spentAmount: 280,
      color: '#D97706',
      icon: '🚗',
    },
    {
      id: '4',
      category: 'Entertainment',
      budgetAmount: 200,
      spentAmount: 150,
      color: '#14B8A6',
      icon: '🎮',
    },
    {
      id: '5',
      category: 'Utilities',
      budgetAmount: 400,
      spentAmount: 375,
      color: '#EC4899',
      icon: '⚡',
    },
    {
      id: '6',
      category: 'Healthcare',
      budgetAmount: 250,
      spentAmount: 120,
      color: '#7C3AED',
      icon: '🏥',
    },
  ];
};

// Calculate financial health score
export const calculateFinancialHealthScore = (
  transactions: Transaction[],
  accountBalance: number,
  totalDebt: number = 0
) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Get current month transactions
  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.created_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  const income = monthTransactions
    .filter(t => t.type === 'credit')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const expenses = monthTransactions
    .filter(t => t.type === 'debit')
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);
  
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  
  // Calculate individual factor scores
  const factors: Array<{
    name: string;
    score: number;
    weight: number;
    icon: string;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    description: string;
  }> = [
    {
      name: 'Savings Rate',
      score: Math.min(Math.round(savingsRate * 4), 100), // 25% savings = 100 score
      weight: 30,
      icon: '💰',
      status: (savingsRate >= 20 ? 'excellent' : savingsRate >= 10 ? 'good' : savingsRate >= 5 ? 'fair' : 'poor') as 'excellent' | 'good' | 'fair' | 'poor',
      description: 'Percentage of income you save each month',
    },
    {
      name: 'Spending Control',
      score: income > 0 ? Math.min(Math.round((1 - expenses / income) * 100), 100) : 50,
      weight: 25,
      icon: '📊',
      status: (expenses < income * 0.8 ? 'excellent' : expenses < income * 0.9 ? 'good' : expenses < income ? 'fair' : 'poor') as 'excellent' | 'good' | 'fair' | 'poor',
      description: 'How well you manage your monthly expenses',
    },
    {
      name: 'Emergency Fund',
      score: Math.min(Math.round((accountBalance / (expenses * 3)) * 100), 100), // 3 months expenses = 100
      weight: 20,
      icon: '🛡️',
      status: (accountBalance >= expenses * 6 ? 'excellent' : accountBalance >= expenses * 3 ? 'good' : accountBalance >= expenses ? 'fair' : 'poor') as 'excellent' | 'good' | 'fair' | 'poor',
      description: 'Ability to cover unexpected expenses',
    },
    {
      name: 'Debt Management',
      score: totalDebt === 0 ? 100 : Math.max(100 - Math.round((totalDebt / income) * 10), 0),
      weight: 15,
      icon: '💳',
      status: (totalDebt === 0 ? 'excellent' : totalDebt < income * 2 ? 'good' : totalDebt < income * 5 ? 'fair' : 'poor') as 'excellent' | 'good' | 'fair' | 'poor',
      description: 'Your debt-to-income ratio',
    },
    {
      name: 'Financial Consistency',
      score: 75, // This would be calculated based on transaction patterns over time
      weight: 10,
      icon: '📈',
      status: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
      description: 'Stability of your income and spending',
    },
  ];
  
  // Calculate weighted overall score
  const overallScore = Math.round(
    factors.reduce((acc, factor) => acc + (factor.score * factor.weight / 100), 0)
  );
  
  return {
    overallScore,
    factors,
  };
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Get date range for filters
export const getDateRange = (range: string): { start: Date; end: Date } => {
  const end = new Date();
  const start = new Date();
  
  switch (range) {
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case '3months':
      start.setMonth(start.getMonth() - 3);
      break;
    case '6months':
      start.setMonth(start.getMonth() - 6);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setMonth(start.getMonth() - 1);
  }
  
  return { start, end };
};
