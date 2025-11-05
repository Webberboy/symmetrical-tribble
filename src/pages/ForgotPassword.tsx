import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Mail, Shield, Clock, CheckCircle, Home, Receipt, User } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Request OTP code for password reset (no redirectTo = OTP mode)
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        toast.error(error.message);
      } else {
        setEmailSent(true);
        toast.success("Verification code sent! Check your email.");
        
        // Navigate to OTP verification page after 2 seconds
        setTimeout(() => {
          navigate(`/reset-password-verify?email=${encodeURIComponent(email)}`);
        }, 2000);
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }

    setLoading(false);
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Forgot Password Form */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto overscroll-none">
          <div className="p-8 lg:p-12">
            <div className="w-full max-w-2xl mx-auto space-y-8">
              {/* Header */}
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Reset Password</h1>
              </div>

              {/* Reset Password Form */}
              <div className="bg-white">
                <div className="text-center pb-8">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gray-100 p-3 rounded-full">
                      <Mail className="h-8 w-8 text-gray-600" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {emailSent ? "Check Your Email" : "Forgot Password?"}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    {emailSent 
                      ? "We've sent a 6-digit verification code to your email address."
                      : "No worries! Enter your email and we'll send you a verification code."
                    }
                  </p>
                </div>

                {!emailSent ? (
                  <div>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700 font-medium">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 border-gray-300 focus:border-gray-500 focus:ring-gray-500 text-white"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium" 
                        disabled={loading || !isValidEmail(email)}
                      >
                        {loading ? "Sending..." : "Send Verification Code"}
                      </Button>
                    </form>

                    {/* Security Features */}
                    <div className="mt-6 space-y-3 pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Security Features</h3>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Shield className="h-4 w-4 text-green-500 mr-2" />
                          Secure password reset process
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 text-green-500 mr-2" />
                          Code expires in 60 minutes
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Email verification required
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Success State */}
                    <div className="text-center space-y-4">
                      <div className="bg-green-100 p-4 rounded-lg">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                        <p className="text-green-800 font-medium">Email Sent Successfully!</p>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>Check your email inbox and spam folder.</p>
                        <p>The verification code will expire in 60 minutes.</p>
                        <p>You'll be redirected to enter the code shortly...</p>
                      </div>

                      <Button
                        onClick={() => {
                          setEmailSent(false);
                          setEmail("");
                        }}
                        variant="outline"
                        className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Send Another Email
                      </Button>
                    </div>
                  </div>
                )}

                {/* Back to Sign In */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => navigate("/signin")}
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Sign In
                  </button>
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
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40"></div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center h-full p-12 text-white">
            {/* Hero Section */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full mr-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-4xl font-bold">Secure Recovery</h2>
              </div>
              <p className="text-xl text-white/90 leading-relaxed">
                Your account security is our priority. Reset your password safely with our encrypted recovery process.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full mr-4 mt-1">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Email Verification</h3>
                  <p className="text-white/80">
                    Secure email-based password reset with time-limited links to protect your account.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full mr-4 mt-1">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Quick Recovery</h3>
                  <p className="text-white/80">
                    Get back to your account quickly with our streamlined password recovery process.
                  </p>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 pt-8 border-t border-white/20">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold">256-bit</div>
                  <div className="text-sm text-white/70">Encryption</div>
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

export default ForgotPassword;