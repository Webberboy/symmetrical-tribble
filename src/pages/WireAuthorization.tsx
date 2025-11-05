import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WireTransferData {
  fromAccount: any;
  amount: string;
  recipientData: any;
  accountType: any;
  accountInfo: any;
  wireTransferFee: number;
  totalAmount: number;
  processingTime: string;
  timestamp: string;
}

const WireAuthorization: React.FC = () => {
  const navigate = useNavigate();
  const [transferData, setTransferData] = useState<WireTransferData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  
  // Email OTP Verification
  const [userEmail, setUserEmail] = useState('');
  const [transferPin, setTransferPin] = useState('');
  const [pinSent, setPinSent] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    fetchUserData();
    // Load transfer data and get user email
    const loadTransferData = async () => {
      try {
        const data = localStorage.getItem('wireFinalTransfer');
        if (!data) {
          navigate('/wire-account-selection');
          return;
        }
        
        setTransferData(JSON.parse(data));
        
        // Get user email from Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          setUserEmail(user.email);
        } else {
          toast.error('User not authenticated');
          navigate('/signin');
        }
      } catch (error) {
        navigate('/wire-account-selection');
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

  // Countdown timer for resend
  useEffect(() => {
    if (pinSent && countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, pinSent, canResend]);

  const handleBack = () => {
    navigate('/wire-review');
  };

  const handleSendPin = async () => {
    setIsProcessing(true);
    
    try {
      // Generate 6-digit PIN
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedPin(pin);
      
      // Send PIN via Supabase Edge Function
      const { error } = await supabase.functions.invoke('send-transfer-pin', {
        body: {
          email: userEmail,
          pin: pin,
          amount: transferData?.totalAmount,
          recipient: transferData?.recipientData.recipientName,
        },
      });

      if (error) {
        toast.error('Failed to send transfer PIN. Please try again.');
        setIsProcessing(false);
        return;
      }

      setPinSent(true);
      setCountdown(60);
      setCanResend(false);
      toast.success(`Transfer PIN sent to ${userEmail}`);
    } catch (error) {
      toast.error('Failed to send transfer PIN');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyPin = () => {
    if (transferPin === generatedPin) {
      setPinVerified(true);
      toast.success('Transfer PIN verified successfully!');
    } else {
      toast.error('Invalid transfer PIN. Please try again.');
      setTransferPin('');
    }
  };

  const handleResendPin = () => {
    setCanResend(false);
    setCountdown(60);
    setTransferPin('');
    handleSendPin();
  };

  const handleProcessTransfer = () => {
    if (pinVerified) {
      setIsProcessing(true);
      
      // Save authorization data
      const authData = {
        ...transferData,
        authorizedAt: new Date().toISOString(),
        authMethod: 'email_pin',
        status: 'processing'
      };
      
      localStorage.setItem('wireTransferAuth', JSON.stringify(authData));
      
      // Simulate processing delay
      setTimeout(() => {
        navigate('/wire-success');
      }, 2000);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
            onClick={() => navigate('/wire-account-selection')}
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
        title="Authorization"
        onBackClick={() => navigate('/wire-review')}
      />

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Transfer Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="text-center">
            <Shield className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Secure Authorization</h2>
            <p className="text-sm text-gray-600 mb-4">
              Authorize your wire transfer of {formatCurrency(transferData.totalAmount)}
            </p>
            <div className="text-xs text-gray-500">
              To: {transferData.recipientData.recipientName}
            </div>
          </div>
        </div>

        {/* Email PIN Verification */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center mb-3">
            <Mail className="w-5 h-5 text-gray-600 mr-3" />
            <h3 className="font-semibold text-gray-900">Email Verification</h3>
            {pinVerified && (
              <div className="ml-auto">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>

          {!pinSent ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                We'll send a 6-digit transfer PIN to your registered email address:
              </p>
              <p className="text-sm font-medium text-gray-900 mb-4">{userEmail}</p>
              <button
                onClick={handleSendPin}
                disabled={isProcessing || pinVerified}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isProcessing || pinVerified
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isProcessing ? 'Sending...' : 'Send Transfer PIN'}
              </button>
            </div>
          ) : !pinVerified ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Enter the 6-digit PIN sent to {userEmail}:
              </p>
              <input
                type="text"
                value={transferPin}
                onChange={(e) => setTransferPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-center text-lg font-mono mb-4"
                autoFocus
              />
              <button
                onClick={handleVerifyPin}
                disabled={transferPin.length !== 6}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors mb-3 ${
                  transferPin.length !== 6
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                Verify PIN
              </button>
              
              {/* Resend PIN */}
              <div className="text-center">
                {!canResend ? (
                  <p className="text-sm text-gray-500">
                    Resend PIN in {countdown}s
                  </p>
                ) : (
                  <button
                    onClick={handleResendPin}
                    className="text-sm text-gray-900 hover:underline font-medium"
                  >
                    Resend PIN
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-green-600 font-medium">PIN Verified Successfully!</p>
            </div>
          )}
        </div>

        {/* Process Transfer Button */}
        {pinVerified && (
          <button
            onClick={handleProcessTransfer}
            disabled={isProcessing}
            className={`w-full py-4 px-6 rounded-lg font-medium transition-colors ${
              isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isProcessing ? 'Processing Transfer...' : 'Process Wire Transfer'}
          </button>
        )}

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Security Notice</h4>
              <p className="text-sm text-blue-800">
                Your transfer is protected with email verification. Never share your transfer PIN with anyone.
              </p>
            </div>
          </div>
        </div>

        {/* Cancel Link */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-800 text-sm transition-colors"
            disabled={isProcessing}
          >
            Cancel Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

export default WireAuthorization;