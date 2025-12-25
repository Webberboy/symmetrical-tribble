import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EyeIcon as Eye, EyeSlashIcon as EyeOff, ClipboardDocumentIcon as Copy, ArrowRightOnRectangleIcon as Transfer, DocumentTextIcon as Transaction, CreditCardIcon } from '@heroicons/react/24/outline'
import { Bitcoin, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import { getAuthenticatedUser } from '@/lib/authUtils';

interface Account {
  id: number;
  name: string;
  type: 'savings' | 'current' | 'investment';
  balance: number;
  accountNumber: string;
  lastCredit: number;
  lastDebit: number;
}

const AccountBalances: React.FC = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [currentAccount, setCurrentAccount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real account data from Supabase
  useEffect(() => {
    fetchAccountData();
  }, []);

  // Memoized user data to prevent redundant fetches
  const [cachedUser, setCachedUser] = useState<any>(null);

  const fetchAccountData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use cached user data if available
      let user = cachedUser;
      if (!user) {
        // Check if user is authenticated using the utility function
        user = await getAuthenticatedUser(true, navigate);
        if (!user) {
          // The utility function will handle redirect and toast
          return;
        }
        setCachedUser(user); // Cache for future use
      }

      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .in('account_type', ['checking', 'savings'])
        .order('account_type', { ascending: true });

      if (accountsError) {
        console.error('Error fetching accounts:', accountsError);
        setError('Failed to load account data');
        return;
      }

      if (!accountsData || accountsData.length === 0) {
        // No accounts found - this shouldn't happen but handle gracefully
        setAccounts([]);
        setIsLoading(false);
        return;
      }

      // Fetch last credit/debit from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('checking_last_credit, checking_last_debit, savings_last_credit, savings_last_debit')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Map accounts data to component format
      const userAccounts: Account[] = accountsData.map((account, index) => ({
        id: index + 1,
        name: account.account_type === 'savings' ? 'Savings Account' : 'Checking Account',
        type: account.account_type === 'savings' ? 'savings' : 'current',
        balance: account.account_type === 'checking' 
          ? (account.checking_balance || account.balance || 0.00)
          : (account.savings_balance || account.balance || 0.00),
        accountNumber: account.account_number, // Show full account number
        lastCredit: account.account_type === 'checking' 
          ? (profile?.checking_last_credit || 0.00)
          : (profile?.savings_last_credit || 0.00),
        lastDebit: account.account_type === 'checking'
          ? (profile?.checking_last_debit || 0.00)
          : (profile?.savings_last_debit || 0.00)
      }));

      setAccounts(userAccounts);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load account data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const scrollToCard = (index: number) => {
    if (scrollContainerRef.current && !isTransitioning) {
      setIsTransitioning(true);
      const container = scrollContainerRef.current;
      // For full-width cards, each card takes the full container width
      const cardWidth = container.clientWidth;
      const targetScroll = index * cardWidth;
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
      
      setCurrentAccount(index);
      
      // Reset transition state after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleStart = (clientX: number) => {
    if (scrollContainerRef.current && !isTransitioning) {
      setIsDragging(true);
      setStartX(clientX);
      setScrollLeft(scrollContainerRef.current.scrollLeft);
      setDragOffset(0);
      scrollContainerRef.current.style.scrollBehavior = 'auto';
    }
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !scrollContainerRef.current || isTransitioning) return;
    
    const x = clientX;
    const walk = (x - startX) * 1.5; // Increase sensitivity for smoother feel
    const newOffset = -walk;
    setDragOffset(newOffset);
    
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleEnd = () => {
    if (!isDragging || !scrollContainerRef.current || isTransitioning) return;
    
    setIsDragging(false);
    setIsTransitioning(true);
    
    const container = scrollContainerRef.current;
    const cardWidth = container.scrollWidth / accounts.length;
    const currentScroll = container.scrollLeft;
    const threshold = cardWidth * 0.3; // 30% threshold for card change
    
    let targetIndex = Math.round(currentScroll / cardWidth);
    
    // Adjust based on drag direction and threshold
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0 && targetIndex > 0) {
        targetIndex = targetIndex - 1;
      } else if (dragOffset < 0 && targetIndex < accounts.length - 1) {
        targetIndex = targetIndex + 1;
      }
    }
    
    // Ensure target index is within bounds
    targetIndex = Math.max(0, Math.min(accounts.length - 1, targetIndex));
    
    container.style.scrollBehavior = 'smooth';
    const targetScroll = targetIndex * cardWidth;
    container.scrollTo({ left: targetScroll });
    
    setCurrentAccount(targetIndex);
    setDragOffset(0);
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Enhanced scroll position tracking with smooth updates
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isDragging || isTransitioning) return;
      
      // For full-width cards, each card takes the full container width
      const cardWidth = container.clientWidth;
      const scrollPosition = container.scrollLeft;
      const newCurrentAccount = Math.round(scrollPosition / cardWidth);
      
      if (newCurrentAccount !== currentAccount && newCurrentAccount >= 0 && newCurrentAccount < accounts.length) {
        setCurrentAccount(newCurrentAccount);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentAccount, isDragging, isTransitioning, accounts.length]);

  const AccountCard = ({ account }: { account: Account }) => (
    <Card className="relative overflow-hidden bg-white border border-gray-200 shadow-card hover:shadow-card-hover transition-all duration-200 p-6">
      {/* Hide/Show Balance Button - Top Right Corner */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowBalance(!showBalance);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors"
        >
          {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {/* Account Type */}
      <div className="mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              {account.name.replace(' Account', '')}
            </h3>
            <p className="text-xs text-gray-500">{account.type === 'savings' ? 'Savings' : 'Checking'}</p>
          </div>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <p className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-1">Available Balance</p>
        <div className="text-3xl font-bold text-gray-900 tabular-nums">
          {showBalance ? formatCurrency(account.balance) : '••••••••'}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4"></div>

      {/* Account Number Box */}
      <div className="mb-4">
        <p className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-2">Account Number</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900 font-mono font-semibold">
                {showBalance ? account.accountNumber : '••••••••••••'}
              </p>
            </div>
            {showBalance && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigator.clipboard.writeText(account.accountNumber);
                  sonnerToast.success('Account number copied!');
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="text-gray-500 hover:text-primary transition-colors p-1 rounded hover:bg-gray-100"
                title="Copy account number"
              >
                <Copy className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate('/transactions');
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="bg-white text-gray-700 border-gray-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
        >
          <Transaction className="h-4 w-4 mr-2" />
          Transactions
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate('/internal-transfer');
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="bg-primary hover:bg-primary/90 transition-colors"
        >
          <Transfer className="h-4 w-4 mr-2" />
          Transfer
        </Button>
      </div>

    </Card>
  );

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        {/* Skeleton loading state for better UX */}
        <div className="hidden md:block">
          <div className="grid grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
                  <div className="h-8 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="border-t border-gray-200 my-4"></div>
                <div className="mb-4">
                  <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="md:hidden">
          <div className="flex overflow-x-auto -mx-4 px-4 space-x-4">
            {[1, 2].map((i) => (
              <div key={i} className="w-full flex-shrink-0 bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
                  <div className="h-8 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="border-t border-gray-200 my-4"></div>
                <div className="mb-4">
                  <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="w-full space-y-6">
        {/* Empty state with helpful message */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Accounts Found</h3>
          <p className="text-gray-600 mb-4">You don't have any active accounts at the moment.</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Try Again
          </Button>
        </div>
        
        {/* Quick Actions Section - Still show even with no accounts */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/internal-transfer')}
              className="flex flex-col items-center justify-center p-4 h-24 bg-white border-gray-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors group"
            >
              <Transfer className="h-6 w-6 mb-2 text-gray-700 group-hover:text-white" />
              <span className="text-sm font-medium">Transfer</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/cards')}
              className="flex flex-col items-center justify-center p-4 h-24 bg-white border-gray-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors group"
            >
              <CreditCardIcon className="h-6 w-6 mb-2 text-gray-700 group-hover:text-white" />
              <span className="text-sm font-medium">My Card</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/bills')}
              className="flex flex-col items-center justify-center p-4 h-24 bg-white border-gray-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors group"
            >
              <Receipt className="h-6 w-6 mb-2 text-gray-700 group-hover:text-white" />
              <span className="text-sm font-medium">Bills</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/crypto')}
              className="flex flex-col items-center justify-center p-4 h-24 bg-white border-gray-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors group"
            >
              <Bitcoin className="h-6 w-6 mb-2 text-gray-700 group-hover:text-white" />
              <span className="text-sm font-medium">Crypto</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Enhanced Desktop View with full-width equal cards */}
      <div className="hidden md:block">
        <div 
          ref={scrollContainerRef}
          className={`grid grid-cols-2 gap-6 ${
            isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {accounts.map((account, index) => (
            <div 
              key={account.id} 
              className="w-full"
            >
              <AccountCard account={account} />
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Mobile View with full-width edge-to-edge cards */}
      <div className="md:hidden -mx-4">
        <div 
          ref={scrollContainerRef}
          className={`flex overflow-x-auto scrollbar-hide ${
            isDragging ? 'cursor-grabbing select-none' : ''
          }`}
          style={{ 
            scrollSnapType: 'x mandatory',
            scrollBehavior: isDragging ? 'auto' : 'smooth'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {accounts.map((account, index) => (
            <div 
              key={account.id} 
              className="w-full flex-shrink-0 px-4"
              style={{ scrollSnapAlign: 'start' }}
            >
              <AccountCard account={account} />
            </div>
          ))}
        </div>

        {/* Enhanced Dot Indicators with smooth transitions */}
        <div className="flex justify-center mt-4 space-x-2 px-4">
          {accounts.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToCard(index)}
              className={`${
                index === currentAccount 
                  ? 'w-8 h-2 bg-gray-600 rounded-full' 
                  : 'w-2 h-2 bg-gray-400 rounded-full hover:bg-gray-600'
              }`}
              disabled={isTransitioning}
            />
          ))}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Transfer */}
          <Button
            variant="outline"
            onClick={() => navigate('/internal-transfer')}
            className="flex flex-col items-center justify-center p-4 h-24 bg-white border-gray-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors group"
          >
            <Transfer className="h-6 w-6 mb-2 text-gray-700 group-hover:text-white" />
            <span className="text-sm font-medium">Transfer</span>
          </Button>

          {/* My Card */}
          <Button
            variant="outline"
            onClick={() => navigate('/cards')}
            className="flex flex-col items-center justify-center p-4 h-24 bg-white border-gray-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors group"
          >
            <CreditCardIcon className="h-6 w-6 mb-2 text-gray-700 group-hover:text-white" />
            <span className="text-sm font-medium">My Card</span>
          </Button>

          {/* Bills */}
          <Button
            variant="outline"
            onClick={() => navigate('/bills')}
            className="flex flex-col items-center justify-center p-4 h-24 bg-white border-gray-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors group"
          >
            <Receipt className="h-6 w-6 mb-2 text-gray-700 group-hover:text-white" />
            <span className="text-sm font-medium">Bills</span>
          </Button>

          {/* Crypto */}
            <Button
              variant="outline"
              onClick={() => navigate('/crypto')}
              className="flex flex-col items-center justify-center p-4 h-24 bg-white border-gray-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors group"
            >
              <Bitcoin className="h-6 w-6 mb-2 text-gray-700 group-hover:text-white" />
              <span className="text-sm font-medium">Crypto</span>
            </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountBalances;