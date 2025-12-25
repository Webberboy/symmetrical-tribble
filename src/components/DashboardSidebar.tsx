import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogOut, User, Home, CreditCard, HelpCircle, Banknote, ArrowUpRight, Bitcoin, Building2, Smartphone, TrendingUp, Globe, ArrowRight, HandCoins, BarChart3, Receipt, FileText, Camera, PieChart, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardSidebarProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
}

interface ServiceItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'main' | 'transfer' | 'crypto' | 'loan' | 'investment' | 'bills' | 'documents' | 'deposit' | 'budgets' | 'request' | 'cards' | 'support';
  path?: string;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ user }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    enableCrypto, 
    enableWireTransfers, 
    enableInternalTransfers,
    enableLoans, 
    enableBills, 
    enableInvestments,
    enableStatements,
    enableMobileDeposit,
    enableBudgets,
    enableRequestMoney,
    websiteName,
    logoUrl
  } = useSettings();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const services: ServiceItem[] = [
    // Main Navigation (from footer)
    {
      id: 'home',
      title: 'Home',
      icon: Home,
      category: 'main',
      path: '/dashboard'
    },
    {
      id: 'transactions',
      title: 'Transactions',
      icon: Banknote,
      category: 'main',
      path: '/transactions'
    },
    {
      id: 'cards',
      title: 'My Card',
      icon: CreditCard,
      category: 'cards',
      path: '/cards'
    },
    {
      id: 'support',
      title: 'Support',
      icon: HelpCircle,
      category: 'support',
      path: '/support'
    },
    
    // Transfers Section
    {
      id: 'wire-transfer',
      title: 'Wire Transfer',
      icon: ArrowUpRight,
      category: 'transfer',
      path: '/transfer'
    },
    {
      id: 'internal-transfer',
      title: 'Internal Transfer',
      icon: ArrowRight,
      category: 'transfer',
      path: '/internal-transfer'
    },
    
    // Financial Services
    {
      id: 'crypto',
      title: 'Crypto',
      icon: Bitcoin,
      category: 'crypto',
      path: '/crypto'
    },
    {
      id: 'ucb-loans',
      title: 'Loans',
      icon: HandCoins,
      category: 'loan',
      path: '/loans'
    },
    {
      id: 'ucb-investments',
      title: 'Investments',
      icon: BarChart3,
      category: 'investment',
      path: '/investment'
    },
    
    // Management
    {
      id: 'bills',
      title: 'Bills',
      icon: Receipt,
      category: 'bills',
      path: '/bills'
    },
    {
      id: 'budgets',
      title: 'Budgets',
      icon: PieChart,
      category: 'budgets',
      path: '/budgets'
    },
    {
      id: 'request-money',
      title: 'Request Money',
      icon: Download,
      category: 'request',
      path: '/request-money'
    },
    {
      id: 'mobile-deposit',
      title: 'Mobile Deposit',
      icon: Camera,
      category: 'deposit',
      path: '/mobile-deposit'
    },
    
    // Documents & Reports
    {
      id: 'statements',
      title: 'Statements',
      icon: FileText,
      category: 'documents',
      path: '/statements'
    }
  ];

  // Filter services based on feature toggles
  const filteredServices = services.filter(service => {
    if (service.category === 'crypto' && !enableCrypto) return false;
    if (service.category === 'transfer' && service.id === 'wire-transfer' && !enableWireTransfers) return false;
    if (service.category === 'transfer' && service.id === 'internal-transfer' && !enableInternalTransfers) return false;
    if (service.category === 'loan' && !enableLoans) return false;
    if (service.category === 'bills' && !enableBills) return false;
    if (service.category === 'investment' && !enableInvestments) return false;
    if (service.category === 'documents' && !enableStatements) return false;
    if (service.category === 'deposit' && !enableMobileDeposit) return false;
    if (service.category === 'budgets' && !enableBudgets) return false;
    if (service.category === 'request' && !enableRequestMoney) return false;
    return true;
  });

  // Group services by category for better organization
  const groupedServices = filteredServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<ServiceItem['category'], ServiceItem[]>);

  const categoryTitles = {
    main: 'Main Navigation',
    transfer: 'Transfers',
    crypto: 'Digital Assets',
    loan: 'Financial Services',
    investment: 'Investments',
    bills: 'Management',
    documents: 'Documents & Reports',
    deposit: 'Deposit Services',
    budgets: 'Budget Tools',
    request: 'Request Services',
    cards: 'Card Services',
    support: 'Support'
  };

  const getCategoryColor = (category: ServiceItem['category']) => {
    return 'text-gray-800 bg-gray-100 hover:bg-red-600 hover:text-white';
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
    navigate("/auth");
  };

  const handleServiceClick = async (path: string) => {
    if (path === '/transfer') {
      // Auto-select checking account and skip selection page for wire transfers
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/signin');
          return;
        }

        // Fetch checking account
        const { data: accountsData, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('account_type', 'checking')
          .single();

        if (error || !accountsData) {
          // If no checking account found, fall back to normal flow
          navigate('/transfer');
          return;
        }

        // Create checking account object and store in localStorage
        const checkingAccount = {
          id: 'checking',
          name: 'My Checking',
          type: 'Checking Account',
          balance: accountsData.checking_balance || 0.00,
          accountNumber: accountsData.account_number,
          account_type: 'checking'
        };

        localStorage.setItem('wireTransferAccount', JSON.stringify(checkingAccount));
        navigate('/wire-amount-entry');
      } catch (error) {
        // If any error occurs, fall back to normal flow
        navigate('/transfer');
      }
    } else {
      navigate(path);
    }
  };

  // Scroll lock behavior
  useEffect(() => {
    const sidebar = sidebarRef.current;
    
    if (!sidebar) return;

    const handleWheel = (e: WheelEvent) => {
      const isScrollingDown = e.deltaY > 0;
      const isAtTop = sidebar.scrollTop === 0;
      const isAtBottom = sidebar.scrollTop + sidebar.clientHeight >= sidebar.scrollHeight - 1;
      
      // If scrolling down and at bottom, or scrolling up and at top, prevent default
      if ((isScrollingDown && isAtBottom) || (!isScrollingDown && isAtTop)) {
        e.preventDefault();
        return;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const isAtTop = sidebar.scrollTop === 0;
      const isAtBottom = sidebar.scrollTop + sidebar.clientHeight >= sidebar.scrollHeight - 1;
      
      // Prevent overscroll on touch devices
      if ((e.touches[0].clientY < sidebar.getBoundingClientRect().top && isAtTop) ||
          (e.touches[0].clientY > sidebar.getBoundingClientRect().bottom && isAtBottom)) {
        e.preventDefault();
      }
    };

    sidebar.addEventListener('wheel', handleWheel, { passive: false });
    sidebar.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      sidebar.removeEventListener('wheel', handleWheel);
      sidebar.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div 
      ref={sidebarRef}
      className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col overflow-y-auto sticky top-0"
      style={{ 
        scrollbarWidth: 'none', 
        msOverflowStyle: 'none',
        overscrollBehavior: 'contain'
      }}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {logoUrl ? (
            <>
              <img 
                src={logoUrl} 
                alt={websiteName} 
                className="h-8 w-auto object-contain max-w-[120px]"
              />
              <div className="flex flex-col">
                <h1 className="text-sm font-bold text-gray-900">{websiteName}</h1>
                <p className="text-xs text-gray-600">Banking</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">{websiteName.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900">{websiteName}</h1>
                <p className="text-xs text-gray-600">Banking</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <div ref={menuRef} className="flex-1 p-4">
        {/* Main Navigation - Always show first */}
        {groupedServices.main && groupedServices.main.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
              {categoryTitles.main}
            </h4>
            <div className="space-y-1">
              {groupedServices.main.map((service) => {
                const Icon = service.icon;
                return (
                  <Button
                    key={service.id}
                    variant="ghost"
                    onClick={() => service.path && handleServiceClick(service.path)}
                    className={`w-full justify-start text-left px-2 py-2 rounded-lg transition-colors group ${getCategoryColor(service.category)}`}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="p-1.5 rounded-md bg-gray-200 group-hover:bg-red-700 transition-colors">
                        <Icon className="h-4 w-4 text-gray-700 group-hover:text-white" />
                      </div>
                      <span className="text-xs font-medium flex-1">{service.title}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Transfers Section */}
        {groupedServices.transfer && groupedServices.transfer.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
              {categoryTitles.transfer}
            </h4>
            <div className="space-y-1">
              {groupedServices.transfer.map((service) => {
                const Icon = service.icon;
                return (
                  <Button
                    key={service.id}
                    variant="ghost"
                    onClick={() => service.path && handleServiceClick(service.path)}
                    className={`w-full justify-start text-left px-2 py-2 rounded-lg transition-colors group ${getCategoryColor(service.category)}`}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="p-1.5 rounded-md bg-gray-200 group-hover:bg-red-700 transition-colors">
                        <Icon className="h-4 w-4 text-gray-700 group-hover:text-white" />
                      </div>
                      <span className="text-xs font-medium flex-1">{service.title}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Card Services */}
        {groupedServices.cards && groupedServices.cards.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
              {categoryTitles.cards}
            </h4>
            <div className="space-y-1">
              {groupedServices.cards.map((service) => {
                const Icon = service.icon;
                return (
                  <Button
                    key={service.id}
                    variant="ghost"
                    onClick={() => service.path && handleServiceClick(service.path)}
                    className={`w-full justify-start text-left px-2 py-2 rounded-lg transition-colors group ${getCategoryColor(service.category)}`}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="p-1.5 rounded-md bg-gray-200 group-hover:bg-red-700 transition-colors">
                        <Icon className="h-4 w-4 text-gray-700 group-hover:text-white" />
                      </div>
                      <span className="text-xs font-medium flex-1">{service.title}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Financial Services */}
        {(groupedServices.loan || groupedServices.investment || groupedServices.deposit || groupedServices.budgets) && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
              Financial Services
            </h4>
            {groupedServices.loan && groupedServices.loan.length > 0 && (
              <div className="space-y-1 mb-3">
                {groupedServices.loan.map((service) => {
                  const Icon = service.icon;
                  return (
                    <Button
                    key={service.id}
                    variant="ghost"
                    onClick={() => service.path && handleServiceClick(service.path)}
                    className={`w-full justify-start text-left px-2 py-2 rounded-lg transition-colors group ${getCategoryColor(service.category)}`}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="p-1.5 rounded-md bg-gray-200 group-hover:bg-red-700 transition-colors">
                        <Icon className="h-4 w-4 text-gray-700 group-hover:text-white" />
                      </div>
                      <span className="text-xs font-medium flex-1">{service.title}</span>
                    </div>
                  </Button>
                  );
                })}
              </div>
            )}
            {groupedServices.investment && groupedServices.investment.length > 0 && (
              <div className="space-y-1 mb-3">
                {groupedServices.investment.map((service) => {
                  const Icon = service.icon;
                  return (
                    <Button
                      key={service.id}
                      variant="ghost"
                      onClick={() => service.path && handleServiceClick(service.path)}
                      className={`w-full justify-start text-left px-2 py-2 rounded-lg transition-colors group ${getCategoryColor(service.category)}`}
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <div className="p-1.5 rounded-md bg-gray-200 group-hover:bg-red-700 transition-colors">
                          <Icon className="h-4 w-4 text-gray-700 group-hover:text-white" />
                        </div>
                        <span className="text-xs font-medium flex-1">{service.title}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
            {groupedServices.deposit && groupedServices.deposit.length > 0 && (
              <div className="space-y-1 mb-3">
                {groupedServices.deposit.map((service) => {
                  const Icon = service.icon;
                  return (
                    <Button
                      key={service.id}
                      variant="ghost"
                      onClick={() => service.path && handleServiceClick(service.path)}
                      className={`w-full justify-start text-left px-2 py-2 rounded-lg transition-colors group ${getCategoryColor(service.category)}`}
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <div className="p-1.5 rounded-md bg-gray-200 group-hover:bg-red-700 transition-colors">
                          <Icon className="h-4 w-4 text-gray-700 group-hover:text-white" />
                        </div>
                        <span className="text-xs font-medium flex-1">{service.title}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
            {groupedServices.budgets && groupedServices.budgets.length > 0 && (
              <div className="space-y-1">
                {groupedServices.budgets.map((service) => {
                  const Icon = service.icon;
                  return (
                    <Button
                      key={service.id}
                      variant="ghost"
                      onClick={() => service.path && handleServiceClick(service.path)}
                      className={`w-full justify-start text-left px-2 py-2 rounded-lg transition-colors group ${getCategoryColor(service.category)}`}
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <div className="p-1.5 rounded-md bg-gray-200 group-hover:bg-red-700 transition-colors">
                          <Icon className="h-4 w-4 text-gray-700 group-hover:text-white" />
                        </div>
                        <span className="text-xs font-medium flex-1">{service.title}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Management */}
        {(groupedServices.bills || groupedServices.request) && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
              Management
            </h4>
            {groupedServices.bills && groupedServices.bills.length > 0 && (
              <div className="space-y-1 mb-3">
                {groupedServices.bills.map((service) => {
                  const Icon = service.icon;
                  return (
                    <Button
                      key={service.id}
                      variant="ghost"
                      onClick={() => service.path && handleServiceClick(service.path)}
                      className={`w-full justify-start text-left px-2 py-2 rounded-lg transition-colors group ${getCategoryColor(service.category)}`}
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <div className="p-1.5 rounded-md bg-gray-200 group-hover:bg-red-700 transition-colors">
                          <Icon className="h-4 w-4 text-gray-700 group-hover:text-white" />
                        </div>
                        <span className="text-xs font-medium flex-1">{service.title}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
            {groupedServices.request && groupedServices.request.length > 0 && (
              <div className="space-y-1">
                {groupedServices.request.map((service) => {
                  const Icon = service.icon;
                  return (
                    <Button
                      key={service.id}
                      variant="ghost"
                      onClick={() => service.path && handleServiceClick(service.path)}
                      className={`w-full justify-start text-left px-2 py-2 rounded-lg transition-colors group ${getCategoryColor(service.category)}`}
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <div className="p-1.5 rounded-md bg-gray-200 group-hover:bg-red-700 transition-colors">
                          <Icon className="h-4 w-4 text-gray-700 group-hover:text-white" />
                        </div>
                        <span className="text-xs font-medium flex-1">{service.title}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Documents & Reports */}
        {groupedServices.documents && groupedServices.documents.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
              {categoryTitles.documents}
            </h4>
            <div className="space-y-1">
              {groupedServices.documents.map((service) => {
                const Icon = service.icon;
                return (
                  <Button
                    key={service.id}
                    variant="ghost"
                    onClick={() => service.path && handleServiceClick(service.path)}
                    className={`w-full justify-start text-left px-2 py-2 rounded-lg transition-colors group ${getCategoryColor(service.category)}`}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="p-1.5 rounded-md bg-gray-200 group-hover:bg-red-700 transition-colors">
                        <Icon className="h-4 w-4 text-gray-700 group-hover:text-white" />
                      </div>
                      <span className="text-xs font-medium flex-1">{service.title}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Support */}
        {groupedServices.support && groupedServices.support.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
              {categoryTitles.support}
            </h4>
            <div className="space-y-1">
              {groupedServices.support.map((service) => {
                const Icon = service.icon;
                return (
                  <Button
                      key={service.id}
                      variant="ghost"
                      onClick={() => service.path && handleServiceClick(service.path)}
                      className={`w-full justify-start text-left px-2 py-2 rounded-lg transition-colors group ${getCategoryColor(service.category)}`}
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <div className="p-1.5 rounded-md bg-gray-200 group-hover:bg-red-700 transition-colors">
                          <Icon className="h-4 w-4 text-gray-700 group-hover:text-white" />
                        </div>
                        <span className="text-xs font-medium flex-1">{service.title}</span>
                      </div>
                    </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Crypto Section */}
        {groupedServices.crypto && groupedServices.crypto.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              {categoryTitles.crypto}
            </h4>
            <div className="space-y-1">
              {groupedServices.crypto.map((service) => {
                const Icon = service.icon;
                return (
                  <Button
                    key={service.id}
                    variant="ghost"
                    onClick={() => service.path && handleServiceClick(service.path)}
                    className={`w-full justify-start text-left px-2 py-2 rounded-lg transition-colors group ${getCategoryColor(service.category)}`}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="p-1.5 rounded-md bg-gray-200 group-hover:bg-red-700 transition-colors">
                        <Icon className="h-4 w-4 text-gray-700 group-hover:text-white" />
                      </div>
                      <span className="text-xs font-medium flex-1">{service.title}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
    </div>
  );
};

export default DashboardSidebar;