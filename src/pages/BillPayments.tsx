import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Receipt, CreditCard, Calendar, Loader2, DollarSign, Building } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getUserBills, getBillPaymentHistory, createBillPayment } from "@/lib/billsUtils";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";
import Header from '../components/Header';

const BillPayments = () => {
  const { websiteName } = useSettings();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'pay' | 'history'>('pay');
  
  // Form state
  const [userBills, setUserBills] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [paymentAccount, setPaymentAccount] = useState<string>("Checking Account");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
    fetchData();
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

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const [billsData, paymentsData] = await Promise.all([
        getUserBills(user.id),
        getBillPaymentHistory(user.id)
      ]);
      
      setUserBills(billsData || []);
      setPayments(paymentsData || []);
    } catch (error) {
      toast.error('Failed to load bills data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayBill = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBillId) {
      toast.error('Please select a bill to pay');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      
      const selectedBill = userBills.find(b => b.id === selectedBillId);
      if (!selectedBill) {
        throw new Error('Bill not found');
      }

      const paymentAmount = parseFloat(amount);
      const isPaid = new Date(paymentDate) <= new Date();

      const paymentData = {
        bill_id: selectedBillId,
        bill_name: selectedBill.bill_name,
        provider: selectedBill.provider,
        amount: paymentAmount,
        due_date: selectedBill.next_due_date,
        scheduled_date: paymentDate,
        paid_date: isPaid ? paymentDate : null,
        payment_method: selectedBill.payment_method || 'Bank Account',
        payment_account: paymentAccount,
        category: selectedBill.category,
        status: isPaid ? 'completed' as const : 'scheduled' as const
      };

      await createBillPayment(paymentData);

      toast.success(isPaid ? "Bill payment processed successfully!" : "Bill payment scheduled successfully!");
      
      await fetchData();
      
      setAmount("");
      setSelectedBillId("");
      setPaymentDate(new Date().toISOString().split('T')[0]);
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule payment');
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    if (status === 'completed' || status === 'paid') return 'bg-green-100 text-green-800';
    if (status === 'scheduled') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        title="Bill Payments"
        onBackClick={() => navigate('/dashboard')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bill Payments</h2>
            <p className="text-gray-600">Pay your bills and view payment history</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg max-w-md">
              <button
                onClick={() => setActiveTab('pay')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'pay'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pay Bill
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Payment History
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Pay Bill Tab */}
              {activeTab === 'pay' && (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-6 bg-white border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total Bills</p>
                          <p className="text-2xl font-bold text-gray-900">{userBills.length}</p>
                          <p className="text-xs text-gray-500 mt-1">Active bills</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                          <Receipt className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-white border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">This Month</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(userBills.reduce((sum, bill) => sum + (bill.typical_amount || 0), 0))}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Estimated total</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-white border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Payments Made</p>
                          <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
                          <p className="text-xs text-gray-500 mt-1">Total payments</p>
                        </div>
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Add Bill Button */}
                  <div className="flex justify-end">
                    <Link to="/add-bill">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Receipt className="w-4 h-4 mr-2" />
                        Add New Bill
                      </Button>
                    </Link>
                  </div>

                  {/* Payment Form */}
                  <Card className="p-6 bg-white border-gray-200">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Pay a Bill</h3>
                      <p className="text-sm text-gray-600">Select a bill and enter payment details</p>
                    </div>

                    <form onSubmit={handlePayBill} className="space-y-6">
                      {/* Select Bill */}
                      <div>
                        <Label htmlFor="billSelect" className="text-sm font-medium text-gray-700 mb-2">
                          Select Bill *
                        </Label>
                        <Select value={selectedBillId} onValueChange={setSelectedBillId}>
                          <SelectTrigger className="border-gray-300 focus:border-gray-500 focus:ring-gray-500">
                            <SelectValue placeholder="Choose a bill to pay" />
                          </SelectTrigger>
                          <SelectContent>
                            {userBills.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No bills found - Add a bill first
                              </SelectItem>
                            ) : (
                              userBills.map((bill) => (
                                <SelectItem key={bill.id} value={bill.id}>
                                  {bill.bill_name} - {bill.provider} ({formatCurrency(bill.typical_amount || 0)})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {selectedBillId && userBills.find(b => b.id === selectedBillId) && (
                          <p className="text-xs text-gray-500 mt-1">
                            Due: {formatDate(userBills.find(b => b.id === selectedBillId)?.next_due_date)}
                          </p>
                        )}
                      </div>

                      {/* Payment Account */}
                      <div>
                        <Label htmlFor="paymentAccount" className="text-sm font-medium text-gray-700 mb-2">
                          Payment Account *
                        </Label>
                        <Select value={paymentAccount} onValueChange={setPaymentAccount}>
                          <SelectTrigger className="border-gray-300 focus:border-gray-500 focus:ring-gray-500">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Checking Account">Checking Account</SelectItem>
                            <SelectItem value="Savings Account">Savings Account</SelectItem>
                            <SelectItem value="Credit Card">Credit Card</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Amount */}
                      <div>
                        <Label htmlFor="amount" className="text-sm font-medium text-gray-700 mb-2">
                          Amount *
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                          />
                        </div>
                        {selectedBillId && userBills.find(b => b.id === selectedBillId) && (
                          <p className="text-xs text-gray-500 mt-1">
                            Typical amount: {formatCurrency(userBills.find(b => b.id === selectedBillId)?.typical_amount || 0)}
                          </p>
                        )}
                      </div>

                      {/* Payment Date */}
                      <div>
                        <Label htmlFor="paymentDate" className="text-sm font-medium text-gray-700 mb-2">
                          Payment Date *
                        </Label>
                        <Input 
                          id="paymentDate" 
                          type="date" 
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          required 
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                        />
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex space-x-4 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate('/dashboard')}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          disabled={submitting || !selectedBillId || !amount}
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Receipt className="w-4 h-4 mr-2" />
                              {new Date(paymentDate) <= new Date() ? 'Pay Now' : 'Schedule Payment'}
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Card>
                </div>
              )}

              {/* Payment History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <Card className="p-6 bg-white border-gray-200">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment History</h3>
                      <p className="text-sm text-gray-600">View all your past and scheduled bill payments</p>
                    </div>

                    {payments.length === 0 ? (
                      <div className="text-center py-12">
                        <Receipt className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-900 font-medium mb-2">No payment history yet</p>
                        <p className="text-sm text-gray-600">Your bill payments will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                payment.status === "paid" || payment.status === "completed"
                                  ? "bg-green-100" 
                                  : payment.status === "scheduled" 
                                  ? "bg-blue-100" 
                                  : "bg-gray-100"
                              }`}>
                                {payment.status === "scheduled" ? (
                                  <Calendar className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Receipt className="w-5 h-5 text-green-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900">{payment.bill_name}</p>
                                <p className="text-sm text-gray-600">{payment.provider}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {payment.paid_date 
                                    ? `Paid: ${formatDate(payment.paid_date)}`
                                    : `Scheduled: ${formatDate(payment.scheduled_date)}`
                                  }
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                              <span className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getPaymentStatusColor(payment.status)}`}>
                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                              </span>
                              {payment.confirmation_number && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {payment.confirmation_number}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillPayments;
