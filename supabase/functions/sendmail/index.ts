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
    const { to, subject, text, html, from = 'noreply@unitycaplbk.org', fromName = 'Unity Capital Bank' } = await req.json()

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

    // Extract token and decode JWT to check role
    const token = authHeader.replace('Bearer ', '')
    
    // Decode JWT payload to check role
    let isServiceRole = false
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(token.split('.')[1].length + (4 - token.split('.')[1].length % 4) % 4, '=')))
      isServiceRole = payload.role === 'service_role'
    } catch (e) {
      console.error('Error decoding JWT:', e)
    }
    
    let userId: string | null = null
    
    if (isServiceRole) {
      // For service role key, we don't set a user ID since it's not a real user
      userId = null
    } else {
      // For regular user tokens, verify the user and check admin privileges
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
      
      userId = user.id
    }

    // Email service configuration
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || Deno.env.get('VITE_RESEND_API_KEY')
    
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Resend API key not configured' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Log email attempt for audit purposes
    // For service role, we don't set admin_id since it's not a real user
    const logData: any = {
      recipients: recipients,
      subject: subject,
      content_preview: (text || html || '').substring(0, 200),
      status: 'pending',
      created_at: new Date().toISOString()
    }
    
    // Only set admin_id if we have a real user ID (not service role)
    if (!isServiceRole && userId) {
      logData.admin_id = userId
    }
    
    const { data: emailLog, error: logError } = await supabaseClient
      .from('email_logs')
      .insert(logData)
      .select()
      .single()

    if (logError) {
      console.error('Error logging email:', logError)
    }

    // Send emails using Resend API
    const emailResults = await Promise.allSettled(
      recipients.map(async (recipient) => {
        try {
          const emailData = {
            from: `${fromName} <${from}>`,
            to: [recipient],
            subject: subject,
            text: text,
            html: html
          }

          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            throw new Error(`Resend API error: ${response.status} - ${JSON.stringify(errorData)}`)
          }

          const result = await response.json()
          console.log(`Email sent successfully to: ${recipient}`, result)
          return { recipient, success: true, messageId: result.id }
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