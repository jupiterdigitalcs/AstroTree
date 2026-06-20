import { NextResponse } from 'next/server'
import { getSupabase } from '../_lib/supabase.js'

// RevenueCat webhook — the iOS counterpart to stripe-webhook/route.js.
//
// The native app configures RevenueCat with appUserID = deviceId, so every
// event arrives with event.app_user_id === our deviceId. We write the SAME tier
// fields the Stripe webhook writes (devices.tier + user_profiles.tier), so a
// purchase made in the app unlocks anywhere that account/device is signed in.
//
// Auth: RevenueCat sends the Authorization header value configured in the
// dashboard. We reject anything that doesn't match REVENUECAT_WEBHOOK_AUTH
// (fail closed — a missing secret rejects everything).
export async function POST(request) {
  try {
    const expected = process.env.REVENUECAT_WEBHOOK_AUTH
    const provided = request.headers.get('authorization')
    if (!expected || provided !== expected) {
      console.error('[rc] webhook auth failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const event = body?.event
    if (!event?.type) {
      return NextResponse.json({ error: 'No event' }, { status: 400 })
    }

    const appUserId = event.app_user_id
    // RevenueCat uses $RCAnonymousID:... before an app user id is set. We always
    // configure with the deviceId, so a real purchase should never be anonymous;
    // if it is, we can't map it to a device — skip (the client still unlocks
    // from its own customerInfo).
    if (!appUserId || appUserId.startsWith('$RCAnonymousID')) {
      console.warn(`[rc] event ${event.type} has no mappable app_user_id (${appUserId})`)
      return NextResponse.json({ received: true })
    }

    const sb = getSupabase()
    const now = new Date().toISOString()

    // NON_RENEWING_PURCHASE = our one-time non-consumable unlock.
    // INITIAL_PURCHASE handled defensively in case the product is ever modeled
    // as a subscription. CANCELLATION = refund/revoke -> downgrade.
    const isUnlock = event.type === 'NON_RENEWING_PURCHASE' || event.type === 'INITIAL_PURCHASE'
    const isRevoke = event.type === 'CANCELLATION' || event.type === 'EXPIRATION'

    if (!isUnlock && !isRevoke) {
      // TRANSFER, TEST, BILLING_ISSUE, etc. — nothing to do for a one-time unlock.
      return NextResponse.json({ received: true })
    }

    const tier = isUnlock ? 'premium' : 'free'

    // Write to the device row (deviceId === app_user_id).
    await sb.from('devices').update({ tier, tier_updated_at: now }).eq('id', appUserId)

    // Mirror to user_profiles if the device is linked to an auth account
    // (same source-of-truth the Stripe webhook uses for signed-in users).
    const { data: device } = await sb.from('devices').select('auth_user_id').eq('id', appUserId).single()
    if (device?.auth_user_id) {
      await sb.from('user_profiles').upsert({
        auth_user_id: device.auth_user_id,
        tier,
        tier_updated_at: now,
      }, { onConflict: 'auth_user_id' })
    }

    console.log(`[rc] ${event.type} -> tier=${tier} for device ${appUserId}`)
    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('[rc] webhook error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
