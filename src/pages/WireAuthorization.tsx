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
    console.log('=== WIRE AUTHORIZATION COMPONENT MOUNTED ===');
    console.log('Initial state:', {
      transferData: transferData,
      userEmail: userEmail,
      pinSent: pinSent,
      pinVerified: pinVerified,
      generatedPin: generatedPin,
      isLoading: isLoading
    });
    
    fetchUserData();
    // Load transfer data and get user email
    const loadTransferData = async () => {
      try {
        const data = localStorage.getItem('wireFinalTransfer');
        console.log('LocalStorage wireFinalTransfer data:', data);
        
        if (!data) {
          console.log('No transfer data found - redirecting to transfer page');
          navigate('/transfer');
          return;
        }
        
        const parsedData = JSON.parse(data);
        console.log('Parsed transfer data:', parsedData);
        setTransferData(parsedData);
        
        // Get user email from Supabase
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Supabase user:', user);
        
        if (user && user.email) {
          console.log('Setting user email:', user.email);
          setUserEmail(user.email);
        } else {
          console.log('User not authenticated - redirecting to signin');
          toast.error('User not authenticated');
          navigate('/signin');
        }
      } catch (error) {
        console.error('Error loading transfer data:', error);
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
    console.log('🔄 [DEBUG] Wire transfer PIN request initiated');
    setIsProcessing(true);
    
    try {
      // Validate transfer data exists
      if (!transferData) {
        console.error('❌ [DEBUG] Transfer data is missing');
        toast.error('Transfer data is missing. Please start over.');
        setIsProcessing(false);
        return;
      }
      
      // Validate required fields
      if (!userEmail) {
        console.error('❌ [DEBUG] User email is missing');
        toast.error('User email is missing. Please log in again.');
        setIsProcessing(false);
        return;
      }
      
      if (!transferData.totalAmount || transferData.totalAmount <= 0) {
        console.error('❌ [DEBUG] Invalid transfer amount:', transferData.totalAmount);
        toast.error('Invalid transfer amount. Please check your transfer details.');
        setIsProcessing(false);
        return;
      }
      
      if (!transferData.recipientData?.recipientName) {
        console.error('❌ [DEBUG] Recipient name is missing');
        toast.error('Recipient information is incomplete. Please check your transfer details.');
        setIsProcessing(false);
        return;
      }
      
      // Generate 6-digit authorization code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedPin(code);
      
      console.log('📧 [DEBUG] Wire transfer PIN generation and email request:', {
        userEmail,
        amount: transferData.totalAmount,
        recipient: transferData.recipientData.recipientName,
        generatedCode: code,
        timestamp: new Date().toISOString(),
        requestPayload: {
          email: userEmail,
          code: code,
          amount: transferData.totalAmount,
          recipient: transferData.recipientData.recipientName
        }
      });
      
      // Send authorization code via new Supabase Edge Function
      console.log('📧 [DEBUG] Calling Supabase edge function: send-wire-auth-code');
      const { data, error } = await supabase.functions.invoke('send-wire-auth-code', {
        body: {
          email: userEmail,
          code: code,
          amount: transferData.totalAmount,
          recipient: transferData.recipientData.recipientName
        }
      })
      
      console.log('📧 [DEBUG] Wire transfer PIN email response:', { data, error });

      if (error) {
        console.error('❌ [DEBUG] Failed to send authorization code:', error);
        toast.error('Failed to send authorization code. Please try again.');
        setIsProcessing(false);
        return;
      }

      console.log('✅ [DEBUG] Wire transfer PIN sent successfully');
      
      setPinSent(true);
      setCountdown(60);
      setCanResend(false);
      toast.success(`Authorization code sent to ${userEmail}`);
    } catch (error) {
      console.error('❌ [DEBUG] Authorization code error:', error);
      toast.error('Failed to send authorization code');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyPin = () => {
    console.log('=== PIN VERIFICATION ATTEMPT ===');
    console.log('Entered PIN:', transferPin);
    console.log('Generated PIN:', generatedPin);
    console.log('PIN Match:', transferPin === generatedPin);
    console.log('Transfer Data:', transferData);
    console.log('User Email:', userEmail);
    
    if (transferPin === generatedPin) {
      console.log('PIN VERIFIED SUCCESSFULLY - Setting pinVerified to true');
      setPinVerified(true);
      toast.success('Transfer PIN verified successfully!');
    } else {
      console.log('PIN VERIFICATION FAILED - Clearing input');
      toast.error('Invalid transfer PIN. Please try again.');
      setTransferPin('');
    }
  };

  const handleResendPin = () => {
    console.log('=== RESEND PIN CLICKED ===');
    console.log('Current state before resend:', {
      canResend: canResend,
      countdown: countdown,
      transferPin: transferPin
    });
    
    setCanResend(false);
    setCountdown(60);
    setTransferPin('');
    console.log('Calling handleSendPin for resend...');
    handleSendPin();
  };

  const handleProcessTransfer = () => {
    console.log('=== PROCESS TRANSFER CLICKED ===');
    console.log('PIN Verified:', pinVerified);
    console.log('Is Processing:', isProcessing);
    console.log('Transfer Data:', transferData);
    
    if (pinVerified) {
      console.log('Starting transfer processing...');
      setIsProcessing(true);
      
      // Save authorization data
      const authData = {
        ...transferData,
        authorizedAt: new Date().toISOString(),
        authMethod: 'email_pin',
        status: 'processing'
      };
      
      console.log('Saving authorization data to localStorage:', authData);
      localStorage.setItem('wireTransferAuth', JSON.stringify(authData));
      
      console.log('Processing transfer immediately - no artificial delay');
      // Navigate immediately without artificial delay
      navigate('/wire-success');
    } else {
      console.log('Transfer processing blocked - PIN not verified');
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
                We'll send a 6-digit authorization code to your registered email address:
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
                {isProcessing ? 'Sending...' : 'Send Authorization Code'}
              </button>
            </div>
          ) : !pinVerified ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Enter the 6-digit authorization code sent to {userEmail}:
              </p>
              <input
                type="text"
                value={transferPin}
                onChange={(e) => {
                  const cleanedValue = e.target.value.replace(/\D/g, '').slice(0, 6);
                  console.log('PIN Input Changed:', {
                    originalValue: e.target.value,
                    cleanedValue: cleanedValue,
                    length: cleanedValue.length,
                    maxLength: 6
                  });
                  setTransferPin(cleanedValue);
                }}
                placeholder="Enter 6-digit code"
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
                Verify Code
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