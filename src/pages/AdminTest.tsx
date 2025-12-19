import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AdminTest = () => {
  const navigate = useNavigate();
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const envAdminEmails = import.meta.env.VITE_ADMIN_EMAILS || '';
    const ADMIN_EMAILS = envAdminEmails 
      ? envAdminEmails.split(',').map((email: string) => email.trim().toLowerCase())
      : ['admin@unitycapital.com'];

    setInfo({
      isLoggedIn: !!session,
      userEmail: session?.user?.email || 'Not logged in',
      envAdminEmails: envAdminEmails || 'Not set (using fallback)',
      allowedAdmins: ADMIN_EMAILS,
      isAdmin: session?.user?.email && ADMIN_EMAILS.includes(session.user.email.toLowerCase()),
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <Card className="max-w-2xl mx-auto bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Admin Access Debug Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-white">
          <div>
            <p className="font-semibold">Logged In:</p>
            <p className={info.isLoggedIn ? 'text-green-400' : 'text-red-400'}>
              {info.isLoggedIn ? '✅ Yes' : '❌ No'}
            </p>
          </div>
          
          <div>
            <p className="font-semibold">Your Email:</p>
            <p className="text-blue-400 font-mono">{info.userEmail}</p>
          </div>
          
          <div>
            <p className="font-semibold">Environment Variable (VITE_ADMIN_EMAILS):</p>
            <p className="text-yellow-400 font-mono">{info.envAdminEmails}</p>
          </div>
          
          <div>
            <p className="font-semibold">Allowed Admin Emails:</p>
            <div className="bg-gray-700 p-2 rounded mt-1">
              {info.allowedAdmins?.map((email: string) => (
                <p key={email} className="text-green-400 font-mono">{email}</p>
              ))}
            </div>
          </div>
          
          <div>
            <p className="font-semibold">Admin Access Status:</p>
            <p className={info.isAdmin ? 'text-green-400 text-xl' : 'text-red-400 text-xl'}>
              {info.isAdmin ? '✅ GRANTED - You should have access!' : '❌ DENIED - Email mismatch'}
            </p>
          </div>

          <div className="pt-4 space-y-2">
            <Button 
              onClick={() => navigate('/xk9p2vnz7q')} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Go to Admin Login
            </Button>
            <Button 
              onClick={() => navigate('/xk9p2vnz7q-dash')} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Try Admin Dashboard
            </Button>
            <Button 
              onClick={checkAdmin} 
              variant="outline"
              className="w-full border-gray-600 text-gray-300"
            >
              Refresh Info
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTest;
