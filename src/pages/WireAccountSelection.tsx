import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  accountNumber: string;
}

const WireAccountSelection = () => {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchUserData();
    fetchUserAccounts();
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

  const fetchUserAccounts = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('User not authenticated');
        navigate('/signin');
        return;
      }

      // Fetch accounts from accounts table
      const { data: accountsData, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .in('account_type', ['checking', 'savings'])
        .order('account_type', { ascending: true });

      if (error) {
        toast.error('Failed to load account information');
        setIsLoading(false);
        return;
      }

      if (!accountsData || accountsData.length === 0) {
        toast.error('No accounts found. Please contact support.');
        setIsLoading(false);
        return;
      }


      // Create account objects with real data from accounts table
      const userAccounts: Account[] = accountsData.map(account => ({
        id: account.account_type, // 'checking' or 'savings'
        name: account.account_type === 'checking' ? 'My Checking' : 'My Savings',
        type: account.account_type === 'checking' ? 'Checking Account' : 'Savings Account',
        balance: account.balance || 0.00,
        accountNumber: account.account_number // Each has unique account number
      }));

      setAccounts(userAccounts);
    } catch (error) {
      toast.error('Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccount(accountId);
  };

  const handleNext = () => {
    if (selectedAccount) {
      // Store selected account in localStorage for next screens
      const account = accounts.find(acc => acc.id === selectedAccount);
      localStorage.setItem('wireTransferAccount', JSON.stringify(account));
      navigate('/wire-amount-entry');
    }
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          showBackButton={true} 
          title="Send Money"
          onBackClick={() => navigate('/dashboard')}
        />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your accounts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          showBackButton={true} 
          title="Send Money"
          onBackClick={() => navigate('/dashboard')}
        />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-600 mb-4">No accounts found</p>
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loader until both data and user profile are loaded
  if (isLoading || !userData) {
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
        title="Send Money"
        onBackClick={() => navigate('/dashboard')}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Account</h2>
            <p className="text-gray-600">Choose the account you'd like to send money from</p>
          </div>

          <div className="space-y-4 mb-8">
            {accounts.map((account) => (
              <Card 
                key={account.id}
                className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedAccount === account.id 
                    ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleAccountSelect(account.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedAccount === account.id 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedAccount === account.id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${
                        selectedAccount === account.id 
                          ? 'text-gray-900' 
                          : 'text-white'
                      }`}>{account.name}</h3>
                      <p className={`text-sm ${
                        selectedAccount === account.id 
                          ? 'text-gray-600' 
                          : 'text-gray-300'
                      }`}>{account.type}</p>
                      <p className={`text-sm ${
                        selectedAccount === account.id 
                          ? 'text-gray-500' 
                          : 'text-gray-400'
                      }`}>{account.accountNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      selectedAccount === account.id 
                        ? 'text-gray-900' 
                        : 'text-white'
                    }`}>
                      {formatBalance(account.balance)}
                    </p>
                    <p className={`text-sm ${
                      selectedAccount === account.id 
                        ? 'text-gray-500' 
                        : 'text-gray-400'
                    }`}>Available Balance</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Card>
            ))}
          </div>

          {/* Insufficient Funds Warning */}
          {selectedAccount && accounts.find(acc => acc.id === selectedAccount)?.balance === 0 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Your account balance is $0.00. You'll need to add funds before you can send a wire transfer (minimum $5 for the transfer fee).
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
            >
              CANCEL
            </Button>
            <Button
              onClick={handleNext}
              disabled={!selectedAccount}
              className={`flex-1 py-3 font-semibold ${
                selectedAccount
                  ? 'bg-gray-800 hover:bg-gray-900 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              NEXT
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WireAccountSelection;
