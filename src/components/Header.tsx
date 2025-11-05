import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, User, ChevronDown, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { useUser } from "@/contexts/UserContext";
import NotificationsPanel from "@/components/NotificationsPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const { toast } = useToast();
  const { websiteName, logoUrl } = useSettings();
  const { userId, avatarUrl } = useUser();


  const handleLogout = () => {
    localStorage.removeItem("user");
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
    navigate("/auth");
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Back Button and Logo/Title */}
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
              <div className="flex items-center space-x-3">
                {logoUrl ? (
                  <>
                    <img 
                      src={logoUrl} 
                      alt={websiteName} 
                      className="h-14 w-auto object-contain max-w-[200px]"
                    />
                    <div className="flex flex-col">
                      <h1 className="text-xl font-bold text-gray-900">{websiteName}</h1>
                      <p className="text-xs text-gray-600 hidden sm:block">Enterprise Banking</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-sm">UCB</span>
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-gray-900">{websiteName}</h1>
                      <p className="text-xs text-gray-600 hidden sm:block">Enterprise Banking</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* User Info, Notifications and Profile Dropdown */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Notification Bell */}
            {userId && <NotificationsPanel userId={userId} />}

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-2 sm:px-3">
                  <Avatar className="h-8 w-8 border-2 border-gray-200">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
                    <AvatarFallback className="bg-primary text-white text-sm font-semibold">
                      {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {user ? `${user.firstName} ${user.lastName}` : 'User'}
                    </p>
                    <p className="text-xs text-gray-600 truncate max-w-[150px]">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-600 hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white border-gray-200 shadow-lg" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    {user ? `${user.firstName} ${user.lastName}` : 'User'}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuItem 
                  onClick={() => navigate('/profile')}
                  className="cursor-pointer hover:bg-gray-50 py-3"
                >
                  <User className="mr-3 h-4 w-4 text-gray-600" />
                  <span className="font-medium">Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer hover:bg-red-50 text-red-600 py-3"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-medium">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;