import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Eye, Mail, Code } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

const EmailSending = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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

  // Form state
  const [formData, setFormData] = useState({
    fromEmail: 'admin@heritagebk.org',
    fromName: 'Heritage Bank',
    toEmail: '',
    subject: '',
    htmlTemplate: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <!-- Header -->
            <tr>
              <td style="background-color: #1f2937; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Heritage Bank</h1>
                <p style="color: #e5e7eb; margin: 10px 0 0 0; font-size: 14px;">Your Trusted Banking Partner</p>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hello there!</h2>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                  This is your email content. You can customize this HTML template to match your needs.
                </p>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                  Add your message here with professional styling and formatting.
                </p>
                
                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                  <tr>
                    <td align="center">
                      <a href="#" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                        Click Here
                      </a>
                    </td>
                  </tr>
                </table>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                  Thank you for being a valued customer.
                </p>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  © 2025 Heritage Bank. All rights reserved.
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
</html>`,
  });

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

    if (!formData.htmlTemplate) {
      toast({
        title: 'Validation Error',
        description: 'Please enter email HTML template',
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

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-custom-email', {
        body: {
          fromName: formData.fromName,
          fromEmail: formData.fromEmail,
          toEmail: formData.toEmail,
          subject: formData.subject,
          htmlContent: formData.htmlTemplate,
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

      // Clear recipient and subject, keep template
      setFormData(prev => ({
        ...prev,
        toEmail: '',
        subject: '',
      }));

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

  const handlePreviewToggle = () => {
    setPreviewMode(!previewMode);
  };

  // Sample templates
  const sampleTemplates = {
    welcome: {
      name: 'Welcome Email',
      html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <tr>
              <td style="background-color: #1f2937; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome! 🎉</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0;">Welcome to Heritage Bank!</h2>
                <p style="color: #4b5563; line-height: 1.6;">We're excited to have you join our banking family. Get ready to experience world-class financial services.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    },
    notification: {
      name: 'Notification',
      html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notification</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <tr>
              <td style="padding: 30px;">
                <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                  <p style="color: #1e40af; margin: 0; font-weight: 600;">Important Notification</p>
                  <p style="color: #1e3a8a; margin: 10px 0 0 0;">This is an important message that requires your attention.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    },
    alert: {
      name: 'Security Alert',
      html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Alert</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; border-top: 4px solid #dc2626;">
            <tr>
              <td style="padding: 30px; text-align: center;">
                <h1 style="color: #dc2626; margin: 0;">🔒 Security Alert</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 30px 40px 30px;">
                <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px;">
                  <p style="color: #991b1b; margin: 0; font-weight: 600;">Security Notice</p>
                  <p style="color: #7f1d1d; margin: 10px 0 0 0;">We detected unusual activity on your account.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    },
  };

  const loadTemplate = (templateKey: string) => {
    const template = sampleTemplates[templateKey as keyof typeof sampleTemplates];
    if (template) {
      setFormData(prev => ({ ...prev, htmlTemplate: template.html }));
      toast({
        title: 'Template Loaded',
        description: `${template.name} template has been loaded`,
      });
    }
  };

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
                Send custom HTML emails to users
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
                  Fill in the email details and customize your HTML template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* From Email */}
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={formData.fromName}
                    onChange={(e) => handleInputChange('fromName', e.target.value)}
                    placeholder="Heritage Bank"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={formData.fromEmail}
                    onChange={(e) => handleInputChange('fromEmail', e.target.value)}
                    placeholder="admin@heritagebk.org"
                  />
                </div>

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

                {/* Template Selection */}
                <div className="space-y-2">
                  <Label>Quick Templates</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadTemplate('welcome')}
                    >
                      Welcome
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadTemplate('notification')}
                    >
                      Notification
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadTemplate('alert')}
                    >
                      Security Alert
                    </Button>
                  </div>
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

          {/* HTML Template Editor & Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    HTML Template
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviewToggle}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {previewMode ? 'Edit' : 'Preview'}
                  </Button>
                </CardTitle>
                <CardDescription>
                  {previewMode ? 'Preview your email design' : 'Edit your HTML template'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="editor" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="editor">Editor</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="editor" className="space-y-2">
                    <Label htmlFor="htmlTemplate">HTML Code</Label>
                    <Textarea
                      id="htmlTemplate"
                      value={formData.htmlTemplate}
                      onChange={(e) => handleInputChange('htmlTemplate', e.target.value)}
                      placeholder="Enter your HTML email template here..."
                      className="font-mono text-sm min-h-[500px]"
                    />
                    <p className="text-xs text-gray-500">
                      Use inline CSS styles for best email client compatibility
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="preview" className="space-y-2">
                    <div className="border rounded-lg overflow-auto bg-white dark:bg-gray-950 min-h-[500px] max-h-[600px]">
                      <div
                        dangerouslySetInnerHTML={{ __html: formData.htmlTemplate }}
                        className="p-4"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tips Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Email Design Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Use inline CSS styles instead of external stylesheets for maximum compatibility</li>
              <li>• Use table-based layouts for consistent rendering across email clients</li>
              <li>• Keep email width around 600px for optimal viewing on all devices</li>
              <li>• Test your emails across different email clients (Gmail, Outlook, etc.)</li>
              <li>• Always include alt text for images</li>
              <li>• Avoid using JavaScript - it's blocked by most email clients</li>
              <li>• Use web-safe fonts like Arial, Helvetica, Times New Roman, Georgia</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailSending;
