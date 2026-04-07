import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabase } from '../_lib/supabase.js'

export async function POST(request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const sig = request.headers.get('stripe-signature')

    // Read raw body for signature verification
    const rawBody = await request.text()

    let event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error('[stripe] webhook signature failed:', err.message)
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
    }

    const sb = getSupabase()

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const { deviceId, productKey } = session.metadata ?? {}

      await sb.from('purchases').update({
        status: 'completed',
        stripe_payment_intent: session.payment_intent,
        completed_at: new Date().toISOString(),
      }).eq('stripe_session_id', session.id)

      if (deviceId) {
        const updates = {}
        if (session.customer) updates.stripe_customer_id = session.customer
        if (session.customer_details?.email) {
          updates.email = session.customer_details.email
          updates.email_opt_in = true
        }
        if (productKey === 'premium_upgrade') {
          updates.tier = 'premium'
          updates.tier_updated_at = new Date().toISOString()
        }
        if (Object.keys(updates).length) {
          await sb.from('devices').update(updates).eq('id', deviceId)
        }
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object
      await sb.from('purchases').update({ status: 'expired' }).eq('stripe_session_id', session.id)
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('[stripe] webhook error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
