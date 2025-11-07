import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Eye, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSettings } from '@/contexts/SettingsContext';

const EmailSending = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { websiteName } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Form state - MUST be declared before any conditional returns
  const [formData, setFormData] = useState({
    toEmail: '',
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
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/xk9p2vnz7q');
    } finally {
      setIsCheckingAuth(false);
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleSendEmail = async () => {
    // Validation
    if (!formData.toEmail) {
      toast({
        title: 'Validation Error',
        description: 'Please enter recipient email address',
        variant: 'destructive',
      });
      return;
    }

    if (!validateEmail(formData.toEmail)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address',
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

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-custom-email', {
        body: {
          fromName: websiteName || 'Heritage Bank',
          fromEmail: 'admin@heritagebk.org',
          toEmail: formData.toEmail,
          subject: formData.subject,
          htmlContent: fullHtml,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      toast({
        title: 'Email Sent Successfully! ✉️',
        description: `Email sent to ${formData.toEmail}`,
      });

      // Clear form
      setFormData({
        toEmail: '',
        subject: '',
        emailBody: '',
      });

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/xk9p2vnz7q-dash')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Email Sending
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Send branded emails to users
              </p>
            </div>
          </div>
        </div>

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
                {/* To Email */}
                <div className="space-y-2">
                  <Label htmlFor="toEmail">To Email *</Label>
                  <Input
                    id="toEmail"
                    type="email"
                    value={formData.toEmail}
                    onChange={(e) => handleInputChange('toEmail', e.target.value)}
                    placeholder="recipient@example.com"
                    required
                  />
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
                    Your message will be automatically wrapped with a branded header and footer
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
                    <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
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
