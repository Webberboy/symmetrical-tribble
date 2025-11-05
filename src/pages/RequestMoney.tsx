import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownTrayIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PaymentRequest {
  id: string;
  payer_email: string;
  payer_name: string | null;
  amount: number;
  note: string | null;
  status: 'pending' | 'completed' | 'declined' | 'cancelled';
  created_at: string;
}

const RequestMoney = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadAccounts(), loadRequests()]);
  };

  const loadAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      setCurrentUser(user);
      
      const { data, error } = await supabase
        .from('accounts')
        .select('id, account_name, account_number')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setAccounts(data || []);
    } catch (error: any) {
      toast.error('Failed to load accounts');
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }
      
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('requester_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      setRequests(data || []);
    } catch (error: any) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!email || !amount || !selectedAccount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Generate secure token
      const token = crypto.randomUUID();

      const { error } = await supabase
        .from('payment_requests')
        .insert({
          requester_user_id: user.id,
          requester_account_id: selectedAccount,
          payer_email: email,
          payer_name: email.split('@')[0],
          amount: parseFloat(amount),
          note: note || null,
          status: 'pending',
          request_token: token,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });

      if (error) throw error;

      toast.success('Payment request sent successfully');
      setEmail('');
      setAmount('');
      setNote('');
      setSelectedAccount('');
      await loadRequests();
    } catch (error: any) {
      toast.error('Failed to send payment request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('payment_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (error) throw error;

      toast.info('Payment request cancelled');
      await loadRequests();
    } catch (error: any) {
      toast.error('Failed to cancel request');
    }
  };

  const getStatusBadge = (status: PaymentRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            <ClockIcon className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Declined
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-20">
      <Header 
        user={{ 
          firstName: currentUser?.user_metadata?.first_name || 'User', 
          lastName: currentUser?.user_metadata?.last_name || '', 
          email: currentUser?.email || '' 
        }}
        showBackButton={true}
        title="Request Money"
        onBackClick={() => navigate('/dashboard')}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Form */}
          <Card className="bg-white border-gray-200 shadow-card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">New Payment Request</h2>
            
            <div className="space-y-5">
              {/* Email Input */}
              <div>
                <Label htmlFor="email" className="text-gray-900 font-semibold">Recipient Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="recipient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2"
                />
              </div>

              {/* Amount Input */}
              <div>
                <Label htmlFor="amount" className="text-gray-900 font-semibold">Amount *</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Account Selection */}
              <div>
                <Label htmlFor="account" className="text-gray-900 font-semibold">Deposit To *</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger id="account" className="mt-2">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} {account.account_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Note Input */}
              <div>
                <Label htmlFor="note" className="text-gray-900 font-semibold">Note (Optional)</Label>
                <Textarea
                  id="note"
                  placeholder="What is this request for?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>

              <Button onClick={handleSendRequest} className="w-full" size="lg" disabled={submitting}>
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                {submitting ? 'Sending...' : 'Send Payment Request'}
              </Button>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>How it works:</strong> Your recipient will receive an email with a secure link to complete the payment. Once paid, funds will be deposited into your selected account.
              </p>
            </div>
          </Card>

          {/* Request History */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Requests</h2>
            
            {requests.length === 0 ? (
              <Card className="bg-white border-gray-200 p-8 text-center">
                <p className="text-gray-500">No payment requests yet</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <Card key={request.id} className="bg-white border-gray-200 shadow-card p-5 hover:shadow-card-hover transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.payer_name || 'Unknown'}</h3>
                        <p className="text-sm text-gray-600">{request.payer_email}</p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Amount:</span>
                        <span className="text-lg font-bold text-gray-900">
                          ${request.amount.toFixed(2)}
                        </span>
                      </div>

                      {request.note && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{request.note}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          {new Date(request.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {request.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelRequest(request.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default RequestMoney;
