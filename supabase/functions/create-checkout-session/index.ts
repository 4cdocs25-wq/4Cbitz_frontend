import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, email, successUrl, cancelUrl } = await req.json()

    console.log('Creating checkout session for:', { userId, email })

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '4C Management Business Setup Guide',
              description: 'Lifetime access to comprehensive UAE business setup documents',
            },
            unit_amount: 2999, // $29.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      customer_email: email,
      metadata: {
        userId: userId,
      },
    })

    console.log('Checkout session created:', session.id)

    // Create pending transaction record in database
    const { error: dbError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId,
        payment_status: 'pending',
        stripe_session_id: session.id,
        amount: 2999, // $29.99 in cents
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Error creating pending transaction:', dbError)
      // Don't fail the checkout if database insert fails
      // Transaction can still be tracked via webhook
    } else {
      console.log('Pending transaction created for user:', userId)
    }

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        checkoutUrl: session.url
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
