import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { sessionId, userId } = await req.json()

    console.log('Verifying payment session:', { sessionId, userId })

    if (!sessionId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing sessionId or userId' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // Retrieve the Stripe Checkout Session
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    console.log('Session retrieved:', {
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
    })

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Check if payment was successful
    if (session.payment_status === 'paid' && session.status === 'complete') {
      console.log('Payment confirmed - updating payment record to completed')

      // Update existing pending transaction to completed
      const { error } = await supabaseAdmin
        .from('payments')
        .update({
          payment_status: 'completed',
          stripe_payment_intent_id: session.payment_intent as string,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_session_id', sessionId)

      if (error) {
        console.error('Error updating payment record:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to update payment record', details: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          },
        )
      }

      console.log('Payment record updated to completed successfully')

      return new Response(
        JSON.stringify({
          success: true,
          paymentStatus: 'completed',
          message: 'Payment verified and recorded successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else {
      // Payment not completed - update to failed status
      console.log('Payment not completed:', { payment_status: session.payment_status, status: session.status })

      // Update transaction to failed
      const { error } = await supabaseAdmin
        .from('payments')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_session_id', sessionId)

      if (error) {
        console.error('Error updating payment to failed:', error)
      }

      return new Response(
        JSON.stringify({
          success: false,
          paymentStatus: 'failed',
          message: 'Payment not completed'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }
  } catch (error) {
    console.error('Error verifying payment:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
