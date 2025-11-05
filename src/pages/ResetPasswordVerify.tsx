import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Loader2, RefreshCw, ArrowLeft, Eye, EyeOff, Check, X, Lightbulb } from "lucide-react";

const ResetPasswordVerify = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    
    const emailParam = searchParams.get("email");
    
    if (emailParam) {
      setEmail(emailParam);
    } else {
      toast.error("No email provided. Please request a password reset.");
      navigate("/forgot-password");
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
    if (value && index < 5) {
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
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    
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
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }


    setVerifying(true);

    try {
      // Verify OTP with Supabase
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "recovery",
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

      toast.success("Code verified! Now set your new password.");
      setStep('password');
      setVerifying(false);

    } catch (error: any) {
      toast.error(error.message || "An error occurred during verification");
      setVerifying(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setVerifying(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error(error.message || "Failed to update password");
        setVerifying(false);
        return;
      }

      toast.success("Password reset successful! Redirecting to sign in...");
      
      // Sign out and redirect to sign in
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate("/signin");
      }, 2000);

    } catch (error: any) {
      toast.error(error.message || "An error occurred");
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;


    setResending(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        toast.error(error.message || "Failed to resend code");
      } else {
        toast.success("New verification code sent!");
        setCountdown(60); // 60 second cooldown
        setOtp(["", "", "", "", "", ""]); // Clear inputs
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      toast.error("Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.every(digit => digit !== "") && !verifying && step === 'otp') {
      handleVerifyOtp();
    }
  }, [otp]);

  // Password strength checker
  const getPasswordStrength = () => {
    const hasLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    return { hasLength, hasUpper, hasLower, hasNumber, hasSymbol };
  };

  const passwordStrength = getPasswordStrength();
  const allRequirementsMet = Object.values(passwordStrength).every(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* OTP Verification Step */}
          {step === 'otp' && (
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Verification Code</h2>
                  <p className="text-gray-600 mb-2">
                    We've sent a 6-digit code to
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
                      "Verify Code"
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

          {/* Password Reset Step */}
          {step === 'password' && (
            <Card className="bg-white border-gray-200 p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h2>
                  <p className="text-gray-600">
                    Choose a strong password for your account
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-gray-700 font-medium">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="h-12 border-gray-300 focus:border-gray-500 text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements */}
                  {newPassword && (
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-gray-700">Password must contain:</p>
                      <div className="space-y-1">
                        <div className={`flex items-center ${passwordStrength.hasLength ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordStrength.hasLength ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                          At least 8 characters
                        </div>
                        <div className={`flex items-center ${passwordStrength.hasUpper ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordStrength.hasUpper ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                          One uppercase letter
                        </div>
                        <div className={`flex items-center ${passwordStrength.hasLower ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordStrength.hasLower ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                          One lowercase letter
                        </div>
                        <div className={`flex items-center ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordStrength.hasNumber ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                          One number
                        </div>
                        <div className={`flex items-center ${passwordStrength.hasSymbol ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordStrength.hasSymbol ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                          One special character
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-12 border-gray-300 focus:border-gray-500 text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-sm text-red-600">Passwords do not match</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={verifying || !allRequirementsMet || newPassword !== confirmPassword}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordVerify;
