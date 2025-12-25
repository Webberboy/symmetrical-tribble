import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, CheckCircle, Loader2, RefreshCw, ArrowLeft, Lightbulb } from "lucide-react";
import { completeUserSignup } from "@/lib/accountUtils";
import { sendWelcomeEmail } from "@/lib/emailService";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    
    const emailParam = searchParams.get("email");
    
    if (emailParam) {
      setEmail(emailParam);
    } else {
      toast.error("No email provided. Please sign up again.");
      navigate("/signup");
    }

    // Focus first input
    inputRefs.current[0]?.focus();
  }, [searchParams, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace: clear current and move to previous
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
    // Arrow keys navigation
    else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    else if (e.key === "ArrowRight" && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 8);
    
    if (!/^\d+$/.test(pastedData)) {
      toast.error("Please paste only digits");
      return;
    }

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus last filled input or first empty
    const nextIndex = Math.min(pastedData.length, 7);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    
    if (otpCode.length !== 8) {
      toast.error("Please enter the complete 8-digit code");
      return;
    }


    setVerifying(true);

    try {
      // Verify OTP with Supabase
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "email",
      });

      if (verifyError) {
        
        if (verifyError.message.includes("expired")) {
          toast.error("Code expired. Please request a new one.");
        } else if (verifyError.message.includes("invalid")) {
          toast.error("Invalid code. Please check and try again.");
        } else {
          toast.error(verifyError.message || "Verification failed");
        }
        
        setVerifying(false);
        return;
      }

      if (!verifyData.user) {
        toast.error("Verification failed. Please try again.");
        setVerifying(false);
        return;
      }


      setVerified(true);

      // Fetch signup data from pending_signups table
      const { data: pendingSignup, error: fetchError } = await supabase
        .from("pending_signups")
        .select("signup_data")
        .eq("auth_user_id", verifyData.user.id)
        .maybeSingle();

      if (fetchError) {
      }

      let signupData = pendingSignup?.signup_data;

      // Fallback to localStorage if database fetch fails
      if (!signupData) {
        const storageKey = `signup_data_${verifyData.user.id}`;
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
          signupData = JSON.parse(storedData);
        }
      } else {
      }

      if (!signupData) {
        toast.error("Signup data not found. Redirecting to profile...");
        setTimeout(() => navigate("/profile"), 2000);
        return;
      }


      // Create complete profile
      const { profile, role, accountNumber } = await completeUserSignup(
        verifyData.user.id,
        signupData
      );

      // Send welcome email
      try {
        console.log('=== Sending welcome email ===');
        console.log('Email:', verifyData.user.email);
        console.log('Account number:', accountNumber);
        console.log('First name:', signupData.firstName || signupData.first_name);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token && accountNumber) {
          const welcomeResult = await sendWelcomeEmail(
            verifyData.user.email!,
            accountNumber,
            signupData.firstName || signupData.first_name
          );
          
          if (welcomeResult.success) {
            console.log('Welcome email sent successfully');
          } else {
            console.error('Failed to send welcome email:', welcomeResult.error);
          }
        }
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the signup if welcome email fails
      }

      // Cleanup database and localStorage
      await supabase
        .from("pending_signups")
        .delete()
        .eq("auth_user_id", verifyData.user.id);
      
      localStorage.removeItem(`signup_data_${verifyData.user.id}`);

      toast.success("Email verified! Welcome to your account.");
      
      // Navigate immediately after successful verification
      navigate("/dashboard");

    } catch (error: any) {
      toast.error(error.message || "An error occurred during verification");
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;


    setResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) {
        toast.error(error.message || "Failed to resend code");
      } else {
        toast.success("New verification code sent!");
        setCountdown(60); // 60 second cooldown
        setOtp(["", "", "", "", "", "", "", ""]); // Clear inputs
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      toast.error("Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  // Auto-submit when all 8 digits are entered
  useEffect(() => {
    if (otp.every(digit => digit !== "") && !verifying && !verified) {
      handleVerifyOtp();
    }
  }, [otp]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Verifying State */}
          {verifying && (
            <Card className="bg-white border-gray-200 p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying your code</h2>
                  <p className="text-gray-600">Please wait...</p>
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

          {/* OTP Input State */}
          {!verifying && !verified && (
            <Card className="bg-white border-gray-200 p-8">
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Icon */}
                <div className="relative">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="h-10 w-10 text-blue-600" />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
                  <p className="text-gray-600 mb-2">
                    We've sent an 8-digit code to
                  </p>
                  {email && (
                    <p className="text-base font-semibold text-gray-900">{email}</p>
                  )}
                </div>

                {/* OTP Input */}
                <div className="w-full">
                  <div className="flex justify-center gap-2 mb-6">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        disabled={verifying}
                      />
                    ))}
                  </div>

                  <Button
                    onClick={handleVerifyOtp}
                    disabled={verifying || otp.some(digit => digit === "")}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Email"
                    )}
                  </Button>
                </div>

                {/* Resend Button */}
                <div className="w-full">
                  <Button
                    onClick={handleResendOtp}
                    disabled={resending || countdown > 0}
                    variant="outline"
                    className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : countdown > 0 ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Resend code in {countdown}s
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Resend verification code
                      </>
                    )}
                  </Button>
                </div>

                {/* Back to Sign In */}
                <div className="w-full pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => navigate("/signin")}
                    variant="ghost"
                    className="w-full h-12 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Sign In
                  </Button>
                </div>

                {/* Help Text */}
                <div className="w-full bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Tip:</strong> Check your spam folder if you don't see the email. The code expires after 60 minutes.</span>
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
