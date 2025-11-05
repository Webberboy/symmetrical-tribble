import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Download, ArrowRight, AlertCircle, DollarSign, Clock, Building, User, Copy } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateWireTransferReceipt } from '@/lib/pdfReceiptGenerator';

interface WireTransferAuth {
  fromAccount: any;
  amount: string;
  recipientData: any;
  accountType: any;
  accountInfo: any;
  wireTransferFee: number;
  totalAmount: number;
  processingTime: string;
  timestamp: string;
  authorizedAt: string;
  authMethod: string;
  status: string;
}

const WireSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [transferData, setTransferData] = useState<WireTransferAuth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
    // Load authorization data and save to database
    const loadAndSaveTransferData = async () => {
      try {
        const data = localStorage.getItem('wireTransferAuth');
        if (!data) {
          navigate('/wire-account-selection');
          return;
        }

        const authData = JSON.parse(data);
        setTransferData(authData);
        
        // Generate confirmation number
        const confirmNum = 'WT' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
        setConfirmationNumber(confirmNum);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error('User not authenticated');
          navigate('/signin');
          return;
        }

        // Create transaction record
        const { data: transactionData, error: txnError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'debit',
            amount: authData.totalAmount,
            description: `Wire transfer to ${authData.recipientData.recipientName}`,
            status: 'pending',
            recipient_account: authData.accountInfo.recipientAccountNumber
          })
          .select()
          .single();

        if (txnError) {
          toast.error('Failed to record transaction');
        }

        // Create wire transfer record
        const { error: wireError } = await supabase
          .from('wire_transfers')
          .insert({
            user_id: user.id,
            transaction_id: transactionData?.id,
            amount: parseFloat(authData.amount),
            fee: authData.wireTransferFee,
            total_amount: authData.totalAmount,
            from_account_id: user.id, // Use user ID as account ID since accounts are stored in profiles table
            from_account_number: authData.fromAccount.accountNumber || 'N/A',
            recipient_name: authData.recipientData.recipientName,
            recipient_bank_name: authData.recipientData.bankName,
            recipient_routing_number: authData.accountInfo.recipientRoutingNumber || authData.recipientData.routingNumber,
            recipient_account_number: authData.accountInfo.recipientAccountNumber,
            recipient_bank_address: authData.recipientData.bankAddress,
            account_type: authData.accountInfo?.recipientAccountType || 'checking',
            reference_message: authData.accountInfo?.referenceMessage || null,
            swift_code: authData.accountInfo?.swiftCode || null,
            confirmation_number: confirmNum,
            status: 'processing',
            processing_time: authData.processingTime,
            authorized_at: authData.authorizedAt
          });

        if (wireError) {
          toast.error('Failed to record wire transfer');
        }

        // Save confirmation for future reference
        const confirmationData = {
          ...authData,
          confirmationNumber: confirmNum,
          processedAt: new Date().toISOString()
        };
        localStorage.setItem('wireTransferConfirmation', JSON.stringify(confirmationData));
        
        // Clear temporary localStorage data
        localStorage.removeItem('wireTransferAccount');
        localStorage.removeItem('wireTransferAmount');
        localStorage.removeItem('wireRecipientData');
        localStorage.removeItem('wireAccountType');
        localStorage.removeItem('wireAccountInfo');
        localStorage.removeItem('wireFinalTransfer');
        localStorage.removeItem('wireTransferAuth');
        
      } catch (error) {
        navigate('/wire-account-selection');
      } finally {
        setIsLoading(false);
      }
    };

    loadAndSaveTransferData();
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

  const handleCopyConfirmation = async () => {
    try {
      await navigator.clipboard.writeText(confirmationNumber);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
    }
  };

  const handleDownloadReceipt = () => {
    if (!transferData || !userData) return;
    
    try {
      generateWireTransferReceipt({
        transferId: confirmationNumber,
        date: new Date(transferData.authorizedAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        amount: parseFloat(transferData.amount),
        senderName: `${userData.firstName} ${userData.lastName}`,
        senderAccount: transferData.fromAccount.accountNumber || 'N/A',
        recipientName: transferData.recipientData.recipientName,
        recipientAccount: transferData.accountInfo.recipientAccountNumber || 'N/A',
        recipientBank: transferData.recipientData.bankName,
        recipientRoutingNumber: transferData.accountInfo.recipientRoutingNumber || transferData.recipientData.routingNumber || 'N/A',
        purpose: transferData.accountInfo?.referenceMessage,
        status: 'processing',
        userEmail: userData.email,
      });
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate receipt');
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

  const formatAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return '';
    return '****' + accountNumber.slice(-4);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <p className="text-gray-600">Unable to load transfer confirmation</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Return to Dashboard
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
        title="Transfer Confirmation"
        onBackClick={() => navigate('/dashboard')}
      />

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Success Message */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Transfer Authorized</h2>
          <p className="text-gray-600 mb-4">
            Your wire transfer of {formatCurrency(transferData.totalAmount)} has been successfully authorized and is now processing.
          </p>
          
          {/* Confirmation Number */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Confirmation Number</p>
            <div className="flex items-center justify-center">
              <span className="text-lg font-mono font-semibold text-gray-900 mr-3">
                {confirmationNumber}
              </span>
              <button
                onClick={handleCopyConfirmation}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                title="Copy confirmation number"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copySuccess && (
              <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>
            )}
          </div>

          {/* Processing Status */}
          <div className="flex items-center justify-center text-orange-600 mb-4">
            <Clock className="w-5 h-5 mr-2" />
            <span className="font-medium">Processing</span>
          </div>
        </div>

        {/* Transfer Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Transfer Details</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">From Account</span>
              <span className="font-medium text-gray-900">
                {formatAccountNumber(transferData.fromAccount.accountNumber || '')}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Transfer Amount</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(parseFloat(transferData.amount))}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Wire Transfer Fee</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(transferData.wireTransferFee)}
              </span>
            </div>
            
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Total Amount</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(transferData.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recipient Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Recipient Information</h3>
          
          <div className="space-y-3">
            <div>
              <span className="text-gray-600 block text-sm">Recipient Name</span>
              <span className="font-medium text-gray-900">
                {transferData.recipientData.recipientName}
              </span>
            </div>
            
            <div>
              <span className="text-gray-600 block text-sm">Bank Name</span>
              <span className="font-medium text-gray-900">
                {transferData.recipientData.bankName}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600 block text-sm">Routing Number</span>
                <span className="font-medium text-gray-900">
                  {transferData.accountInfo.recipientRoutingNumber || 'N/A'}
                </span>
              </div>
              
              <div>
                <span className="text-gray-600 block text-sm">Account Number</span>
                <span className="font-medium text-gray-900">
                  ****{transferData.accountInfo.recipientAccountNumber?.slice(-4) || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Processing Information</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Authorized On</span>
              <span className="font-medium text-gray-900">
                {formatDate(transferData.authorizedAt)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Time</span>
              <span className="font-medium text-gray-900">
                {formatTime(transferData.authorizedAt)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Expected Processing</span>
              <span className="font-medium text-gray-900">
                {transferData.processingTime}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-orange-600 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Processing
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleDownloadReceipt}
            className="w-full flex items-center justify-center py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Receipt
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Return to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">Important Notice</h4>
              <div className="text-sm text-yellow-800 space-y-1">
                <p>• This transfer cannot be cancelled once processing begins</p>
                <p>• Processing times may vary based on the receiving bank</p>
                <p>• You will receive email updates on the transfer status</p>
                <p>• Keep your confirmation number for future reference</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Questions about your transfer?{' '}
            <button className="text-gray-900 hover:underline font-medium">
              Contact Support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WireSuccess;