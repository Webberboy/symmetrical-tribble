import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AccountBalances from "@/components/AccountBalances";
import PromotionalBanner from "@/components/PromotionalBanner";
import GlobalNotifications from "@/components/GlobalNotifications";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useWhiteLabelMeta } from "@/hooks/useWhiteLabelMeta";
import { validateSession } from "@/lib/authUtils";

const Dashboard = () => {
  useWhiteLabelMeta("Dashboard");
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Function to capitalize first letter of a string
  const capitalizeFirstLetter = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  useEffect(() => {
    const validateAndLoadUser = async () => {
      try {
        // First check localStorage for user data
        const userData = localStorage.getItem("user");
        if (!userData) {
          navigate("/auth");
          return;
        }

        // Parse user data immediately to render UI faster
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Validate Supabase session asynchronously in background
        const isValidSession = await validateSession();
        
        if (!isValidSession) {
          // Session is invalid or expired, clear localStorage and redirect
          localStorage.removeItem("user");
          navigate("/auth");
          return;
        }
      } catch (error) {
        console.error("Error validating session:", error);
        // Clear localStorage on any error and redirect
        localStorage.removeItem("user");
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    validateAndLoadUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Main Content Skeleton */}
            <div className="lg:col-span-3 space-y-8">
              {/* Account Balances Skeleton */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Quick Actions Skeleton */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-6"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4 h-24">
                      <div className="h-6 w-6 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <DashboardSidebar user={user} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header user={user} />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Banner Notifications (Top) */}
            {user.id && (
              <GlobalNotifications userId={user.id} displayType="banner" />
            )}

            {/* Welcome Section - Professional */}
            <div className="bg-white rounded-lg shadow-card p-6 border border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {capitalizeFirstLetter(user.firstName)}
              </h1>
            </div>

            {/* Card Notifications (After Welcome) */}
            {user.id && (
              <GlobalNotifications userId={user.id} displayType="card" />
            )}

            {/* Account Balances Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Accounts</h2>
              </div>
              <AccountBalances />
            </section>

            {/* Promotional Banner */}
            <section>
              <PromotionalBanner />
            </section>

            {/* Bottom Spacing for Navigation */}
            <div className="h-20 md:h-16"></div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>

      {/* Modal Notifications (Popup) */}
      {user.id && (
        <GlobalNotifications userId={user.id} displayType="modal" />
      )}
    </div>
  );
};

export default Dashboard;
