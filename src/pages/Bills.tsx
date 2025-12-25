import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Plus, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Home,
  Car,
  Smartphone,
  Wifi,
  Droplets,
  Lightbulb,
  Loader2
} from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';
import { getUserBills, getBillPaymentHistory, getBillStatistics } from '@/lib/billsUtils';
import { toast } from 'sonner';
import { handleSmartError } from '@/lib/errorHandler';

interface BillWithStatus {
  id: string;
  bill_name: string;
  provider: string;
  typical_amount: number;
  next_due_date: string;
  category: string;
  status: 'upcoming' | 'paid' | 'overdue';
  is_recurring: boolean;
  account_number?: string;
  paidDate?: string;
}

const Bills = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bills, setBills] = useState<BillWithStatus[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalMonthly: 0,
    upcomingCount: 0,
    overdueCount: 0
  });
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
    fetchBillsData();
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

  const fetchBillsData = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Please sign in to view bills');
        navigate('/signin');
        return;
      }

      // Fetch all bills
      const allBills = await getUserBills(userData.user.id);
      
      // Fetch payment history
      const payments = await getBillPaymentHistory(userData.user.id, {
        status: 'completed'
      });

      // Get statistics
      const stats = await getBillStatistics(userData.user.id);

      // Transform bills with status
      const today = new Date().toISOString().split('T')[0];
      const billsWithStatus: BillWithStatus[] = allBills.map(bill => {
        // Check if bill was recently paid
        const recentPayment = payments.find(
          p => p.bill_id === bill.id && p.paid_date && p.paid_date >= today
        );

        let status: 'upcoming' | 'paid' | 'overdue' = 'upcoming';
        if (recentPayment) {
          status = 'paid';
        } else if (bill.next_due_date && bill.next_due_date < today) {
          status = 'overdue';
        }

        return {
          id: bill.id,
          bill_name: bill.bill_name,
          provider: bill.provider,
          typical_amount: bill.typical_amount || 0,
          next_due_date: bill.next_due_date || '',
          category: bill.category,
          status,
          is_recurring: true,
          account_number: bill.account_number
        };
      });

      setBills(billsWithStatus);
      setRecentPayments(payments.slice(0, 10));
      setStatistics({
        totalMonthly: stats.totalMonthly,
        upcomingCount: stats.upcomingCount,
        overdueCount: stats.overdueCount
      });
    } catch (error: any) {
      handleSmartError(error, 'Bills.fetchBillsData', 'Failed to load bills');
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
        return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'overdue':
        return 'text-red-600 bg-red-50';
      case 'upcoming':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
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

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getFilteredBills = () => {
    switch (activeTab) {
      case 'upcoming':
        return bills.filter(bill => bill.status === 'upcoming');
      case 'recent':
        return recentPayments.map(p => ({
          id: p.id,
          bill_name: p.bill_name,
          provider: p.provider,
          typical_amount: p.amount,
          next_due_date: p.paid_date,
          category: p.category,
          status: 'paid' as const,
          is_recurring: p.is_recurring,
          paidDate: p.paid_date
        }));
      case 'all':
        return bills;
      default:
        return bills;
    }
  };

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
        title="Bills" 
        onBackClick={() => navigate('/dashboard')}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bill Management</h2>
          <p className="text-gray-600">Manage your bills and payments</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4 bg-white border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Monthly</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(statistics.totalMonthly)}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-full">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-white border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Upcoming</p>
                    <p className="text-lg font-semibold text-gray-900">{statistics.upcomingCount}</p>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded-full">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-white border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overdue</p>
                    <p className="text-lg font-semibold text-red-600">{statistics.overdueCount}</p>
                  </div>
                  <div className="p-2 bg-red-50 rounded-full">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-4 mb-6 bg-white border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => navigate('/bill-payments')}
                  className="flex items-center justify-center p-3 bg-gray-800 hover:bg-gray-900 text-white"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Pay Bill</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/auto-pay')}
                  className="flex items-center justify-center p-3 bg-gray-800 hover:bg-gray-900 text-white"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Auto Pay</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/add-bill')}
                  className="flex items-center justify-center p-3 bg-gray-800 hover:bg-gray-900 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Add Bill</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/bill-history')}
                  className="flex items-center justify-center p-3 bg-gray-800 hover:bg-gray-900 text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">History</span>
                </Button>
              </div>
            </Card>

            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'upcoming', label: 'Upcoming' },
                    { id: 'recent', label: 'Recent' },
                    { id: 'all', label: 'All Bills' }
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

            {/* Bills List */}
            <div className="space-y-3">
              {getFilteredBills().map((bill) => (
                <Card key={bill.id} className="p-4 bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-full">
                        {getBillIcon(bill.category)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{bill.bill_name}</h4>
                        <p className="text-sm text-gray-600">{bill.provider}</p>
                        <p className="text-sm text-gray-500">
                          {activeTab === 'recent' ? `Paid ${formatDate(bill.paidDate || bill.next_due_date)}` : `Due ${formatDate(bill.next_due_date)}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(bill.typical_amount)}</p>
                      {activeTab === 'upcoming' && bill.next_due_date && (
                        <p className="text-sm text-gray-500">
                          {getDaysUntilDue(bill.next_due_date)} days left
                        </p>
                      )}
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getBillStatusColor(bill.status)}`}>
                        {bill.status === 'paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {bill.status === 'overdue' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {bill.status === 'upcoming' && <Clock className="w-3 h-3 mr-1" />}
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {getFilteredBills().length === 0 && (
              <Card className="p-8 text-center bg-white border border-gray-200">
                <div className="text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-900 mb-2">No bills found</p>
                  <p className="text-sm text-gray-600">
                    {bills.length === 0 
                      ? 'Click "Add Bill" to start tracking your bills.'
                      : 'There are no bills in this category.'}
                  </p>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Bills;
