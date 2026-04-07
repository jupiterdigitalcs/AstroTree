import { NextResponse } from 'next/server'
import { getSupabase } from '../_lib/supabase.js'

const MAX_TITLE_LEN  = 200
const MAX_NODE_COUNT = 200
const MAX_EDGE_COUNT = 500
const MAX_NAME_LEN   = 200
const BIRTHDATE_RE   = /^\d{4}-\d{2}-\d{2}$/

function sanitizeNode(node) {
  if (!node || typeof node !== 'object') return null
  const data = node.data ?? {}
  return {
    ...node,
    data: {
      ...data,
      name: typeof data.name === 'string' ? data.name.slice(0, MAX_NAME_LEN) : '',
      birthdate: typeof data.birthdate === 'string' && BIRTHDATE_RE.test(data.birthdate)
        ? data.birthdate : '',
    },
  }
}

function toRow(r) {
  return {
    id: r.id, title: r.title, nodes: r.nodes, edges: r.edges,
    counter: r.counter, savedAt: r.saved_at, shareToken: r.share_token ?? null,
    isPublic: r.is_public, isSample: r.is_sample,
  }
}

async function checkChartLimit(sb, deviceId, chartId) {
  const { data: enabledRow } = await sb.from('paywall_config').select('value').eq('key', 'paywall_enabled').single()
  if (enabledRow?.value !== true) return null

  const { data: existing } = await sb.from('charts').select('id').eq('id', chartId).eq('device_id', deviceId).single()
  if (existing) return null

  const { data: device } = await sb.from('devices').select('tier').eq('id', deviceId).single()
  const tier = device?.tier ?? 'free'

  const limitKey = tier === 'premium' ? 'chart_limit_premium' : 'chart_limit_free'
  const { data: limitRow } = await sb.from('paywall_config').select('value').eq('key', limitKey).single()
  const limit = limitRow?.value ?? (tier === 'premium' ? 50 : 3)

  const { count } = await sb.from('charts').select('id', { count: 'exact', head: true }).eq('device_id', deviceId)
  if (count >= limit) return { error: 'chart_limit_reached', limit }
  return null
}

// ── Action handlers ─────────────────────────────────────────────────────────

async function handleSave(request) {
  const deviceId = request.headers.get('x-device-id')
  if (!deviceId) return NextResponse.json({ error: 'Missing device ID' }, { status: 400 })
  const chart = await request.json()
  if (!chart?.id) return NextResponse.json({ error: 'Missing chart ID' }, { status: 400 })

  const sb = getSupabase()
  const limitErr = await checkChartLimit(sb, deviceId, chart.id)
  if (limitErr) return NextResponse.json(limitErr, { status: 403 })

  const row = {
    id: chart.id, device_id: deviceId,
    title:      typeof chart.title === 'string' ? chart.title.slice(0, MAX_TITLE_LEN) : '',
    nodes:      Array.isArray(chart.nodes) ? chart.nodes.slice(0, MAX_NODE_COUNT).map(sanitizeNode).filter(Boolean) : [],
    edges:      Array.isArray(chart.edges) ? chart.edges.slice(0, MAX_EDGE_COUNT) : [],
    counter:    chart.counter,
    saved_at:   chart.savedAt,
    updated_at: new Date().toISOString(),
    referrer:   chart.referrer || 'direct',
  }
  const { error } = await sb.from('charts').upsert(row, { onConflict: 'id', ignoreDuplicates: false })
  return error
    ? NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    : NextResponse.json({ ok: true })
}

async function handleLoad(searchParams) {
  const token = searchParams.get('token')
  if (!token) return NextResponse.json(null, { status: 400 })
  const { data, error } = await getSupabase()
    .from('charts')
    .select('id,title,nodes,edges,counter,saved_at,share_token,is_public,is_sample')
    .eq('share_token', token).single()
  if (error || !data) return NextResponse.json(null, { status: 404 })
  return NextResponse.json(toRow(data))
}

async function handleList(request) {
  const deviceId = request.headers.get('x-device-id')
  if (!deviceId) return NextResponse.json([])
  const { data, error } = await getSupabase()
    .from('charts')
    .select('id,title,nodes,edges,counter,saved_at,share_token,is_public,is_sample')
    .eq('device_id', deviceId).order('updated_at', { ascending: false })
  if (error || !data) return NextResponse.json([])
  return NextResponse.json(data.map(toRow))
}

async function handleDelete(request) {
  const deviceId = request.headers.get('x-device-id')
  const body = await request.json()
  if (!deviceId || !body?.id) return NextResponse.json({ ok: false }, { status: 400 })
  const { error } = await getSupabase().from('charts').delete().eq('id', body.id).eq('device_id', deviceId)
  return error
    ? NextResponse.json({ ok: false }, { status: 500 })
    : NextResponse.json({ ok: true })
}

async function handlePublic() {
  const { data, error } = await getSupabase()
    .from('charts')
    .select('id,title,nodes,edges,counter,saved_at,is_sample')
    .or('is_public.eq.true,is_sample.eq.true')
    .order('updated_at', { ascending: false }).limit(20)
  if (error || !data) return NextResponse.json([])
  return NextResponse.json(data.map(toRow))
}

async function handleShare(request) {
  const deviceId = request.headers.get('x-device-id')
  const body = await request.json()
  if (!deviceId || !body?.id) return NextResponse.json({ token: null }, { status: 400 })
  const token = crypto.randomUUID()
  const { data, error } = await getSupabase()
    .from('charts').update({ share_token: token })
    .eq('id', body.id).eq('device_id', deviceId)
    .select('id')
  if (error) return NextResponse.json({ token: null }, { status: 500 })
  if (!data?.length) return NextResponse.json({ token: null }, { status: 404 })
  return NextResponse.json({ token })
}

async function handleRestore(request) {
  const { email, deviceId } = await request.json()
  if (!email || !deviceId) return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })
  const { data, error } = await getSupabase().rpc('restore_charts_by_email', {
    p_email: email.trim(), p_new_device_id: deviceId,
  })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ── Route handlers ──────────────────────────────────────────────────────────

const POST_ROUTES = { save: handleSave, delete: handleDelete, share: handleShare, restore: handleRestore }
const GET_ROUTES  = { load: handleLoad, list: handleList, public: handlePublic }

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    // list and load use headers, so pass request too
    if (action === 'list') return await handleList(request)
    const fn = GET_ROUTES[action]
    if (!fn) return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    return await fn(searchParams)
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const fn = POST_ROUTES[action]
    if (!fn) return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    return await fn(request)
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
