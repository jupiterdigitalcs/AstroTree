import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabase } from '../_lib/supabase.js'
import { sendPremiumConfirmation } from '../_lib/email.js'

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

        // Send purchase confirmation email with chart data
        const email = session.customer_details?.email
        if (email && productKey === 'premium_upgrade') {
          const { data: charts } = await sb
            .from('charts')
            .select('title, tree_data')
            .eq('device_id', deviceId)
            .order('saved_at', { ascending: false })
          const parsed = (charts || []).map(c => {
            const d = typeof c.tree_data === 'string' ? JSON.parse(c.tree_data) : c.tree_data
            return { title: c.title, nodes: d?.nodes || [] }
          })
          sendPremiumConfirmation({ to: email, charts: parsed }).catch(err =>
            console.error('[stripe] email send error:', err)
          )
        }
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object
      await sb.from('purchases').update({ status: 'expired' }).eq('stripe_session_id', session.id)
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object
      const paymentIntent = charge.payment_intent

      // Find the purchase by payment intent and mark as refunded
      const { data: purchase } = await sb
        .from('purchases')
        .select('device_id')
        .eq('stripe_payment_intent', paymentIntent)
        .single()

      if (purchase?.device_id) {
        await sb.from('purchases').update({
          status: 'refunded',
        }).eq('stripe_payment_intent', paymentIntent)

        // Downgrade the device back to free
        await sb.from('devices').update({
          tier: 'free',
          tier_updated_at: new Date().toISOString(),
        }).eq('id', purchase.device_id)

        console.log(`[stripe] refund processed — device ${purchase.device_id} downgraded to free`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('[stripe] webhook error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
