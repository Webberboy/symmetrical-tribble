// Heritage Bank - Welcome Email Edge Function
// Triggered automatically when a new profile is inserted into the database
// Sends welcome email via Resend with account number

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: {
    id: string
    email: string
    first_name: string
    full_name: string
    account_number: string
    created_at: string
  }
  schema: string
  old_record: null | any
}

Deno.serve(async (req) => {
  try {
    }

    // Parse the webhook payload
    const payload: WebhookPayload = await req.json()
    }

    const profile = payload.record

    // Validate we have required data
    if (!profile.email || !profile.first_name || !profile.account_number) {
    }


    const resendData = await res.json()

    if (!res.ok) {
    }

  } catch (error) {
  }
})
