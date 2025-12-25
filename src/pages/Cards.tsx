import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Eye, EyeOff, CreditCard as CreditCardIcon, Lock, FileText, Plus, Loader2, RefreshCw, Trash2, ChevronLeft, ChevronRight, Copy, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { supabase } from '@/integrations/supabase/client';
import { useSettings } from '@/contexts/SettingsContext';
import CardAnalytics from '@/components/cards/CardAnalytics';
import TransactionFilters from '@/components/cards/TransactionFilters';
import CardControls from '@/components/cards/CardControls';
import RecurringCharges from '@/components/cards/RecurringCharges';
import VirtualCards from '@/components/cards/VirtualCards';
import RewardsTracker from '@/components/cards/RewardsTracker';

interface CardData {
  id: string;
  card_number: string;
  card_number_masked: string;
  card_holder_name: string;
  expiry_date: string;
  cvv: string;
  card_type: string;
  card_status: string;
  card_color?: string; // Add card color field
  current_balance: number;
  credit_limit: number | null;
  available_credit: number | null;
  card_brand: string | null;
  is_frozen: boolean;
}

interface CardTransaction {
  id: string;
  merchant_name: string;
  amount: number;
  transaction_type: string;
  transaction_date: string;
  status: string;
}

interface UserProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

// Professional card colors (solid, no gradients)
const cardColors: Record<string, string> = {
  'gradient-blue': 'bg-blue-600',
  'gradient-purple': 'bg-purple-600',
  'gradient-green': 'bg-green-600',
  'gradient-red': 'bg-red-600',
  'gradient-gold': 'bg-amber-600',
  'gradient-black': 'bg-gray-900'
};

const getCardColor = (colorId?: string): string => {
  return cardColors[colorId || 'gradient-blue'] || cardColors['gradient-blue'];
};

const Cards = () => {
  const navigate = useNavigate();
  const { websiteName } = useSettings();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddMoneyDialog, setShowAddMoneyDialog] = useState(false);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [allCards, setAllCards] = useState<CardData[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    fetchUserData();
    checkAuthAndLoadData();
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

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true);
      
      // Check authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        navigate("/signin");
        return;
      }

      // Get user profile
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

      // Load card data and accounts
      await loadCardData(session.user.id);
      await loadUserAccounts(session.user.id);
    } catch (error) {
      toast.error('An error occurred while loading data');
      navigate("/signin");
    } finally {
      setLoading(false);
    }
  };

  const loadCardData = async (userId: string) => {
    try {
      // Load all cards
      const { data: cards, error: cardError } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (cardError) {
        toast.error('Failed to load card data');
        return;
      }

      if (cards && cards.length > 0) {
        setAllCards(cards as CardData[]);
        setCardData(cards[0] as CardData);
        setCurrentCardIndex(0);
        
        // Load recent transactions for the first card
        await loadTransactions(cards[0].id);
      } else {
        setAllCards([]);
        setCardData(null);
      }
    } catch (error) {
      toast.error('Failed to load card data');
    }
  };

  const loadTransactions = async (cardId: string) => {
    try {
      const { data, error } = await supabase
        .from('card_transactions')
        .select('*')
        .eq('card_id', cardId)
        .order('transaction_date', { ascending: false })
        .limit(10);

      if (error) {
        return;
      }

      setTransactions((data || []) as CardTransaction[]);
    } catch (error) {
    }
  };

  const handleRefresh = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      await loadCardData(user.id);
      toast.success('Card data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleFreezeCard = async () => {
    if (!cardData) return;

    try {
      const newFreezeState = !cardData.is_frozen;
      
      // Update card status
      const { error: updateError } = await supabase
        .from('cards')
        .update({ 
          is_frozen: newFreezeState,
          card_status: newFreezeState ? 'frozen' : 'active',
          frozen_at: newFreezeState ? new Date().toISOString() : null,
          freeze_reason: newFreezeState ? 'User requested freeze' : null
        })
        .eq('id', cardData.id);

      if (updateError) {
        toast.error('Failed to update card status');
        return;
      }

      // Log freeze history
      const { error: historyError } = await supabase
        .from('card_freeze_history')
        .insert({
          card_id: cardData.id,
          user_id: user?.id,
          action: newFreezeState ? 'freeze' : 'unfreeze',
          reason: newFreezeState ? 'User requested freeze' : 'User requested unfreeze',
          freeze_type: 'user_requested',
          initiated_by: 'user'
        });

      if (historyError) {
      }

      // Update local state
      setCardData({
        ...cardData,
        is_frozen: newFreezeState,
        card_status: newFreezeState ? 'frozen' : 'active'
      });

      // Update in allCards array too
      const updatedCards = allCards.map(card => 
        card.id === cardData.id 
          ? { ...card, is_frozen: newFreezeState, card_status: newFreezeState ? 'frozen' : 'active' }
          : card
      );
      setAllCards(updatedCards);

      toast.success(
        newFreezeState 
          ? 'Card has been frozen' 
          : 'Card has been unfrozen'
      );
      
      setShowFreezeDialog(false);
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleDeleteCard = async () => {
    if (!cardData || !user) return;

    setDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardData.id);

      if (deleteError) {
        toast.error('Failed to delete card');
        return;
      }

      toast.success('Card deleted successfully');
      setShowDeleteDialog(false);
      
      // Reload cards
      await loadCardData(user.id);
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setDeleting(false);
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      const newIndex = currentCardIndex - 1;
      setCurrentCardIndex(newIndex);
      setCardData(allCards[newIndex]);
      loadTransactions(allCards[newIndex].id);
      setShowDetails(false);
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < allCards.length - 1) {
      const newIndex = currentCardIndex + 1;
      setCurrentCardIndex(newIndex);
      setCardData(allCards[newIndex]);
      loadTransactions(allCards[newIndex].id);
      setShowDetails(false);
    }
  };

  const loadUserAccounts = async (userId: string) => {
    try {
      const { data: accountsData, error } = await supabase
        .from('accounts')
        .select('id, account_name, account_number, account_type, checking_balance, savings_balance, balance')
        .eq('user_id', userId)
        .in('account_type', ['checking', 'savings'])
        .order('account_type', { ascending: true });

      if (!error && accountsData) {
        setAccounts(accountsData);
        if (accountsData.length > 0) {
          setSelectedAccount(accountsData[0].id);
        }
      }
    } catch (error) {
    }
  };

  const handleAddMoney = async () => {
    if (!selectedAccount || !transferAmount || !cardData || !user) {
      toast.error('Please select an account and enter an amount');
      return;
    }

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setTransferring(true);
    try {
      // Get the selected account
      const account = accounts.find(acc => acc.id === selectedAccount);
      if (!account) {
        toast.error('Account not found');
        return;
      }

      // Get the correct balance based on account type
      const accountBalance = account.account_type === 'checking' 
        ? account.checking_balance || account.balance || 0 
        : account.savings_balance || account.balance || 0;

      // Check if account has sufficient balance
      if (accountBalance < amount) {
        toast.error(`Insufficient balance in ${account.account_type} account. Available: $${accountBalance.toFixed(2)}`);
        return;
      }

      // Deduct from account - update the correct balance field based on account type
      const balanceUpdate = account.account_type === 'checking'
        ? { checking_balance: accountBalance - amount }
        : { savings_balance: accountBalance - amount };

      const { error: accountError } = await supabase
        .from('accounts')
        .update(balanceUpdate)
        .eq('id', selectedAccount);

      if (accountError) {
        toast.error('Failed to transfer money from account');
        return;
      }

      // Add to card balance
      const { error: cardError } = await supabase
        .from('cards')
        .update({ current_balance: cardData.current_balance + amount })
        .eq('id', cardData.id);

      if (cardError) {
        // Rollback account deduction - restore the correct balance field
        const rollbackUpdate = account.account_type === 'checking'
          ? { checking_balance: accountBalance }
          : { savings_balance: accountBalance };

        await supabase
          .from('accounts')
          .update(rollbackUpdate)
          .eq('id', selectedAccount);
        toast.error('Failed to add money to card');
        return;
      }

      // Create card transaction record
      await supabase
        .from('card_transactions')
        .insert({
          card_id: cardData.id,
          user_id: user.id,
          merchant_name: `Transfer from ${account.account_type} account`,
          amount: amount,
          transaction_type: 'payment',
          status: 'completed',
          transaction_date: new Date().toISOString(),
          posted_date: new Date().toISOString()
        });

      toast.success(`Successfully added $${amount.toFixed(2)} to your card`);
      setShowAddMoneyDialog(false);
      setTransferAmount('');
      
      // Reload card data and accounts
      await loadCardData(user.id);
      await loadUserAccounts(user.id);
    } catch (error) {
      toast.error('An error occurred during transfer');
    } finally {
      setTransferring(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatCardNumber = (number: string, showFull: boolean) => {
    if (showFull) {
      return number.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    return number;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
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
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-20">
      {/* Header */}
      <Header user={userData} showBackButton={true} onBackClick={() => navigate('/dashboard')} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 mb-6">
        {/* Page Header - Professional */}
        <div className="bg-white rounded-lg shadow-card p-6 border border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Cards</h1>
              <p className="text-gray-600 mt-1">Manage your debit and credit cards</p>
            </div>
            {cardData && (
              <Button 
                onClick={() => navigate('/create-card')}
                className="bg-primary hover:bg-primary/90"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Card
              </Button>
            )}
          </div>
        </div>

        {/* Card Counter and Navigation */}
        {cardData && allCards.length > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-2 px-1">
            <div className="text-sm font-medium text-gray-700">
              Card {currentCardIndex + 1} of {allCards.length}
            </div>
            {allCards.length > 1 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousCard}
                  disabled={currentCardIndex === 0}
                  className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextCard}
                  disabled={currentCardIndex === allCards.length - 1}
                  className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}

        {cardData ? (
          <>
            {/* Card Display Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Credit Card Display - Professional Style */}
              <div className="space-y-4 lg:col-span-1">
                <Card className={`relative overflow-hidden ${getCardColor(cardData.card_color)} border-0 shadow-xl p-6 aspect-[1.6/1] w-full max-w-sm mx-auto lg:mx-0`}>
                  {/* Subtle Pattern Overlay */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
                  </div>

                  {/* Frozen Overlay */}
                  {cardData.is_frozen && (
                    <div className="absolute inset-0 bg-blue-500/40 backdrop-blur-sm flex items-center justify-center z-20">
                      <div className="text-center text-white bg-blue-600/90 px-6 py-4 rounded-lg">
                        <Lock className="h-10 w-10 mx-auto mb-2" />
                        <p className="font-semibold text-sm">Card Frozen</p>
                      </div>
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="relative z-10 h-full flex flex-col justify-between text-white">
                    {/* Card Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white/90 text-sm font-semibold tracking-wide">{websiteName.toUpperCase()}</p>
                        <p className="text-white/70 text-xs uppercase mt-0.5">{cardData.card_type} CARD</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDetails(!showDetails)}
                          className="text-white/90 hover:text-white hover:bg-white/20 p-1.5 rounded-lg"
                        >
                          {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <CreditCardIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Card Number */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-mono font-semibold tracking-wider tabular-nums flex-1">
                          {showDetails 
                            ? formatCardNumber(cardData.card_number, true)
                            : formatCardNumber(cardData.card_number_masked, false)
                          }
                        </p>
                        {showDetails && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(cardData.card_number, 'Card number')}
                            className="text-white/90 hover:text-white hover:bg-white/20 p-1.5 rounded-lg"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Card Details */}
                      <div className="flex justify-between items-end gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Card Holder</p>
                          <p className="text-sm font-semibold truncate mt-0.5">{cardData.card_holder_name.toUpperCase()}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Expires</p>
                          <p className="text-sm font-semibold mt-0.5">{cardData.expiry_date}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-white/70 text-xs font-medium uppercase tracking-wider">CVV</p>
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-semibold mt-0.5">
                              {showDetails ? cardData.cvv : '•••'}
                            </p>
                            {showDetails && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(cardData.cvv, 'CVV')}
                                className="text-white/90 hover:text-white hover:bg-white/20 p-0.5 rounded h-5 w-5"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Card Status Badge - Professional */}
                <div className="text-center">
                  <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm border ${
                    cardData.is_frozen 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      cardData.is_frozen ? 'bg-blue-500' : 'bg-green-500'
                    }`}></span>
                    {cardData.is_frozen ? 'Card Frozen' : 'Card Active'}
                  </span>
                </div>
              </div>

              {/* Card Information - Professional */}
              <div className="space-y-4 lg:col-span-2">
                <Card className="bg-white border-gray-200 p-6 shadow-card">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Card Balance</h3>
                  <div className="space-y-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600 font-medium mb-1">Current Balance</p>
                      <p className="text-3xl font-bold text-gray-900 tabular-nums">
                        {formatCurrency(cardData.current_balance || 0)}
                      </p>
                    </div>
                    {cardData.card_type === 'credit' && cardData.credit_limit && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-700 font-medium mb-1">Credit Limit</p>
                          <p className="text-xl font-bold text-blue-900 tabular-nums">
                            {formatCurrency(cardData.credit_limit)}
                          </p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-sm text-green-700 font-medium mb-1">Available Credit</p>
                          <p className="text-xl font-bold text-green-900 tabular-nums">
                            {formatCurrency(cardData.available_credit || 0)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Card Actions - Professional */}
                <Card className="bg-white border-gray-200 p-6 shadow-card">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Card Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="justify-start h-12 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      onClick={() => setShowAddMoneyDialog(true)}
                    >
                      <Plus className="h-5 w-5 mr-3 text-green-600" />
                      <span className="font-medium">Add Money</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start h-12 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      onClick={() => setShowTransactionDialog(true)}
                    >
                      <FileText className="h-5 w-5 mr-3 text-blue-600" />
                      <span className="font-medium">View Transactions</span>
                    </Button>
                    <Button
                      variant="outline"
                      className={`justify-start h-12 border-gray-300 hover:bg-gray-50 transition-colors ${
                        cardData.is_frozen 
                          ? 'bg-blue-50 text-blue-700 border-blue-300' 
                          : 'bg-white text-gray-700'
                      }`}
                      onClick={() => setShowFreezeDialog(true)}
                    >
                      <Lock className={`h-5 w-5 mr-3 ${cardData.is_frozen ? 'text-blue-600' : 'text-orange-600'}`} />
                      <span className="font-medium">{cardData.is_frozen ? 'Unfreeze Card' : 'Freeze Card'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start h-12 bg-white border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors sm:col-span-2"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-5 w-5 mr-3" />
                      <span className="font-medium">Delete Card</span>
                    </Button>
                  </div>
                </Card>
              </div>
            </div>

            {/* Enhanced Features Tabs */}
            <Card className="bg-white border-gray-200 shadow-card mt-8">
              <Tabs defaultValue="analytics" className="w-full">
                <div className="border-b border-gray-200 px-6">
                  <TabsList className="bg-transparent h-auto p-0 gap-6">
                    <TabsTrigger 
                      value="analytics" 
                      className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-4 text-gray-600 data-[state=active]:text-primary font-medium"
                    >
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger 
                      value="transactions"
                      className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-4 text-gray-600 data-[state=active]:text-primary font-medium"
                    >
                      Transactions
                    </TabsTrigger>
                    <TabsTrigger 
                      value="controls"
                      className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-4 text-gray-600 data-[state=active]:text-primary font-medium"
                    >
                      Controls
                    </TabsTrigger>
                    <TabsTrigger 
                      value="recurring"
                      className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-4 text-gray-600 data-[state=active]:text-primary font-medium"
                    >
                      Recurring
                    </TabsTrigger>
                    <TabsTrigger 
                      value="virtual"
                      className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-4 text-gray-600 data-[state=active]:text-primary font-medium"
                    >
                      Virtual Cards
                    </TabsTrigger>
                    <TabsTrigger 
                      value="rewards"
                      className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 py-4 text-gray-600 data-[state=active]:text-primary font-medium"
                    >
                      Rewards
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="analytics" className="mt-0">
                    <CardAnalytics 
                      transactions={transactions} 
                      cardBalance={cardData.current_balance || 0}
                      creditLimit={cardData.credit_limit}
                    />
                  </TabsContent>

                  <TabsContent value="transactions" className="mt-0">
                    <TransactionFilters 
                      transactions={transactions}
                      onFilteredTransactions={(filtered) => setTransactions(filtered)}
                    />
                  </TabsContent>

                  <TabsContent value="controls" className="mt-0">
                    <CardControls cardId={cardData.id} />
                  </TabsContent>

                  <TabsContent value="recurring" className="mt-0">
                    <RecurringCharges transactions={transactions} />
                  </TabsContent>

                  <TabsContent value="virtual" className="mt-0">
                    <VirtualCards 
                      parentCardId={cardData.id}
                      onCardCreated={(card) => toast.success('Virtual card created successfully')}
                    />
                  </TabsContent>

                  <TabsContent value="rewards" className="mt-0">
                    <RewardsTracker 
                      cardId={cardData.id} 
                      monthlySpending={transactions
                        .filter(t => {
                          const date = new Date(t.transaction_date);
                          const now = new Date();
                          return date.getMonth() === now.getMonth() && 
                                 date.getFullYear() === now.getFullYear() &&
                                 t.transaction_type === 'purchase';
                        })
                        .reduce((sum, t) => sum + t.amount, 0)
                      } 
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </>
        ) : (
          <Card className="p-12 text-center bg-white border-gray-200 shadow-card">
            <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CreditCardIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Card Found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You don't have a card yet. Create one now to start making transactions!
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => navigate('/create-card')}
                size="lg"
                className="px-8"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Card
              </Button>
              <Button 
                onClick={() => navigate('/dashboard')}
                variant="outline"
                size="lg"
              >
                Return to Dashboard
              </Button>
            </div>
          </Card>
        )}
      </div>

      <BottomNavigation />

      {/* Transaction Dialog */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="sm:max-w-[500px] mx-4">
          <DialogHeader>
            <DialogTitle>Card Transactions</DialogTitle>
            <DialogDescription>
              Recent transactions for your card
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{transaction.merchant_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.transaction_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <span className={`font-medium ${
                        transaction.transaction_type === 'refund' || transaction.transaction_type === 'payment'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'refund' || transaction.transaction_type === 'payment' ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </span>
                      <p className="text-xs text-gray-500 capitalize">{transaction.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No transactions yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Freeze Card Confirmation Dialog */}
      <Dialog open={showFreezeDialog} onOpenChange={setShowFreezeDialog}>
        <DialogContent className="sm:max-w-[400px] mx-4">
          <DialogHeader>
            <DialogTitle>
              {cardData?.is_frozen ? 'Unfreeze Card' : 'Freeze Card'}
            </DialogTitle>
            <DialogDescription>
              {cardData?.is_frozen 
                ? 'Are you sure you want to unfreeze your card?'
                : 'Are you sure you want to freeze your card?'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {cardData?.is_frozen
                ? 'Unfreezing your card will allow all transactions to proceed normally.'
                : 'Freezing your card will temporarily block all transactions. You can unfreeze it anytime.'
              }
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowFreezeDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant={cardData?.is_frozen ? 'default' : 'destructive'}
                onClick={handleFreezeCard}
              >
                {cardData?.is_frozen ? 'Yes, Unfreeze Card' : 'Yes, Freeze Card'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Card Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px] mx-4">
          <DialogHeader>
            <DialogTitle>Delete Card</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this card?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This action cannot be undone. All card data and transaction history will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCard}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Card'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Money Dialog */}
      <Dialog open={showAddMoneyDialog} onOpenChange={setShowAddMoneyDialog}>
        <DialogContent className="sm:max-w-[500px] mx-4">
          <DialogHeader>
            <DialogTitle>Add Money to Card</DialogTitle>
            <DialogDescription>
              Transfer money from your bank account to your card
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {accounts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-600 mb-4">No checking or savings accounts found</p>
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <Label>Select Account</Label>
                  <RadioGroup value={selectedAccount} onValueChange={setSelectedAccount}>
                    {accounts.map((account) => (
                      <div key={account.id} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value={account.id} id={account.id} />
                        <Label htmlFor={account.id} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium capitalize">{account.account_type} Account</p>
                              <p className="text-sm text-gray-500">
                                {account.account_number ? `****${account.account_number.slice(-4)}` : 'Account'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                ${(account.account_type === 'checking' 
                                  ? account.checking_balance || account.balance || 0 
                                  : account.savings_balance || account.balance || 0).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">Available</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="pl-8"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {selectedAccount && transferAmount && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      {(() => {
                        const selectedAcc = accounts.find(a => a.id === selectedAccount);
                        const accountBalance = selectedAcc 
                          ? (selectedAcc.account_type === 'checking' 
                            ? selectedAcc.checking_balance || selectedAcc.balance || 0 
                            : selectedAcc.savings_balance || selectedAcc.balance || 0)
                          : 0;
                        return parseFloat(transferAmount) > accountBalance ? (
                          <>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="text-red-600">Insufficient balance</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">Sufficient balance</span>
                          </>
                        );
                      })()}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddMoneyDialog(false);
                      setTransferAmount('');
                    }}
                    disabled={transferring}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddMoney}
                    disabled={transferring || !selectedAccount || !transferAmount || parseFloat(transferAmount) <= 0}
                  >
                    {transferring ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Transferring...
                      </>
                    ) : (
                      'Add Money'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cards;
