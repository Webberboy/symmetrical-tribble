import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Filter,
  Search,
  Lightbulb,
  Car,
  Smartphone,
  Home,
  Building,
  Loader2
} from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';
import { getBillPaymentHistory } from '@/lib/billsUtils';
import { toast } from 'sonner';

const BillHistory = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
    fetchPaymentHistory();
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

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Please sign in to view payment history');
        navigate('/signin');
        return;
      }

      const payments = await getBillPaymentHistory(userData.user.id);
      setPaymentHistory(payments);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const getBillIcon = (category: string) => {
    switch (category) {
      case 'utilities':
        return <Lightbulb className="w-5 h-5 text-gray-600" />;
      case 'insurance':
        return <Car className="w-5 h-5 text-gray-600" />;
      case 'subscription':
        return <Smartphone className="w-5 h-5 text-gray-600" />;
      case 'mortgage':
        return <Home className="w-5 h-5 text-gray-600" />;
      default:
        return <Building className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getFilteredHistory = () => {
    let filtered = paymentHistory;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.bill_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.provider.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by month
    if (selectedMonth) {
      filtered = filtered.filter(payment => {
        const paymentMonth = new Date(payment.paid_date).toISOString().slice(0, 7);
        return paymentMonth === selectedMonth;
      });
    }

    // Filter by tab
    switch (activeTab) {
      case 'thisMonth':
        const currentMonth = new Date().toISOString().slice(0, 7);
        return filtered.filter(payment => {
          const paymentMonth = new Date(payment.paid_date).toISOString().slice(0, 7);
          return paymentMonth === currentMonth;
        });
      case 'lastMonth':
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthStr = lastMonth.toISOString().slice(0, 7);
        return filtered.filter(payment => {
          const paymentMonth = new Date(payment.paid_date).toISOString().slice(0, 7);
          return paymentMonth === lastMonthStr;
        });
      case 'all':
      default:
        return filtered;
    }
  };

  const totalPaid = getFilteredHistory().reduce((sum, payment) => sum + payment.amount, 0);
  const totalTransactions = getFilteredHistory().length;

  const months = [
    { value: '2024-01', label: 'January 2024' },
    { value: '2023-12', label: 'December 2023' },
    { value: '2023-11', label: 'November 2023' },
    { value: '2023-10', label: 'October 2023' }
  ];

  // Show loader until both data and user profile are loaded
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
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={userData}
        showBackButton={true} 
        title="Bill History" 
        onBackClick={() => navigate('/bills')}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment History</h2>
          <p className="text-gray-600">View your past bill payments and transactions</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-4 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-full">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-lg font-semibold text-gray-900">{totalTransactions}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-full">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6 bg-white border border-gray-200">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search bills or providers..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Month Filter */}
            <div className="flex-1">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Months</option>
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Export Button */}
            <Button variant="outline" className="text-gray-600 hover:text-gray-800">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </Card>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'all', label: 'All Payments' },
                { id: 'thisMonth', label: 'This Month' },
                { id: 'lastMonth', label: 'Last Month' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Payment History List */}
        <div className="space-y-3">
          {getFilteredHistory().map((payment) => (
            <Card key={payment.id} className="p-4 bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-full">
                    {getBillIcon(payment.category)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{payment.bill_name}</h4>
                    <p className="text-sm text-gray-600">{payment.provider}</p>
                    <p className="text-sm text-gray-500">Paid on {formatDate(payment.paid_date)}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                  <p className="text-sm text-gray-500">Due: {formatDate(payment.due_date)}</p>
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 text-green-600 bg-green-50">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Paid
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">Method: {payment.payment_account}</span>
                  <span className="text-sm text-gray-500">Ref: {payment.confirmation_number}</span>
                </div>
                <Button variant="outline" size="sm" className="text-gray-600 hover:text-gray-800">
                  <Download className="w-3 h-3 mr-1" />
                  Receipt
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {getFilteredHistory().length === 0 && (
          <Card className="p-8 text-center bg-white border border-gray-200">
            <div className="text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">No payment history found</p>
              <p className="text-sm text-gray-600">
                {searchTerm || selectedMonth 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Your payment history will appear here once you start making bill payments.'
                }
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BillHistory;