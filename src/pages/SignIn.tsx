import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { validateCredentials } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Home, Receipt, User } from "lucide-react";
import { UAParser } from "ua-parser-js";
import { useSettings } from "@/contexts/SettingsContext";

const SignIn = () => {
  const navigate = useNavigate();
  const { websiteName, logoUrl } = useSettings();
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle email verification redirect
  useEffect(() => {
    const handleEmailVerification = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");

      if (accessToken && type === "signup") {
        // Redirect to verify-email page with the hash
        navigate(`/verify-email${window.location.hash}`);
      }
    };

    handleEmailVerification();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Just validate credentials (no session created)
      const result = await validateCredentials(accountNumber, password);
      
      // Check if user is banned
      if (result.isBanned) {
        // Get support email from settings
        const { data: settingsData } = await supabase
          .from('white_label_settings')
          .select('support_email')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        const supportEmail = settingsData?.support_email || 'support@heritagebk.org';
        
        toast.error(
          <div className="space-y-2">
            <p className="font-semibold">Account Suspended</p>
            <p className="text-sm">{result.banReason}</p>
            <p className="text-sm">Please contact support at: <a href={`mailto:${supportEmail}`} className="underline font-semibold">{supportEmail}</a></p>
          </div>,
          { duration: 8000 }
        );
        setLoading(false);
        return;
      }
      
      if (!result.valid || !result.email || !result.userId) {
        toast.error(result.error || "Invalid account number or password");
        setLoading(false);
        return;
      }

      // Step 2: Get device and location info
      const parser = new UAParser();
      const device = parser.getResult();
      const deviceInfo = `${device.os?.name || 'Unknown OS'} ${device.os?.version || ''}`.trim();
      
      let location = "Unknown Location";
      try {
        const ipResponse = await fetch('https://ipapi.co/json/');
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          location = `${ipData.city || ''}, ${ipData.region || ''}, ${ipData.country_name || 'Unknown'}`.replace(/^, |, $/g, '');
        }
      } catch (e) {
      }

      // Step 3: Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Step 4: Send OTP via edge function (it handles everything)
      const loadingToast = toast.loading("Sending verification code...");
      
      const { error: emailError } = await supabase.functions.invoke('send-otp-email', {
        body: { 
          email: result.email,
          otpCode: otp,
          userName: 'User', // We don't have profile yet, that's ok
          deviceInfo: deviceInfo,
          location: location
        }
      });

      toast.dismiss(loadingToast);

      if (emailError) {
        toast.error('Failed to send verification code');
        setLoading(false);
        return;
      }

      toast.success("Verification code sent! Check your email.");

      // Step 5: Navigate to OTP page with the OTP we generated
      navigate("/otp-verification", {
        state: {
          email: result.email,
          userId: result.userId,
          accountNumber: accountNumber,
          password: password, // Need this to actually log in after OTP
          storedOTP: otp, // Pass the OTP so they can verify it
          purpose: 'login'
        }
      });

    } catch (error) {
      toast.error("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Left Side - Authentication Forms */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <div className="flex-1 overflow-y-auto overscroll-none">
          <div className="p-8 lg:p-12">
            <div className="w-full max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Sign In</h1>
          </div>

          {/* Auth Form */}
          <div className="bg-gray-50">
            <div className="text-center pb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-gray-600 mt-2">
                Sign in with your account number
              </p>
            </div>
            <div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber" className="text-gray-700 font-medium">Account Number</Label>
                  <Input
                    id="accountNumber"
                    type="text"
                    placeholder="ACC123456"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                    className="h-12 border-gray-300 focus:border-gray-500 focus:ring-gray-500 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 border-gray-300 focus:border-gray-500 focus:ring-gray-500 text-white"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium" 
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <a href="/signup" className="text-gray-900 hover:underline font-medium">
                    Create a new account
                  </a>
                </p>
              </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Image Section */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div 
          className="w-full bg-cover bg-center bg-no-repeat relative"
          style={{
            backgroundImage: "url('/Untitled design (8).png')"
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40"></div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center h-full p-12 text-white">
            {/* Hero Section */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={websiteName} 
                    className="h-14 w-auto object-contain mr-4 bg-white/20 backdrop-blur-sm p-3 rounded-full"
                  />
                ) : (
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full mr-4">
                    <Home className="h-8 w-8 text-white" />
                  </div>
                )}
                <h2 className="text-4xl font-bold">Modern Financial Management</h2>
              </div>
              <p className="text-xl text-white/90 leading-relaxed">
                Experience the future of financial management with our secure, innovative platform designed for your financial success.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full mr-4 mt-1">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Smart Transactions</h3>
                  <p className="text-white/80">
                    Intelligent transaction categorization and real-time spending insights to help you manage your finances better.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full mr-4 mt-1">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Personal Finance Tools</h3>
                  <p className="text-white/80">
                    Tailored financial solutions that adapt to your lifestyle and goals with 24/7 support.
                  </p>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 pt-8 border-t border-white/20">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold">99.9%</div>
                  <div className="text-sm text-white/70">Uptime</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm text-white/70">Support</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">Secure</div>
                  <div className="text-sm text-white/70">Platform</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
