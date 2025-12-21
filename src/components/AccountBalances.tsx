import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EyeIcon as Eye, EyeSlashIcon as EyeOff, ClipboardDocumentIcon as Copy } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';

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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real account data from Supabase
  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Fetch accounts from accounts table
      const { data: accountsData, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .in('account_type', ['checking', 'savings'])
        .order('account_type', { ascending: true });

      if (error) {
        console.error('Error fetching accounts:', error);
        toast({
          title: "Error",
          description: "Failed to load account information",
          variant: "destructive"
        });
        setIsLoading(false);
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
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive"
      });
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

      {/* Account Number */}
      <div className="mb-4">
        <p className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-1">Account Number</p>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-900 font-mono font-semibold">
            {showBalance ? account.accountNumber : '••••••••••••'}
          </p>
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

      {/* Transaction Information */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-lg p-3">
          <p className="text-xs text-green-700 font-medium uppercase tracking-wider mb-1">Last Credit</p>
          <p className="text-lg font-bold text-green-900 tabular-nums">
            {showBalance ? formatCurrency(account.lastCredit) : '••••••'}
          </p>
        </div>
        
        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
          <p className="text-xs text-red-700 font-medium uppercase tracking-wider mb-1">Last Debit</p>
          <p className="text-lg font-bold text-red-900 tabular-nums">
            {showBalance ? formatCurrency(account.lastDebit) : '••••••'}
          </p>
        </div>
      </div>

    </Card>
  );

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-600">No accounts found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
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
    </div>
  );
};

export default AccountBalances;