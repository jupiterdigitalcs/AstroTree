import { NextResponse } from 'next/server'
import { getSupabase } from '../_lib/supabase.js'
import { createAdminToken, requireAdmin } from '../_lib/adminAuth.js'

async function handleLogin(request) {
  const { password } = await request.json()
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: 'Invalid password' }, { status: 401 })
  }
  return NextResponse.json({ ok: true, token: createAdminToken() })
}

async function handleCharts(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') ?? ''
  const email = searchParams.get('email') ?? ''
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''
  const page = searchParams.get('page') ?? '0'
  const { data, error } = await getSupabase().rpc('admin_get_charts', {
    p_search: search.trim(), p_email: email.trim(),
    p_date_from: dateFrom ? new Date(dateFrom).toISOString() : null,
    p_date_to:   dateTo   ? new Date(dateTo + 'T23:59:59').toISOString() : null,
    p_limit: 50, p_offset: parseInt(page, 10) * 50,
  })
  return error ? NextResponse.json([], { status: 500 }) : NextResponse.json(data ?? [])
}

async function handleStats(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabase().rpc('admin_get_stats')
  return error ? NextResponse.json(null, { status: 500 }) : NextResponse.json(data)
}

async function handleDevices(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabase().rpc('admin_get_devices')
  return error ? NextResponse.json([], { status: 500 }) : NextResponse.json(data ?? [])
}

async function handleTreesPerDay(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabase().rpc('admin_trees_per_day')
  return error ? NextResponse.json([], { status: 500 }) : NextResponse.json(data ?? [])
}

async function handleEngagement(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabase().rpc('admin_get_engagement_stats')
  return error ? NextResponse.json(null, { status: 500 }) : NextResponse.json(data)
}

async function handleMarkTest(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { deviceId, isTest } = await request.json()
  if (!deviceId) return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 })
  // Mark device as test by setting a recognizable email prefix
  const marker = isTest ? 'test@internal' : null
  const { error } = await getSupabase()
    .from('devices')
    .update({ email: marker })
    .eq('id', deviceId)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  // Also mark all charts from this device as sample
  if (isTest) {
    await getSupabase()
      .from('charts')
      .update({ is_sample: true })
      .eq('device_id', deviceId)
  }
  return NextResponse.json({ ok: true })
}

async function handleCelestialUsers(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sb = getSupabase()
  // Get all user_profiles with premium tier
  const { data, error } = await sb
    .from('user_profiles')
    .select('auth_user_id, tier, tier_updated_at, stripe_customer_id')
    .eq('tier', 'premium')
  if (error) return NextResponse.json([], { status: 500 })
  if (!data?.length) return NextResponse.json([])

  // Single call to get all auth users, then match by ID
  const { data: { users } } = await sb.auth.admin.listUsers({ perPage: 1000 })
  const userMap = {}
  if (users) users.forEach(u => { userMap[u.id] = u.email })

  const results = (data ?? []).map(profile => ({
    authUserId: profile.auth_user_id,
    email: userMap[profile.auth_user_id] ?? null,
    tier: profile.tier,
    tierUpdatedAt: profile.tier_updated_at,
    stripeCustomerId: profile.stripe_customer_id,
  }))
  return NextResponse.json(results)
}

async function handleDowngradeUser(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { authUserId, email } = await request.json()
  if (!authUserId) return NextResponse.json({ error: 'Missing authUserId' }, { status: 400 })

  const sb = getSupabase()

  // Downgrade user_profiles
  const { error: profileErr } = await sb
    .from('user_profiles')
    .update({ tier: 'free', tier_updated_at: new Date().toISOString() })
    .eq('auth_user_id', authUserId)
  if (profileErr) return NextResponse.json({ ok: false, error: profileErr.message }, { status: 500 })

  // Also downgrade any devices linked to this user
  await sb
    .from('devices')
    .update({ tier: 'free', tier_updated_at: new Date().toISOString() })
    .eq('auth_user_id', authUserId)

  return NextResponse.json({ ok: true })
}

async function handleFunnel(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('dateFrom')
  const dateTo   = searchParams.get('dateTo')
  const since    = dateFrom ? new Date(dateFrom).toISOString() : new Date(Date.now() - 30 * 86400000).toISOString()
  const excludeDevices = searchParams.get('excludeDevices') ?? ''
  const excludeEmails  = searchParams.get('excludeEmails') ?? ''
  const sb = getSupabase()

  // Get test device IDs to exclude (email = 'test@internal')
  const { data: testDevices } = await sb.from('devices').select('id').eq('email', 'test@internal')
  const testIds = new Set((testDevices ?? []).map(d => d.id))

  // Exclude devices linked to specific emails (e.g. the owner's account)
  if (excludeEmails) {
    for (const email of excludeEmails.split(',')) {
      const trimmed = email.trim()
      if (!trimmed) continue
      // Find auth users with this email, then find their linked devices
      const { data: { users } } = await sb.auth.admin.listUsers({ perPage: 1000 })
      const matchedAuthIds = (users ?? []).filter(u => u.email === trimmed).map(u => u.id)
      if (matchedAuthIds.length) {
        const { data: linked } = await sb.from('devices').select('id').in('auth_user_id', matchedAuthIds)
        for (const d of linked ?? []) testIds.add(d.id)
      }
      // Also match devices by email field directly
      const { data: byEmail } = await sb.from('devices').select('id').eq('email', trimmed)
      for (const d of byEmail ?? []) testIds.add(d.id)
    }
  }

  // Also exclude any device IDs passed from the client (e.g. the admin's own device)
  if (excludeDevices) {
    for (const id of excludeDevices.split(',')) {
      const trimmed = id.trim()
      if (trimmed) testIds.add(trimmed)
    }
  }

  let query = sb
    .from('device_events')
    .select('event_name, device_id, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000)
  if (dateTo) query = query.lte('created_at', new Date(dateTo + 'T23:59:59').toISOString())

  const { data, error } = await query
  if (error) return NextResponse.json([], { status: 500 })

  // Filter out test/owner devices
  const filtered = (data ?? []).filter(r => !testIds.has(r.device_id))

  // Aggregate: count of unique devices per event
  const byEvent = {}
  const countByEvent = {}
  for (const row of filtered) {
    if (!byEvent[row.event_name]) { byEvent[row.event_name] = new Set(); countByEvent[row.event_name] = 0 }
    byEvent[row.event_name].add(row.device_id)
    countByEvent[row.event_name]++
  }
  const result = Object.entries(byEvent).map(([event, devices]) => ({
    event, uniqueDevices: devices.size, totalCount: countByEvent[event],
  }))
  result.sort((a, b) => b.uniqueDevices - a.uniqueDevices)
  return NextResponse.json(result)
}

async function handlePaywallConfig(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabase().from('paywall_config').select('key, value, updated_at')
  if (error) return NextResponse.json([], { status: 500 })
  return NextResponse.json(data ?? [])
}

async function handlePaywallConfigSet(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { key, value } = await request.json()
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  const { error } = await getSupabase().rpc('admin_set_paywall_config', { p_key: key, p_value: value })
  return error
    ? NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    : NextResponse.json({ ok: true })
}

async function handlePurchases(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabase().rpc('admin_get_purchases')
  return error ? NextResponse.json([], { status: 500 }) : NextResponse.json(data ?? [])
}

// ── Route handlers ──────────────────────────────────────────────────────────

const ROUTES = {
  login: handleLogin, charts: handleCharts, stats: handleStats,
  devices: handleDevices, 'trees-per-day': handleTreesPerDay,
  engagement: handleEngagement, funnel: handleFunnel, 'paywall-config': handlePaywallConfig,
  'paywall-config-set': handlePaywallConfigSet, purchases: handlePurchases,
  'mark-test': handleMarkTest, 'celestial-users': handleCelestialUsers,
  'downgrade-user': handleDowngradeUser,
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const fn = ROUTES[action]
    if (!fn) return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    return await fn(request)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const fn = ROUTES[action]
    if (!fn) return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    return await fn(request)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
