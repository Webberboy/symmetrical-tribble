import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoginNotificationRequest {
  email: string;
  userName: string;
  deviceInfo: string;
  browser: string;
  location: string;
  ipAddress: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName, deviceInfo, browser, location, ipAddress } = await req.json() as LoginNotificationRequest;


    const loginTime = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const changePasswordUrl = `https://unitycapital.com/forgot-password`;
  const contactSupportUrl = `https://unitycapital.com/support`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Unity Capital <noreply@unitycapital.com>",
        to: [email],
        subject: "New Login to Your Unity Capital Account",
        html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Notification</title>
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
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">New Login Detected</h2>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                  Hello ${userName},
                </p>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                  We detected a new login to your Heritage Bank account. If this was you, no action is needed.
                </p>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
                  <tr>
                    <td style="padding: 20px;">
                      <p style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Login Details</p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 30%;">Date & Time:</td>
                          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${loginTime}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Device:</td>
                          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${deviceInfo}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Browser:</td>
                          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${browser}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Location:</td>
                          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${location}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">IP Address:</td>
                          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${ipAddress}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fee2e2; border-left: 4px solid #dc2626; margin: 30px 0;">
                  <tr>
                    <td style="padding: 16px;">
                      <p style="color: #991b1b; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">
                        ⚠️ Wasn't you? Take action immediately!
                      </p>
                      <p style="color: #7f1d1d; margin: 0; font-size: 13px; line-height: 1.6;">
                        If you didn't log in, your account may be compromised. Please change your password immediately and contact our support team.
                      </p>
                    </td>
                  </tr>
                </table>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                  <tr>
                    <td align="center">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 0 10px;">
                            <a href="${changePasswordUrl}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                              Change Password
                            </a>
                          </td>
                          <td style="padding: 0 10px;">
                            <a href="${contactSupportUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                              Contact Support
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;">
                  You're receiving this email to help keep your account secure. We send these notifications for all account logins.
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
      JSON.stringify({ error: error.message }),
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-login-notification' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
