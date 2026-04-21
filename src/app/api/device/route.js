import { NextResponse } from 'next/server'
import { getSupabase } from '../_lib/supabase.js'
import { getAuthUser } from '../_lib/authUser.js'

async function handleRegister(request) {
  const { deviceId, referrer, timezone, userAgent, country, city } = await request.json()
  if (!deviceId) return NextResponse.json({ error: 'Missing device ID' }, { status: 400 })
  const sb = getSupabase()
  const { error: insertError } = await sb.from('devices').insert({
    id: deviceId, referrer: referrer ?? 'direct', timezone: timezone ?? null,
    user_agent: typeof userAgent === 'string' ? userAgent.slice(0, 300) : null,
    country: country ?? null, city: city ?? null,
  })
  if (insertError) {
    await sb.from('devices').update({ last_seen: new Date().toISOString() }).eq('id', deviceId)
  }
  return NextResponse.json({ ok: true })
}

async function handleEmail(request) {
  const { deviceId, email } = await request.json()
  if (!deviceId || !email) return NextResponse.json({ ok: false }, { status: 400 })
  const { error } = await getSupabase()
    .from('devices')
    .update({ email: email.trim().slice(0, 254), email_opt_in: true })
    .eq('id', deviceId)
  return NextResponse.json({ ok: !error })
}

async function handlePing(request) {
  const { deviceId } = await request.json()
  if (!deviceId) return NextResponse.json({ error: 'Missing device ID' }, { status: 400 })
  await getSupabase().rpc('device_ping', { p_device_id: deviceId })
  return NextResponse.json({ ok: true })
}

async function handleEntitlements(request) {
  const sb = getSupabase()

  // Always load paywall config (used by client gating logic)
  const { data: configRows } = await sb.from('paywall_config').select('key, value')
  const config = {}
  if (configRows) configRows.forEach(r => { config[r.key] = r.value })

  // Tier is account-bound. Premium follows the auth user, NOT the device.
  // Exception: if the device itself has tier='premium' (e.g. just purchased but
  // hasn't signed in yet), honour that so the user sees features immediately.
  const authUser = await getAuthUser(request)
  if (!authUser) {
    const deviceId = request.headers.get('x-device-id')
    if (deviceId) {
      const { data: device } = await sb.from('devices')
        .select('tier').eq('id', deviceId).maybeSingle()
      if (device?.tier === 'premium') {
        return NextResponse.json({ tier: 'premium', config })
      }
    }
    return NextResponse.json({ tier: 'free', config })
  }

  // Source of truth for auth users: user_profiles.tier
  const { data: profile } = await sb
    .from('user_profiles')
    .select('tier')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  return NextResponse.json({ tier: profile?.tier ?? 'free', config })
}

async function handleLinkAuth(request) {
  const { deviceId, authUserId, email } = await request.json()
  if (!deviceId || !authUserId || !email) {
    return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })
  }
  const sb = getSupabase()
  const { data, error } = await sb.rpc('link_device_to_user', {
    p_device_id: deviceId,
    p_auth_user_id: authUserId,
    p_email: email.trim().slice(0, 254),
  })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  // Migrate device-only charts to this auth user so they aren't orphaned
  const { error: migrateErr } = await sb
    .from('charts')
    .update({ auth_user_id: authUserId })
    .eq('device_id', deviceId)
    .is('auth_user_id', null)
  if (migrateErr) console.error('[link-auth] chart migration error:', migrateErr.message)

  // Restore tier from user_profiles (source of truth for auth users)
  const { data: profile } = await sb.from('user_profiles').select('tier').eq('auth_user_id', authUserId).single()
  if (profile?.tier) {
    await sb.from('devices').update({ tier: profile.tier, tier_updated_at: new Date().toISOString() }).eq('id', deviceId)
  }

  return NextResponse.json(data ?? { ok: true })
}

async function handleUnlinkAuth(request) {
  const { deviceId } = await request.json()
  if (!deviceId) return NextResponse.json({ ok: false, error: 'Missing device ID' }, { status: 400 })
  const { error } = await getSupabase()
    .from('devices')
    .update({ auth_user_id: null, tier: 'free', tier_updated_at: new Date().toISOString() })
    .eq('id', deviceId)
  console.log('[unlink-auth]', deviceId, error ? `ERROR: ${error.message}` : 'OK — tier reset to free')
  return NextResponse.json({ ok: !error })
}

async function handleEvent(request) {
  const { deviceId, eventName } = await request.json()
  if (!deviceId || !eventName) return NextResponse.json({ ok: false }, { status: 400 })
  const name = String(eventName).slice(0, 64)
  await getSupabase().from('device_events').insert({ device_id: deviceId, event_name: name })
  return NextResponse.json({ ok: true })
}

// ── Route handlers ──────────────────────────────────────────────────────────

const POST_ROUTES = { register: handleRegister, email: handleEmail, ping: handlePing, event: handleEvent, 'link-auth': handleLinkAuth, 'unlink-auth': handleUnlinkAuth }

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    if (action === 'entitlements') return await handleEntitlements(request)
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  } catch {
    return NextResponse.json({ ok: true })
  }
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    if (action === 'entitlements') return await handleEntitlements(request)
    const fn = POST_ROUTES[action]
    if (!fn) return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    return await fn(request)
  } catch {
    return NextResponse.json({ ok: true })
  }
}
