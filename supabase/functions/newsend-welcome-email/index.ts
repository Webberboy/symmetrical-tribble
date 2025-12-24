import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WelcomeEmailRequest {
  email: string
  accountNumber: string
  firstName?: string
}

serve(async (req) => {
  console.log('=== Welcome Email Edge Function Started ===')
  console.log('Request URL:', req.url)
  console.log('Request method:', req.method)
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request handled')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log request details
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    let body
    try {
      body = await req.json()
      console.log('Request body parsed successfully:', JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: parseError.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Validate that body is an object
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ 
        error: 'Request body must be a JSON object',
        received: body
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    const { email, accountNumber, firstName }: WelcomeEmailRequest = body

    // Validate required parameters with detailed checks
    if (!email) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameter: email is required',
        received: { email, accountNumber, firstName }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    if (!accountNumber) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameter: accountNumber is required',
        received: { email, accountNumber, firstName }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid email format' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate account number format (should be 12 digits)
    const accountNumberRegex = /^\d{12}$/
    if (!accountNumberRegex.test(accountNumber)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid account number format: must be 12 digits' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Add console log for debugging
    console.log('Welcome email request received:', { email, accountNumber, firstName })

    // Check if Resend API key is available
    if (!RESEND_API_KEY) {
      console.log('=== TEST MODE - No Resend API key configured ===')
      console.log('Would have sent welcome email with:', { email, accountNumber, firstName })
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Test mode - welcome email not sent (no API key)',
        accountNumber: accountNumber 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Personalize greeting
    const greeting = firstName ? `Dear ${firstName}` : 'Welcome'

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Unity Capital Bank <noreply@unitycaplbk.org>',
        to: [email],
        subject: 'Welcome to Unity Capital Bank - Account Created Successfully',
        html: `
<!DOCTYPE html> 
<html> 
  <head> 
    <meta charset="utf-8"> 
    <meta name="viewport" content="width=device-width, initial-scale=1.0"> 
    <title>Welcome to Unity Capital Bank</title> 
  </head> 
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;"> 
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;"> 
      <tr> 
        <td align="center"> 
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"> 
            <tr> 
              <td style="background-color: #1f2937; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;"> 
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Unity Capital Bank</h1> 
                <p style="color: #e5e7eb; margin: 10px 0 0 0; font-size: 14px;">Enterprise Banking</p> 
              </td> 
            </tr> 
            <tr> 
              <td style="padding: 40px 30px;"> 
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">${greeting}!</h2> 
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;"> 
                  Thank you for choosing Unity Capital Bank! Your account has been successfully created and you're now ready to experience modern banking at its finest. 
                </p> 
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-weight: 600;"> 
                  Your account number is: 
                </p> 
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;"> 
                  <tr> 
                    <td align="center"> 
                      <div style="display: inline-block; background-color: #1f2937; border: 2px solid #2563eb; border-radius: 8px; padding: 20px 40px;"> 
                        <span style="font-size: 36px; font-weight: bold; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;"> 
                          ${accountNumber} 
                        </span> 
                      </div> 
                     </td> 
                  </tr> 
                </table> 
                <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;"> 
                  <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;"> 
                    <strong>💡 Welcome Features:</strong> Secure online banking, competitive interest rates, free domestic wire transfers, 24/7 customer support, and advanced security features. 
                  </p> 
                </div> 
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;"> 
                  <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;"> 
                    <strong>🔒 Security Reminder:</strong> Keep your account number confidential, never share login credentials, enable two-factor authentication, and monitor your account regularly. 
                  </p> 
                </div> 
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;"> 
                  If you didn't create an account with Unity Capital Bank, please disregard this email. 
                </p> 
              </td> 
            </tr> 
            <tr> 
              <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;"> 
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;"> 
                  © ${new Date().getFullYear()} Unity Capital Bank. All rights reserved. 
                </p> 
                <p style="color: #9ca3af; font-size: 12px; margin: 0;"> 
                  This is an automated message, please do not reply to this email. 
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
      }),
    })

    if (res.ok) {
      const data = await res.json()
      console.log('Welcome email sent successfully:', data)
      console.log('=== Welcome Email Edge Function Completed Successfully ===')
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      const errorText = await res.text()
      console.error('Resend API error:', errorText)
      console.log('=== Welcome Email Edge Function Failed - Resend API Error ===')
      return new Response(JSON.stringify({ 
        error: 'Failed to send welcome email',
        details: errorText,
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    console.error('Welcome email error:', error)
    console.log('=== Welcome Email Edge Function Failed - Exception ===')
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})