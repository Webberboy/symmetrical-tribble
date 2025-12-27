import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const emailTemplates = [];

const EmailInterface = () => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [useHtmlTemplate, setUseHtmlTemplate] = useState(true);
  const [importedEmails, setImportedEmails] = useState<string[]>([]);
  const [showEmailList, setShowEmailList] = useState(false);

  const handleTemplateSelect = (templateId: string) => {
    // Template functionality removed - users now create emails from scratch
  };

  const generateHtmlFromText = (textContent: string) => {
    // Convert plain text to HTML using Unity Capital Bank design style with branded header
    const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject || 'Unity Capital Bank Notification'}</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <!-- Branded Header -->
    <div style="background-color: #111111; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.5px;">Unity Capital Bank</h1>
    </div>

    <!-- Main Content Container -->
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Dear Customer,
        </p>
        
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #3498db;">
          <div style="font-size: 16px; line-height: 1.6; color: #333;">
            ${textContent.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Thank you for banking with us.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Best regards,<br>
          <strong>Unity Capital Bank Team</strong>
        </p>
    </div>
</body>
</html>`;
    
    return htmlTemplate;
  };

  const handleClearForm = () => {
    setRecipientEmail('');
    setSubject('');
    setContent('');
    setShowPreview(false);
    setUseHtmlTemplate(true);
    setImportedEmails([]);
    setShowEmailList(false);
    toast.info('Form cleared');
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const emails = extractEmailsFromContent(content);
      
      if (emails.length === 0) {
        toast.error('No valid email addresses found in file');
        return;
      }

      setImportedEmails(emails);
      setShowEmailList(true);
      toast.success(`Imported ${emails.length} email address${emails.length !== 1 ? 'es' : ''}`);
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const extractEmailsFromContent = (content: string): string[] => {
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
    const emails = content.match(emailRegex) || [];
    
    // Remove duplicates and filter valid emails
    const uniqueEmails = [...new Set(emails)].filter(email => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailPattern.test(email);
    });
    
    return uniqueEmails;
  };

  const handleUseImportedEmail = (email: string) => {
    setRecipientEmail(email);
    setShowEmailList(false);
  };

  const handleUseAllImportedEmails = () => {
    setRecipientEmail(importedEmails.join(', '));
    setShowEmailList(false);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== HANDLE SEND EMAIL TRIGGERED ===');
    console.log('Current form state:', {
      recipientEmail: recipientEmail,
      subject: subject,
      contentLength: content.length,
      useHtmlTemplate: useHtmlTemplate
    });
    
    if (!recipientEmail || !subject || !content) {
      toast.error('Please fill in all required fields');
      console.log('ERROR: Missing required fields');
      return;
    }

    console.log('=== EMAIL SEND DEBUG START ===');
    console.log('1. Form validation starting...');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = recipientEmail.split(',').map(email => email.trim()).filter(email => email);
    const invalidEmails = recipients.filter(email => !emailRegex.test(email));
    
    console.log('2. Recipients found:', recipients);
    console.log('3. Invalid emails:', invalidEmails);
    
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      console.log('4. Validation failed - invalid emails found');
      return;
    }

    setIsLoading(true);
    console.log('5. Starting email send process...');

    try {
      // Create email data object
      const emailData = {
        to: recipients,
        subject: subject,
        text: content,
        html: useHtmlTemplate ? generateHtmlFromText(content) : undefined
      };
      
      console.log('6. Email data created:', emailData);
      
      // Get the authentication token from localStorage or session
      const token = localStorage.getItem('sb-localhost-auth-token') || 
                   localStorage.getItem('supabase-auth-token') ||
                   sessionStorage.getItem('sb-localhost-auth-token') ||
                   sessionStorage.getItem('supabase-auth-token');
      
      // Check for admin session as fallback
      const adminSession = localStorage.getItem('testAdminSession');
      const adminUser = localStorage.getItem('adminUser');
      
      console.log('7. Auth token found:', token ? 'YES (length: ' + token.length + ')' : 'NO');
      console.log('7b. Admin session found:', adminSession ? 'YES' : 'NO');
      console.log('7c. Admin user found:', adminUser ? 'YES' : 'NO');
      console.log('8. LocalStorage items:');
      console.log('   - sb-localhost-auth-token:', localStorage.getItem('sb-localhost-auth-token') ? 'EXISTS' : 'NOT FOUND');
      console.log('   - supabase-auth-token:', localStorage.getItem('supabase-auth-token') ? 'EXISTS' : 'NOT FOUND');
      console.log('   - testAdminSession:', localStorage.getItem('testAdminSession') ? 'EXISTS' : 'NOT FOUND');
      console.log('   - adminUser:', localStorage.getItem('adminUser') ? 'EXISTS' : 'NOT FOUND');
      
      if (!token && !adminSession) {
        toast.error('Authentication required. Please log in again.');
        setIsLoading(false);
        console.log('9. ERROR: No auth token or admin session found - stopping');
        return;
      }
      
      // Use admin session token if no regular auth token exists
      const authToken = token || adminSession;

      console.log('10. Calling edge function...');
      console.log('11. Edge function URL: /functions/v1/sendmail');
      console.log('12. Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken ? authToken.substring(0, 20) : 'NONE'}...` // Only log first 20 chars of token
      });

      // Call the Supabase edge function
      const response = await fetch('/functions/v1/sendmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(emailData)
      });

      console.log('13. Edge function response status:', response.status);
      console.log('14. Edge function response ok:', response.ok);
      console.log('14b. Using auth token:', authToken ? authToken.substring(0, 20) + '...' : 'NONE');
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('15. Edge function error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('15. Edge function result:', result);
      
      if (result.success) {
        console.log('16. SUCCESS: Email sent successfully:', result);
        toast.success(result.message || `Email sent successfully to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}!`);
        handleClearForm();
      } else {
        console.error('17. ERROR: Email sending failed:', result);
        toast.error(result.error || 'Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('18. CATCH ERROR: Error sending email:', error);
      console.error('19. Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
      console.log('20. Email send process completed');
      console.log('=== EMAIL SEND DEBUG END ===');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-gray-300 hover:text-white hover:bg-gray-700 p-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <h1 className="text-3xl font-bold text-white">Email Management</h1>
          </div>
          <p className="text-gray-400">Send custom emails to users</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Compose Email</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-gray-300">Recipient Email</Label>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleFileImport}
                          className="hidden"
                          id="email-import"
                        />
                        <label
                          htmlFor="email-import"
                          className="cursor-pointer px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                        >
                          Import Emails
                        </label>
                        {importedEmails.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowEmailList(!showEmailList)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs px-2 py-1"
                          >
                            {showEmailList ? 'Hide' : 'Show'} ({importedEmails.length})
                          </Button>
                        )}
                      </div>
                    </div>
                    <Input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                    
                    {showEmailList && importedEmails.length > 0 && (
                      <div className="mt-2 border border-gray-600 rounded-lg bg-gray-800">
                        <div className="p-2 bg-gray-900 border-b border-gray-600 flex justify-between items-center">
                          <p className="text-sm font-medium text-gray-300">Imported Emails ({importedEmails.length})</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleUseAllImportedEmails}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs px-2 py-1"
                          >
                            Use All
                          </Button>
                        </div>
                        <div className="max-h-32 overflow-y-auto">
                          {importedEmails.map((email, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-2 hover:bg-gray-700 border-b border-gray-700 last:border-b-0"
                            >
                              <span className="text-sm text-gray-300 truncate">{email}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUseImportedEmail(email)}
                                className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1"
                              >
                                Use
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-gray-300">Subject</Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter email subject"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>

                  {/* HTML Template Toggle */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="html-template"
                      checked={useHtmlTemplate}
                      onChange={(e) => setUseHtmlTemplate(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor="html-template" className="text-gray-300 cursor-pointer">
                      Use branded HTML template
                    </Label>
                  </div>


                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-gray-300">Email Content</Label>
                      <div className="flex gap-1">
                        <Button
                          variant={!showPreview ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setShowPreview(false)}
                          className={`${!showPreview ? 'bg-blue-600' : 'border-gray-600 text-gray-300'} text-xs px-2 py-1`}
                        >
                          Text Editor
                        </Button>
                        <Button
                          variant={showPreview ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setShowPreview(true)}
                          className={`${showPreview ? 'bg-blue-600' : 'border-gray-600 text-gray-300'} text-xs px-2 py-1`}
                        >
                          Preview
                        </Button>
                      </div>
                    </div>
                    
                    {!showPreview ? (
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Type your email message here..."
                        rows={12}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 resize-vertical"
                      />
                    ) : (
                      <div className="border border-gray-600 rounded-lg bg-gray-800">
                        <div className="p-3 bg-gray-900 border-b border-gray-600">
                          <p className="text-sm font-medium text-gray-300">Email Preview</p>
                        </div>
                        <div className="p-4 max-h-64 overflow-y-auto">
                          <div dangerouslySetInnerHTML={{ 
                            __html: useHtmlTemplate ? generateHtmlFromText(content || 'Your email content will appear here...') : (content || 'Your email content will appear here...').replace(/\n/g, '<br>') 
                          }} />
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-400 mt-1">
                      {!showPreview 
                        ? ""
                        : "Preview mode - See how your email will look"
                      }
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSendEmail}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isLoading ? 'Sending...' : 'Send Email'}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleClearForm}
                      disabled={isLoading}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Clear Form
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailInterface;