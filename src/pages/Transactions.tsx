import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Send,
  DollarSign,
  Loader2,
  RefreshCw,
  Filter,
  X,
  Download,
  Calendar
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SpendingTrendsChart from "@/components/analytics/SpendingTrendsChart";
import { processSpendingTrends } from "@/lib/analyticsUtils";
import { generateTransactionReceipt } from "@/lib/pdfReceiptGenerator";

// Transaction interface matching database schema
interface Transaction {
  id: string;
  user_id: string;
  type: 'debit' | 'credit' | string;
  amount: number;
  description: string | null;
  status: string;
  recipient_account: string | null;
  category: string | null;
  reference_number: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface UserProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
}

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  
  // Filter states
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<string>("all");
  const [filterMinAmount, setFilterMinAmount] = useState<string>("");
  const [filterMaxAmount, setFilterMaxAmount] = useState<string>("");
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
    checkAuthAndLoadData();
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

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true);
      
      // Check authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        navigate("/signin");
        return;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, full_name')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        toast.error('Failed to load profile');
        navigate("/signin");
        return;
      }

      setUser(profile);

      // Load transactions
      await loadTransactions(session.user.id);
    } catch (error) {
      toast.error('An error occurred while loading data');
      navigate("/signin");
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load transactions');
        setTransactions([]);
        return;
      }

      setTransactions(data || []);
    } catch (error) {
      toast.error('Failed to load transactions');
      setTransactions([]);
    }
  };

  const handleRefresh = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      await loadTransactions(user.id);
      toast.success('Transactions refreshed');
    } catch (error) {
      toast.error('Failed to refresh transactions');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcceptTransaction = async () => {
    if (!selectedTransaction) return;
    
    setIsProcessingAction(true);
    try {
      // Update transaction status to completed
      const { error: txnError } = await supabase
        .from('transactions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTransaction.id);

      if (txnError) throw txnError;

      // Update user's account balance - deduct the amount for debit transactions
      if (selectedTransaction.type === 'debit') {
        // Get current user's accounts
        const { data: accounts, error: accountsError } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', selectedTransaction.user_id)
          .eq('account_type', 'checking'); // Wire transfers typically come from checking

        if (accountsError) {
        } else if (accounts && accounts.length > 0) {
          const account = accounts[0];
          const newBalance = account.balance - selectedTransaction.amount;
          
          // Update account balance
          const { error: balanceError } = await supabase
            .from('accounts')
            .update({ 
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', account.id);

          if (balanceError) {
            toast.error('Transaction approved but balance update failed');
          }
        }
      } else if (selectedTransaction.type === 'credit') {
        // For credit transactions, add the amount
        const { data: accounts, error: accountsError } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', selectedTransaction.user_id)
          .eq('account_type', 'checking');

        if (accountsError) {
        } else if (accounts && accounts.length > 0) {
          const account = accounts[0];
          const newBalance = account.balance + selectedTransaction.amount;
          
          // Update account balance
          const { error: balanceError } = await supabase
            .from('accounts')
            .update({ 
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', account.id);

          if (balanceError) {
            toast.error('Transaction approved but balance update failed');
          }
        }
      }

      // If it's a wire transfer, also update wire_transfers table
      if (selectedTransaction.description?.toLowerCase().includes('wire transfer')) {
        const { error: wireError } = await supabase
          .from('wire_transfers')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('transaction_id', selectedTransaction.id);

        if (wireError) console.error('Wire transfer update error:', wireError);
      }

      toast.success('Transaction approved and balance updated successfully! ✅');
      setShowTransactionModal(false);
      
      // Reload transactions
      if (user) await loadTransactions(user.id);
    } catch (error: any) {
      toast.error('Failed to approve transaction: ' + error.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeclineTransaction = async () => {
    if (!selectedTransaction) return;
    
    setIsProcessingAction(true);
    try {
      // Update transaction status to cancelled
      const { error: txnError } = await supabase
        .from('transactions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTransaction.id);

      if (txnError) throw txnError;

      // For declined debit transactions (like wire transfers), refund/restore the amount
      // Since the money was held when pending, we add it back
      if (selectedTransaction.type === 'debit') {
        const { data: accounts, error: accountsError } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', selectedTransaction.user_id)
          .eq('account_type', 'checking');

        if (accountsError) {
        } else if (accounts && accounts.length > 0) {
          const account = accounts[0];
          // Add back the amount that was held
          const newBalance = account.balance + selectedTransaction.amount;
          
          const { error: balanceError } = await supabase
            .from('accounts')
            .update({ 
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', account.id);

          if (balanceError) {
            toast.error('Transaction declined but refund failed');
          }
        }
      }

      // If it's a wire transfer, also update wire_transfers table
      if (selectedTransaction.description?.toLowerCase().includes('wire transfer')) {
        const { error: wireError } = await supabase
          .from('wire_transfers')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('transaction_id', selectedTransaction.id);

        if (wireError) console.error('Wire transfer update error:', wireError);
      }

      toast.success('Transaction declined and funds restored successfully! 💰');
      setShowTransactionModal(false);
      
      // Reload transactions
      if (user) await loadTransactions(user.id);
    } catch (error: any) {
      toast.error('Failed to decline transaction: ' + error.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('deposit') || lowerType.includes('credit')) {
      return ArrowDownLeft;
    } else if (lowerType.includes('withdrawal') || lowerType.includes('debit')) {
      return ArrowUpRight;
    } else if (lowerType.includes('transfer')) {
      return Send;
    }
    return DollarSign;
  };

  const isCredit = (type: string) => {
    const lowerType = type.toLowerCase();
    return lowerType.includes('deposit') || lowerType.includes('credit');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterType("all");
    setFilterStatus("all");
    setFilterDateRange("all");
    setFilterMinAmount("");
    setFilterMaxAmount("");
    setSearchTerm("");
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return filterType !== "all" || 
           filterStatus !== "all" || 
           filterDateRange !== "all" || 
           filterMinAmount !== "" || 
           filterMaxAmount !== "" || 
           searchTerm !== "";
  };

  // Get date range for filtering
  const getDateRange = (range: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch(range) {
      case 'today':
        return { start: today, end: new Date() };
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { start: weekAgo, end: new Date() };
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { start: monthAgo, end: new Date() };
      case '3months':
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return { start: threeMonthsAgo, end: new Date() };
      case 'year':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return { start: yearAgo, end: new Date() };
      default:
        return null;
    }
  };

  // Comprehensive filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.type.toLowerCase().includes(searchLower) ||
        transaction.category?.toLowerCase().includes(searchLower) ||
        transaction.reference_number?.toLowerCase().includes(searchLower) ||
        transaction.recipient_account?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }
    
    // Type filter
    if (filterType !== "all") {
      const lowerType = transaction.type.toLowerCase();
      if (filterType === "credit" && !isCredit(transaction.type)) return false;
      if (filterType === "debit" && isCredit(transaction.type)) return false;
      if (filterType === "transfer" && !lowerType.includes("transfer")) return false;
    }
    
    // Status filter
    if (filterStatus !== "all") {
      if (transaction.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    }
    
    // Date range filter
    if (filterDateRange !== "all" && transaction.created_at) {
      const dateRange = getDateRange(filterDateRange);
      if (dateRange) {
        const transactionDate = new Date(transaction.created_at);
        if (transactionDate < dateRange.start || transactionDate > dateRange.end) return false;
      }
    }
    
    // Amount range filter
    const minAmount = filterMinAmount ? parseFloat(filterMinAmount) : null;
    const maxAmount = filterMaxAmount ? parseFloat(filterMaxAmount) : null;
    
    if (minAmount !== null && transaction.amount < minAmount) return false;
    if (maxAmount !== null && transaction.amount > maxAmount) return false;
    
    return true;
  });

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    if (!transaction.created_at) return groups;
    
    const date = new Date(transaction.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const formatDateHeading = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header user={userData} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-card p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
              <p className="text-gray-600 mt-1">{filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                className="border-gray-300 text-white bg-primary hover:bg-primary/90 hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-primary h-10"
              />
            </div>
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`border-gray-300 h-10 text-white bg-primary hover:bg-primary/90 hover:text-white ${hasActiveFilters() ? 'border-primary bg-primary/5' : ''}`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {hasActiveFilters() && (
                    <span className="ml-2 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {[filterType !== 'all', filterStatus !== 'all', filterDateRange !== 'all', filterMinAmount || filterMaxAmount].filter(Boolean).length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-white border-gray-200 shadow-lg" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">Filters</h4>
                    {hasActiveFilters() && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearFilters}
                        className="text-primary hover:text-primary/80 h-auto p-0 font-medium"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>

                  {/* Transaction Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Transaction Type</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="bg-white border-gray-300">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="credit">Credits (Deposits)</SelectItem>
                        <SelectItem value="debit">Debits (Withdrawals)</SelectItem>
                        <SelectItem value="transfer">Transfers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="bg-white border-gray-300">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Date Range</Label>
                    <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                      <SelectTrigger className="bg-white border-gray-300">
                        <SelectValue placeholder="All time" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 days</SelectItem>
                        <SelectItem value="month">Last 30 days</SelectItem>
                        <SelectItem value="3months">Last 3 months</SelectItem>
                        <SelectItem value="year">Last year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Amount Range</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={filterMinAmount}
                          onChange={(e) => setFilterMinAmount(e.target.value)}
                          className="bg-white border-gray-300 h-9"
                        />
                      </div>
                      <span className="flex items-center text-gray-500">-</span>
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Max"
                          value={filterMaxAmount}
                          onChange={(e) => setFilterMaxAmount(e.target.value)}
                          className="bg-white border-gray-300 h-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters() && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm("")} className="hover:bg-primary/20 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filterType !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Type: {filterType}
                  <button onClick={() => setFilterType("all")} className="hover:bg-blue-200 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filterStatus !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Status: {filterStatus}
                  <button onClick={() => setFilterStatus("all")} className="hover:bg-green-200 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filterDateRange !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  <Calendar className="h-3 w-3" />
                  {filterDateRange === 'today' ? 'Today' : filterDateRange === 'week' ? 'Last 7 days' : filterDateRange === 'month' ? 'Last 30 days' : filterDateRange === '3months' ? 'Last 3 months' : 'Last year'}
                  <button onClick={() => setFilterDateRange("all")} className="hover:bg-purple-200 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(filterMinAmount || filterMaxAmount) && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  Amount: {filterMinAmount || '0'} - {filterMaxAmount || '∞'}
                  <button onClick={() => { setFilterMinAmount(""); setFilterMaxAmount(""); }} className="hover:bg-orange-200 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Spending Trends Chart */}
        {transactions.length > 0 && (
          <SpendingTrendsChart data={processSpendingTrends(transactions as any)} />
        )}

        {/* Grouped Transactions */}
        {sortedDates.length > 0 ? (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date} className="space-y-3">
                {/* Date Heading */}
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {formatDateHeading(date)}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                  
                {/* Transactions for this date */}
                <Card className="overflow-hidden bg-white border-gray-200 shadow-card">
                  <div className="divide-y divide-gray-100">
                    {groupedTransactions[date].map((transaction) => {
                      const IconComponent = getTransactionIcon(transaction.type);
                      const isCreditTransaction = isCredit(transaction.type);
                      
                      return (
                        <div 
                          key={transaction.id} 
                          className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowTransactionModal(true);
                          }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                                isCreditTransaction ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
                              }`}>
                                <IconComponent className={`h-6 w-6 ${
                                  isCreditTransaction ? 'text-green-600' : 'text-red-600'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <h3 className="text-base font-semibold text-gray-900 truncate">
                                    {transaction.description || 'No description'}
                                  </h3>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap text-sm text-gray-600">
                                  <span className="capitalize">{transaction.type.replace(/_/g, ' ')}</span>
                                  {transaction.category && (
                                    <>
                                      <span className="text-gray-400">•</span>
                                      <span>{transaction.category}</span>
                                    </>
                                  )}
                                  {transaction.created_at && (
                                    <>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-gray-500">
                                        {new Date(transaction.created_at).toLocaleTimeString('en-US', { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {transaction.recipient_account && (
                                  <p className="text-xs text-gray-500 truncate mt-1">To: {transaction.recipient_account}</p>
                                )}
                                {transaction.reference_number && (
                                  <p className="text-xs text-gray-400 font-mono mt-1">Ref: {transaction.reference_number}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-lg font-bold tabular-nums ${
                                isCreditTransaction ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {isCreditTransaction ? '+' : '-'}{formatCurrency(transaction.amount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center bg-white border-gray-200 shadow-card">
            <div className="h-16 w-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No transactions found' : 'No transactions yet'}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Your transactions will appear here once you make some.'}
            </p>
          </Card>
        )}
      </div>

      {/* Transaction Details Modal */}
      <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
        <DialogContent className="sm:max-w-[500px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Transaction Details</DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete information about this transaction
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6 mt-4">
              {/* Amount Section */}
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Amount</p>
                <p className={`text-4xl font-bold ${
                  isCredit(selectedTransaction.type) ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isCredit(selectedTransaction.type) ? '+' : '-'}{formatCurrency(selectedTransaction.amount)}
                </p>
              </div>

              {/* Transaction Details Grid */}
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Status</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                  </span>
                </div>

                {/* Type */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Type</span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const IconComponent = getTransactionIcon(selectedTransaction.type);
                      return <IconComponent className={`h-5 w-5 ${
                        isCredit(selectedTransaction.type) ? 'text-green-600' : 'text-red-600'
                      }`} />;
                    })()}
                    <span className="text-sm font-semibold text-gray-900 capitalize">
                      {selectedTransaction.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {selectedTransaction.description && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Description</span>
                    <span className="text-sm font-semibold text-gray-900 text-right">
                      {selectedTransaction.description}
                    </span>
                  </div>
                )}

                {/* Category */}
                {selectedTransaction.category && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Category</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedTransaction.category}
                    </span>
                  </div>
                )}

                {/* Recipient Account */}
                {selectedTransaction.recipient_account && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Recipient</span>
                    <span className="text-sm font-mono text-gray-900">
                      {selectedTransaction.recipient_account}
                    </span>
                  </div>
                )}

                {/* Reference Number */}
                {selectedTransaction.reference_number && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Reference Number</span>
                    <span className="text-sm font-mono text-gray-900">
                      {selectedTransaction.reference_number}
                    </span>
                  </div>
                )}

                {/* Date */}
                {selectedTransaction.created_at && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-600">Date & Time</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(selectedTransaction.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(selectedTransaction.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Transaction ID */}
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-gray-600">Transaction ID</span>
                  <span className="text-sm font-mono text-gray-900 truncate max-w-[200px]">
                    {selectedTransaction.id}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-gray-200 mt-6">
                {/* Regular buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-300 hover:bg-gray-50"
                    onClick={() => setShowTransactionModal(false)}
                    disabled={isProcessingAction}
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-1 bg-primary text-white hover:bg-primary/90"
                    disabled={isProcessingAction}
                    onClick={() => {
                      if (selectedTransaction && user) {
                        try {
                          generateTransactionReceipt({
                            transactionId: selectedTransaction.id,
                            date: new Date(selectedTransaction.created_at).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            }),
                            type: selectedTransaction.type,
                            amount: selectedTransaction.amount,
                            description: selectedTransaction.description || undefined,
                            category: selectedTransaction.category || undefined,
                            status: selectedTransaction.status,
                            accountNumber: userData?.accountNumber,
                            userName: `${user.first_name} ${user.last_name}`,
                            userEmail: user.email,
                          });
                          toast.success('Receipt downloaded successfully');
                        } catch (error) {
                          toast.error('Failed to generate receipt');
                        }
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
};

export default Transactions;
