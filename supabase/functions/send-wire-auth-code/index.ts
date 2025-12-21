import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WireAuthRequest {
  email: string
  code: string
  amount: number
  recipient: string
}

serve(async (req) => {
  console.log('=== Edge Function Started ===')
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
    
    const { email, code, amount, recipient }: WireAuthRequest = body

    // Validate required parameters with detailed checks
    if (!email) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameter: email is required',
        received: { email, code, amount, recipient }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    if (!code) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameter: code is required',
        received: { email, code, amount, recipient }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    if (amount === undefined || amount === null) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameter: amount is required',
        received: { email, code, amount, recipient }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    if (!recipient) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameter: recipient is required',
        received: { email, code, amount, recipient }
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

    // Validate code format (should be 6 digits)
    const codeRegex = /^\d{6}$/
    if (!codeRegex.test(code)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid code format: must be 6 digits' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate amount - handle both number and string inputs
    let validatedAmount = amount
    if (typeof amount === 'string') {
      validatedAmount = parseFloat(amount)
    }
    if (typeof validatedAmount !== 'number' || isNaN(validatedAmount) || validatedAmount <= 0) {
      return new Response(JSON.stringify({ 
        error: 'Invalid amount: must be a positive number',
        receivedAmount: amount,
        validatedAmount: validatedAmount
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Add console log for debugging
    console.log('Wire authorization code request received:', { email, code, amount, recipient })

    // Check if Resend API key is available
    if (!RESEND_API_KEY) {
      console.log('=== TEST MODE - No Resend API key configured ===')
      console.log('Would have sent email with:', { email, code, amount: validatedAmount, recipient })
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Test mode - email not sent (no API key)',
        code: code 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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
        subject: 'Wire Transfer Authorization Code',
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
    .code-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      text-align: center;
      font-size: 36px;
      font-weight: bold;
      letter-spacing: 10px;
      margin: 25px 0;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      font-family: 'Courier New', monospace;
    }
    .transfer-details {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      border: 1px solid #e9ecef;
    }
    .transfer-details h3 {
      color: #667eea;
      margin-top: 0;
      font-size: 18px;
      font-weight: 600;
    }
    .transfer-details p {
      margin: 8px 0;
      font-size: 14px;
    }
    .transfer-details strong {
      color: #495057;
    }
    .warning {
      background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
      border: 1px solid #ffc107;
      padding: 20px;
      border-radius: 10px;
      margin-top: 20px;
    }
    .warning p {
      margin: 0 0 10px 0;
      font-weight: 600;
      color: #856404;
    }
    .warning ul {
      margin: 0;
      padding-left: 20px;
      color: #856404;
    }
    .warning li {
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
  </style>
</head>
<body>
  <div className="container">
    <div className="header">
      <h1>Unity Capital Bank</h1>
      <p>Modern Financial Management</p>
    </div>
    
    <div className="content">
      <h2 style="color: #667eea; margin-bottom: 15px;">Wire Transfer Authorization</h2>
      <p style="font-size: 16px; margin-bottom: 20px;">You are attempting to authorize a wire transfer. Please use the authorization code below to complete the authorization:</p>
      
      <div className="code-box">
        ${code}
      </div>
      
      <div className="transfer-details">
        <h3>Transfer Details</h3>
        <p><strong>Amount:</strong> $${validatedAmount.toFixed(2)}</p>
        <p><strong>Recipient:</strong> ${recipient}</p>
        <p><strong>Valid for:</strong> <span className="highlight">10 minutes</span></p>
      </div>
      
      <div className="warning">
        <p><strong>⚠️ Security Alert</strong></p>
        <ul>
          <li>This authorization code is valid for 10 minutes only</li>
          <li>Never share this code with anyone</li>
          <li>Unity Capital Bank will never ask for your authorization code via phone or email</li>
          <li>If you didn't initiate this transfer, contact us immediately</li>
        </ul>
      </div>
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
      console.log('Wire authorization email sent successfully:', data)
      console.log('=== Edge Function Completed Successfully ===')
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      const errorText = await res.text()
      console.error('Resend API error:', errorText)
      console.log('=== Edge Function Failed - Resend API Error ===')
      return new Response(JSON.stringify({ 
        error: 'Failed to send email',
        details: errorText,
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    console.error('Wire authorization error:', error)
    console.log('=== Edge Function Failed - Exception ===')
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})