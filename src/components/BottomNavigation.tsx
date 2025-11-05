import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon as Home, 
  ReceiptPercentIcon as Receipt, 
  CreditCardIcon as CreditCard, 
  QuestionMarkCircleIcon as HelpCircle, 
  UserIcon as User 
} from '@heroicons/react/24/outline';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/dashboard'
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: Receipt,
      path: '/transactions'
    },
    {
      id: 'cards',
      label: 'My Card',
      icon: CreditCard,
      path: '/cards'
    },
    {
      id: 'support',
      label: 'Support',
      icon: HelpCircle,
      path: '/support'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/profile'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white backdrop-blur-md border-t border-gray-200 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-1 md:py-2">
        <div className="flex items-center justify-around md:justify-center md:space-x-12 lg:space-x-16">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`flex flex-col items-center justify-center p-2 md:p-3 md:px-6 rounded-lg transition-all duration-200 relative ${
                  active 
                    ? 'text-gray-800 bg-gray-100' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <IconComponent className={`h-4 w-4 md:h-5 md:w-5 mb-1 ${active ? 'text-gray-800' : 'text-current'}`} />
                <span className={`text-xs font-medium ${active ? 'text-gray-800' : 'text-current'}`}>
                  {item.label}
                </span>
                
                {/* Active Indicator */}
                {active && (
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gray-600 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Safe Area for iOS - only on mobile */}
      <div className="h-safe-area-inset-bottom bg-white md:hidden"></div>
    </div>
  );
};

export default BottomNavigation;