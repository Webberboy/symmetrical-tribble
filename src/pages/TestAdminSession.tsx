import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TestAdminSession() {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState<{
    testAdminSession: string | null;
    adminUser: string | null;
  }>({ testAdminSession: null, adminUser: null });

  useEffect(() => {
    const testSession = localStorage.getItem('testAdminSession');
    const adminUser = localStorage.getItem('adminUser');
    
    console.log('🧪 TestAdminSession - Current session data:', {
      testAdminSession: testSession,
      adminUser: adminUser
    });
    
    setSessionData({ testAdminSession: testSession, adminUser: adminUser });
  }, []);

  const handleSetAdminSession = () => {
    const mockAdminUser = {
      id: 'test-admin-123',
      email: 'admin@example.com',
      role: 'admin',
      permissions: { all: true },
      isAdmin: true
    };
    
    localStorage.setItem('adminUser', JSON.stringify(mockAdminUser));
    localStorage.setItem('testAdminSession', 'true');
    
    console.log('✅ Admin session set manually');
    setSessionData({ testAdminSession: 'true', adminUser: JSON.stringify(mockAdminUser) });
  };

  const handleClearSession = () => {
    localStorage.removeItem('adminUser');
    localStorage.removeItem('testAdminSession');
    
    console.log('❌ Admin session cleared');
    setSessionData({ testAdminSession: null, adminUser: null });
  };

  const handleTestSendmail = () => {
    console.log('🚀 Navigating to /sendmail');
    navigate('/sendmail');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Test Admin Session</h1>
        
        <div className="space-y-4 mb-6">
          <div className="text-sm text-gray-300">
            <strong>testAdminSession:</strong> {sessionData.testAdminSession || 'null'}
          </div>
          <div className="text-sm text-gray-300">
            <strong>adminUser:</strong> {sessionData.adminUser ? 'Present' : 'null'}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSetAdminSession}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
          >
            Set Admin Session
          </button>
          
          <button
            onClick={handleClearSession}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
          >
            Clear Session
          </button>
          
          <button
            onClick={handleTestSendmail}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
          >
            Test /sendmail Access
          </button>
        </div>
      </div>
    </div>
  );
}