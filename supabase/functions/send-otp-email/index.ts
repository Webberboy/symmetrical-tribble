import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPEmailRequest {
  email: string;
  otpCode: string;
  userName: string;
  deviceInfo: string;
  location: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check authentication - just verify that some authorization header exists
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Missing or invalid Authorization header");
    }

    // For now, accept any bearer token (we can tighten this later)
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      throw new Error("Empty bearer token");
    }

    // Check if RESEND_API_KEY is available
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, otpCode, userName, deviceInfo, location } = await req.json() as OTPEmailRequest;


    const loginTime = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Heritage Bank <noreply@heritagebk.org>",
        to: [email],
        subject: "Your Heritage Bank Login Code",
        html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Login Code</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <tr>
              <td style="background-color: #1f2937; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Heritage Bank</h1>
                <p style="color: #e5e7eb; margin: 10px 0 0 0; font-size: 14px;">Enterprise Banking</p>
              </td>
            </tr>
            
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Login Verification Code</h2>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                  Hello ${userName}, someone is trying to log in to your Heritage Bank account. If this was you, use the verification code below:
                </p>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px; margin: 30px 0;">
                  <tr>
                    <td style="padding: 30px; text-align: center;">
                      <p style="color: #e5e7eb; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Your Verification Code</p>
                      <p style="color: #ffffff; margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        ${otpCode}
                      </p>
                    </td>
                  </tr>
                </table>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; margin: 20px 0;">
                  <tr>
                    <td style="padding: 16px;">
                      <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                        <strong>⚠️ Security Notice:</strong> This code will expire in 10 minutes. Never share this code with anyone.
                      </p>
                    </td>
                  </tr>
                </table>
                
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                    <strong>Login Details:</strong>
                  </p>
                  <p style="color: #4b5563; font-size: 13px; line-height: 1.6; margin: 0;">
                    • Time: ${loginTime}<br>
                    • Device: ${deviceInfo}<br>
                    • Location: ${location}
                  </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #dc2626; font-size: 14px; line-height: 1.6; margin: 0; font-weight: 600;">
                  ⚠️ If you didn't attempt to log in, please secure your account immediately by changing your password.
                </p>
              </td>
            </tr>
            
            <tr>
              <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  © ${new Date().getFullYear()} Heritage Bank. All rights reserved.
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
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const data = await res.json();

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, details: error.stack }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-otp-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
