import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Eye, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSettings } from '@/contexts/SettingsContext';
import { Checkbox } from '@/components/ui/checkbox';

const EmailSending = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { websiteName } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [allUsers, setAllUsers] = useState<Array<{ id: string; email: string; full_name: string }>>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);

  // Form state - MUST be declared before any conditional returns
  const [formData, setFormData] = useState({
    subject: '',
    emailBody: '',
  });

  // Generate the full HTML email with branded header and footer
  const generateFullEmail = (body: string) => {
    const currentYear = new Date().getFullYear();
    const bankName = websiteName || 'Heritage Bank';
    
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${formData.subject}</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <!-- Header -->
            <tr>
              <td style="background-color: #1f2937; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${bankName}</h1>
                <p style="color: #e5e7eb; margin: 10px 0 0 0; font-size: 14px;">Enterprise Banking</p>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <div style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${body}</div>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  © ${currentYear} ${bankName}. All rights reserved.
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  Need help? Contact us at support@heritagebk.org
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  };

  // Check admin authentication on mount
  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Access Denied',
          description: 'Please log in as admin to access this page',
          variant: 'destructive',
        });
        navigate('/xk9p2vnz7q');
        return;
      }

      // Check if user has admin role (you can customize this check)
      const userEmail = session.user.email;
      const adminEmails = ['admin@heritagebk.org']; // Add your admin emails here
      
      if (!adminEmails.includes(userEmail || '')) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      // Load all users once admin is verified
      await loadAllUsers();
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/xk9p2vnz7q');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('full_name', { ascending: true });

      if (error) throw error;
      
      setAllUsers(profiles || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user list',
        variant: 'destructive',
      });
    }
  };

  const handleSelectAllEmails = () => {
    if (selectedEmails.length === allUsers.length) {
      // Deselect all
      setSelectedEmails([]);
    } else {
      // Select all
      setSelectedEmails(allUsers.map(user => user.email));
    }
  };

  const handleToggleEmail = (email: string) => {
    setSelectedEmails(prev => {
      if (prev.includes(email)) {
        return prev.filter(e => e !== email);
      } else {
        return [...prev, email];
      }
    });
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSendEmail = async () => {
    // Validation
    if (selectedEmails.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one recipient',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.subject) {
      toast({
        title: 'Validation Error',
        description: 'Please enter email subject',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.emailBody) {
      toast({
        title: 'Validation Error',
        description: 'Please enter email message',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to send emails',
          variant: 'destructive',
        });
        return;
      }

      // Generate the full HTML with branded header/footer
      const fullHtml = generateFullEmail(formData.emailBody);

      // Send email to each selected recipient
      let successCount = 0;
      let failCount = 0;

      for (const email of selectedEmails) {
        try {
          const { data, error } = await supabase.functions.invoke('send-custom-email', {
            body: {
              fromName: websiteName || 'Heritage Bank',
              fromEmail: 'admin@heritagebk.org',
              toEmail: email,
              subject: formData.subject,
              htmlContent: fullHtml,
            },
          });

          if (error || !data.success) {
            failCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Emails Sent! ✉️',
          description: `Successfully sent to ${successCount} recipient(s)${failCount > 0 ? `, ${failCount} failed` : ''}`,
        });
      }

      if (failCount > 0 && successCount === 0) {
        toast({
          title: 'Failed to Send Emails',
          description: `All ${failCount} emails failed to send`,
          variant: 'destructive',
        });
      }

      // Clear form on success
      if (successCount > 0) {
        setFormData({
          subject: '',
          emailBody: '',
        });
        setSelectedEmails([]);
      }

    } catch (error: any) {
      console.error('Email send error:', error);
      toast({
        title: 'Failed to Send Email',
        description: error.message || 'An error occurred while sending the email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

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
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to Admin</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Send Email</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Composer */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Compose Email
                </CardTitle>
                <CardDescription>
                  Enter recipient, subject, and your message
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email Recipients Selector */}
                <div className="space-y-2">
                  <Label>Recipients *</Label>
                  <div className="relative">
                    <div 
                      onClick={() => setShowEmailDropdown(!showEmailDropdown)}
                      className="min-h-[40px] px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white cursor-pointer flex flex-wrap gap-2 items-center"
                    >
                      {selectedEmails.length === 0 ? (
                        <span className="text-gray-400">Select recipients...</span>
                      ) : (
                        <span className="text-sm">
                          {selectedEmails.length} recipient{selectedEmails.length !== 1 ? 's' : ''} selected
                        </span>
                      )}
                    </div>
                    
                    {showEmailDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-64 overflow-y-auto">
                        {/* Select All Option */}
                        <div 
                          className="px-3 py-2 hover:bg-gray-600 cursor-pointer flex items-center gap-2 border-b border-gray-600 bg-gray-800 sticky top-0"
                          onClick={handleSelectAllEmails}
                        >
                          <Checkbox 
                            checked={selectedEmails.length === allUsers.length && allUsers.length > 0}
                            onCheckedChange={handleSelectAllEmails}
                          />
                          <span className="font-semibold text-white">
                            {selectedEmails.length === allUsers.length ? 'Deselect All' : 'Select All'} ({allUsers.length})
                          </span>
                        </div>

                        {/* Individual User Options */}
                        {allUsers.map((user) => (
                          <div 
                            key={user.id}
                            className="px-3 py-2 hover:bg-gray-600 cursor-pointer flex items-center gap-2"
                            onClick={() => handleToggleEmail(user.email)}
                          >
                            <Checkbox 
                              checked={selectedEmails.includes(user.email)}
                              onCheckedChange={() => handleToggleEmail(user.email)}
                            />
                            <div className="flex-1">
                              <div className="text-sm text-white">{user.full_name || 'N/A'}</div>
                              <div className="text-xs text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        ))}

                        {allUsers.length === 0 && (
                          <div className="px-3 py-4 text-center text-gray-400">
                            No users available
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    Click to select multiple recipients or use "Select All"
                  </p>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Your email subject"
                    required
                  />
                </div>

                {/* Email Body */}
                <div className="space-y-2">
                  <Label htmlFor="emailBody">Message *</Label>
                  <Textarea
                    id="emailBody"
                    value={formData.emailBody}
                    onChange={(e) => handleInputChange('emailBody', e.target.value)}
                    placeholder="Type your email message here..."
                    rows={10}
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enter the email message content
                  </p>
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendEmail}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Email
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Email Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Email Preview
                </CardTitle>
                <CardDescription>
                  See how your email will look to recipients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formData.emailBody ? (
                  <div 
                    className="border rounded-lg p-4 bg-white dark:bg-gray-800 max-h-[600px] overflow-auto"
                    dangerouslySetInnerHTML={{ __html: generateFullEmail(formData.emailBody) }}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Type a message to see the preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSending;
