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

  // Look up product config from paywall_config
  const { data: productsRow } = await sb.from('paywall_config').select('value').eq('key', 'products').single()
  const products = productsRow?.value ?? []
  const product = products.find(p => p.key === productKey)
  if (!product?.stripePriceId) return res.status(400).json({ error: 'Product not configured' })

  const stripe = getStripe()

  // Reuse existing Stripe customer if we have one
  const { data: device } = await sb.from('devices').select('email, stripe_customer_id').eq('id', deviceId).single()
  let customerId = device?.stripe_customer_id ?? null

  // Build success/cancel URLs
  const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://astrodig.com'
  const successUrl = `${origin}/?purchase=success`
  const cancelUrl  = `${origin}/?purchase=cancelled`

  // Create Checkout Session — Stripe collects the email during checkout
  const sessionParams = {
    mode: 'payment',
    line_items: [{ price: product.stripePriceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url:  cancelUrl,
    metadata: { deviceId, productKey },
  }
  if (customerId) {
    sessionParams.customer = customerId
  } else {
    // Pre-fill email if we have it, but don't require it
    sessionParams.customer_email = device?.email || undefined
  }
  const session = await stripe.checkout.sessions.create(sessionParams)

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
  'status':         handleStatus,
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
