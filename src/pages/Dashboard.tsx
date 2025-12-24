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

        // Validate Supabase session using utility function
        const isValidSession = await validateSession();
        
        if (!isValidSession) {
          // Session is invalid or expired, clear localStorage and redirect
          localStorage.removeItem("user");
          navigate("/auth");
          return;
        }

        // Parse and set user data
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
