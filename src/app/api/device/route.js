import { NextResponse } from 'next/server'
import { getSupabase } from '../_lib/supabase.js'

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
  const deviceId = request.headers.get('x-device-id')
  if (!deviceId) return NextResponse.json({ error: 'Missing device ID' }, { status: 400 })
  const { data, error } = await getSupabase().rpc('get_device_entitlements', { p_device_id: deviceId })
  if (error) return NextResponse.json({ tier: 'free', config: {} }, { status: 500 })
  return NextResponse.json(data ?? { tier: 'free', config: {} })
}

async function handleEvent(request) {
  const { deviceId, eventName } = await request.json()
  if (!deviceId || !eventName) return NextResponse.json({ ok: false }, { status: 400 })
  const name = String(eventName).slice(0, 64)
  await getSupabase().from('device_events').insert({ device_id: deviceId, event_name: name })
  return NextResponse.json({ ok: true })
}

// ── Route handlers ──────────────────────────────────────────────────────────

const POST_ROUTES = { register: handleRegister, email: handleEmail, ping: handlePing, event: handleEvent }

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
