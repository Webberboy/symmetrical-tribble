import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, User, Building, AlertCircle, Edit2, Edit3, CreditCard } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';

interface WireTransferData {
  fromAccount: any;
  amount: string;
  recipientData: any;
  accountType: any;
  accountInfo: any;
}

const WireConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const [transferData, setTransferData] = useState<WireTransferData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
    // Load all saved data from localStorage
    const loadTransferData = () => {
      try {
        const fromAccount = JSON.parse(localStorage.getItem('wireTransferAccount') || '{}');
        const amount = localStorage.getItem('wireTransferAmount') || '';
        const recipientData = JSON.parse(localStorage.getItem('wireRecipientData') || '{}');
        const accountType = JSON.parse(localStorage.getItem('wireAccountType') || '{}');
        const accountInfo = JSON.parse(localStorage.getItem('wireAccountInfo') || '{}');

        setTransferData({
          fromAccount,
          amount,
          recipientData,
          accountType,
          accountInfo
        });
      } catch (error) {
        // Redirect back to start if data is corrupted
        navigate('/transfer');
      } finally {
        setIsLoading(false);
      }
    };

    loadTransferData();
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

  const handleBack = () => {
    navigate('/wire-account-info');
  };

  const handleEdit = (section: string) => {
    switch (section) {
      case 'amount':
        navigate('/wire-amount-entry');
        break;
      case 'recipient':
        navigate('/wire-recipient-form');
        break;
      case 'account-type':
        navigate('/wire-account-info');
        break;
      case 'account-info':
        navigate('/wire-account-info');
        break;
      default:
        break;
    }
  };

  const handleContinue = () => {
    navigate('/wire-review');
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const formatAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return '';
    // Show only last 4 digits
    return `****${accountNumber.slice(-4)}`;
  };

  const formatRoutingNumber = (routing: string) => {
    if (!routing) return '';
    // Format as XXX-XXX-XXX
    const clean = routing.replace(/\D/g, '');
    if (clean.length === 9) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 9)}`;
    }
    return routing;
  };

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

  if (!transferData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Unable to load transfer details</p>
          <button
            onClick={() => navigate('/transfer')}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={userData}
        showBackButton={true} 
        title="Review Transfer"
        onBackClick={() => navigate('/wire-account-info')}
      />

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Transfer Amount */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Transfer Amount</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(transferData.amount)}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleEdit('amount')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* From Account */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">From Account</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {transferData.fromAccount.accountType} {formatAccountNumber(transferData.fromAccount.accountNumber)}
                </p>
                <p className="text-sm text-gray-500">
                  Balance: {formatCurrency(transferData.fromAccount.balance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recipient Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-600 mr-3" />
              <h3 className="font-medium text-gray-900">Recipient</h3>
            </div>
            <button
              onClick={() => handleEdit('recipient')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Name</p>
              <p className="text-sm text-gray-900">{transferData.recipientData.recipientName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Bank</p>
              <p className="text-sm text-gray-900">{transferData.recipientData.bankName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Bank Address</p>
              <p className="text-sm text-gray-900">{transferData.recipientData.bankAddress}</p>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Building className="w-5 h-5 text-gray-600 mr-3" />
              <h3 className="font-medium text-gray-900">Account Details</h3>
            </div>
            <button
              onClick={() => handleEdit('account-info')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Account Type</p>
              <p className="text-sm text-gray-900 capitalize">
                {transferData.accountInfo.recipientAccountType}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Routing Number</p>
              <p className="text-sm text-gray-900">
                {formatRoutingNumber(transferData.accountInfo.recipientRoutingNumber)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Account Number</p>
              <p className="text-sm text-gray-900">
                {formatAccountNumber(transferData.accountInfo.recipientAccountNumber)}
              </p>
            </div>
            {transferData.accountInfo.swiftCode && (
              <div>
                <p className="text-sm font-medium text-gray-700">SWIFT Code</p>
                <p className="text-sm text-gray-900">{transferData.accountInfo.swiftCode}</p>
              </div>
            )}
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-800">
                <strong>Please review carefully:</strong> Wire transfers are irreversible. 
                Ensure all information is correct before proceeding.
              </p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full py-4 px-6 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Continue to Review
        </button>

        {/* Cancel Link */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-800 text-sm transition-colors"
          >
            Cancel Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

export default WireConfirmation;