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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/signin');
      return;
    }

    const adminEmails = import.meta.env.VITE_ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(user.email)) {
      toast.error('Unauthorized access');
      navigate('/dashboard');
      return;
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
