import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Banknote, Smartphone, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";

const AddMoney = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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

  const paymentMethods = [
    {
      id: "card",
      name: "Debit/Credit Card",
      icon: CreditCard,
      description: "Add money using your debit or credit card"
    },
    {
      id: "bank",
      name: "Bank Transfer",
      icon: Banknote,
      description: "Transfer from your linked bank account"
    },
    {
      id: "mobile",
      name: "Mobile Payment",
      icon: Smartphone,
      description: "Use mobile payment services"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) > 10000) {
      toast.error("Maximum amount per transaction is $10,000");
      return;
    }

    setIsLoading(true);

    try {
      // Update user balance in localStorage (for demo purposes)
      if (user) {
        const currentBalance = parseFloat(user.balance || "0");
        const newBalance = currentBalance + parseFloat(amount);
        const updatedUser = { ...user, balance: newBalance.toString() };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      setIsSuccess(true);
      toast.success(`Successfully added ${formatCurrency(parseFloat(amount))} to your account`);
      
      // Reset form after success
      setTimeout(() => {
        setAmount("");
        setIsSuccess(false);
      }, 1500);

    } catch (error) {
      toast.error("Failed to add money. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
        user={user} 
        showBackButton={true} 
        title="Add Money" 
        onBackClick={() => navigate('/cards')} 
      />
        <div className="max-w-md mx-auto px-4 py-8">
          <Card className="bg-white border-gray-200 text-center p-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600 mb-6">
              {formatCurrency(parseFloat(amount))} has been added to your account
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate("/cards")} 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              >
                Back to Cards
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/dashboard")} 
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        showBackButton={true} 
        title="Add Money" 
        onBackClick={() => navigate('/cards')} 
      />
      
      <div className="max-w-md mx-auto px-4 py-6">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Add Money</h1>
          <p className="text-gray-600">Add funds to your account</p>
        </div>

        {/* Add Money Form */}
        <Card className="bg-white border-gray-200 mb-6">
          <CardHeader>
            <CardTitle className="text-gray-900">Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-gray-700">Enter Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 text-lg h-12 border-gray-300 text-white"
                    min="0.01"
                    max="10000"
                    step="0.01"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">Minimum: $0.01 • Maximum: $10,000</p>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <Label className="text-gray-700">Payment Method</Label>
                <div className="space-y-2">
                  {paymentMethods.map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <div
                        key={method.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedMethod === method.id
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => setSelectedMethod(method.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent className="h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{method.name}</p>
                            <p className="text-sm text-gray-600">{method.description}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedMethod === method.id
                              ? 'border-gray-900 bg-gray-900'
                              : 'border-gray-300'
                          }`}>
                            {selectedMethod === method.id && (
                              <div className="w-full h-full rounded-full bg-white scale-50"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !amount}
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Add ${amount ? formatCurrency(parseFloat(amount)) : '$0.00'}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>Secure Transaction:</strong> Your payment information is encrypted and secure. 
              Funds will be available in your account immediately after processing.
            </p>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default AddMoney;