import { NextResponse } from 'next/server'
import { getSupabase } from '../_lib/supabase.js'

// Valid promo codes → maps to tier upgrade
// Add new codes here as needed
const PROMO_CODES = {
  'JupiterPisces': 'premium',
}

export async function POST(request) {
  try {
    const { code, email, deviceId } = await request.json()

    if (!code || !email || !deviceId) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })
    }

    // Validate code (case-sensitive)
    const tier = PROMO_CODES[code]
    if (!tier) {
      return NextResponse.json({ ok: false, error: 'Invalid code' }, { status: 400 })
    }

    const sb = getSupabase()

    // Update device: set tier, save email
    const { error } = await sb.from('devices').update({
      tier,
      tier_updated_at: new Date().toISOString(),
      email: email.trim().slice(0, 254),
      email_opt_in: true,
    }).eq('id', deviceId)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    // Log the redemption as a purchase record for admin visibility
    await sb.from('purchases').insert({
      device_id: deviceId,
      stripe_session_id: `promo_${code}_${Date.now()}`,
      product_key: 'promo_code',
      amount_cents: 0,
      currency: 'usd',
      status: 'completed',
      completed_at: new Date().toISOString(),
      metadata: { code, email },
    })

    return NextResponse.json({ ok: true, tier })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
