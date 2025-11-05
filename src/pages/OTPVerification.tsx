import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, ArrowLeft, Clock, Mail, Lock } from "lucide-react";

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  // Get data from navigation state
  const { email, accountNumber, storedOTP, password, userId } = location.state || {};

  useEffect(() => {
    // Redirect if no login data
    if (!email || !storedOTP || !password) {
      toast.error("Invalid session. Please log in again.");
      navigate("/signin");
      return;
    }

    // Start countdown timer
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          toast.error("OTP expired. Please request a new one.");
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Allow resend after 1 minute
    setTimeout(() => setCanResend(true), 60000);

    return () => clearInterval(countdown);
  }, [email, storedOTP, password, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split("");
    while (newOtp.length < 6) newOtp.push("");
    setOtp(newOtp);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    document.getElementById(`otp-${lastIndex}`)?.focus();
  };

  const handleResendOTP = async () => {
    setResending(true);
    try {
      // Generate new OTP
      const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Send new OTP via Edge Function
      const { error } = await supabase.functions.invoke('send-otp-email', {
        body: {
          email: email,
          otpCode: newOTP,
          userName: 'User',
          deviceInfo: 'Resend Request',
          location: 'Unknown'
        }
      });

      if (error) throw error;

      // Update location state with new OTP
      navigate(location.pathname, {
        state: { ...location.state, storedOTP: newOTP },
        replace: true,
      });

      setTimer(600);
      setCanResend(false);
      setTimeout(() => setCanResend(true), 60000);
      
      toast.success("New OTP sent to your email!");
    } catch (error) {
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOTP = async () => {
    const enteredOTP = otp.join("");
    
    if (enteredOTP.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    if (timer === 0) {
      toast.error("OTP expired. Please request a new one.");
      return;
    }

    setLoading(true);

    try {
      // Verify OTP
      if (enteredOTP !== storedOTP) {
        toast.error("Invalid OTP. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        document.getElementById("otp-0")?.focus();
        setLoading(false);
        return;
      }

      // OTP is correct, NOW actually log the user in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error || !data?.user) {
        toast.error("Login failed. Please try signing in again.");
        setLoading(false);
        return;
      }

      // Get user profile and save to localStorage
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        const userData = {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name || profile.full_name?.split(' ')[0] || 'User',
          lastName: profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '',
          accountNumber: profile.account_number,
          balance: profile.balance || 0
        };
        localStorage.setItem("user", JSON.stringify(userData));
      }

      // Send login notification email (optional, don't block login if it fails)
      try {
        await supabase.functions.invoke('send-login-notification', {
          body: {
            email: email,
            userName: profile?.first_name || 'User'
          }
        });
      } catch (e) {
      }

      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gray-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Shield className="h-8 w-8 text-gray-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Identity</h1>
          <p className="text-gray-600">
            We've sent a 6-digit code to
          </p>
          <p className="text-gray-900 font-medium mt-1">{email}</p>
        </div>

        {/* Timer */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full">
            <Clock className="h-4 w-4 mr-2" />
            <span className="font-medium">Code expires in {formatTime(timer)}</span>
          </div>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <Label className="text-gray-700 font-medium mb-3 block text-center">
            Enter Verification Code
          </Label>
          <p className="text-xs text-gray-600 font-bold text-center mb-3">
            Check your email. If not in inbox, please check your spam folder
          </p>
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-2xl font-bold border-gray-300 focus:border-gray-500 focus:ring-gray-500 text-white"
                disabled={loading || timer === 0}
              />
            ))}
          </div>
        </div>

        {/* Verify Button */}
        <Button
          onClick={handleVerifyOTP}
          className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium mb-4"
          disabled={loading || timer === 0 || otp.join("").length !== 6}
        >
          {loading ? "Verifying..." : "Verify & Login"}
        </Button>

        {/* Resend OTP */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
          <button
            onClick={handleResendOTP}
            disabled={!canResend || resending}
            className={`text-sm font-medium ${
              canResend && !resending
                ? "text-blue-600 hover:text-blue-800 hover:underline"
                : "text-gray-500 cursor-not-allowed"
            }`}
          >
            <Mail className="inline h-4 w-4 mr-1" />
            {resending ? "Sending..." : "Resend Code"}
            {!canResend && " (wait 1 minute)"}
          </button>
        </div>

        {/* Security Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-xs text-gray-600 text-center flex items-center justify-center gap-2">
            <Lock className="h-4 w-4 text-gray-600" />
            <span>This is an extra security step to protect your account. The code is valid for 10 minutes.</span>
          </p>
        </div>

        {/* Back Button */}
        <div className="text-center">
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
  );
};

export default OTPVerification;
