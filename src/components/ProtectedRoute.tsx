import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isAdmin } from '@/lib/adminAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check localStorage for admin session (from FlexibleAdminLogin)
        const adminSession = localStorage.getItem('testAdminSession');
        const adminUser = localStorage.getItem('adminUser');
        
        console.log('🔐 ProtectedRoute checking auth:', { adminSession, adminUser, requireAdmin });
        
        if (adminSession === 'true' && adminUser) {
          console.log('✅ Admin session found, allowing access');
          setIsAuthenticated(true);
          setIsAdminUser(true);
          setIsLoading(false);
          return;
        }

        // Check if user is authenticated via Supabase auth
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // If admin access is required, check admin status
        if (requireAdmin) {
          const adminStatus = await isAdmin();
          setIsAdminUser(adminStatus);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [requireAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to admin login
  if (!isAuthenticated) {
    console.log('🚫 Not authenticated, redirecting to login');
    return <Navigate to="/xk9p2vnz7q" replace />;
  }

  // If admin access is required but user is not admin, redirect to admin login
  if (requireAdmin && !isAdminUser) {
    console.log('🚫 Admin access required but user is not admin, redirecting to login');
    return <Navigate to="/xk9p2vnz7q" replace />;
  }

  // All checks passed, render the protected content
  return <>{children}</>;
};