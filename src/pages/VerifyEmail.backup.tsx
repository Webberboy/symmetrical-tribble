import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { completeUserSignup } from "@/lib/accountUtils";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    
    // Get email from URL params (passed from signup page)
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }

    // Check for OTP expired error in hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const errorParam = hashParams.get("error");
    const errorCode = hashParams.get("error_code");
    const errorDescription = hashParams.get("error_description");


    if (errorParam === "access_denied" && errorCode === "otp_expired") {
      setError("Your verification link has expired. Please request a new one.");
      return;
    }

    // Check if user clicked verification link (has tokens in URL)
    const handleEmailVerification = async () => {
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");


      if (accessToken && type === "signup") {
        setVerifying(true);
        
        try {
          // Set the session with the tokens from the URL
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get("refresh_token") || "",
          });

          if (sessionError) {
            throw sessionError;
          }

          if (!sessionData.user) {
            throw new Error("No user found after verification");
          }

          
          setVerified(true);

          // Now create the user profile
          // Get stored signup data from localStorage
          const storageKey = `signup_data_${sessionData.user.id}`;
          
          const storedData = localStorage.getItem(storageKey);
          
          if (storedData) {
            const signupData = JSON.parse(storedData);
            
            // Create profile
            const { profile, role, accountNumber } = await completeUserSignup(
              sessionData.user.id,
              signupData
            );


            // Send welcome email
            try {
              
              const { sendWelcomeEmail } = await import("@/lib/emailService");
              const result = await sendWelcomeEmail(
                signupData.email,
                signupData.first_name,
                accountNumber
              );
              
              if (result.success) {
              } else {
              }
            } catch (emailError: any) {
              // Don't block signup if email fails
            }

            // Clean up localStorage
            localStorage.removeItem(`signup_data_${sessionData.user.id}`);

            // Redirect to dashboard
            setTimeout(() => {
              navigate("/dashboard");
            }, 2000);
          } else {
            // No stored data - just redirect to complete profile manually
            setTimeout(() => {
              navigate("/profile");
            }, 2000);
          }
        } catch (err: any) {
          
          // Check if it's a network error
          if (err.message && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('SSL'))) {
            setError("Network error. Please check your connection and try again.");
          } else {
            setError(err.message || "Failed to verify email");
          }
        } finally {
          setVerifying(false);
        }
      } else {
      }
    };

    handleEmailVerification();
  }, [navigate, searchParams]);

  const handleRetry = async () => {
    setError(null);
    setVerifying(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No user session found");
      }

      // Get stored signup data
      const storageKey = `signup_data_${user.id}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (!storedData) {
        throw new Error("Signup data not found. Please sign up again.");
      }

      const signupData = JSON.parse(storedData);
      
      // Retry profile creation
      const { profile, role, accountNumber } = await completeUserSignup(user.id, signupData);


      // Clean up localStorage
      localStorage.removeItem(storageKey);

      setVerified(true);

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to complete signup");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    
    if (!email) {
      toast.error("No email address found");
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) {
        throw error;
      }

      toast.success("Verification email sent! Please check your inbox.");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend email");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Verifying State */}
          {verifying && (
            <Card className="bg-white border-gray-200 p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying your email</h2>
                  <p className="text-gray-600">Please wait while we set up your account...</p>
                </div>
              </div>
            </Card>
          )}

          {/* Verified State */}
          {verified && !verifying && (
            <Card className="bg-white border-gray-200 p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Email verified!</h2>
                  <p className="text-gray-600">Setting up your account...</p>
                </div>
                <div className="w-full bg-blue-100 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    You'll be redirected to your dashboard shortly.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Error State */}
          {error && !verifying && (
            <Card className="bg-white border-gray-200 p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {error.includes("expired") ? "Link Expired" : "Verification Failed"}
                  </h2>
                  <p className="text-red-600 mb-2">{error}</p>
                  {error.includes("expired") && (
                    <p className="text-gray-600 text-sm mt-4">
                      Verification links expire after a certain time for security reasons. 
                      Please request a new verification email to continue.
                    </p>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col w-full space-y-3 mt-4">
                  {error.includes("expired") ? (
                    <>
                      <Button
                        onClick={handleResendEmail}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={!email}
                      >
                        <Mail className="mr-2 h-5 w-5" />
                        Send New Verification Link
                      </Button>
                      {email && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-800">
                            📧 A new verification email will be sent to: <strong>{email}</strong>
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <Button
                      onClick={handleRetry}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={verifying}
                    >
                      <RefreshCw className="mr-2 h-5 w-5" />
                      {verifying ? "Retrying..." : "Retry Setup"}
                    </Button>
                  )}
                  <Button
                    onClick={() => navigate("/signin")}
                    variant="outline"
                    className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Go to Sign In
                  </Button>
                  <Button
                    onClick={() => navigate("/signup")}
                    variant="ghost"
                    className="w-full h-12 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    Create New Account
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Waiting for Email Verification */}
          {!verifying && !verified && !error && (
            <Card className="bg-white border-gray-200 p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-6">
                {/* Email Icon */}
                <div className="relative">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="h-10 w-10 text-blue-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full animate-ping" />
                </div>

                {/* Title and Description */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                  <p className="text-gray-600 mb-4">
                    We've sent a verification link to your email address
                  </p>
                  {email && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600">Sent to:</p>
                      <p className="text-base font-semibold text-gray-900">{email}</p>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 text-left">
                    <strong>Next steps:</strong>
                    <br />
                    1. Open your email inbox
                    <br />
                    2. Click the verification link
                    <br />
                    3. Your account will be set up automatically
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col w-full space-y-3">
                  <Button
                    onClick={handleResendEmail}
                    variant="outline"
                    className="w-full h-12 border-gray-300 hover:bg-gray-50"
                    disabled={!email}
                  >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Resend Verification Email
                  </Button>
                  <Button
                    onClick={() => navigate("/signin")}
                    variant="ghost"
                    className="w-full h-12 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    Back to Sign In
                  </Button>
                </div>

                {/* Help Text */}
                <div className="w-full bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600">
                    💡 <strong>Tip:</strong> Check your spam folder if you don't see the email within a few minutes.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
