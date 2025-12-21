// Heritage Bank - Welcome Email Edge Function
// Triggered automatically when a new profile is inserted into the database
// Sends welcome email via Resend with account number

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: {
    id: string
    email: string
    first_name: string
    full_name: string
    account_number: string
    created_at: string
  }
  schema: string
  old_record: null | any
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-request-id',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  try {
    // Verify this is a POST request
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-request-id',
      },
    })
    }

    // Parse the webhook payload
    const payload: WebhookPayload = await req.json()
    
    // Only process INSERT operations on profiles table
    if (payload.type !== 'INSERT' || payload.table !== 'profiles') {
      return new Response('Not a profile insert', { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-request-id',
        },
      })
    }

    const profile = payload.record

    // Validate we have required data
    if (!profile.email || !profile.first_name || !profile.account_number) {
      return new Response('Missing required fields', { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-request-id',
        },
      })
    }

    // Check if Resend API key is available
    const resendApiKey = Deno.env.get('VITE_RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('VITE_RESEND_API_KEY not configured')
      return new Response('Email service not configured', { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-request-id',
        },
      })
    }

    // Send welcome email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Heritage Bank <welcome@heritagebank.com>',
        to: profile.email,
        subject: `Welcome to Heritage Bank - Your Account Number: ${profile.account_number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h1 style="color: #2c3e50; text-align: center;">Welcome to Heritage Bank!</h1>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Dear ${profile.first_name},
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Thank you for choosing Heritage Bank for your financial needs. We're excited to have you as our newest customer!
              </p>
              
              <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #3498db;">
                <h2 style="color: #2c3e50; margin-top: 0;">Your Account Information</h2>
                <p style="font-size: 16px; margin: 10px 0;">
                  <strong>Account Number:</strong> <span style="font-size: 18px; color: #e74c3c; font-weight: bold;">${profile.account_number}</span>
                </p>
                <p style="font-size: 14px; color: #7f8c8d; margin-top: 15px;">
                  <strong>Important:</strong> Please save this account number for future reference. You'll need it for logging in and managing your account.
                </p>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Your account includes:
              </p>
              <ul style="font-size: 16px; line-height: 1.8; color: #333;">
                <li>✅ Checking Account with Account Number: <strong>${profile.account_number}</strong></li>
                <li>✅ Savings Account with competitive interest rates</li>
                <li>✅ Online Banking Access</li>
                <li>✅ Mobile Banking App</li>
                <li>✅ 24/7 Customer Support</li>
              </ul>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                You can now log in to your account using your email address and the password you created during signup.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('VITE_APP_URL') || 'https://heritagebank.com'}/signin" 
                   style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Sign In to Your Account
                </a>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                If you have any questions or need assistance, please don't hesitate to contact our customer support team.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Welcome to the Heritage Bank family!
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Best regards,<br>
                <strong>Heritage Bank Team</strong>
              </p>
              
              <hr style="border: none; height: 1px; background-color: #ddd; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
                This is an automated email. Please do not reply to this address.
              </p>
            </div>
          </div>
        `,
        text: `
Welcome to Heritage Bank!

Dear ${profile.first_name},

Thank you for choosing Heritage Bank for your financial needs. We're excited to have you as our newest customer!

YOUR ACCOUNT INFORMATION:
Account Number: ${profile.account_number}

Important: Please save this account number for future reference. You'll need it for logging in and managing your account.

Your account includes:
✅ Checking Account with Account Number: ${profile.account_number}
✅ Savings Account with competitive interest rates
✅ Online Banking Access
✅ Mobile Banking App
✅ 24/7 Customer Support

You can now log in to your account using your email address and the password you created during signup.

Sign in at: ${Deno.env.get('VITE_APP_URL') || 'https://heritagebank.com'}/signin

If you have any questions or need assistance, please don't hesitate to contact our customer support team.

Welcome to the Heritage Bank family!

Best regards,
Heritage Bank Team

---
This is an automated email. Please do not reply to this address.
        `
      })
    })
    
    const resendData = await res.json()

    if (!res.ok) {
      console.error('Resend API error:', resendData)
      return new Response(`Failed to send email: ${resendData.message}`, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    console.log('Welcome email sent successfully to:', profile.email)
    return new Response(JSON.stringify({ success: true, message: 'Welcome email sent successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-request-id',
      },
    })

  } catch (error) {
    console.error('Error in welcome email function:', error)
    return new Response(`Internal server error: ${error.message}`, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-request-id',
      },
    })
  }
})
