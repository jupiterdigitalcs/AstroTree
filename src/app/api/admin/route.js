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
  engagement: handleEngagement, 'paywall-config': handlePaywallConfig,
  'paywall-config-set': handlePaywallConfigSet, purchases: handlePurchases,
  'mark-test': handleMarkTest,
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
