import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRightOnRectangleIcon as LogOut,
  MagnifyingGlassIcon as Search,
  PencilIcon as Edit,
  Cog6ToothIcon as Settings,
  PlusIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import WireTransferManagement from '@/components/admin/WireTransferManagement';
import WireTransferRequests from '@/components/admin/WireTransferRequests';
import CryptoManagement from '@/components/admin/CryptoManagement';
import LoanManagement from '@/components/admin/LoanManagement';
import NotificationManagement from '@/components/admin/NotificationManagement';
import TransactionBuilder from '@/components/admin/TransactionBuilder';
import MessagesManagement from '@/components/admin/MessagesManagement';
import InvestmentManagement from '@/components/admin/InvestmentManagement';
import UserCreation from '@/components/admin/UserCreation';
import { useSettings } from '@/contexts/SettingsContext';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  account_number: string;
  balance: number;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  date_of_birth?: string;
  id_document_url?: string;
  id_document_data?: string;
  id_document_filename?: string;
  id_document_type?: string;
  is_banned?: boolean;
  ban_reason?: string;
  created_at: string;
  updated_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { websiteName } = useSettings();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserCreationOpen, setIsUserCreationOpen] = useState(false);
  const [usersWithMessages, setUsersWithMessages] = useState<Map<string, number>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    // Set up real-time subscription for new users
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          // Reload users when any change happens
          loadUsers();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    try {
      console.log('🔐 Checking admin access...');
      
      // Check for test admin session first
      const testSession = localStorage.getItem('testAdminSession');
      console.log('🧪 Test admin session:', testSession);
      
      if (testSession === 'true') {
        console.log('✅ Test admin session active');
        setIsAdmin(true);
        setIsLoading(false);
        loadUsers();
        return;
      }

      // Check if admin user is stored in localStorage
      const adminUser = localStorage.getItem('adminUser');
      console.log('👤 Admin user in localStorage:', adminUser);
      
      if (!adminUser) {
        console.log('❌ No admin user found in localStorage');
        toast.error("Please log in as admin");
        navigate("/xk9p2vnz7q");
        setIsLoading(false);
        return;
      }

      const adminData = JSON.parse(adminUser);
      console.log('📋 Admin data:', adminData);
      
      if (!adminData.isAdmin) {
        console.log('❌ User is not admin');
        toast.error("Access denied. Admin privileges required.");
        navigate("/xk9p2vnz7q");
        setIsLoading(false);
        return;
      }

      // Verify admin still exists and is active in the admin table
      console.log('🔍 Verifying admin in database...');
      const { data: adminCheck, error: adminError } = await supabase
        .from('admin')
        .select('id, email, role, is_active')
        .eq('email', adminData.email)
        .eq('is_active', true)
        .single();

      console.log('📊 Admin check result:', { data: adminCheck, error: adminError });

      if (adminError || !adminCheck) {
        console.log('❌ Admin verification failed:', adminError);
        toast.error("Access denied. Admin privileges required.");
        localStorage.removeItem('adminUser');
        navigate("/xk9p2vnz7q");
        setIsLoading(false);
        return;
      }

      console.log('✅ Admin access granted');
      setIsAdmin(true);
      setIsLoading(false); // Show UI immediately
      loadUsers(); // Load users in background without await
    } catch (error: any) {
      console.error('💥 Admin access error:', error);
      toast.error('Failed to verify admin access');
      navigate("/xk9p2vnz7q");
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      console.log('🔄 Loading users from profiles table...');
      
      // Run both queries in parallel for faster loading
      const [profilesResult, messagesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, account_number, is_banned, ban_reason, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('messages')
          .select('user_id')
          .eq('status', 'pending')
      ]);

      console.log('📊 Profiles result:', profilesResult);
      console.log('📨 Messages result:', messagesResult);

      if (profilesResult.error) {
        console.error('❌ Profiles error:', profilesResult.error);
        throw profilesResult.error;
      }
      
      console.log('✅ Found', profilesResult.data?.length || 0, 'users');
      console.log('👥 Users data:', profilesResult.data);
      
      setUsers(profilesResult.data || []);

      // Process message counts
      if (messagesResult.data) {
        const messageCounts = new Map<string, number>();
        messagesResult.data.forEach(msg => {
          const count = messageCounts.get(msg.user_id) || 0;
          messageCounts.set(msg.user_id, count + 1);
        });
        setUsersWithMessages(messageCounts);
        console.log('💬 Found pending messages for', messageCounts.size, 'users');
      }
    } catch (error: any) {
      console.error('💥 Failed to load users:', error);
      toast.error('Failed to load users: ' + error.message);
    }
  };

  const handleEditUser = (user: Profile) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  const handleBanUser = async (user: Profile) => {
    const isBanned = user.is_banned;
    const action = isBanned ? 'unban' : 'ban';
    
    if (!isBanned) {
      // Ask for ban reason
      const reason = prompt('Enter reason for banning this user (optional):');
      if (reason === null) return; // User cancelled
      
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            is_banned: true,
            ban_reason: reason || 'No reason provided'
          })
          .eq('id', user.id);

        if (error) throw error;
        
        toast.success(`User ${user.full_name} has been banned`);
        await loadUsers();
      } catch (error: any) {
        toast.error('Failed to ban user: ' + error.message);
      }
    } else {
      // Unban user
      if (!confirm(`Are you sure you want to unban ${user.full_name}?`)) return;
      
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            is_banned: false,
            ban_reason: null
          })
          .eq('id', user.id);

        if (error) throw error;
        
        toast.success(`User ${user.full_name} has been unbanned`);
        await loadUsers();
      } catch (error: any) {
        toast.error('Failed to unban user: ' + error.message);
      }
    }
  };

  const handleTabChange = (value: string) => {
    // When Messages tab is opened, clear the badge for this user
    if (value === 'messages' && selectedUser) {
      setUsersWithMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(selectedUser.id);
        return newMap;
      });
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('user');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('testAdminSession');
    toast.success("Logged out successfully");
    navigate("/xk9p2vnz7q");
  };

  const handleUserCreated = () => {
    setIsUserCreationOpen(false);
    loadUsers();
    toast.success('User account created successfully');
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.account_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading admin dashboard...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 dark">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-white">{websiteName} - Admin Panel</h1>
            <nav className="flex gap-4 items-center">
              {/* Commented out menu items
              <Button 
                onClick={() => setIsUserCreationOpen(true)}
                className="text-sm text-white hover:bg-gray-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create User
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/emailsending')} 
                className="text-sm text-white hover:bg-gray-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Emails
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  console.log('🔄 Manual user reload triggered');
                  loadUsers();
                }} 
                className="text-sm text-white hover:bg-gray-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Users
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/xk9p2vnz7q-settings'} 
                className="text-sm text-white hover:bg-gray-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              */}
              <Button variant="ghost" onClick={handleLogout} className="text-sm text-white hover:bg-gray-700">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">User Management</h2>
          <p className="text-gray-400">View and manage all user accounts</p>
        </div>

        {/* Management Overview - Commented out
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">Management Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-gray-300">Total Users Loaded</Label>
                <div className="text-white font-mono">{users.length}</div>
              </div>
              <div>
                <Label className="text-gray-300">Users with Messages</Label>
                <div className="text-white font-mono">{usersWithMessages.size}</div>
              </div>
              <div>
                <Label className="text-gray-300">Search Filter</Label>
                <div className="text-white font-mono">{searchTerm || 'None'}</div>
              </div>
            </div>
            <div className="mt-4">
              <Label className="text-gray-300">Supabase Configuration</Label>
              <div className="text-gray-400 font-mono text-xs break-all">
                URL: {import.meta.env.VITE_SUPABASE_URL || 'Not set'}
              </div>
              <div className="text-gray-400 font-mono text-xs">
                Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set (' + import.meta.env.VITE_SUPABASE_ANON_KEY.length + ' chars)' : 'Not set'}
              </div>
            </div>
          </CardContent>
        </Card>
        */}

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-white">All Users</CardTitle>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-64 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Name</TableHead>
                    <TableHead className="text-gray-300">Email</TableHead>
                    <TableHead className="text-gray-300">Account #</TableHead>
                    <TableHead className="text-gray-300">Created</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-gray-700">
                        <TableCell className="font-medium text-white">
                          <div className="flex items-center gap-2">
                            {user.full_name || 'N/A'}
                            {user.is_banned && (
                              <Badge variant="destructive" className="bg-red-600 text-white text-xs">
                                BANNED
                              </Badge>
                            )}
                            {usersWithMessages.has(user.id) && (
                              <Badge variant="destructive" className="h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                                {usersWithMessages.get(user.id)}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">{user.email || 'N/A'}</TableCell>
                        <TableCell className="text-gray-300">{user.account_number || 'N/A'}</TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(user)}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBanUser(user)}
                              className={`text-xs ${
                                user.is_banned 
                                  ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                                  : 'bg-red-600 hover:bg-red-700 border-red-600'
                              } text-white`}
                            >
                              {user.is_banned ? 'Unban' : 'Ban'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Profile Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:w-[1400px] max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-xl sm:text-2xl">User Profile Management</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <Tabs defaultValue="wire-transfer" className="w-full" onValueChange={handleTabChange}>
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 -mx-2 px-2">
                <TabsList className="inline-flex w-auto min-w-full bg-gray-700 mb-4 gap-1">
                  {/* Commented out Overview tab
                  <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 text-xs sm:text-sm whitespace-nowrap">Overview</TabsTrigger>
                  */}
                  <TabsTrigger value="wire-transfer" className="data-[state=active]:bg-blue-600 text-xs sm:text-sm whitespace-nowrap">Wire Transfer</TabsTrigger>
                  {/* Commented out Crypto, Loans, and Investment tabs
                  <TabsTrigger value="crypto" className="data-[state=active]:bg-blue-600 text-xs sm:text-sm whitespace-nowrap">Crypto</TabsTrigger>
                  <TabsTrigger value="loans" className="data-[state=active]:bg-blue-600 text-xs sm:text-sm whitespace-nowrap">Loans</TabsTrigger>
                  <TabsTrigger value="investments" className="data-[state=active]:bg-blue-600 text-xs sm:text-sm whitespace-nowrap">Investments</TabsTrigger>
                  */}
                  <TabsTrigger value="transactions" className="data-[state=active]:bg-blue-600 text-xs sm:text-sm whitespace-nowrap">Transactions</TabsTrigger>
                  {/* Commented out Notifications tab
                  <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600 text-xs sm:text-sm whitespace-nowrap">Notifications</TabsTrigger>
                  */}
                  <TabsTrigger value="messages" className="data-[state=active]:bg-blue-600 text-xs sm:text-sm whitespace-nowrap">Messages</TabsTrigger>
                </TabsList>
              </div>

              {/* Wire Transfer Tab - Contains personal/account info */}
              <TabsContent value="wire-transfer" className="space-y-6">
                {/* Personal Information - Commented Out */}
                {/*
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-700 pb-2">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-300 text-sm">Full Name</Label>
                      <Input 
                        value={selectedUser.full_name || 'N/A'} 
                        readOnly 
                        className="bg-gray-700 border-gray-600 text-white mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Email</Label>
                      <Input 
                        value={selectedUser.email || 'N/A'} 
                        readOnly 
                        className="bg-gray-700 border-gray-600 text-white mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Phone</Label>
                      <Input 
                        value={selectedUser.phone || 'N/A'} 
                        readOnly 
                        className="bg-gray-700 border-gray-600 text-white mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Date of Birth</Label>
                      <Input 
                        value={selectedUser.date_of_birth || 'N/A'} 
                        readOnly 
                        className="bg-gray-700 border-gray-600 text-white mt-1 text-sm"
                      />
                    </div>
                  </div>
                </div>
                */}

                {/* Address Information - Commented Out */}
                {/*
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-700 pb-2">
                    Address Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 lg:col-span-3">
                      <Label className="text-gray-300 text-sm">Address</Label>
                      <Input 
                        value={selectedUser.address || 'N/A'} 
                        readOnly 
                        className="bg-gray-700 border-gray-600 text-white mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">City</Label>
                      <Input 
                        value={selectedUser.city || 'N/A'} 
                        readOnly 
                        className="bg-gray-700 border-gray-600 text-white mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">State</Label>
                      <Input 
                        value={selectedUser.state || 'N/A'} 
                        readOnly 
                        className="bg-gray-700 border-gray-600 text-white mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">ZIP Code</Label>
                      <Input 
                        value={selectedUser.zip_code || 'N/A'} 
                        readOnly 
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                      />
                    </div>
                  </div>
                </div>
                */}

                {/* Account Information - Commented Out */}
                {/*
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                    Account Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Account Number</Label>
                      <Input 
                        value={selectedUser.account_number || 'N/A'} 
                        readOnly 
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Account Created</Label>
                      <Input 
                        value={new Date(selectedUser.created_at).toLocaleString()} 
                        readOnly 
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                      />
                    </div>
                  </div>
                </div>
                */}

                {/* ID Document */}
                {selectedUser.id_document_data && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                      ID Document
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Document: {selectedUser.id_document_filename || 'ID Document'}</Label>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (selectedUser.id_document_data && selectedUser.id_document_type) {
                              const dataUrl = `data:${selectedUser.id_document_type};base64,${selectedUser.id_document_data}`;
                              const newWindow = window.open();
                              if (newWindow) {
                                newWindow.document.write(`
                                  <html>
                                    <head>
                                      <title>${selectedUser.id_document_filename || 'ID Document'}</title>
                                      <style>
                                        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #000; }
                                        img { max-width: 100%; height: auto; }
                                        embed { width: 100%; height: 90vh; }
                                      </style>
                                    </head>
                                    <body>
                                      ${selectedUser.id_document_type?.startsWith('image/') 
                                        ? `<img src="${dataUrl}" alt="ID Document" />` 
                                        : `<embed src="${dataUrl}" type="${selectedUser.id_document_type}" />`
                                      }
                                    </body>
                                  </html>
                                `);
                                newWindow.document.close();
                              }
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          View Document
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Wire Transfer Requests */}
                <WireTransferRequests user={selectedUser} onUpdate={loadUsers} />
              </TabsContent>

              {/* Crypto Tab */}

              {/* Crypto Tab - Commented Out */}
              {/*
              <TabsContent value="crypto">
                <CryptoManagement user={selectedUser} onUpdate={loadUsers} />
              </TabsContent>
              */}

              {/* Loans Tab - Commented Out */}
              {/*
              <TabsContent value="loans" className="space-y-4">
                <LoanManagement user={selectedUser} onUpdate={loadUsers} />
              </TabsContent>
              */}

              {/* Transaction Builder Tab */}
              <TabsContent value="transactions" className="space-y-4">
                <TransactionBuilder user={selectedUser} onUpdate={loadUsers} />
              </TabsContent>

              {/* Investments Tab - Commented Out */}
              {/*
              <TabsContent value="investments" className="space-y-4">
                <InvestmentManagement user={selectedUser} />
              </TabsContent>
              */}

              {/* Global Notifications Tab - Commented Out
              <TabsContent value="notifications" className="space-y-4 py-8">
                <NotificationManagement user={selectedUser} />
              </TabsContent>
              */}

              {/* Messages Tab */}
              <TabsContent value="messages" className="space-y-4">
                <MessagesManagement userId={selectedUser.id} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* User Creation Dialog */}
      <UserCreation 
        isOpen={isUserCreationOpen} 
        onClose={() => setIsUserCreationOpen(false)} 
        onUserCreated={handleUserCreated} 
      />
    </div>
  );
};

export default AdminDashboard;
