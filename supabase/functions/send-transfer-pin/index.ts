import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransferPinRequest {
  email: string
  pin: string
  amount: number
  recipient: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, pin, amount, recipient }: TransferPinRequest = await req.json()

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Heritage Bank <noreply@heritagebk.org>',
        to: [email],
        subject: 'Wire Transfer Authorization PIN',
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #1a1a1a;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .content {
      background-color: #f9f9f9;
      padding: 30px;
      border-radius: 5px;
      margin-top: 20px;
    }
    .pin-box {
      background-color: #fff;
      border: 2px solid #1a1a1a;
      padding: 20px;
      text-align: center;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 8px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .transfer-details {
      background-color: #fff;
      padding: 15px;
      border-left: 4px solid #1a1a1a;
      margin: 20px 0;
    }
    .warning {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Heritage Bank</h1>
      <p>Wire Transfer Authorization</p>
    </div>
    
    <div class="content">
      <h2>Transfer PIN Required</h2>
      <p>You are attempting to authorize a wire transfer. Please use the PIN below to complete the authorization:</p>
      
      <div class="pin-box">
        ${pin}
      </div>
      
      <div class="transfer-details">
        <h3>Transfer Details:</h3>
        <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
        <p><strong>Recipient:</strong> ${recipient}</p>
        <p><strong>Valid for:</strong> 10 minutes</p>
      </div>
      
      <div class="warning">
        <p><strong>⚠️ Security Alert</strong></p>
        <ul>
          <li>This PIN is valid for 10 minutes</li>
          <li>Never share this PIN with anyone</li>
          <li>Heritage Bank will never ask for your PIN via phone or email</li>
          <li>If you didn't initiate this transfer, contact us immediately</li>
        </ul>
      </div>
    </div>
    
    <div class="footer">
      <p>This is an automated message from Heritage Bank</p>
      <p>For support, contact us at support@heritagebk.org</p>
      <p>&copy; ${new Date().getFullYear()} Heritage Bank. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
        `,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      const error = await res.text()
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
