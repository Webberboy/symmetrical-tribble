import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowUpRightIcon as ArrowUpRight, 
  CurrencyDollarIcon as Bitcoin, 
  CreditCardIcon as CreditCard, 
  BuildingOffice2Icon as Building2, 
  DevicePhoneMobileIcon as Smartphone,
  ArrowTrendingUpIcon as TrendingUp,
  GlobeAltIcon as Globe,
  ArrowRightIcon as ArrowRight,
  HandRaisedIcon as HandCoins,
  ChartBarIcon as BarChart3,
  ReceiptPercentIcon as Receipt,
  DocumentTextIcon as DocumentText,
  CameraIcon as Camera,
  ChartPieIcon as ChartPie,
  ArrowDownTrayIcon as ArrowDownTray
} from '@heroicons/react/24/outline';

interface ServiceItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'transfer' | 'crypto' | 'loan' | 'investment' | 'bills' | 'documents' | 'deposit' | 'budgets' | 'request';
  path?: string;
}

const BankingServices: React.FC = () => {
  const navigate = useNavigate();
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
    enableRequestMoney
  } = useSettings();
  
  const services: ServiceItem[] = [
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
    {
      id: 'crypto',
      title: 'Crypto',
      icon: Bitcoin,
      category: 'crypto',
      path: '/crypto'
    },
    {
      id: 'bills',
      title: 'Bills',
      icon: Receipt,
      category: 'bills',
      path: '/bills'
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
    {
      id: 'statements',
      title: 'Statements',
      icon: DocumentText,
      category: 'documents',
      path: '/statements'
    },
    {
      id: 'mobile-deposit',
      title: 'Mobile Deposit',
      icon: Camera,
      category: 'deposit',
      path: '/mobile-deposit'
    },
    {
      id: 'budgets',
      title: 'Budgets',
      icon: ChartPie,
      category: 'budgets',
      path: '/budgets'
    },
    {
      id: 'request-money',
      title: 'Request Money',
      icon: ArrowDownTray,
      category: 'request',
      path: '/request-money'
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

  const getCategoryColor = (category: ServiceItem['category']) => {
    // Professional solid colors instead of gradients
    switch(category) {
      case 'transfer':
        return 'bg-blue-50 border-blue-100 hover:bg-blue-100';
      case 'crypto':
        return 'bg-purple-50 border-purple-100 hover:bg-purple-100';
      case 'loan':
        return 'bg-green-50 border-green-100 hover:bg-green-100';
      case 'investment':
        return 'bg-orange-50 border-orange-100 hover:bg-orange-100';
      case 'bills':
        return 'bg-red-50 border-red-100 hover:bg-red-100';
      case 'documents':
        return 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100';
      case 'deposit':
        return 'bg-teal-50 border-teal-100 hover:bg-teal-100';
      case 'budgets':
        return 'bg-amber-50 border-amber-100 hover:bg-amber-100';
      case 'request':
        return 'bg-cyan-50 border-cyan-100 hover:bg-cyan-100';
      default:
        return 'bg-gray-50 border-gray-100 hover:bg-gray-100';
    }
  };

  const getIconColor = (category: ServiceItem['category']) => {
    // Professional icon colors matching category
    switch(category) {
      case 'transfer':
        return 'text-blue-600';
      case 'crypto':
        return 'text-purple-600';
      case 'loan':
        return 'text-green-600';
      case 'investment':
        return 'text-orange-600';
      case 'bills':
        return 'text-red-600';
      case 'documents':
        return 'text-indigo-600';
      case 'deposit':
        return 'text-teal-600';
      case 'budgets':
        return 'text-amber-600';
      case 'request':
        return 'text-cyan-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleWireTransferClick = async () => {
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
        // If no checking account found, still go to wire amount entry
        // The WireAccountSelection component will auto-select or show available accounts
        navigate('/wire-amount-entry');
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
      // If any error occurs, still go to wire amount entry
      // The WireAccountSelection component will handle account selection
      navigate('/wire-amount-entry');
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredServices.map((service) => {
          const IconComponent = service.icon;
          return (
            <Card
              key={service.id}
              className={`relative overflow-hidden ${getCategoryColor(service.category)} border shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer group`}
              onClick={() => {
                if (service.id === 'wire-transfer' && service.path) {
                  // Auto-select checking account and skip selection page
                  handleWireTransferClick();
                } else if (service.path) {
                  navigate(service.path);
                }
              }}
            >
              <div className="p-4 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <IconComponent className={`h-6 w-6 ${getIconColor(service.category)}`} />
                  </div>
                </div>
                
                <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                  {service.title}
                </h3>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BankingServices;