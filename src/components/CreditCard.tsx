import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EyeIcon as Eye, EyeSlashIcon as EyeOff, CreditCardIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/contexts/SettingsContext';

const CreditCard: React.FC = () => {
  const { websiteName } = useSettings();
  const [showDetails, setShowDetails] = useState(false);

  const cardData = {
    number: '4716 XXXX XXXX 3329',
    holder: 'MARC DAVID',
    expiry: '10/26',
    cvv: '***',
    balance: 15420.50,
    limit: 25000.00,
    availableCredit: 9579.50
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="w-full space-y-6">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{websiteName} Cards</h2>
          <p className="text-gray-600">Manage your credit cards</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {/* Credit Card */}
      <div className="relative">
        <Card className="relative overflow-hidden bg-white border-gray-300 p-8 aspect-[1.6/1] max-w-md">
          {/* Card Background Pattern - Removed colorful gradients */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-32 h-32 bg-gray-300 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-24 h-24 bg-gray-300 rounded-full"></div>
          </div>

          {/* Card Content */}
          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* Top Section */}
            <div className="flex items-start justify-between">
              {/* Chip */}
              <div className="w-12 h-9 bg-gray-400 rounded-md flex items-center justify-center">
                <div className="w-8 h-6 bg-gray-300 rounded-sm"></div>
              </div>
              
              {/* Contactless Symbol */}
              <div className="text-gray-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="rotate-90">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
                </svg>
              </div>
            </div>

            {/* Card Number */}
            <div className="text-center">
              <div className="text-xl font-mono font-bold text-gray-900 tracking-wider mb-4">
                {showDetails ? cardData.number : '4716 XXXX XXXX 3329'}
              </div>
            </div>

            {/* Bottom Section */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">CARD HOLDER</p>
                <p className="text-sm font-semibold text-white tracking-wide">
                  {showDetails ? cardData.holder : 'MARC DAVID'}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">EXPIRES</p>
                <p className="text-sm font-semibold text-white">
                  {showDetails ? cardData.expiry : '10/26'}
                </p>
              </div>
            </div>
          </div>

          {/* Bank Logo */}
          <div className="absolute top-6 right-6">
            <div className="flex items-center space-x-2">
              <CreditCardIcon className="h-6 w-6 text-white/80" />
              <span className="text-xs font-bold text-white/80">UCB</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Card Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200 p-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Balance</p>
            <p className="text-lg font-bold text-red-600">
              {showDetails ? formatCurrency(cardData.balance) : '••••••'}
            </p>
          </div>
        </Card>

        <Card className="bg-white border-gray-200 p-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Credit Limit</p>
            <p className="text-lg font-bold text-gray-800">
              {showDetails ? formatCurrency(cardData.limit) : '••••••'}
            </p>
          </div>
        </Card>

        <Card className="bg-white border-gray-200 p-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Available Credit</p>
            <p className="text-lg font-bold text-green-600">
              {showDetails ? formatCurrency(cardData.availableCredit) : '••••••'}
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        >
          Make Payment
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        >
          View Statements
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        >
          Freeze Card
        </Button>
      </div>
    </div>
  );
};

export default CreditCard;