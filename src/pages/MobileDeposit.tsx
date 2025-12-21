import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CameraIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const MobileDeposit = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'review' | 'success'>('upload');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      
      const { data, error } = await supabase
        .from('accounts')
        .select('id, account_name, account_number, checking_balance, savings_balance, account_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setAccounts(data || []);
    } catch (error: any) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleFrontImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFrontImage(reader.result as string);
        toast.success('Front of check uploaded');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackImage(reader.result as string);
        toast.success('Back of check uploaded');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReview = () => {
    // Check if all required fields are filled
    if (!selectedAccount) {
      toast.error('Please select an account');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid check amount');
      return;
    }
    
    if (!frontImage) {
      toast.error('Please upload the front of the check');
      return;
    }
    
    if (!backImage) {
      toast.error('Please upload the back of the check');
      return;
    }
    
    setStep('review');
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('mobile_deposits')
        .insert({
          user_id: user.id,
          account_id: selectedAccount,
          amount: parseFloat(amount),
          status: 'pending',
          front_image_url: frontImage,
          back_image_url: backImage,
          submitted_at: new Date().toISOString(),
        });

      if (error) throw error;

      setStep('success');
      toast.success('Check submitted for deposit');
    } catch (error: any) {
      toast.error('Failed to submit deposit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setSelectedAccount('');
    setAmount('');
    setFrontImage(null);
    setBackImage(null);
  };

  if (step === 'success') {
    const selectedAcct = accounts.find(a => a.id === selectedAccount);
    
    return (
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-20">
        <Header 
          user={currentUser ? { 
            firstName: currentUser.user_metadata?.first_name || 'User', 
            lastName: currentUser.user_metadata?.last_name || '', 
            email: currentUser.email || '' 
          } : { firstName: '', lastName: '', email: '' }}
          showBackButton={false}
          title="Deposit Submitted"
          onBackClick={() => {}}
        />
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="bg-white border-gray-200 shadow-card p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="h-12 w-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Deposit Submitted!</h1>
            <p className="text-gray-600 mb-8">Your check deposit has been submitted for processing</p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-gray-900">${parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To Account:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedAcct?.account_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-blue-600">Processing</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected Availability:</span>
                  <span className="font-semibold text-gray-900">1-2 business days</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleReset} className="w-full max-w-md">
                Make Another Deposit
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'} className="w-full max-w-md">
                Return to Dashboard
              </Button>
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left max-w-md mx-auto">
              <p className="text-sm text-blue-900">
                <strong>Important:</strong> Please write "Mobile Deposit" and the date on your check and keep it in a safe place for 14 days before destroying it.
              </p>
            </div>
          </Card>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  if (step === 'review') {
    const selectedAcct = accounts.find(a => a.id === selectedAccount);
    
    return (
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-20">
        <Header 
          user={currentUser ? { 
            firstName: currentUser.user_metadata?.first_name || 'User', 
            lastName: currentUser.user_metadata?.last_name || '', 
            email: currentUser.email || '' 
          } : { firstName: '', lastName: '', email: '' }}
          showBackButton={true}
          title="Review Deposit"
          onBackClick={() => setStep('upload')}
        />
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="bg-white rounded-lg shadow-card p-6 border border-gray-200">
            <p className="text-gray-600 mt-1">Please verify all information before submitting</p>
          </div>

          <Card className="bg-white border-gray-200 shadow-card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Deposit Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Deposit Amount</p>
                  <p className="text-2xl font-bold text-gray-900">${parseFloat(amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">To Account</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedAcct?.account_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedAcct?.account_number}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Front of Check</p>
                  <img src={frontImage || ''} alt="Front" className="rounded-lg border-2 border-gray-200 w-full" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Back of Check</p>
                  <img src={backImage || ''} alt="Back" className="rounded-lg border-2 border-gray-200 w-full" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={() => setStep('upload')} variant="outline" className="flex-1">
                Go Back
              </Button>
              <Button onClick={handleSubmit} className="flex-1" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Deposit'}
              </Button>
            </div>
          </Card>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-20">
      <Header 
        user={currentUser ? { 
          firstName: currentUser.user_metadata?.first_name || 'User', 
          lastName: currentUser.user_metadata?.last_name || '', 
          email: currentUser.email || '' 
        } : { firstName: '', lastName: '', email: '' }}
        showBackButton={true}
        title="Mobile Check Deposit"
        onBackClick={() => navigate('/dashboard')}
      />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-card p-6 border border-gray-200">
          <div>
            <p className="text-gray-600 mt-1">Deposit checks quickly using your camera</p>
          </div>
        </div>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200 p-6">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Deposit Instructions</h3>
              <ol className="space-y-1 text-sm text-gray-700 list-decimal list-inside">
                <li>Endorse the back of your check by signing it</li>
                <li>Take a clear photo of the front and back of the check</li>
                <li>Enter the check amount</li>
                <li>Select the account to deposit into</li>
                <li>Review and submit your deposit</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Deposit Form */}
        <Card className="bg-white border-gray-200 shadow-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Deposit Information</h2>
          
          <div className="space-y-6">
            {/* Account Selection */}
            <div>
              <Label htmlFor="account" className="text-gray-900 font-semibold">Select Account *</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger id="account" className="mt-2">
                  <SelectValue placeholder="Choose an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => {
                    const balance = account.account_type === 'checking' 
                      ? account.checking_balance 
                      : account.account_type === 'savings' 
                      ? account.savings_balance 
                      : account.balance;
                    return (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{account.account_name} {account.account_number}</span>
                          <span className="text-gray-500 ml-4">${parseFloat(balance?.toString() || '0').toFixed(2)}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Input */}
            <div>
              <Label htmlFor="amount" className="text-gray-900 font-semibold">Check Amount *</Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Front Image Upload */}
            <div>
              <Label className="text-gray-900 font-semibold">Front of Check *</Label>
              <div className="mt-2">
                {frontImage ? (
                  <div className="relative">
                    <img src={frontImage} alt="Front" className="rounded-lg border-2 border-gray-200 w-full" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFrontImage(null)}
                      className="absolute top-2 right-2 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 border-red-300 font-semibold"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <CameraIcon className="h-12 w-12 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-600">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or HEIC (MAX. 10MB)</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFrontImageUpload} />
                  </label>
                )}
              </div>
            </div>

            {/* Back Image Upload */}
            <div>
              <Label className="text-gray-900 font-semibold">Back of Check *</Label>
              <div className="mt-2">
                {backImage ? (
                  <div className="relative">
                    <img src={backImage} alt="Back" className="rounded-lg border-2 border-gray-200 w-full" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBackImage(null)}
                      className="absolute top-2 right-2 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 border-red-300 font-semibold"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <CameraIcon className="h-12 w-12 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-600">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or HEIC (MAX. 10MB)</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleBackImageUpload} />
                  </label>
                )}
              </div>
            </div>

            <Button onClick={handleReview} className="w-full" size="lg">
              Review Deposit
            </Button>
          </div>
        </Card>

        {/* Deposit Limits */}
        <Card className="bg-amber-50 border-amber-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Deposit Limits</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Daily limit: $5,000</li>
            <li>• Monthly limit: $20,000</li>
            <li>• Funds typically available in 1-2 business days</li>
            <li>• Keep your check for 14 days after deposit</li>
          </ul>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MobileDeposit;
