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
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
      margin: -20px -20px 20px -20px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 5px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 20px 0;
    }
    .account-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 5px;
      margin: 25px 0;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      font-family: 'Courier New', monospace;
    }
    .account-details {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      border: 1px solid #e9ecef;
    }
    .account-details h3 {
      color: #667eea;
      margin-top: 0;
      font-size: 18px;
      font-weight: 600;
    }
    .account-details p {
      margin: 8px 0;
      font-size: 14px;
    }
    .account-details strong {
      color: #495057;
    }
    .features {
      background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
      border: 1px solid #28a745;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
    }
    .features p {
      margin: 0 0 10px 0;
      font-weight: 600;
      color: #155724;
    }
    .features ul {
      margin: 0;
      padding-left: 20px;
      color: #155724;
    }
    .features li {
      margin: 5px 0;
      font-size: 14px;
    }
    .security-notice {
      background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
      border: 1px solid #17a2b8;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
    }
    .security-notice p {
      margin: 0 0 10px 0;
      font-weight: 600;
      color: #0c5460;
    }
    .security-notice ul {
      margin: 0;
      padding-left: 20px;
      color: #0c5460;
    }
    .security-notice li {
      margin: 5px 0;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #6c757d;
      font-size: 12px;
      line-height: 1.5;
    }
    .footer p {
      margin: 5px 0;
    }
    .highlight {
      color: #667eea;
      font-weight: 600;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: 600;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div className="container">
    <div className="header">
      <h1>Unity Capital Bank</h1>
      <p>Modern Financial Management</p>
    </div>
    
    <div className="content">
      <h2 style="color: #667eea; margin-bottom: 15px;">${greeting}!</h2>
      <p style="font-size: 16px; margin-bottom: 20px;">Thank you for choosing Unity Capital Bank. Your account has been successfully created and you're now ready to experience modern banking at its finest.</p>
      
      <div className="account-box">
        ${accountNumber}
      </div>
      
      <div className="account-details">
        <h3>Your Account Details</h3>
        <p><strong>Account Number:</strong> <span className="highlight">${accountNumber}</span></p>
        <p><strong>Account Type:</strong> Checking & Savings Accounts</p>
        <p><strong>Status:</strong> <span style="color: #28a745;">Active</span></p>
        <p><strong>Date Opened:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div className="features">
        <p><strong>🎉 Welcome to Modern Banking!</strong></p>
        <ul>
          <li>Secure online and mobile banking access</li>
          <li>Competitive interest rates on savings accounts</li>
          <li>Free domestic wire transfers</li>
          <li>24/7 customer support</li>
          <li>Advanced security features to protect your account</li>
        </ul>
      </div>
      
      <div className="security-notice">
        <p><strong>🔒 Important Security Information</strong></p>
        <ul>
          <li>Keep your account number confidential and secure</li>
          <li>Never share your login credentials with anyone</li>
          <li>Enable two-factor authentication for enhanced security</li>
          <li>Monitor your account regularly for any unauthorized activity</li>
          <li>Contact us immediately if you notice any suspicious activity</li>
        </ul>
      </div>
      
      <p style="text-align: center; margin: 25px 0;">
        <a href="#" className="btn">Log In to Your Account</a>
      </p>
      
      <p style="font-size: 16px; margin-bottom: 20px;">We're excited to have you as part of the Unity Capital Bank family. If you have any questions or need assistance, our dedicated support team is here to help.</p>
    </div>
    
    <div className="footer">
      <p><strong>Unity Capital Bank</strong></p>
      <p>Modern Financial Management Made Simple & Secure</p>
      <p>For support, contact us at support@unitycaplbk.org</p>
      <p>&copy; ${new Date().getFullYear()} Unity Capital Bank. All rights reserved.</p>
    </div>
  </div>
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