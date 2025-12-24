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
    <meta charset="utf-8"> 
    <meta name="viewport" content="width=device-width, initial-scale=1.0"> 
    <title>Wire Transfer Authorization</title> 
  </head> 
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;"> 
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;"> 
      <tr> 
        <td align="center"> 
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"> 
            <tr> 
              <td style="background-color: #dc2626; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;"> 
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Unity Capital Bank</h1> 
                <p style="color: #fee2e2; margin: 10px 0 0 0; font-size: 14px;">Wire Transfer Authorization</p> 
              </td> 
            </tr> 
            <tr> 
              <td style="padding: 40px 30px;"> 
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Wire Transfer Authorization Code</h2> 
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;"> 
                  You have initiated a wire transfer. Please use the following authorization code to complete your transaction. 
                </p> 
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-weight: 600;"> 
                  Your authorization code is: 
                </p> 
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;"> 
                  <tr> 
                    <td align="center"> 
                      <div style="display: inline-block; background-color: #dc2626; border: 2px solid #b91c1c; border-radius: 8px; padding: 20px 40px;"> 
                        <span style="font-size: 36px; font-weight: bold; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;"> 
                          ${code} 
                        </span> 
                      </div> 
                     </td> 
                  </tr> 
                </table> 
                <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;"> 
                  <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;"> 
                    <strong>💰 Transfer Details:</strong> Amount: $${validatedAmount.toFixed(2)}, Recipient: ${recipient}, Date: ${new Date().toLocaleDateString()} 
                  </p> 
                </div> 
                <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px;"> 
                  <p style="color: #b91c1c; font-size: 14px; line-height: 1.6; margin: 0;"> 
                    <strong>⚠️ Security Warning:</strong> This code expires in 10 minutes. Never share this code with anyone. Unity Capital Bank will never ask for this code over the phone. If you didn't initiate this transfer, contact us immediately. 
                  </p> 
                </div> 
                <p style="color: #dc2626; font-size: 14px; line-height: 1.6; margin: 20px 0; font-weight: 600; text-align: center;"> 
                  ⏰ This code expires in 10 minutes 
                </p> 
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;"> 
                  Please enter this code in your banking application to authorize the wire transfer. 
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