import Stripe from 'stripe'
import { getSupabase } from './_lib/supabase.js'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

// ── Create Checkout Session ─────────────────────────────────────────────────

async function handleCreateSession(req, res) {
  const deviceId = req.headers['x-device-id']
  if (!deviceId) return res.status(400).json({ error: 'Missing device ID' })
  const { productKey } = req.body ?? {}
  if (!productKey) return res.status(400).json({ error: 'Missing productKey' })

  const sb = getSupabase()

  // Device must have an email before purchasing
  const { data: device } = await sb.from('devices').select('email, stripe_customer_id').eq('id', deviceId).single()
  if (!device?.email) return res.status(400).json({ error: 'Email required before purchase' })

  // Look up product config from paywall_config
  const { data: productsRow } = await sb.from('paywall_config').select('value').eq('key', 'products').single()
  const products = productsRow?.value ?? []
  const product = products.find(p => p.key === productKey)
  if (!product?.stripePriceId) return res.status(400).json({ error: 'Product not configured' })

  const stripe = getStripe()

  // Create or reuse Stripe customer
  let customerId = device.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({ email: device.email, metadata: { deviceId } })
    customerId = customer.id
    await sb.from('devices').update({ stripe_customer_id: customerId }).eq('id', deviceId)
  }

  // Build success/cancel URLs
  const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://astrodig.com'
  const successUrl = `${origin}/?purchase=success`
  const cancelUrl  = `${origin}/?purchase=cancelled`

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    line_items: [{ price: product.stripePriceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url:  cancelUrl,
    metadata: { deviceId, productKey },
  })

  // Insert pending purchase record
  await sb.from('purchases').insert({
    device_id: deviceId,
    stripe_session_id: session.id,
    product_key: productKey,
    amount_cents: product.amountCents ?? 0,
    currency: product.currency ?? 'usd',
    status: 'pending',
    metadata: req.body.metadata ?? {},
  })

  return res.status(200).json({ url: session.url })
}

// ── Stripe Webhook ──────────────────────────────────────────────────────────

async function handleWebhook(req, res) {
  const stripe = getStripe()
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event
  try {
    // Vercel passes raw body as a buffer when bodyParser is disabled
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('[stripe] webhook signature verification failed:', err.message)
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

    // Upgrade device tier if this is a premium_upgrade product
    if (productKey === 'premium_upgrade' && deviceId) {
      await sb.from('devices').update({
        tier: 'premium',
        tier_updated_at: new Date().toISOString(),
      }).eq('id', deviceId)
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object
    await sb.from('purchases').update({ status: 'expired' }).eq('stripe_session_id', session.id)
  }

  return res.status(200).json({ received: true })
}

// ── Check purchase status (after redirect back) ─────────────────────────────

async function handleStatus(req, res) {
  const deviceId = req.headers['x-device-id']
  if (!deviceId) return res.status(400).json({ error: 'Missing device ID' })

  const sb = getSupabase()
  const { data: device } = await sb.from('devices').select('tier').eq('id', deviceId).single()
  const { data: recent } = await sb.from('purchases')
    .select('product_key, status, completed_at')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return res.status(200).json({
    tier: device?.tier ?? 'free',
    recentPurchase: recent ?? null,
  })
}

// ── Router ──────────────────────────────────────────────────────────────────

const ROUTES = {
  'create-session': handleCreateSession,
  'webhook':        handleWebhook,
  'status':         handleStatus,
}

// Disable body parsing for webhook (needs raw body for signature verification)
export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
}

export default async function handler(req, res) {
  try {
    const action = req.query.action
    const fn = ROUTES[action]
    if (!fn) return res.status(400).json({ error: `Unknown action: ${action}` })
    return await fn(req, res)
  } catch (e) {
    console.error('[stripe] error:', e)
    return res.status(500).json({ error: e.message })
  }
}
