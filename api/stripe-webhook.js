import Stripe from 'stripe'
import { getSupabase } from './_lib/supabase.js'

// Disable body parsing — Stripe signature verification needs the raw body
export const config = {
  api: { bodyParser: false },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const sig = req.headers['stripe-signature']

    // Read raw body manually
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const rawBody = Buffer.concat(chunks).toString('utf8')

    let event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error('[stripe] webhook signature failed:', err.message)
      return res.status(400).json({ error: 'Webhook signature verification failed' })
    }

    const sb = getSupabase()

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const { deviceId, productKey } = session.metadata ?? {}

      // Update purchase record
      await sb.from('purchases').update({
        status: 'completed',
        stripe_payment_intent: session.payment_intent,
        completed_at: new Date().toISOString(),
      }).eq('stripe_session_id', session.id)

      // Save Stripe customer + email to device, upgrade tier if applicable
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

    return res.status(200).json({ received: true })
  } catch (e) {
    console.error('[stripe] webhook error:', e)
    return res.status(500).json({ error: e.message })
  }
}
