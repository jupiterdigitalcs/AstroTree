import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabase } from '../_lib/supabase.js'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

async function handleCreateSession(request) {
  const deviceId = request.headers.get('x-device-id')
  if (!deviceId) return NextResponse.json({ error: 'Missing device ID' }, { status: 400 })
  const { productKey, metadata: extraMeta } = await request.json()
  if (!productKey) return NextResponse.json({ error: 'Missing productKey' }, { status: 400 })

  const sb = getSupabase()

  const { data: productsRow } = await sb.from('paywall_config').select('value').eq('key', 'products').single()
  const products = productsRow?.value ?? []
  const product = products.find(p => p.key === productKey)
  if (!product?.stripePriceId) return NextResponse.json({ error: 'Product not configured' }, { status: 400 })

  const stripe = getStripe()

  const { data: device } = await sb.from('devices').select('email, stripe_customer_id').eq('id', deviceId).single()
  let customerId = device?.stripe_customer_id ?? null

  const origin = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/$/, '') || 'https://astrodig.com'
  const successUrl = `${origin}/?purchase=success`
  const cancelUrl  = `${origin}/?purchase=cancelled`

  const sessionParams = {
    mode: 'payment',
    line_items: [{ price: product.stripePriceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url:  cancelUrl,
    metadata: { deviceId, productKey },
    allow_promotion_codes: true,
  }
  if (customerId) {
    sessionParams.customer = customerId
  } else {
    sessionParams.customer_email = device?.email || undefined
  }
  const session = await stripe.checkout.sessions.create(sessionParams)

  await sb.from('purchases').insert({
    device_id: deviceId,
    stripe_session_id: session.id,
    product_key: productKey,
    amount_cents: product.amountCents ?? 0,
    currency: product.currency ?? 'usd',
    status: 'pending',
    metadata: extraMeta ?? {},
  })

  return NextResponse.json({ url: session.url })
}

async function handleStatus(request) {
  const deviceId = request.headers.get('x-device-id')
  if (!deviceId) return NextResponse.json({ error: 'Missing device ID' }, { status: 400 })

  const sb = getSupabase()
  const { data: device } = await sb.from('devices').select('tier').eq('id', deviceId).single()
  const { data: recent } = await sb.from('purchases')
    .select('product_key, status, completed_at')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({
    tier: device?.tier ?? 'free',
    recentPurchase: recent ?? null,
  })
}

const ROUTES = {
  'create-session': handleCreateSession,
  'status':         handleStatus,
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const fn = ROUTES[action]
    if (!fn) return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    return await fn(request)
  } catch (e) {
    console.error('[stripe] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    if (action === 'status') return await handleStatus(request)
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
