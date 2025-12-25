import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  Send, 
  Receipt, 
  HandCoins, 
  Vault, 
  Grid3X3,
  Bell,
  Settings,
  FileText,
  User
} from "lucide-react";

const Dash = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/auth");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      navigate("/auth");
    }
  }, [navigate]);

  const bankingServices = [
    { icon: Building2, label: "Account", path: "/dashboard" },
    { icon: Send, label: "Fund Transfer", path: "/transfer" },
    { icon: Receipt, label: "Statement", path: "/statements" },
    { icon: HandCoins, label: "Loans", path: "/loans" },
    { icon: Vault, label: "Deposits", path: "/deposit" },
    { icon: Grid3X3, label: "More", path: "/more" }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-white">
      {/* Header */}
      <div className="px-4 py-6 flex justify-end items-center">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6" />
          <Settings className="w-6 h-6" />
        </div>
      </div>

      {/* Account Cards */}
      <div className="px-4 pb-6">
        <div className="flex gap-4 overflow-x-auto">
          {/* Saving Account Card */}
          <Card className="min-w-[280px] md:min-w-[400px] lg:min-w-[450px] bg-gray-800 border-gray-700 text-white">
            <CardContent className="p-6">
              <div className="text-gray-400 text-sm mb-2">Saving Account</div>
              <div className="text-2xl font-bold mb-4">
                {user.accountNumber || "0014 1241 5574"}
              </div>
              <Button 
                className="bg-gray-700 hover:bg-gray-800 text-white mb-3"
                onClick={() => navigate("/dashboard")}
              >
                Check Balance
              </Button>
              <div className="text-gray-400 text-sm cursor-pointer">Statement</div>
            </CardContent>
          </Card>

          {/* Checking Account Card */}
          <Card className="min-w-[280px] md:min-w-[400px] lg:min-w-[450px] bg-gray-800 border-gray-700 text-white">
            <CardContent className="p-6">
              <div className="text-gray-400 text-sm mb-2">Checking Account</div>
              <div className="text-2xl font-bold mb-4">2244 12</div>
              <Button 
                className="bg-gray-700 hover:bg-gray-800 text-white mb-3"
                onClick={() => navigate("/dashboard")}
              >
                Check Balance
              </Button>
              <div className="text-gray-400 text-sm cursor-pointer">Statement</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Banking Services Grid */}
      <div className="bg-white text-gray-800 rounded-t-3xl px-6 py-8 flex-1">
        <div className="grid grid-cols-3 gap-6 mb-8">
          {bankingServices.map((service, index) => (
            <div 
              key={index}
              className="flex flex-col items-center gap-3 cursor-pointer hover:opacity-70 transition-opacity"
              onClick={async () => {
                if (service.path === '/transfer') {
                  // Auto-select checking account and skip selection page for wire transfers
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) {
                      navigate('/signin');
                      return;
                    }

                    // Fetch checking account
                    const { data: accountsData, error } = await supabase
                      .from('accounts')
                      .select('*')
                      .eq('user_id', user.id)
                      .eq('account_type', 'checking')
                      .single();

                    if (error || !accountsData) {
                      // If no checking account found, fall back to normal flow
                      navigate('/transfer');
                      return;
                    }

                    // Create checking account object and store in localStorage
                    const checkingAccount = {
                      id: 'checking',
                      name: 'My Checking',
                      type: 'Checking Account',
                      balance: accountsData.checking_balance || 0.00,
                      accountNumber: accountsData.account_number,
                      account_type: 'checking'
                    };

                    localStorage.setItem('wireTransferAccount', JSON.stringify(checkingAccount));
                    navigate('/wire-amount-entry');
                  } catch (error) {
                    // If any error occurs, fall back to normal flow
                    navigate('/transfer');
                  }
                } else {
                  navigate(service.path);
                }
              }}
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <service.icon className="w-6 h-6 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-center">{service.label}</span>
            </div>
          ))}
        </div>

        {/* Promotional Banner */}
        <Card className="bg-gray-800 text-white overflow-hidden border-gray-700">
          <CardContent className="p-0">
            <div className="flex items-center">
              <div className="flex-1 p-6">
                <h3 className="text-lg font-bold mb-2">Travel for</h3>
                <h2 className="text-xl font-bold mb-3">discover yourself !</h2>
                <Button 
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6"
                  size="sm"
                >
                  Apply Now
                </Button>
                <div className="text-xs mt-2 opacity-90">
                  Instant Loan at<br />
                  just 8.99% Interest
                </div>
              </div>
              <div className="w-32 h-32 bg-gray-600 rounded-full opacity-20 -mr-8"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-gray-900 px-6 py-4">
        <div className="flex justify-around items-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 bg-gray-600 rounded"></div>
            <span className="text-xs text-gray-400">Banking</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <FileText className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400">Transactions</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <User className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400">Account</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dash;