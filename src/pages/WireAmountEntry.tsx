import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  accountNumber: string;
  account_type?: string;
  checking_balance?: number;
  savings_balance?: number;
}

const WireAmountEntry: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isWireTransfersBlocked, setIsWireTransfersBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    // Get selected account from localStorage
    const accountData = localStorage.getItem('wireTransferAccount');
    if (accountData) {
      const parsedAccount = JSON.parse(accountData);
      console.log('WireAmountEntry - Retrieved account from localStorage:', parsedAccount);
      setSelectedAccount(parsedAccount);
    } else {
      // If no account selected, redirect to wire account selection
      navigate('/wire-account-selection');
    }
  }, []); // Remove navigate from dependency array to prevent infinite loop

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

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
        
        // Check if wire transfers are blocked for this user
        if (profile.wire_transfers_blocked === true) {
          setIsWireTransfersBlocked(true);
          toast({
            title: 'Wire Transfers Blocked',
            description: 'Your account has been restricted from making wire transfers. Please contact support for assistance.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumberClick = (num: string) => {
    if (num === '.' && amount.includes('.')) return;
    if (amount.includes('.') && amount.split('.')[1].length >= 2) return;
    
    setAmount(prev => prev + num);
  };

  const handleBackspace = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setAmount('');
  };

  const handleNext = async () => {
    const enteredAmount = parseFloat(amount);
    const accountBalance = selectedAccount?.balance || 0;
    
    if (!amount || enteredAmount <= 0) {
      return;
    }
    
    // Check if user has sufficient balance (including the $5 fee)
    const wireTransferFee = 5.00;
    const totalRequired = enteredAmount + wireTransferFee;
    
    if (totalRequired > accountBalance) {
      // Show error message
      return; // Button will be disabled anyway
    }
    
    // Check if wire transfers are enabled for this user
    // This check is moved to a later step to speed up the initial navigation
    // The profile check will be done on the next page instead
    
    // Store amount for next screens
    localStorage.setItem('wireTransferAmount', amount);
    navigate('/wire-recipient-form');
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const isValidAmount = () => {
    const enteredAmount = parseFloat(amount);
    const accountBalance = selectedAccount?.balance || 0;
    const wireTransferFee = 5.00;
    const totalRequired = enteredAmount + wireTransferFee;
    
    return amount && 
           enteredAmount > 0 && 
           totalRequired <= accountBalance;
  };

  // Show loading state while checking wire transfer block status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show blocked message if wire transfers are blocked
  if (isWireTransfersBlocked) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          user={userData}
          showBackButton={true} 
          title="Send Money"
          onBackClick={() => navigate('/dashboard')}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-md mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-red-600 text-xl font-bold">!</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900">Wire Transfers Blocked</h3>
                  <p className="text-red-700 mt-1">
                    {userData?.profile?.wire_transfer_block_reason || 'Your account has been restricted from making wire transfers. Please contact customer support for assistance.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
              >
                BACK
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 font-semibold bg-gray-800 hover:bg-gray-900 text-white"
              >
                RETURN TO DASHBOARD
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      <Header 
        user={userData}
        showBackButton={true} 
        title="Send Money"
        onBackClick={() => navigate('/dashboard')}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-md mx-auto">
          {/* Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter amount</h2>
            {selectedAccount && (
              <p className="text-sm text-gray-600">
                From {selectedAccount.name} • Available {formatBalance(selectedAccount.balance || 0)}
              </p>
            )}
          </div>

          {/* Amount Display */}
          <div className="mb-8">
            <Card className="p-6 bg-white border-gray-200">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="h-8 w-8 text-gray-600 mr-1" />
                  <span className="text-4xl font-bold text-gray-900">
                    {amount || '0.00'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Wire transfer amount</p>
              </div>
            </Card>
          </div>

          {/* Numeric Keypad */}
          <div className="mb-8">
            <div className="grid grid-cols-3 gap-4">
              {/* Numbers 1-9 */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num.toString())}
                  className="h-16 bg-white border border-gray-200 rounded-lg text-xl font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  {num}
                </button>
              ))}
              
              {/* Bottom row: decimal, 0, backspace */}
              <button
                onClick={() => handleNumberClick('.')}
                className="h-16 bg-white border border-gray-200 rounded-lg text-xl font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
              >
                .
              </button>
              <button
                onClick={() => handleNumberClick('0')}
                className="h-16 bg-white border border-gray-200 rounded-lg text-xl font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="h-16 bg-white border border-gray-200 rounded-lg text-xl font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
              >
                ⌫
              </button>
            </div>
            
            {/* Clear button */}
            <button
              onClick={handleClear}
              className="w-full mt-4 h-12 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Validation Message */}
        {amount && parseFloat(amount) > 0 && !isValidAmount() && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium mb-1">
              Insufficient funds
            </p>
            <p className="text-xs text-red-600">
              Amount + $5 fee = ${(parseFloat(amount) + 5).toFixed(2)}<br />
              Available balance: {selectedAccount ? formatBalance(selectedAccount.balance || 0) : '$0.00'}
            </p>
          </div>
        )}

          {/* Info Message */}
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Wire transfer fees</p>
                <p>Domestic wire transfers: $5.00 • International wire transfers: $15.00</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
            >
              BACK
            </Button>
            <Button
              onClick={handleNext}
              disabled={!isValidAmount()}
              className={`flex-1 py-3 font-semibold ${
                isValidAmount()
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

export default WireAmountEntry;