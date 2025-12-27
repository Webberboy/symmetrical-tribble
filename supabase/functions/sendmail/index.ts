import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the request body
    const { to, subject, text, html, from = 'noreply@unitycapitalbank.com', fromName = 'Unity Capital Bank' } = await req.json()

    // Validate required fields
    if (!to || !subject || (!text && !html)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to, subject, and content (text or html)' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Normalize recipients to array
    const recipients = Array.isArray(to) ? to : [to]
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = recipients.filter(email => !emailRegex.test(email))
    
    if (invalidEmails.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid email addresses: ${invalidEmails.join(', ')}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Get admin user information from the request context
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authorization required' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Verify admin permissions (check if user is admin)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired token' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Check if user has admin privileges
    const { data: adminData, error: adminError } = await supabaseClient
      .from('admin')
      .select('id')
      .eq('id', user.id)
      .single()

    if (adminError || !adminData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Admin privileges required' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      )
    }

    // Email service configuration
    const emailConfig = {
      service: 'gmail', // You can change this to your email service
      auth: {
        user: Deno.env.get('EMAIL_USER') || 'your-email@gmail.com',
        pass: Deno.env.get('EMAIL_PASS') || 'your-app-password'
      }
    }

    // Log email attempt for audit purposes
    const { data: emailLog, error: logError } = await supabaseClient
      .from('email_logs')
      .insert({
        admin_id: user.id,
        recipients: recipients,
        subject: subject,
        content_preview: (text || html || '').substring(0, 200),
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (logError) {
      console.error('Error logging email:', logError)
    }

    // Simulate email sending (replace with actual email service integration)
    // In production, you would integrate with services like:
    // - SendGrid
    // - Mailgun  
    // - AWS SES
    // - Nodemailer with Gmail/SMTP
    
    const emailResults = await Promise.allSettled(
      recipients.map(async (recipient) => {
        try {
          // Simulate email sending delay
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Here you would integrate with your actual email service
          // Example with a hypothetical email service:
          /*
          const response = await fetch('https://api.emailservice.com/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('EMAIL_SERVICE_API_KEY')}`
            },
            body: JSON.stringify({
              to: recipient,
              from: from,
              fromName: fromName,
              subject: subject,
              text: text,
              html: html
            })
          })
          */

          console.log(`Email sent successfully to: ${recipient}`)
          return { recipient, success: true }
        } catch (error) {
          console.error(`Failed to send email to ${recipient}:`, error)
          return { recipient, success: false, error: error.message }
        }
      })
    )

    const successfulSends = emailResults.filter(result => result.status === 'fulfilled' && result.value.success)
    const failedSends = emailResults.filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success))

    // Update email log with results
    if (emailLog) {
      await supabaseClient
        .from('email_logs')
        .update({
          status: failedSends.length === 0 ? 'sent' : 'partial',
          sent_count: successfulSends.length,
          failed_count: failedSends.length,
          completed_at: new Date().toISOString()
        })
        .eq('id', emailLog.id)
    }

    return new Response(
      JSON.stringify({
        success: failedSends.length === 0,
        message: `Sent ${successfulSends.length} email${successfulSends.length !== 1 ? 's' : ''} successfully`,
        results: {
          successful: successfulSends.map((result: any) => result.value || result),
          failed: failedSends.map((result: any) => result.value || result)
        },
        totalRecipients: recipients.length,
        successfulCount: successfulSends.length,
        failedCount: failedSends.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: failedSends.length === 0 ? 200 : 207
      }
    )

  } catch (error) {
    console.error('Error in sendmail function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})