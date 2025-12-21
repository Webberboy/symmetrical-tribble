import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AccountBalances from "@/components/AccountBalances";
import BankingServices from "@/components/BankingServices";
import PromotionalBanner from "@/components/PromotionalBanner";
import GlobalNotifications from "@/components/GlobalNotifications";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useWhiteLabelMeta } from "@/hooks/useWhiteLabelMeta";
import { validateSession } from "@/lib/authUtils";

const Dashboard = () => {
  useWhiteLabelMeta("Dashboard");
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header user={user} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Notifications (Top) */}
        {user.id && (
          <GlobalNotifications userId={user.id} displayType="banner" />
        )}

        {/* Welcome Section - Professional */}
        <div className="bg-white rounded-lg shadow-card p-6 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Welcome back, {user.firstName}
          </h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
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

        {/* Banking Services Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <BankingServices />
        </section>

        {/* Promotional Banner */}
        <section>
          <PromotionalBanner />
        </section>

        {/* Bottom Spacing for Navigation */}
        <div className="h-20 md:h-16"></div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Modal Notifications (Popup) */}
      {user.id && (
        <GlobalNotifications userId={user.id} displayType="modal" />
      )}
    </div>
  );
};

export default Dashboard;
