import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabase } from '../_lib/supabase.js'
import { sendPremiumConfirmation, sendOwnerPurchaseNotification, sendRefundConfirmation, sendOwnerRefundNotification } from '../_lib/email.js'

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

        // Write tier to user_profiles if user has an auth account
        const purchaseEmail = session.customer_details?.email
        if (productKey === 'premium_upgrade') {
          // Check if this device is linked to an auth user
          const { data: device } = await sb.from('devices').select('auth_user_id').eq('id', deviceId).single()
          let authUserId = device?.auth_user_id

          // If not linked, try to find auth user by email
          if (!authUserId && purchaseEmail) {
            const { data: { users } } = await sb.auth.admin.listUsers({ filter: purchaseEmail })
            const matched = users?.find(u => u.email === purchaseEmail)
            if (matched) {
              authUserId = matched.id
              await sb.from('devices').update({ auth_user_id: matched.id }).eq('id', deviceId)
            }
          }

          // Write premium to user_profiles (the source of truth for auth users)
          if (authUserId) {
            await sb.from('user_profiles').upsert({
              auth_user_id: authUserId,
              tier: 'premium',
              stripe_customer_id: session.customer || null,
              tier_updated_at: new Date().toISOString(),
            }, { onConflict: 'auth_user_id' })
          }
        }

        // Send purchase confirmation email with chart data
        const email = session.customer_details?.email
        console.log(`[stripe] purchase complete — email: ${email || 'NONE'}, productKey: ${productKey}, deviceId: ${deviceId}`)
        if (email && productKey === 'premium_upgrade') {
          // Charts may have auth_user_id, device_id, or both — query with OR to catch all
          const { data: dev } = await sb.from('devices').select('auth_user_id').eq('id', deviceId).single()
          const orFilter = dev?.auth_user_id
            ? `device_id.eq.${deviceId},auth_user_id.eq.${dev.auth_user_id}`
            : `device_id.eq.${deviceId}`
          const { data: charts } = await sb
            .from('charts')
            .select('id, title, tree_data')
            .or(orFilter)
            .order('saved_at', { ascending: false })
          // Deduplicate in case a chart matches both device_id and auth_user_id
          const seen = new Set()
          const unique = (charts || []).filter(c => seen.has(c.id) ? false : (seen.add(c.id), true))
          const parsed = unique.map(c => {
            try {
              const d = typeof c.tree_data === 'string' ? JSON.parse(c.tree_data) : c.tree_data
              return { title: c.title, nodes: d?.nodes || [] }
            } catch {
              return { title: c.title, nodes: [] }
            }
          })
          sendPremiumConfirmation({ to: email, charts: parsed }).catch(err =>
            console.error('[stripe] email send error:', err)
          )
          sendOwnerPurchaseNotification({
            buyerEmail: email,
            amount: session.amount_total,
            chartsCount: parsed.length,
            deviceId,
          }).catch(err => console.error('[stripe] owner notification error:', err))
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

        // Also downgrade user_profiles if this device is linked to an auth user
        const { data: dev } = await sb.from('devices').select('auth_user_id').eq('id', purchase.device_id).single()
        if (dev?.auth_user_id) {
          await sb.from('user_profiles').update({
            tier: 'free',
            tier_updated_at: new Date().toISOString(),
          }).eq('auth_user_id', dev.auth_user_id)
        }

        // Send refund emails
        const { data: refundDevice } = await sb.from('devices').select('email').eq('id', purchase.device_id).single()
        const refundEmail = refundDevice?.email
        if (refundEmail) {
          sendRefundConfirmation({ to: refundEmail }).catch(err =>
            console.error('[stripe] refund email error:', err)
          )
        }
        sendOwnerRefundNotification({
          buyerEmail: refundEmail,
          deviceId: purchase.device_id,
        }).catch(err => console.error('[stripe] owner refund notification error:', err))

        console.log(`[stripe] refund processed — device ${purchase.device_id} downgraded to free`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('[stripe] webhook error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
