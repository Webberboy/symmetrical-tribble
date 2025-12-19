import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CryptoOTPRequest {
  email: string;
  otpCode: string;
  cryptoAmount: string;
  cryptoSymbol: string;
  totalAmount: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otpCode, cryptoAmount, cryptoSymbol, totalAmount } = await req.json() as CryptoOTPRequest;


    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Unity Capital <noreply@unitycapital.com>",
        to: [email],
        subject: "Verify Your Crypto Purchase - Unity Capital",
        html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Crypto Purchase</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <tr>
              <td style="background-color: #2563eb; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Unity Capital</h1>
                <p style="color: #e5e7eb; margin: 10px 0 0 0; font-size: 14px;">Crypto Purchase Verification</p>
              </td>
            </tr>
            
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">🔒 Verify Your Crypto Purchase</h2>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                  You are about to purchase <strong style="color: #2563eb;">${cryptoAmount} ${cryptoSymbol}</strong> for <strong style="color: #1f2937;">${totalAmount}</strong>.
                </p>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                  To complete this transaction, please use the verification code below:
                </p>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 12px; margin: 30px 0;">
                  <tr>
                    <td style="padding: 30px; text-align: center;">
                      <p style="color: #e5e7eb; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Your Verification Code</p>
                      <p style="color: #ffffff; margin: 0; font-size: 48px; font-weight: bold; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                        ${otpCode}
                      </p>
                    </td>
                  </tr>
                </table>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; margin: 20px 0;">
                  <tr>
                    <td style="padding: 16px;">
                      <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                        <strong>⚠️ Security Notice:</strong> This code will expire in 10 minutes. Never share this code with anyone, including Unity Capital staff.
                      </p>
                    </td>
                  </tr>
                </table>
                
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                    <strong>Transaction Details:</strong>
                  </p>
                  <p style="color: #4b5563; font-size: 13px; line-height: 1.6; margin: 0;">
                    • Purchase Amount: ${cryptoAmount} ${cryptoSymbol}<br>
                    • Total Cost: ${totalAmount}<br>
                    • Time: ${new Date().toLocaleString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #dc2626; font-size: 14px; line-height: 1.6; margin: 0; font-weight: 600;">
                  ⚠️ If you didn't initiate this purchase, please contact our support team immediately.
                </p>
              </td>
            </tr>
            
            <tr>
              <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  © ${new Date().getFullYear()} Unity Capital. All rights reserved.
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
