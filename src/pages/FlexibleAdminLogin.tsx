// =====================================================
// FLEXIBLE ADMIN LOGIN COMPONENT
// =====================================================
// Can use any authentication method from adminAuth.ts
// Just change ADMIN_AUTH_METHOD to switch methods
// =====================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
  isAdmin, 
  checkAdminEmail, 
  checkAdminTable,
  checkAuthMetadata,
  checkAdminRPC,
  getAdminUser 
} from '@/lib/adminAuth';

// =====================================================
// CHOOSE YOUR ADMIN AUTHENTICATION METHOD
// =====================================================
type AdminAuthMethod = 
  | 'EMAIL_WHITELIST'    // Simple email check
  | 'ADMIN_TABLE'        // Separate admin_users table
  | 'AUTH_METADATA'      // Check user_metadata
  | 'RPC_FUNCTION'       // Database function
  | 'COMBINED';          // Try multiple methods

const ADMIN_AUTH_METHOD: AdminAuthMethod = 'COMBINED'; // 👈 CHANGE THIS

export default function FlexibleAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      // For ADMIN_TABLE method, use direct admin table authentication
      if (ADMIN_AUTH_METHOD === 'ADMIN_TABLE' || ADMIN_AUTH_METHOD === 'COMBINED') {
        // Use the verify_admin_login function we created
        const { data: adminData, error: adminError } = await supabase
          .rpc('verify_admin_login', {
            p_email: email.trim(),
            p_password: password.trim()
          });

        if (adminError || !adminData || !adminData[0]?.success) {
          toast.error('Invalid admin credentials or account inactive');
          setIsLoading(false);
          return;
        }

        const admin = adminData[0];

        // Create mock admin session
        const mockAdminUser = {
          id: admin.admin_id,
          email: admin.admin_email,
          role: admin.admin_role,
          permissions: { all: true },
          isAdmin: true
        };
        
        localStorage.setItem('adminUser', JSON.stringify(mockAdminUser));
        localStorage.setItem('testAdminSession', 'true');
        toast.success('Admin Login Successful!');
        navigate('/xk9p2vnz7q-dash');
        setIsLoading(false);
        return;
      }

      // For other methods, use the original Supabase Auth flow
      // Step 1: Sign in with Supabase Auth
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (signInError) {
        toast.error(signInError.message || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      if (!authData.session || !authData.user) {
        toast.error('Authentication failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Step 2: Check admin access based on selected method
      let hasAdminAccess = false;
      let adminCheckMethod = '';

      switch (ADMIN_AUTH_METHOD) {
        case 'EMAIL_WHITELIST':
          hasAdminAccess = checkAdminEmail(authData.user.email || '');
          adminCheckMethod = 'Email Whitelist';
          break;

        case 'AUTH_METADATA':
          hasAdminAccess = await checkAuthMetadata();
          adminCheckMethod = 'Auth Metadata';
          break;

        case 'RPC_FUNCTION':
          hasAdminAccess = await checkAdminRPC(authData.user.id);
          adminCheckMethod = 'RPC Function';
          break;

        default:
          hasAdminAccess = false;
      }

      // Step 3: Grant or deny access
      if (!hasAdminAccess) {
        toast.error('Access denied. Admin privileges required.');
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // Success!
      toast.success(`Welcome! (${adminCheckMethod})`);
      navigate('/xk9p2vnz7q-dash');

    } catch (error: any) {
      toast.error(error.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
