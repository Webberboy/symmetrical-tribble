import React from 'react';
import { useNavigate } from 'react-router-dom';

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();

  const handlePrivacyClick = () => {
    navigate('/privacy-policy');
  };

  const handleTermsClick = () => {
    navigate('/terms');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white backdrop-blur-md border-t border-gray-200 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center space-x-4">
          {/* Copyright Text */}
          <p className="text-sm text-gray-600 font-medium">
            © 2025 Unity Capital Bank. All rights reserved.
          </p>
          
          {/* Separator */}
          <span className="text-sm text-gray-400">•</span>
          
          {/* Privacy Link */}
          <button
            onClick={handlePrivacyClick}
            className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors duration-200"
          >
            Privacy Policy
          </button>
          
          {/* Separator */}
          <span className="text-sm text-gray-400">•</span>
          
          {/* Terms Link */}
          <button
            onClick={handleTermsClick}
            className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors duration-200"
          >
            Terms & Conditions
          </button>
        </div>
      </div>
      
      {/* Safe Area for iOS - only on mobile */}
      <div className="h-safe-area-inset-bottom bg-white md:hidden"></div>
    </div>
  );
};

export default BottomNavigation;