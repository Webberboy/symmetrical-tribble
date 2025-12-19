import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import WhiteLabelSettings from '@/components/admin/WhiteLabelSettings';

const AdminSettings = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Check for test admin session first
      const testSession = localStorage.getItem('testAdminSession');
      if (testSession === 'true') {
        return; // Allow access for test admin
      }

      // Check if admin user is stored in localStorage
      const adminUser = localStorage.getItem('adminUser');
      if (!adminUser) {
        toast.error('Please log in as admin');
        navigate('/xk9p2vnz7q');
        return;
      }

      const adminData = JSON.parse(adminUser);
      if (!adminData.isAdmin) {
        toast.error('Unauthorized access');
        navigate('/dashboard');
        return;
      }

      // Verify admin still exists and is active in the admin table
      const { data: adminCheck, error: adminError } = await supabase
        .from('admin')
        .select('id, email, role, is_active')
        .eq('email', adminData.email)
        .eq('is_active', true)
        .single();

      if (adminError || !adminCheck) {
        toast.error('Unauthorized access');
        localStorage.removeItem('adminUser');
        navigate('/xk9p2vnz7q');
        return;
      }
    } catch (error: any) {
      toast.error('Failed to verify admin access');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                onClick={() => navigate('/xk9p2vnz7q-dash')}
                className="text-white hover:bg-gray-700 text-sm sm:text-base px-2 sm:px-4"
              >
                <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to Admin</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Admin Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <WhiteLabelSettings />
      </div>
    </div>
  );
};

export default AdminSettings;
