import { NextResponse } from 'next/server'
import { getSupabase } from '../_lib/supabase.js'

export async function POST(request) {
  try {
    const { code, email, deviceId } = await request.json()

    if (!code || !email || !deviceId) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })
    }

    const sb = getSupabase()

    // Load promo codes from paywall_config
    const { data: row } = await sb.from('paywall_config').select('value').eq('key', 'promo_codes').single()
    const promoCodes = row?.value ?? []
    // Each code: { code: string, tier: string, active: boolean }
    const matchIdx = promoCodes.findIndex(p => p.code === code && p.active !== false)
    const match = matchIdx >= 0 ? promoCodes[matchIdx] : null

    if (!match) {
      return NextResponse.json({ ok: false, error: 'Invalid code' }, { status: 400 })
    }

    // Check expiration
    if (match.expires_at && new Date(match.expires_at) < new Date()) {
      return NextResponse.json({ ok: false, error: 'This code has expired' }, { status: 400 })
    }

    // Check usage limit
    if (match.max_uses && (match.uses ?? 0) >= match.max_uses) {
      return NextResponse.json({ ok: false, error: 'This code has reached its usage limit' }, { status: 400 })
    }

    const tier = match.tier || 'premium'

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

    // Increment usage counter on the promo code
    promoCodes[matchIdx] = { ...match, uses: (match.uses ?? 0) + 1 }
    await sb.from('paywall_config').update({ value: promoCodes }).eq('key', 'promo_codes')

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
