import { NextResponse } from 'next/server'
import { getSupabase } from '../_lib/supabase.js'
import { sendPremiumConfirmation, sendOwnerPurchaseNotification } from '../_lib/email.js'

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
    const cleanEmail = email.trim().slice(0, 254)

    // Update device: set tier, save email
    const { error } = await sb.from('devices').update({
      tier,
      tier_updated_at: new Date().toISOString(),
      email: cleanEmail,
      email_opt_in: true,
    }).eq('id', deviceId)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    // Mirror tier to user_profiles if device is linked to (or matches) an auth user.
    // Without this, signing out + signing back in would downgrade the device because
    // handleLinkAuth reads from user_profiles as the source of truth.
    const { data: device } = await sb.from('devices').select('auth_user_id').eq('id', deviceId).single()
    let authUserId = device?.auth_user_id
    if (!authUserId && cleanEmail) {
      try {
        const { data: { users } } = await sb.auth.admin.listUsers({ filter: cleanEmail })
        const matched = users?.find(u => u.email === cleanEmail)
        if (matched) {
          authUserId = matched.id
          await sb.from('devices').update({ auth_user_id: matched.id }).eq('id', deviceId)
        }
      } catch (e) {
        console.error('[redeem] listUsers failed:', e)
      }
    }
    if (authUserId) {
      await sb.from('user_profiles').upsert({
        auth_user_id: authUserId,
        tier,
        tier_updated_at: new Date().toISOString(),
      }, { onConflict: 'auth_user_id' })
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

    // Send confirmation emails (same as Stripe purchase)
    if (cleanEmail) {
      const { data: charts } = await sb
        .from('charts')
        .select('title, tree_data')
        .eq('device_id', deviceId)
        .order('saved_at', { ascending: false })
      const parsed = (charts || []).map(c => {
        const d = typeof c.tree_data === 'string' ? JSON.parse(c.tree_data) : c.tree_data
        return { title: c.title, nodes: d?.nodes || [] }
      })
      sendPremiumConfirmation({ to: cleanEmail, charts: parsed }).catch(err =>
        console.error('[redeem] email send error:', err)
      )
      sendOwnerPurchaseNotification({
        buyerEmail: cleanEmail,
        amount: 0,
        chartsCount: parsed.length,
        deviceId,
      }).catch(err => console.error('[redeem] owner notification error:', err))
    }

    return NextResponse.json({ ok: true, tier })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
