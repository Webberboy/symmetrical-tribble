import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, LogOut, ChevronDown } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useUser } from "@/contexts/UserContext";
import NotificationsPanel from "@/components/NotificationsPanel";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  showBackButton?: boolean;
  onBackClick?: () => void;
  title?: string;
}

const Header = ({ user, showBackButton = false, onBackClick, title }: HeaderProps) => {
  const navigate = useNavigate();
  const { websiteName, logoUrl } = useSettings();
  const { userId } = useUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsProfileOpen(false);
    navigate("/auth");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Back Button and Title/Date */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackClick}
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            
            {title ? (
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            ) : (
              <div className="hidden sm:block text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            )}
          </div>

          {/* Notifications and User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Notification Bell */}
            {userId && <NotificationsPanel userId={userId} />}
            
            {/* User Profile Dropdown */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100"
                >
                  <Avatar className="h-8 w-8 border-2 border-gray-200">
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="Profile" />}
                    <AvatarFallback className="bg-primary text-white text-xs font-semibold">
                      {user.firstName[0]}{user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </Button>
                
                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigate('/profile');
                        setIsProfileOpen(false);
                      }}
                      className="w-full justify-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full justify-start px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;