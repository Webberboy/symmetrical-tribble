import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';

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
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
    // Get selected account from localStorage
    const accountData = localStorage.getItem('wireTransferAccount');
    if (accountData) {
      setSelectedAccount(JSON.parse(accountData));
    } else {
      // If no account selected, redirect back to account selection
      navigate('/transfer');
    }
  }, [navigate]);

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
        onBackClick={() => navigate('/transfer')}
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
              onClick={() => navigate('/transfer')}
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