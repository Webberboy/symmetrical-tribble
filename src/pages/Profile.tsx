import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Bell, 
  CreditCard,
  Eye,
  EyeOff,
  Edit,
  Save,
  Camera,
  Settings,
  Lock,
  Smartphone
} from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { avatarUrl, setAvatarUrl: setGlobalAvatarUrl } = useUser();
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    dateOfBirth: "1990-01-15"
  });

  useEffect(() => {
    fetchUserData();
    // Load user data from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setProfileData(prev => ({
        ...prev,
        firstName: parsedUser.firstName || "",
        lastName: parsedUser.lastName || "",
        email: parsedUser.email || ""
      }));
    }

    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserData({
          firstName: profile.first_name,
          lastName: profile.last_name,
          email: user.email
        });
        // Avatar is already loaded from UserContext, no need to set it here
      }
    } catch (error) {
    }
  };

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    emailNotifications: true,
    smsNotifications: false,
    loginAlerts: true
  });

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSecurityToggle = (setting: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  const handleSave = () => {
    setEditMode(false);
    // Here you would typically save to backend
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      // Validate file size (max 2MB for base64 storage)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }

      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;

          // Update profile with base64 image
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: base64String })
            .eq('id', user.id);

          if (updateError) throw updateError;

          setGlobalAvatarUrl(base64String);
          alert('Profile picture updated successfully!');
        } catch (error) {
          alert('Failed to upload profile picture');
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        alert('Failed to read file');
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      alert('Failed to upload profile picture');
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      if (!avatarUrl) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update profile to remove avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setGlobalAvatarUrl(null);
      alert('Profile picture removed successfully!');
    } catch (error) {
      alert('Failed to remove profile picture');
    }
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        user={userData} 
        showBackButton={true} 
        title="Profile" 
        onBackClick={() => navigate('/dashboard')} 
      />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        {/* Profile Picture Section */}
        <Card className="bg-white border-gray-200 mb-8">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center text-gray-900 text-xl">
              <User className="h-6 w-6 mr-3 text-gray-600" />
              Profile Picture
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8">
              <div className="relative flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-white"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-4xl font-bold">
                      {profileData.firstName.charAt(0).toUpperCase()}{profileData.lastName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <label
                  htmlFor="avatar-upload"
                  className={`absolute -bottom-2 -right-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full p-3 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </label>
              </div>
              <div className="flex-1 text-center sm:text-left space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">{profileData.firstName} {profileData.lastName}</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <label htmlFor="avatar-upload">
                    <Button
                      variant="outline"
                      className="border-gray-300 text-white hover:bg-gray-700 hover:text-white hover:border-gray-400 transition-colors w-full sm:w-auto"
                      disabled={uploading}
                      type="button"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                      <Camera className="h-4 w-4 mr-2 text-white" />
                      {uploading ? 'Uploading...' : 'Change Photo'}
                    </Button>
                  </label>
                  {avatarUrl && (
                    <Button
                      variant="outline"
                      className="border-gray-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors w-full sm:w-auto"
                      onClick={handleRemoveAvatar}
                      disabled={uploading}
                    >
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="bg-white border-gray-200 mb-8">
          <CardHeader className="flex flex-row items-center justify-between pb-6">
            <div>
              <CardTitle className="flex items-center text-gray-900 text-xl mb-2">
                <User className="h-6 w-6 mr-3 text-gray-600" />
                Personal Information
              </CardTitle>

            </div>
            <Button
              variant="outline"
              onClick={() => editMode ? handleSave() : setEditMode(true)}
              className="border-gray-300 text-white hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-colors px-6 py-2"
            >
              {editMode ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-8 pt-0">
            {/* Name Fields */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 font-medium text-sm">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!editMode}
                    className="h-12 bg-white border-gray-300 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 focus:border-gray-500 focus:ring-gray-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 font-medium text-sm">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!editMode}
                    className="h-12 bg-white border-gray-300 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 focus:border-gray-500 focus:ring-gray-500 transition-colors"
                  />
                </div>
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium text-sm">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!editMode}
                      className="h-12 pl-12 pr-4 bg-white border-gray-300 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 focus:border-gray-500 focus:ring-gray-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium text-sm">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!editMode}
                      className="h-12 pl-12 pr-4 bg-white border-gray-300 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 focus:border-gray-500 focus:ring-gray-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Address Information</h4>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-gray-700 font-medium text-sm">Street Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!editMode}
                      className="h-12 pl-12 pr-4 bg-white border-gray-300 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 focus:border-gray-500 focus:ring-gray-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-gray-700 font-medium text-sm">City</Label>
                    <Input
                      id="city"
                      value={profileData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      disabled={!editMode}
                      className="h-12 bg-white border-gray-300 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 focus:border-gray-500 focus:ring-gray-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-gray-700 font-medium text-sm">State</Label>
                    <Input
                      id="state"
                      value={profileData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      disabled={!editMode}
                      className="h-12 bg-white border-gray-300 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 focus:border-gray-500 focus:ring-gray-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-gray-700 font-medium text-sm">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={profileData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      disabled={!editMode}
                      className="h-12 bg-white border-gray-300 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 focus:border-gray-500 focus:ring-gray-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Personal Details</h4>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-gray-700 font-medium text-sm">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  disabled={!editMode}
                  className="h-12 bg-white border-gray-300 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 focus:border-gray-500 focus:ring-gray-500 transition-colors max-w-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-white border-gray-200 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Shield className="h-6 w-6 mr-2 text-gray-600" />
              Security Settings
            </CardTitle>
            
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Password Change */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-semibold mb-3 text-gray-900">Change Password</h4>
              <p className="text-sm text-gray-600 mb-4">To change your password, please use the Forgot Password link on the sign-in page.</p>
              <Button 
                variant="outline"
                onClick={() => navigate('/forgot-password')}
                className="border-gray-300 text-white hover:bg-gray-700 hover:text-white hover:border-gray-400"
              >
                <Lock className="h-4 w-4 mr-2 text-white" />
                Reset Password
              </Button>
            </div>

            {/* Two-Factor Authentication */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Smartphone className="h-4 w-4 mr-2 text-gray-600" />
                    Two-Factor Authentication
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">Add an extra layer of security to your account</p>
                </div>
                <button
                  onClick={() => handleSecurityToggle('twoFactorAuth')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    securitySettings.twoFactorAuth ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      securitySettings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Notification Settings */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-900 flex items-center">
                <Bell className="h-4 w-4 mr-2 text-gray-600" />
                Notification Preferences
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive account updates via email</p>
                  </div>
                  <button
                    onClick={() => handleSecurityToggle('emailNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.emailNotifications ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securitySettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">SMS Notifications</p>
                    <p className="text-sm text-gray-600">Receive alerts via text message</p>
                  </div>
                  <button
                    onClick={() => handleSecurityToggle('smsNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.smsNotifications ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securitySettings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Login Alerts</p>
                    <p className="text-sm text-gray-600">Get notified of new login attempts</p>
                  </div>
                  <button
                    onClick={() => handleSecurityToggle('loginAlerts')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.loginAlerts ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securitySettings.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Spacing for Navigation */}
        <div className="h-20 md:h-16"></div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}