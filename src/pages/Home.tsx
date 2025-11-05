import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AccountBalances from "@/components/AccountBalances";
import BankingServices from "@/components/BankingServices";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";

const Home = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        navigate("/auth");
      }
    } else {
      navigate("/auth");
    }
    setLoading(false);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-left mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Hi, {user.firstName}
          </h2>
        </div>

        {/* Account Balances */}
        <section>
          <AccountBalances />
        </section>

        {/* Banking Services */}
        <section>
          <BankingServices />
        </section>

        {/* Bottom Spacing for Navigation */}
        <div className="h-20 md:h-16"></div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Home;