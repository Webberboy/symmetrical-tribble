import { Resend } from 'resend';
import { supabase } from '@/integrations/supabase/client';

// Initialize Resend
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

// Log API key status (without exposing the full key)

/**
 * Get website settings from database
 */
async function getWebsiteSettings() {
  // Try localStorage first (already cached by preload script)
  const cachedName = localStorage.getItem('website_name');
  if (cachedName) {
    return { websiteName: cachedName };
  }

  // Fallback: fetch from Supabase
  try {
    const { data } = await supabase
      .from('white_label_settings')
      .select('website_name')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return { websiteName: data?.website_name || '${websiteName}' };
  } catch (error) {
    return { websiteName: '${websiteName}' }; // Fallback
  }
}

/**
 * Email configuration
 * Domain verified! Using custom branded sender
 */
const EMAIL_CONFIG = {
  // Using verified domain for professional branded emails
  from: 'noreply@unitycapital.com', // Will be combined with website name dynamically
    replyTo: 'support@unitycapital.com',
};

/**
 * Send custom HTML email (for admin use)
 * Note: This function calls Resend from the browser, which will cause CORS errors.
 * For production, this should be moved to a backend/serverless function.
 */
export const sendCustomEmail = async (
  fromName: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send email' };
  }
};

/**
 * Send email verification link (alternative to Supabase emails)
 */
export const sendVerificationEmail = async (
  email: string,
  firstName: string,
  verificationUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    
    // Get dynamic website name
    const { websiteName } = await getWebsiteSettings();
    
    const { data, error } = await resend.emails.send({
      from: `${websiteName} <${EMAIL_CONFIG.from}>`,
      to: email,
      subject: `Verify Your ${websiteName} Account`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your ${websiteName} Account</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background-color: #1f2937; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${websiteName}</h1>
                        <p style="color: #e5e7eb; margin: 10px 0 0 0; font-size: 14px;">Enterprise Banking</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email Address</h2>
                        
                        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                          Hi ${firstName},
                        </p>
                        
                        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                          Thank you for signing up with ${websiteName}! We're excited to have you join our banking community.
                        </p>
                        
                        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                          To complete your account setup and access all our banking services, please verify your email address by clicking the button below:
                        </p>
                        
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                Verify Email Address
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="color: #2563eb; font-size: 12px; word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
                          ${verificationUrl}
                        </p>
                        
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                          <strong>Important:</strong> This verification link will expire in 24 hours for security purposes.
                        </p>
                        
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
                          If you didn't create an account with ${websiteName}, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                          © 2025 ${websiteName}. All rights reserved.
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                          Need help? Contact us at <a href="mailto:support@unitycapital.com" style="color: #2563eb; text-decoration: none;">support@unitycapital.com</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send verification email' };
  }
};

/**
 * Send transaction receipt email
 */
export const sendTransactionReceipt = async (
  email: string,
  firstName: string,
  transaction: {
    type: 'wire' | 'transfer' | 'payment';
    amount: number;
    recipient: string;
    date: string;
    transactionId: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get dynamic website name
    const { websiteName } = await getWebsiteSettings();
    
    const { data, error } = await resend.emails.send({
      from: `${websiteName} <${EMAIL_CONFIG.from}>`,
      to: email,
      subject: `Transaction Receipt - ${transaction.transactionId}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Transaction Receipt</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background-color: #1f2937; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${websiteName}</h1>
                        <p style="color: #e5e7eb; margin: 10px 0 0 0; font-size: 14px;">Transaction Receipt</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Transaction Confirmed ✅</h2>
                        
                        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                          Hi ${firstName}, your transaction has been processed successfully.
                        </p>
                        
                        <!-- Transaction Details -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; margin: 20px 0;">
                          <tr>
                            <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
                              <p style="color: #6b7280; margin: 0; font-size: 14px;">Transaction ID</p>
                              <p style="color: #1f2937; margin: 5px 0 0 0; font-weight: 600;">${transaction.transactionId}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
                              <p style="color: #6b7280; margin: 0; font-size: 14px;">Type</p>
                              <p style="color: #1f2937; margin: 5px 0 0 0; font-weight: 600; text-transform: capitalize;">${transaction.type}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
                              <p style="color: #6b7280; margin: 0; font-size: 14px;">Amount</p>
                              <p style="color: #059669; margin: 5px 0 0 0; font-weight: 700; font-size: 20px;">$${transaction.amount.toFixed(2)}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
                              <p style="color: #6b7280; margin: 0; font-size: 14px;">Recipient</p>
                              <p style="color: #1f2937; margin: 5px 0 0 0; font-weight: 600;">${transaction.recipient}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 15px;">
                              <p style="color: #6b7280; margin: 0; font-size: 14px;">Date & Time</p>
                              <p style="color: #1f2937; margin: 5px 0 0 0; font-weight: 600;">${transaction.date}</p>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                          You can view this transaction in your dashboard at any time.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                          © 2025 ${websiteName}. All rights reserved.
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                          This email was sent to ${email}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send transaction receipt' };
  }
};

/**
 * Send security alert email
 */
export const sendSecurityAlert = async (
  email: string,
  firstName: string,
  alert: {
    type: string;
    description: string;
    date: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get dynamic website name
    const { websiteName } = await getWebsiteSettings();
    
    const { data, error } = await resend.emails.send({
      from: `${websiteName} <${EMAIL_CONFIG.from}>`,
      to: email,
      subject: `🔒 Security Alert - ${websiteName}`,
      html: `
        <!DOCTYPE html>
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
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-top: 4px solid #dc2626;">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 30px; text-align: center;">
                        <h1 style="color: #dc2626; margin: 0; font-size: 28px;">🔒 Security Alert</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 30px 40px 30px;">
                        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                          Hi ${firstName},
                        </p>
                        
                        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                          <p style="color: #991b1b; margin: 0; font-weight: 600;">${alert.type}</p>
                          <p style="color: #7f1d1d; margin: 10px 0 0 0; line-height: 1.6;">${alert.description}</p>
                          <p style="color: #991b1b; margin: 10px 0 0 0; font-size: 14px;">Time: ${alert.date}</p>
                        </div>
                        
                        <p style="color: #4b5563; line-height: 1.6; margin: 20px 0;">
                          If this was you, no action is needed. If you don't recognize this activity, please contact our security team immediately.
                        </p>
                        
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <a href="${window.location.origin}/support" style="display: inline-block; padding: 14px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                Contact Support
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                          © 2025 ${websiteName}. All rights reserved.
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                          This email was sent to ${email}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send security alert' };
  }
};

/**
 * Send welcome email using the edge function
 */
export const sendWelcomeEmail = async (
  email: string,
  accountNumber: string,
  firstName?: string
): Promise<{ success: boolean; error?: string }> => {
  console.log('📧 [DEBUG] sendWelcomeEmail called with:', { email, accountNumber, firstName });
  
  try {
    console.log('=== sendWelcomeEmail called ===');
    console.log('Email:', email);
    console.log('Account number:', accountNumber);
    console.log('First name:', firstName);
    
    console.log('📧 [DEBUG] Calling Supabase edge function: newsend-welcome-email');
    const { data, error } = await supabase.functions.invoke('newsend-welcome-email', {
      body: {
        email,
        firstName,
        accountNumber
      }
    });

    console.log('📧 [DEBUG] Edge function response:', { data, error });

    if (error) {
      console.log('❌ [DEBUG] Edge function error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [DEBUG] Welcome email sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error in sendWelcomeEmail:', error);
    return { success: false, error: error.message || 'Failed to send welcome email' };
  }
};
