import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff, Home, Receipt, User, Building2, Upload, FileText, Check, X } from "lucide-react";
import { completeUserSignup } from "@/lib/accountUtils";
import { storeIdDocument } from "@/lib/storageUtils";
import { useSettings } from "@/contexts/SettingsContext";

const SignUp = () => {
  const navigate = useNavigate();
  const { websiteName, logoUrl } = useSettings();
  const [loading, setLoading] = useState(false);
  const [signupStep, setSignupStep] = useState<'auth' | 'profile' | 'complete'>('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSymbol: false,
    minLength: false
  });
  
  // Enhanced signup form state
  const [signupData, setSignupData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phone: "",
    countryCode: "+1",
    email: "",
    
    // Address Information
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    
    // Identity Verification
    idDocument: null as File | null,
    
    // Security
    password: "",
    confirmPassword: "",
    securityQuestion1: "",
    securityAnswer1: "",
    securityQuestion2: "",
    securityAnswer2: "",
    pin: "",
    
    // Account Preferences
    accountType: "",
    initialDeposit: "",
    communicationMethod: "",
    
    // Legal Compliance
    termsAccepted: false,
    privacyAccepted: false
  });

  const handleSignupInputChange = (field: string, value: string | boolean | File | null) => {
    // Debug email input changes
    if (field === 'email' && typeof value === 'string') {
      console.log('📧 Email input changed:', value);
    }
    
    // Phone number validation based on country code
    if (field === 'phone' && typeof value === 'string') {
      const countryCode = signupData.countryCode || '+1';
      const maxLengths: { [key: string]: number } = {
        '+1': 10,    // USA/Canada - 10 digits
        '+44': 11,   // UK - 11 digits
        '+91': 10,   // India - 10 digits
        '+86': 11,   // China - 11 digits
        '+81': 10,   // Japan - 10 digits
        '+49': 11,   // Germany - 11 digits
        '+33': 10,   // France - 10 digits (9 digits + leading 0)
        '+61': 9,    // Australia - 9 digits
        '+234': 10,  // Nigeria - 10 digits
        '+254': 10,  // Kenya - 10 digits
      };
      
      // Remove all non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      const maxLength = maxLengths[countryCode] || 15;
      
      // Limit to max length for country
      if (digitsOnly.length > maxLength) {
        return; // Don't update if exceeds max length
      }
      
      value = digitsOnly;
    }
    
    setSignupData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Check password strength when password field changes
    if (field === 'password' && typeof value === 'string') {
      setPasswordStrength({
        hasUpperCase: /[A-Z]/.test(value),
        hasLowerCase: /[a-z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(value),
        minLength: value.length >= 8
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (accept common ID document formats)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        // Removed toast notification
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        // Removed toast notification
        return;
      }
      
      setSignupData(prev => ({
        ...prev,
        idDocument: file
      }));
      // Removed toast notification
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('🚀 [DEBUG] Signup process started with email:', signupData.email);
    console.log('📝 [DEBUG] Complete signup data:', {
      email: signupData.email,
      firstName: signupData.firstName,
      lastName: signupData.lastName,
      phone: `${signupData.countryCode}${signupData.phone}`,
      accountType: signupData.accountType,
      dateOfBirth: signupData.dateOfBirth,
      hasIdDocument: !!signupData.idDocument
    });

    // Validation
    if (signupData.password !== signupData.confirmPassword) {
      console.log('❌ Passwords do not match');
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!signupData.termsAccepted || !signupData.privacyAccepted) {
      console.log('❌ Terms or privacy not accepted');
      toast.error("Please accept the terms and privacy policy");
      setLoading(false);
      return;
    }

    try {
      console.log('📝 Complete signup data being submitted:', {
        email: signupData.email,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        phone: `${signupData.countryCode}${signupData.phone}`,
        accountType: signupData.accountType
      });
      
      // Skip email check if there are permission issues
      let existingEmailUser = null;
      let emailCheckError = null;
      
      try {
        console.log('🔍 Checking if email already exists:', signupData.email.toLowerCase());
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('email', signupData.email.toLowerCase())
          .maybeSingle();
        
        existingEmailUser = data;
        emailCheckError = error;
        console.log('📧 Email check result:', { existingEmailUser, emailCheckError });
      } catch (checkError) {
        console.warn('⚠️ Email check failed, continuing without validation:', checkError);
        // Continue with signup even if email check fails
        existingEmailUser = null;
        emailCheckError = null; // Reset error to allow signup to continue
      }

      console.log('📧 Email check result:', { existingEmailUser, emailCheckError });

      // Only show error if it's a real validation error (not permission error)
      if (emailCheckError && emailCheckError.code !== 'PGRST116' && emailCheckError.code !== '42501') {
        console.log('❌ Email validation error:', emailCheckError);
        toast.error("Error validating email. Please try again.");
        setLoading(false);
        return;
      }

      if (existingEmailUser) {
        console.log('❌ Email already registered:', existingEmailUser);
        toast.error("This email address is already registered. Please sign in instead.");
        setLoading(false);
        return;
      }

      // Check if phone number already exists (optional)
      let existingPhoneUser = null;
      let phoneCheckError = null;
      
      try {
        const fullPhone = `${signupData.countryCode}${signupData.phone}`;
        console.log('📱 Checking phone number:', fullPhone);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('phone')
          .eq('phone', fullPhone)
          .maybeSingle();
        
        existingPhoneUser = data;
        phoneCheckError = error;
        console.log('📱 Phone check result:', { existingPhoneUser, phoneCheckError });
      } catch (checkError) {
        console.warn('⚠️ Phone check failed, continuing without validation:', checkError);
        existingPhoneUser = null;
        phoneCheckError = null;
      }

      // Only show error if it's a real validation error (not permission error)
      if (phoneCheckError && phoneCheckError.code !== 'PGRST116' && phoneCheckError.code !== '42501') {
        console.log('❌ Phone validation error:', phoneCheckError);
        toast.error("Error validating phone number. Please try again.");
        setLoading(false);
        return;
      }

      if (existingPhoneUser) {
        console.log('❌ Phone already registered:', existingPhoneUser);
        toast.error("This phone number is already registered. Please use a different number.");
        setLoading(false);
        return;
      }

      
      // Step 1: Create user in Supabase Auth with OTP email verification
      console.log('📧 Creating Supabase Auth user with email:', signupData.email);
      setSignupStep('auth');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          // Use OTP verification instead of magic link
          emailRedirectTo: undefined,
          data: {
            first_name: signupData.firstName,
            last_name: signupData.lastName,
          }
        },
      });

      console.log('🔐 Supabase Auth result:', { authData, authError });

      if (authError) {
        console.log('❌ Supabase Auth error:', authError);
        
        // Check for specific error messages
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          toast.error("This email is already registered. Please sign in instead.");
        } else if (authError.message.includes('email')) {
          toast.error("Invalid email address. Please check and try again.");
        } else {
          toast.error(`Signup failed: ${authError.message}`);
        }
        
        setLoading(false);
        return;
      }


      if (!authData.user) {
        console.log('❌ No user data returned from Supabase Auth');
        // Removed toast notification
        setLoading(false);
        return;
      }

      console.log('✅ Supabase Auth user created:', authData.user.id);


      // Check if email confirmation is required
      const emailConfirmationRequired = !authData.session;
      
      console.log('📧 [DEBUG] Email confirmation status:', {
        emailConfirmationRequired,
        hasSession: !!authData.session,
        sessionData: authData.session ? 'Session exists' : 'No session'
      });
      
      if (emailConfirmationRequired) {
        // Convert ID document to base64 if provided
        let idDocumentData = null;
        let idDocumentFilename = null;
        let idDocumentType = null;
        
        if (signupData.idDocument) {
          // Removed toast notification
          try {
            // Convert file to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => {
                if (typeof reader.result === 'string') {
                  const base64 = reader.result.split(',')[1];
                  resolve(base64);
                } else {
                  reject(new Error('Failed to convert file'));
                }
              };
              reader.onerror = () => reject(new Error('Failed to read file'));
              reader.readAsDataURL(signupData.idDocument!);
            });
            
            idDocumentData = await base64Promise;
            idDocumentFilename = signupData.idDocument.name;
            idDocumentType = signupData.idDocument.type;
          } catch (error) {
            // Removed toast notification
          }
        }
        
        // Store signup data temporarily for later use after email verification
        const profileData = {
          full_name: `${signupData.firstName} ${signupData.lastName}`,
          first_name: signupData.firstName,
          last_name: signupData.lastName,
          email: signupData.email,
          phone: `${signupData.countryCode}${signupData.phone}`,
          country_code: signupData.countryCode,
          date_of_birth: signupData.dateOfBirth,
          address: {
            street: signupData.street,
            city: signupData.city,
            state: signupData.state,
            zip: signupData.zipCode,
            country: signupData.country
          },
          account_type: signupData.accountType,
          id_document_uploaded: signupData.idDocument !== null,
          id_document_data: idDocumentData,
          id_document_filename: idDocumentFilename,
          id_document_type: idDocumentType
        };

        // Store in database (works cross-device, unlike localStorage)
        const { error: pendingSignupError } = await supabase
          .from('pending_signups')
          .insert({
            auth_user_id: authData.user.id,
            email: signupData.email,
            signup_data: profileData
          });

        if (pendingSignupError) {
          
          // Fallback: Store in localStorage WITHOUT large ID document
          try {
            const lightweightData = {
              ...profileData,
              id_document_data: null, // Remove large base64 data
            };
            localStorage.setItem(`signup_data_${authData.user.id}`, JSON.stringify(lightweightData));
            toast.error("Database error. ID document will need to be re-uploaded after verification.");
          } catch (storageError) {
            toast.error("Storage error. Please contact support with user ID: " + authData.user.id);
          }
        } else {
        }

        toast.success(
          "Check your email! We've sent you a verification code.",
          { duration: 5000 }
        );
        
        setLoading(false);
        
        // Redirect to OTP verification page
        navigate(`/verify-email?email=${encodeURIComponent(signupData.email)}`);
        return;
      }

      // Session is available - email confirmation disabled, continue with profile creation

      // Step 2: Create profile and assign role manually
      setSignupStep('profile');
      // Removed toast notification

      // Upload ID document if provided
      if (signupData.idDocument) {
        // Removed toast notification
        const { success, error: storeError } = await storeIdDocument(signupData.idDocument, authData.user.id);
        
        if (!success || storeError) {
          // Removed toast notification
          setLoading(false);
          return;
        }
        
      }

      const profileData = {
        full_name: `${signupData.firstName} ${signupData.lastName}`,
        first_name: signupData.firstName,
        last_name: signupData.lastName,
        email: signupData.email,
        phone: signupData.phone,
        date_of_birth: signupData.dateOfBirth,
        address: {
          street: signupData.street,
          city: signupData.city,
          state: signupData.state,
          zip: signupData.zipCode,
          country: signupData.country
        },
        account_type: signupData.accountType,
        id_document_uploaded: signupData.idDocument !== null
      };

      const { profile, role, accountNumber } = await completeUserSignup(authData.user.id, profileData, authData.session);


      // Step 3: Complete signup
      setSignupStep('complete');
      
      // Send welcome email
      try {
        console.log('📧 [DEBUG] Sending welcome email via emailService:', {
          email: signupData.email,
          firstName: signupData.firstName,
          accountNumber: accountNumber
        });
        
        const { sendWelcomeEmail } = await import("@/lib/emailService");
        const result = await sendWelcomeEmail(
          signupData.email,
          signupData.firstName,
          accountNumber
        );
        
        console.log('📧 [DEBUG] Welcome email result:', result);
        
        if (result.success) {
          console.log('✅ [DEBUG] Welcome email sent successfully');
        } else {
          console.log('❌ [DEBUG] Welcome email failed:', result.error);
        }
      } catch (emailError: any) {
        console.log('❌ [DEBUG] Welcome email error caught:', emailError);
        // Don't block signup if email fails
      }
      
      toast.success(
        `🎉 Welcome to your account! Your Account Number: ${accountNumber}. Please save this for login.`,
        { duration: 10000 }
      );

      // Redirect to dashboard after showing success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

      
    } catch (error: any) {
      
      // Check if it's just a storage error but signup actually succeeded
      if (error.name === 'QuotaExceededError' && error.message.includes('Storage')) {
        
        // Still try to navigate to verification page
        if (signupData.email) {
          toast.success("Check your email! We've sent you a verification code.", { duration: 5000 });
          navigate(`/verify-email?email=${encodeURIComponent(signupData.email)}`);
          return;
        }
      }
      
      toast.error(error.message || "Signup failed. Please try again.");
      setSignupStep('auth');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden fixed inset-0">
      {/* Left Side - Sign Up Form */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto overscroll-none">
          <div className="p-8">
            <div className="w-full max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={websiteName} 
                  className="h-12 w-auto object-contain mr-3"
                />
              ) : (
                <Building2 className="h-8 w-8 text-gray-900 mr-2" />
              )}
              <h1 className="text-3xl font-bold text-gray-900">{websiteName}</h1>
            </div>
            <p className="text-gray-600 text-lg">
              Create your account to get started
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-8">
            {/* Personal Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={signupData.firstName}
                    onChange={(e) => handleSignupInputChange('firstName', e.target.value)}
                    required
                    className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 h-12 text-white bg-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={signupData.lastName}
                    onChange={(e) => handleSignupInputChange('lastName', e.target.value)}
                    required
                    className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 h-12 text-white bg-gray-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <Label htmlFor="email" className="text-gray-700 font-medium">Email *</Label>
                   <Input
                     id="email"
                     type="email"
                     placeholder="john@example.com"
                     value={signupData.email}
                     onChange={(e) => handleSignupInputChange('email', e.target.value)}
                     required
                     className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 h-12 text-white bg-gray-900"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number *</Label>
                   <div className="flex gap-2">
                     <Select 
                       value={signupData.countryCode || '+1'} 
                       onValueChange={(value) => handleSignupInputChange('countryCode', value)}
                     >
                       <SelectTrigger className="w-[120px] border-gray-300 h-12 bg-white text-gray-900">
                         <SelectValue placeholder="+1" />
                       </SelectTrigger>
                       <SelectContent className="bg-white">
                         <SelectItem value="+1" className="text-gray-900">🇺🇸 +1</SelectItem>
                         <SelectItem value="+44" className="text-gray-900">🇬🇧 +44</SelectItem>
                         <SelectItem value="+91" className="text-gray-900">🇮🇳 +91</SelectItem>
                         <SelectItem value="+86" className="text-gray-900">🇨🇳 +86</SelectItem>
                         <SelectItem value="+81" className="text-gray-900">🇯🇵 +81</SelectItem>
                         <SelectItem value="+49" className="text-gray-900">🇩🇪 +49</SelectItem>
                         <SelectItem value="+33" className="text-gray-900">🇫🇷 +33</SelectItem>
                         <SelectItem value="+61" className="text-gray-900">🇦🇺 +61</SelectItem>
                         <SelectItem value="+234" className="text-gray-900">🇳🇬 +234</SelectItem>
                         <SelectItem value="+254" className="text-gray-900">🇰🇪 +254</SelectItem>
                       </SelectContent>
                     </Select>
                     <Input
                       id="phone"
                       type="tel"
                       placeholder="5551234567"
                       value={signupData.phone}
                       onChange={(e) => handleSignupInputChange('phone', e.target.value)}
                       required
                       className="flex-1 border-gray-300 focus:border-gray-500 focus:ring-gray-500 h-12 text-white bg-gray-900"
                     />
                   </div>
                 </div>
               </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-gray-700 font-medium">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={signupData.dateOfBirth}
                  onChange={(e) => handleSignupInputChange('dateOfBirth', e.target.value)}
                  required
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  min="1900-01-01"
                  className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 h-12 text-white bg-gray-900"
                />
                <p className="text-sm text-gray-500">You must be at least 18 years old to create an account</p>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">Address Information</h2>
              <div className="space-y-2">
                 <Label htmlFor="street" className="text-gray-700 font-medium">Street Address *</Label>
                 <Input
                   id="street"
                   type="text"
                   placeholder="123 Main Street"
                   value={signupData.street}
                   onChange={(e) => handleSignupInputChange('street', e.target.value)}
                   required
                   className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 h-12 text-white bg-gray-900"
                 />
               </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-gray-700 font-medium">City *</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="New York"
                    value={signupData.city}
                    onChange={(e) => handleSignupInputChange('city', e.target.value)}
                    required
                    className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 h-12 text-white bg-gray-900"
                  />
                </div>
                <div className="space-y-2">
                   <Label htmlFor="state" className="text-gray-700 font-medium">State *</Label>
                   <Input
                     id="state"
                     type="text"
                     placeholder="NY"
                     value={signupData.state}
                     onChange={(e) => handleSignupInputChange('state', e.target.value)}
                     required
                     className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 h-12 text-white bg-gray-900"
                   />
                 </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-gray-700 font-medium">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    type="text"
                    placeholder="10001"
                    value={signupData.zipCode}
                    onChange={(e) => handleSignupInputChange('zipCode', e.target.value)}
                    required
                    className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 h-12 text-white bg-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Identity Verification */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">Identity Verification</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="idDocument" className="text-gray-700 font-medium">Upload ID Document *</Label>
                  <p className="text-sm text-gray-500 mb-3">
                    Please upload a clear photo of your government-issued ID (Driver's License, Passport, or State ID)
                  </p>
                  <div className="relative">
                    <Input
                      id="idDocument"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileUpload}
                      required
                      className="hidden"
                    />
                    <Label
                      htmlFor="idDocument"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="text-center">
                        {signupData.idDocument ? (
                          <div className="flex flex-col items-center">
                            <FileText className="h-8 w-8 text-green-600 mb-2" />
                            <span className="text-sm font-medium text-green-600">
                              {signupData.idDocument.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({(signupData.idDocument.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-sm font-medium text-gray-600">
                              Click to upload ID document
                            </span>
                            <span className="text-xs text-gray-500">
                              JPEG, PNG, or PDF (max 5MB)
                            </span>
                          </div>
                        )}
                      </div>
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">Security</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupData.password}
                      onChange={(e) => handleSignupInputChange('password', e.target.value)}
                      required
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 h-12 text-white bg-gray-900 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {/* Password Strength Indicator */}
                  <div className="space-y-2 mt-3">
                    <p className="text-sm text-gray-600 font-medium">Password must contain:</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        {passwordStrength.minLength ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={passwordStrength.minLength ? "text-green-600" : "text-gray-600"}>
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {passwordStrength.hasUpperCase ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={passwordStrength.hasUpperCase ? "text-green-600" : "text-gray-600"}>
                          One uppercase letter (A-Z)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {passwordStrength.hasLowerCase ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={passwordStrength.hasLowerCase ? "text-green-600" : "text-gray-600"}>
                          One lowercase letter (a-z)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {passwordStrength.hasNumber ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={passwordStrength.hasNumber ? "text-green-600" : "text-gray-600"}>
                          One number (0-9)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {passwordStrength.hasSymbol ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={passwordStrength.hasSymbol ? "text-green-600" : "text-gray-600"}>
                          One symbol (!@#$%^&*)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupData.confirmPassword}
                      onChange={(e) => handleSignupInputChange('confirmPassword', e.target.value)}
                      required
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 h-12 text-white bg-gray-900 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {signupData.confirmPassword && signupData.password !== signupData.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <X className="h-4 w-4" />
                      Passwords do not match
                    </p>
                  )}
                  {signupData.confirmPassword && signupData.password === signupData.confirmPassword && (
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Passwords match
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Preferences */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">Account Preferences</h2>
              <div className="space-y-2">
                <Label htmlFor="accountType" className="text-gray-700 font-medium">Account Type *</Label>
                <Select value={signupData.accountType} onValueChange={(value) => handleSignupInputChange('accountType', value)}>
                  <SelectTrigger className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 h-12 max-w-xs bg-white text-gray-900">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="checking" className="text-gray-900">Checking Account</SelectItem>
                    <SelectItem value="savings" className="text-gray-900">Savings Account</SelectItem>
                    <SelectItem value="business" className="text-gray-900">Business Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Legal Compliance */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">Legal & Compliance</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="terms"
                    checked={signupData.termsAccepted}
                    onCheckedChange={(checked) => handleSignupInputChange('termsAccepted', checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-gray-700">
                    I agree to the{" "}
                    <a 
                      href="/terms" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Terms and Conditions
                    </a>{" "}
                    *
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="privacy"
                    checked={signupData.privacyAccepted}
                    onCheckedChange={(checked) => handleSignupInputChange('privacyAccepted', checked as boolean)}
                  />
                  <Label htmlFor="privacy" className="text-gray-700">
                    I agree to the{" "}
                    <a 
                      href="/privacy-policy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Privacy Policy
                    </a>{" "}
                    *
                  </Label>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white font-medium text-lg" 
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <a href="/signin" className="text-gray-900 hover:underline font-medium">
                Sign in here
              </a>
            </p>
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
                <h2 className="text-4xl font-bold">Join {websiteName}</h2>
              </div>
              <p className="text-xl text-white/90 leading-relaxed">
                Start your financial journey with us. Secure, reliable, and designed for your success.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full mr-4 mt-1">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Easy Account Setup</h3>
                  <p className="text-white/80">
                    Get started in minutes with our streamlined account creation process and instant verification.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full mr-4 mt-1">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Personalized Experience</h3>
                  <p className="text-white/80">
                    Enjoy financial tools tailored to your needs with customizable features and dedicated support.
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

export default SignUp;
