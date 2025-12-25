import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, User, Building, MapPin, Phone, Mail } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  accountNumber: string;
}

interface RecipientData {
  recipientName: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  bankAddress: string;
}

const WireRecipientForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState('');
  const [recipientData, setRecipientData] = useState<RecipientData>({
    recipientName: '',
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    bankAddress: ''
  });
  const [userData, setUserData] = useState<any>(null);
  const [isWireTransfersBlocked, setIsWireTransfersBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get selected account and amount from localStorage
    const accountData = localStorage.getItem('wireTransferAccount');
    const amountData = localStorage.getItem('wireTransferAmount');
    
    if (accountData) {
      setSelectedAccount(JSON.parse(accountData));
    } else {
      navigate('/transfer');
      return;
    }

    if (amountData) {
      setAmount(amountData);
    } else {
      navigate('/wire-amount-entry');
      return;
    }
    
    // Fetch user data and check wire transfer block status
    fetchUserData();
  }, [navigate]);

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

  const handleInputChange = (field: keyof RecipientData, value: string) => {
    setRecipientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    // Validate required fields
    const requiredFields = ['recipientName', 'bankName', 'routingNumber', 'accountNumber', 'bankAddress'];
    const isValid = requiredFields.every(field => recipientData[field as keyof RecipientData].trim() !== '');

    if (isValid) {
      // Store recipient data for next screens
      localStorage.setItem('wireRecipientData', JSON.stringify(recipientData));
      navigate('/wire-account-info');
    }
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(parseFloat(amount));
  };

  const isFormValid = () => {
    return recipientData.recipientName.trim() !== '' &&
           recipientData.bankName.trim() !== '' &&
           recipientData.routingNumber.trim() !== '' &&
           recipientData.accountNumber.trim() !== '' &&
           recipientData.bankAddress.trim() !== '';
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
          onBackClick={() => navigate('/wire-amount-entry')}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-red-600 text-xl font-bold">!</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900">Wire Transfers Blocked</h3>
                  <p className="text-red-700 mt-1">
                    Your account has been restricted from making wire transfers. Please contact customer support for assistance.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/wire-amount-entry')}
                className="flex-1 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
              >
                BACK
              </Button>
              <Button
                onClick={() => navigate('/transfer')}
                className="flex-1 py-3 font-semibold bg-gray-800 hover:bg-gray-900 text-white"
              >
                RETURN TO TRANSFER
              </Button>
            </div>
          </div>
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
        onBackClick={() => navigate('/wire-amount-entry')}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Recipient details</h2>
            {selectedAccount && amount && (
              <p className="text-sm text-gray-600">
                Sending {formatAmount(amount)} from {selectedAccount.name}
              </p>
            )}
          </div>

          {/* Recipient Form */}
          <div className="space-y-6 mb-8">
            {/* Recipient Information */}
            <Card className="p-6 bg-white border-gray-200">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Recipient Information</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Full Name *
                  </label>
                  <Input
                    type="text"
                    value={recipientData.recipientName}
                    onChange={(e) => handleInputChange('recipientName', e.target.value)}
                    placeholder="Enter recipient's full name as it appears on their account"
                    className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>
              </div>
            </Card>

            {/* Bank Information */}
            <Card className="p-6 bg-white border-gray-200">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Bank Information</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name *
                  </label>
                  <Input
                    type="text"
                    value={recipientData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    placeholder="Enter the recipient's bank name"
                    className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Routing Number *
                  </label>
                  <Input
                    type="text"
                    value={recipientData.routingNumber}
                    onChange={(e) => handleInputChange('routingNumber', e.target.value)}
                    placeholder="9-digit routing number"
                    maxLength={9}
                    className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number *
                  </label>
                  <Input
                    type="text"
                    value={recipientData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    placeholder="Enter recipient's account number"
                    className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Address *
                  </label>
                  <Input
                    type="text"
                    value={recipientData.bankAddress}
                    onChange={(e) => handleInputChange('bankAddress', e.target.value)}
                    placeholder="Enter bank's full address"
                    className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Info Message */}
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  Please ensure all information matches exactly with the recipient's bank account details. 
                  Wire transfers cannot be reversed once processed.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/wire-amount-entry')}
              className="flex-1 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
            >
              BACK
            </Button>
            <Button
              onClick={handleNext}
              disabled={!isFormValid()}
              className={`flex-1 py-3 font-semibold ${
                isFormValid()
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

export default WireRecipientForm;