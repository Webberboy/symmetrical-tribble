import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard as CreditCardIcon, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { supabase } from '@/integrations/supabase/client';
import { useSettings } from '@/contexts/SettingsContext';

interface UserProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

const cardColors = [
  {
    id: 'gradient-blue',
    name: 'Ocean Blue',
    gradient: 'from-blue-600 via-blue-700 to-blue-900',
    preview: 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900'
  },
  {
    id: 'gradient-purple',
    name: 'Royal Purple',
    gradient: 'from-purple-600 via-purple-700 to-purple-900',
    preview: 'bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900'
  },
  {
    id: 'gradient-green',
    name: 'Emerald Green',
    gradient: 'from-green-600 via-green-700 to-green-900',
    preview: 'bg-gradient-to-br from-green-600 via-green-700 to-green-900'
  },
  {
    id: 'gradient-red',
    name: 'Ruby Red',
    gradient: 'from-red-600 via-red-700 to-red-900',
    preview: 'bg-gradient-to-br from-red-600 via-red-700 to-red-900'
  },
  {
    id: 'gradient-gold',
    name: 'Golden Sunset',
    gradient: 'from-yellow-600 via-orange-600 to-red-700',
    preview: 'bg-gradient-to-br from-yellow-600 via-orange-600 to-red-700'
  },
  {
    id: 'gradient-dark',
    name: 'Midnight Black',
    gradient: 'from-gray-800 via-gray-900 to-black',
    preview: 'bg-gradient-to-br from-gray-800 via-gray-900 to-black'
  }
];

const CreateCard = () => {
  const navigate = useNavigate();
  const { websiteName } = useSettings();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [cardHolderName, setCardHolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(cardColors[0]);

  useEffect(() => {
    fetchUserData();
    checkAuth();
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

  const checkAuth = async () => {
    try {
      setLoading(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        navigate("/signin");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        toast.error('Failed to load profile');
        navigate("/signin");
        return;
      }

      setUser(profile);
      
      // Set default card holder name
      const defaultName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'CARD HOLDER';
      setCardHolderName(defaultName);

    } catch (error) {
      toast.error('An error occurred');
      navigate("/signin");
    } finally {
      setLoading(false);
    }
  };

  const generateCardNumber = () => {
    // Generate a valid-looking card number (starts with 4 for Visa)
    const prefix = '4716';
    let number = prefix;
    
    for (let i = 0; i < 12; i++) {
      number += Math.floor(Math.random() * 10);
    }
    
    return number;
  };

  const generateCVV = () => {
    return Math.floor(100 + Math.random() * 900).toString();
  };

  const generateExpiryDate = () => {
    const now = new Date();
    const expiryYear = now.getFullYear() + 4; // Card expires in 4 years
    const expiryMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${expiryMonth}/${expiryYear.toString().slice(-2)}`;
  };

  const maskCardNumber = (number: string) => {
    return `${number.slice(0, 4)} XXXX XXXX ${number.slice(-4)}`;
  };

  const formatCardNumberDisplay = (number: string) => {
    return number.replace(/(\d{4})/g, '$1 ').trim();
  };

  const handleCreateCard = async () => {
    if (!user) return;
    
    if (!cardHolderName.trim()) {
      toast.error('Please enter a card holder name');
      return;
    }

    setCreating(true);
    try {
      const cardNumber = generateCardNumber();
      const cvv = generateCVV();
      const expiryDate = generateExpiryDate();
      
      // Calculate expiry timestamp
      const [month, year] = expiryDate.split('/');
      const expiryTimestamp = new Date(2000 + parseInt(year), parseInt(month) - 1, 1);

      const { data: newCard, error: cardError } = await supabase
        .from('cards')
        .insert({
          user_id: user.id,
          card_number: cardNumber,
          card_number_masked: maskCardNumber(cardNumber),
          card_holder_name: cardHolderName.trim().toUpperCase(),
          expiry_date: expiryDate,
          cvv: cvv,
          card_type: 'debit',
          card_status: 'active',
          card_color: selectedColor.id, // Save the selected color
          current_balance: 0,
          credit_limit: null,
          available_credit: null,
          card_brand: 'visa',
          is_frozen: false,
          issued_at: new Date().toISOString(),
          activated_at: new Date().toISOString(),
          expires_at: expiryTimestamp.toISOString()
        })
        .select()
        .single();

      if (cardError) {
        toast.error('Failed to create card. Please try again.');
        return;
      }

      // Create default card limits
      const { error: limitsError } = await supabase
        .from('card_limits')
        .insert({
          card_id: newCard.id,
          user_id: user.id,
          daily_purchase_limit: 5000,
          daily_withdrawal_limit: 1000,
          monthly_limit: 50000,
          daily_spent: 0,
          daily_withdrawn: 0,
          monthly_spent: 0,
          international_transactions_enabled: true,
          online_transactions_enabled: true,
          contactless_enabled: true,
          atm_withdrawals_enabled: true
        });

      if (limitsError) {
        // Non-critical, continue anyway
      }

      toast.success('Card created successfully!');
      navigate('/cards');
    } catch (error) {
      toast.error('An error occurred while creating your card');
    } finally {
      setCreating(false);
    }
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header user={userData} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Create Your Card</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/cards')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Card Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Card Preview</h3>
            
            <Card className={`relative overflow-hidden bg-gradient-to-br ${selectedColor.gradient} border-none p-6 aspect-[1.6/1] max-w-sm mx-auto lg:mx-0 shadow-2xl`}>
              {/* Card Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 bg-white rounded-full blur-2xl"></div>
              </div>

              {/* Card Content */}
              <div className="relative z-10 h-full flex flex-col justify-between text-white">
                {/* Card Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white text-sm font-medium">{websiteName.toUpperCase()}</p>
                    <p className="text-white text-xs opacity-80">DEBIT CARD</p>
                  </div>
                  <CreditCardIcon className="h-8 w-8 text-white opacity-80" />
                </div>

                {/* Card Number */}
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-mono tracking-wider">
                      {formatCardNumberDisplay(generateCardNumber())}
                    </p>
                  </div>

                  {/* Card Details */}
                  <div className="flex justify-between items-end">
                    <div className="flex-1">
                      <p className="text-gray-200 text-xs">CARD HOLDER</p>
                      <p className="text-sm font-medium truncate pr-4">
                        {cardHolderName.toUpperCase() || 'YOUR NAME HERE'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-200 text-xs">EXPIRES</p>
                      <p className="text-sm font-medium">{generateExpiryDate()}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-gray-200 text-xs">CVV</p>
                      <p className="text-sm font-medium">***</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <p className="text-sm text-gray-600 text-center lg:text-center">
              This is a preview of how your card will look
            </p>
          </div>

          {/* Card Customization Form */}
          <div className="space-y-6">
            <Card className="bg-white border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Customize Your Card</h3>
              
              <div className="space-y-6">
                {/* Card Holder Name */}
                <div className="space-y-2">
                  <Label htmlFor="cardName" className="text-sm font-medium text-gray-700">
                    Card Holder Name
                  </Label>
                  <Input
                    id="cardName"
                    type="text"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                    placeholder="Enter name as you want it on card"
                    maxLength={25}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                  <p className="text-xs text-gray-500">
                    This name will appear on your card
                  </p>
                </div>

                {/* Card Color Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Choose Card Color
                  </Label>
                  <RadioGroup
                    value={selectedColor.id}
                    onValueChange={(value) => {
                      const color = cardColors.find(c => c.id === value);
                      if (color) setSelectedColor(color);
                    }}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                  >
                    {cardColors.map((color) => (
                      <label
                        key={color.id}
                        className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                          selectedColor.id === color.id
                            ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <RadioGroupItem
                          value={color.id}
                          id={color.id}
                          className="sr-only"
                        />
                        <div className="p-3 space-y-2">
                          <div className={`w-full h-16 rounded-md ${color.preview} shadow-lg`}></div>
                          <p className="text-xs font-medium text-gray-700 text-center">
                            {color.name}
                          </p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                {/* Card Features Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-blue-900">Your Card Includes:</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Unique card number and CVV</li>
                    <li>• 4-year validity period</li>
                    <li>• Daily spending limit: $5,000</li>
                    <li>• ATM withdrawal limit: $1,000/day</li>
                    <li>• Contactless payments enabled</li>
                    <li>• International transactions enabled</li>
                  </ul>
                </div>

                {/* Create Button */}
                <Button
                  onClick={handleCreateCard}
                  disabled={creating || !cardHolderName.trim()}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Creating Card...
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="h-5 w-5 mr-2" />
                      Create Card
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By creating a card, you agree to {websiteName}'s terms and conditions
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default CreateCard;
