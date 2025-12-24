import React from 'react';
import { Card } from '@/components/ui/card';
import { ShieldCheckIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const PromotionalBanner: React.FC = () => {
  return (
    <div className="w-full px-4 py-6">
      <Card className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Main Content */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-full">
                  <ShieldCheckIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">
                    Your Data is Protected
                  </h2>
                  <p className="text-blue-100 text-sm md:text-base">
                    Manage your finances with confidence and peace of mind
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-lg">
                      Secure Platform
                    </p>
                    <p className="text-blue-100 text-sm">
                      Your accounts are protected with industry-standard security measures
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">
                      Enterprise-Grade Security
                    </p>
                    <p className="text-blue-100 text-sm">
                      Advanced encryption and multi-factor authentication protect your accounts 24/7
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">
                      Growing Community
                    </p>
                    <p className="text-blue-100 text-sm">
                      Join our community of users managing their financial future
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Side Info */}
            <div className="md:w-64 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-200" />
                <h3 className="font-semibold text-sm">Security Features</h3>
              </div>
              <ul className="space-y-2 text-sm text-blue-100">
                <li>• Real-time fraud monitoring</li>
                <li>• Instant transaction alerts</li>
                <li>• Secure mobile banking</li>
                <li>• 24/7 account protection</li>
                <li>• Zero liability guarantee</li>
              </ul>
            </div>
          </div>
          
          {/* Bottom disclaimer */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <p className="text-xs text-blue-200">
              Your privacy and security are our top priorities. All transactions are encrypted and monitored. 
              Terms and conditions apply.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PromotionalBanner;