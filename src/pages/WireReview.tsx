import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Clock, AlertTriangle, FileText, Shield } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';

interface WireTransferData {
  fromAccount: any;
  amount: string;
  recipientData: any;
  accountType: any;
  accountInfo: any;
}

const WireReview: React.FC = () => {
  const navigate = useNavigate();
  const [transferData, setTransferData] = useState<WireTransferData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [wireTransferFee] = useState(5.00);
  const [processingTime] = useState('1-3 business days');
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
          navigate('/wire-amount-entry');
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
    navigate('/wire-confirmation');
  };

  const handleAuthorize = () => {
    if (agreedToTerms && transferData) {
      // Save final transfer data
      const finalTransferData = {
        ...transferData,
        wireTransferFee,
        totalAmount: parseFloat(transferData.amount) + wireTransferFee,
        processingTime,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('wireFinalTransfer', JSON.stringify(finalTransferData));
      navigate('/wire-authorization');
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const getTotalAmount = () => {
    if (!transferData || !transferData.amount) return 0;
    const amount = parseFloat(transferData.amount);
    if (isNaN(amount)) return 0;
    return amount + wireTransferFee;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading transfer details...</p>
        </div>
      </div>
    );
  }

  if (!transferData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Unable to load transfer details</p>
          <button
            onClick={() => navigate('/wire-amount-entry')}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Start Over
          </button>
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
        title="Final Review"
        onBackClick={() => navigate('/wire-confirmation')}
      />

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Transfer Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="text-center mb-6">
            <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-gray-900">Wire Transfer</h2>
            <p className="text-gray-600 mt-1">Final review and authorization</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Transfer Amount</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(transferData.amount)}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Wire Transfer Fee</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(wireTransferFee)}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3">
              <span className="font-semibold text-gray-900">Total Amount</span>
              <span className="font-bold text-xl text-gray-900">
                {formatCurrency(getTotalAmount())}
              </span>
            </div>
          </div>
        </div>

        {/* Recipient Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Recipient Details</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Name: </span>
              <span className="text-gray-900">{transferData.recipientData.recipientName}</span>
            </div>
            <div>
              <span className="text-gray-600">Bank: </span>
              <span className="text-gray-900">{transferData.recipientData.bankName}</span>
            </div>
            <div>
              <span className="text-gray-600">Account: </span>
              <span className="text-gray-900">****{transferData.accountInfo.recipientAccountNumber?.slice(-4)}</span>
            </div>
          </div>
        </div>

        {/* Processing Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Processing Time</h4>
              <p className="text-sm text-blue-800">
                Your wire transfer will be processed within {processingTime}. 
                You'll receive a confirmation once the transfer is initiated.
              </p>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-900 mb-2">Important Notice</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Wire transfers cannot be canceled or reversed once sent</li>
                <li>• Verify all recipient information is accurate</li>
                <li>• International transfers may incur additional fees</li>
                <li>• Processing times may vary based on recipient bank</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-start mb-3">
            <FileText className="w-5 h-5 text-gray-600 mt-0.5 mr-3 flex-shrink-0" />
            <h4 className="font-medium text-gray-900">Terms and Conditions</h4>
          </div>
          
          <div className="text-sm text-gray-600 space-y-2 mb-4">
            <p>By proceeding with this wire transfer, you acknowledge and agree to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>The wire transfer fee of {formatCurrency(wireTransferFee)} will be deducted from your account</li>
              <li>Wire transfers are final and cannot be reversed</li>
              <li>You are responsible for ensuring recipient information is accurate</li>
              <li>Processing times are estimates and may vary</li>
              <li>Additional fees may apply for international transfers</li>
            </ul>
          </div>

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">
              I have read and agree to the terms and conditions for wire transfers
            </span>
          </label>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-green-900 mb-1">Secure Transfer</h4>
              <p className="text-sm text-green-800">
                Your transfer is protected by enterprise-grade encryption and security measures.
              </p>
            </div>
          </div>
        </div>

        {/* Authorize Button */}
        <button
          onClick={handleAuthorize}
          disabled={!agreedToTerms}
          className={`w-full py-4 px-6 rounded-lg font-medium transition-all ${
            agreedToTerms
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Authorize Wire Transfer
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

export default WireReview;