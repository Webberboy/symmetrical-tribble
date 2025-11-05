import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, AlertCircle, CreditCard } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';

interface AccountInfoData {
  recipientRoutingNumber: string;
  recipientAccountNumber: string;
  recipientBankName: string;
  recipientAccountType: string;
  swiftCode?: string;
}

const WireAccountInfo: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfoData>({
    recipientRoutingNumber: '',
    recipientAccountNumber: '',
    recipientBankName: '',
    recipientAccountType: 'checking',
    swiftCode: ''
  });
  const [isValid, setIsValid] = useState<boolean>(false);
  const [routingError, setRoutingError] = useState<string>('');

  // Load saved data on component mount
  useEffect(() => {
    fetchUserData();
    const savedData = localStorage.getItem('wireAccountInfo');
    if (savedData) {
      const data: AccountInfoData = JSON.parse(savedData);
      setAccountInfo(data);
    }
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

  // Validate form whenever data changes
  useEffect(() => {
    const isRoutingValid = validateRoutingNumber(accountInfo.recipientRoutingNumber);
    const isAccountValid = accountInfo.recipientAccountNumber.trim().length >= 4;
    const isBankNameValid = accountInfo.recipientBankName.trim().length >= 2;
    
    setIsValid(isRoutingValid && isAccountValid && isBankNameValid);
  }, [accountInfo]);

  const validateRoutingNumber = (routing: string): boolean => {
    // Remove any spaces or dashes
    const cleanRouting = routing.replace(/[\s-]/g, '');
    
    // Must be exactly 9 digits
    if (!/^\d{9}$/.test(cleanRouting)) {
      setRoutingError('Routing number must be exactly 9 digits');
      return false;
    }

    // Basic checksum validation (ABA routing number algorithm)
    const digits = cleanRouting.split('').map(Number);
    const checksum = (
      3 * (digits[0] + digits[3] + digits[6]) +
      7 * (digits[1] + digits[4] + digits[7]) +
      (digits[2] + digits[5] + digits[8])
    ) % 10;

    if (checksum !== 0) {
      setRoutingError('Invalid routing number');
      return false;
    }

    setRoutingError('');
    return true;
  };

  const handleInputChange = (field: keyof AccountInfoData, value: string) => {
    setAccountInfo(prev => ({
      ...prev,
      [field]: value
    }));

    // Special handling for routing number
    if (field === 'recipientRoutingNumber') {
      // Allow only digits and format as user types
      const cleanValue = value.replace(/\D/g, '');
      if (cleanValue.length <= 9) {
        setAccountInfo(prev => ({
          ...prev,
          [field]: cleanValue
        }));
      }
    }
  };

  const handleBack = () => {
    navigate('/wire-recipient-form');
  };

  const handleContinue = () => {
    if (isValid) {
      // Save data to localStorage
      localStorage.setItem('wireAccountInfo', JSON.stringify(accountInfo));
      
      // Navigate to next step
      navigate('/wire-confirmation');
    }
  };

  const formatRoutingNumber = (value: string) => {
    // Format as XXX-XXX-XXX for display
    const clean = value.replace(/\D/g, '');
    if (clean.length >= 6) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 9)}`;
    } else if (clean.length >= 3) {
      return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    }
    return clean;
  };

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
        title="Account Details"
        onBackClick={() => navigate('/wire-recipient-form')}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-2xl mx-auto">
        {/* Bank Information */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Building className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Bank Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                value={accountInfo.recipientBankName}
                onChange={(e) => handleInputChange('recipientBankName', e.target.value)}
                placeholder="Enter the recipient's bank name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Routing Number *
              </label>
              <input
                type="text"
                value={formatRoutingNumber(accountInfo.recipientRoutingNumber)}
                onChange={(e) => handleInputChange('recipientRoutingNumber', e.target.value)}
                placeholder="XXX-XXX-XXX"
                maxLength={11}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                  routingError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {routingError && (
                <div className="flex items-center mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {routingError}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                9-digit number found on checks or bank statements
              </p>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number *
              </label>
              <input
                type="text"
                value={accountInfo.recipientAccountNumber}
                onChange={(e) => handleInputChange('recipientAccountNumber', e.target.value)}
                placeholder="Enter recipient's account number"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Account number as it appears on bank statements
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type *
              </label>
              <select
                value={accountInfo.recipientAccountType}
                onChange={(e) => handleInputChange('recipientAccountType', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white"
              >
                <option value="checking">Checking Account</option>
                <option value="savings">Savings Account</option>
                <option value="business">Business Account</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SWIFT Code (Optional)
              </label>
              <input
                type="text"
                value={accountInfo.swiftCode || ''}
                onChange={(e) => handleInputChange('swiftCode', e.target.value)}
                placeholder="Enter SWIFT code if international"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Required for international wire transfers
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Double-check all account information. Wire transfers cannot be reversed once sent.
              </p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className={`w-full py-4 px-6 rounded-lg font-medium transition-all ${
            isValid
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue
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
    </div>
  );
};

export default WireAccountInfo;