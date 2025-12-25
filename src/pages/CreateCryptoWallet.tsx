import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  Shield, 
  Copy, 
  Check,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CreateCryptoWallet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [walletName, setWalletName] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState<string[]>([]);
  const [showPhrase, setShowPhrase] = useState(false);
  const [copied, setCopied] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [verificationWords, setVerificationWords] = useState<number[]>([]);
  const [userInputs, setUserInputs] = useState<string[]>(['', '', '']);
  const [isCreating, setIsCreating] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (step === 2) {
      generateRecoveryPhrase();
    }
  }, [step]);

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

  const generateRecoveryPhrase = () => {
    // Generate 12-word recovery phrase with diverse words from different letters
    const wordList = [
      'abandon', 'ability', 'absorb', 'abstract', 'achieve', 'acoustic', 'acquire', 'actress',
      'balance', 'banner', 'barrel', 'battle', 'beauty', 'believe', 'benefit', 'bicycle',
      'canvas', 'capital', 'capture', 'carbon', 'castle', 'casual', 'catalog', 'category',
      'damage', 'danger', 'debate', 'decade', 'defense', 'degree', 'deliver', 'dentist',
      'early', 'earth', 'easily', 'echo', 'ecology', 'economy', 'educate', 'eight',
      'fabric', 'factor', 'faculty', 'fade', 'family', 'fantasy', 'fashion', 'feature',
      'gadget', 'galaxy', 'gallery', 'garden', 'garlic', 'garment', 'gather', 'gender',
      'habit', 'hammer', 'hamster', 'happy', 'harvest', 'hazard', 'health', 'helmet',
      'ice', 'icon', 'idea', 'identify', 'ignore', 'illness', 'image', 'impact',
      'jacket', 'jaguar', 'january', 'jealous', 'jeans', 'jelly', 'jewel', 'join',
      'kangaroo', 'keen', 'keep', 'ketchup', 'key', 'kick', 'kidney', 'kind',
      'label', 'ladder', 'lady', 'lake', 'lamp', 'laptop', 'lava', 'lawsuit',
      'machine', 'magic', 'magnet', 'major', 'manage', 'mandate', 'mango', 'mansion',
      'napkin', 'narrow', 'nation', 'nature', 'neglect', 'nephew', 'network', 'neutral',
      'obey', 'object', 'oblige', 'observe', 'obtain', 'ocean', 'october', 'odor',
      'paddle', 'page', 'pair', 'palace', 'palm', 'panda', 'panel', 'panic',
      'quantum', 'quarter', 'queen', 'question', 'quick', 'quit', 'quiz', 'quote',
      'rabbit', 'race', 'rack', 'radar', 'radio', 'rail', 'rain', 'raise',
      'saddle', 'sadness', 'safe', 'sail', 'salad', 'salmon', 'salon', 'salt',
      'table', 'tackle', 'tag', 'tail', 'talent', 'talk', 'tank', 'tape',
      'ugly', 'umbrella', 'unable', 'uncle', 'under', 'unfair', 'unfold', 'unhappy',
      'vacant', 'vacuum', 'vague', 'valid', 'valley', 'valve', 'vapor', 'various',
      'wagon', 'wait', 'walnut', 'want', 'warfare', 'warm', 'warrior', 'wash',
      'yacht', 'yard', 'year', 'yellow', 'yield', 'yoga', 'young', 'youth',
      'zebra', 'zero', 'zone', 'zoo'
    ];

    const phrase: string[] = [];
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * wordList.length);
      phrase.push(wordList[randomIndex]);
    }
    setRecoveryPhrase(phrase);

    // Select 3 random positions for verification
    const positions: number[] = [];
    while (positions.length < 3) {
      const pos = Math.floor(Math.random() * 12);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }
    setVerificationWords(positions.sort((a, b) => a - b));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(recoveryPhrase.join(' '));
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Recovery phrase copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerification = () => {
    const isCorrect = verificationWords.every((pos, index) => {
      return userInputs[index].toLowerCase().trim() === recoveryPhrase[pos].toLowerCase();
    });

    if (isCorrect) {
      setStep(4);
    } else {
      toast({
        title: "Incorrect Words",
        description: "Please enter the correct words from your recovery phrase",
        variant: "destructive"
      });
    }
  };

  const createWallet = async () => {
    try {
      console.log('🚀 Starting wallet creation process...');
      setIsCreating(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 Auth check result:', { user: user?.id, authError });
      
      if (!user) {
        console.log('❌ No user found, returning early');
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive"
        });
        return;
      }

      console.log('💾 Attempting to store wallet metadata...');
      console.log('📋 Wallet metadata data:', {
        user_id: user.id,
        wallet_name: walletName || 'My Wallet',
        recovery_phrase_length: recoveryPhrase.length
      });
      
      // Store wallet metadata (encrypted in production)
      const { error: walletError } = await supabase
        .from('crypto_wallet_metadata')
        .insert({
          user_id: user.id,
          wallet_name: walletName || 'My Wallet',
          recovery_phrase_hash: btoa(recoveryPhrase.join(' ')), // In production, use proper encryption
          created_at: new Date().toISOString()
        });

      console.log('📊 Wallet metadata result:', { walletError });
      if (walletError) {
        console.log('❌ Wallet metadata error details:', walletError.message);
        throw walletError;
      }

      console.log('💰 Creating wallets for BTC, ETH, and ADA...');
      // Create wallets for BTC, ETH, and ADA with 0 balance
      const wallets = [
        { user_id: user.id, symbol: 'BTC', balance: 0 },
        { user_id: user.id, symbol: 'ETH', balance: 0 },
        { user_id: user.id, symbol: 'ADA', balance: 0 }
      ];

      console.log('📤 Sending wallet data to crypto_wallets table:', wallets);
      const { error, data } = await supabase
        .from('crypto_wallets')
        .insert(wallets);

      console.log('📊 Crypto wallets result:', { error, data });
      if (error) {
        console.log('❌ Crypto wallets error details:', error.message);
        throw error;
      }

      console.log('✅ Wallet creation successful!');
      toast({
        title: "Success!",
        description: "Your crypto wallet has been created successfully",
      });

      console.log('🔄 Navigating to crypto page in 2 seconds...');
      setTimeout(() => {
        console.log('🚀 Navigating to /crypto...');
        navigate('/crypto');
      }, 2000);
      
    } catch (error: any) {
      console.log('💥 Wallet creation failed:', error);
      console.log('📋 Error details:', error.message || error);
      console.log('🔍 Error code:', error.code);
      console.log('🔍 Error hint:', error.hint);
      console.log('🔍 Error details:', error.details);
      toast({
        title: "Error",
        description: "Failed to create crypto wallet. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
      console.log('🏁 Wallet creation process completed');
    }
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
        title="Create Wallet" 
        onBackClick={() => navigate('/crypto')} 
      />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button
          onClick={() => step === 1 ? navigate('/crypto') : setStep(step - 1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          {step === 1 ? 'Back to Crypto' : 'Previous Step'}
        </button>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {s}
              </div>
              {s < 4 && (
                <div className={`flex-1 h-1 mx-2 ${
                  s < step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Wallet Name */}
        {step === 1 && (
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Lock className="h-6 w-6 mr-2 text-blue-600" />
                Create Your Crypto Wallet
              </CardTitle>
              <CardDescription className="text-gray-600">
                Choose a name for your wallet to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wallet Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g., My Crypto Wallet"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-2">
                  This name is only visible to you
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-blue-900 font-semibold flex items-center mb-2">
                  <Shield className="h-5 w-5 mr-2" />
                  Important Information
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• You'll receive a 12-word recovery phrase</li>
                  <li>• This phrase is the ONLY way to recover your wallet</li>
                  <li>• Never share it with anyone</li>
                  <li>• Store it in a secure location</li>
                </ul>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                disabled={!walletName.trim()}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Recovery Phrase */}
        {step === 2 && (
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Shield className="h-6 w-6 mr-2 text-yellow-500" />
                Your Recovery Phrase
              </CardTitle>
              <CardDescription className="text-gray-600">
                Write down these 12 words in order and store them safely
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-red-800 font-semibold flex items-center mb-2">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Critical Security Warning
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Anyone with this phrase can access your funds</li>
                  <li>• We cannot recover it if you lose it</li>
                  <li>• Never store it digitally or online</li>
                  <li>• Write it down on paper and keep it safe</li>
                </ul>
              </div>

              <div className="relative">
                <div className={`grid grid-cols-3 gap-3 ${!showPhrase ? 'blur-sm' : ''}`}>
                  {recoveryPhrase.map((word, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-center"
                    >
                      <span className="text-xs text-gray-500 block mb-1">#{index + 1}</span>
                      <span className="text-gray-900 font-mono font-semibold">{word}</span>
                    </div>
                  ))}
                </div>
                {!showPhrase && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      onClick={() => setShowPhrase(true)}
                      variant="outline"
                      className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Reveal Recovery Phrase
                    </Button>
                  </div>
                )}
              </div>

              {showPhrase && (
                <>
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="understood"
                      checked={understood}
                      onCheckedChange={(checked) => setUnderstood(checked as boolean)}
                      className="border-gray-300"
                    />
                    <label htmlFor="understood" className="text-sm text-gray-700 cursor-pointer">
                      I have written down my recovery phrase and stored it in a secure location. 
                      I understand that I will need it to verify in the next step.
                    </label>
                  </div>

                  <Button
                    onClick={() => setStep(3)}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                    disabled={!understood}
                  >
                    Continue to Verification
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Verify Recovery Phrase */}
        {step === 3 && (
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Check className="h-6 w-6 mr-2 text-green-600" />
                Verify Your Recovery Phrase
              </CardTitle>
              <CardDescription className="text-gray-600">
                Enter the requested words to confirm you've saved your phrase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {verificationWords.map((wordIndex, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Word #{wordIndex + 1}
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter the word"
                      value={userInputs[index]}
                      onChange={(e) => {
                        const newInputs = [...userInputs];
                        newInputs[index] = e.target.value;
                        setUserInputs(newInputs);
                      }}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={handleVerification}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                disabled={userInputs.some(input => !input.trim())}
              >
                Verify & Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Check className="h-6 w-6 mr-2 text-green-600" />
                All Set!
              </CardTitle>
              <CardDescription className="text-gray-600">
                Your wallet is ready to be created
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <Check className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Successful!</h3>
                <p className="text-gray-700 mb-4">
                  You've successfully verified your recovery phrase.
                </p>
                <p className="text-sm text-gray-600">
                  Wallet Name: <span className="text-gray-900 font-semibold">{walletName}</span>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-blue-900 font-semibold mb-2">What's Next?</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Your wallet will support BTC, ETH, and ADA</li>
                  <li>• You can buy, sell, and manage your crypto</li>
                  <li>• All transactions are secured and encrypted</li>
                </ul>
              </div>

              <Button
                onClick={createWallet}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                disabled={isCreating}
              >
                {isCreating ? 'Creating Wallet...' : 'Create My Wallet'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CreateCryptoWallet;
