import { createClient } from '@supabase/supabase-js'
import { getDeviceId } from './identity.js'

let _supabase = null

function getClient() {
  if (_supabase) return _supabase
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  _supabase = createClient(url, key, {
    global: { headers: { 'x-device-id': getDeviceId() } },
  })
  return _supabase
}

const MAX_TITLE_LEN   = 200
const MAX_NODE_COUNT  = 200
const MAX_EDGE_COUNT  = 500
const MAX_NAME_LEN    = 200
const BIRTHDATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function sanitizeNode(node) {
  if (!node || typeof node !== 'object') return null
  const data = node.data ?? {}
  return {
    ...node,
    data: {
      ...data,
      name: typeof data.name === 'string' ? data.name.slice(0, MAX_NAME_LEN) : '',
      birthdate: typeof data.birthdate === 'string' && BIRTHDATE_REGEX.test(data.birthdate)
        ? data.birthdate
        : '',
    },
  }
}

function toDbRow(chart) {
  return {
    id:         chart.id,
    device_id:  getDeviceId(),
    title:      typeof chart.title === 'string' ? chart.title.slice(0, MAX_TITLE_LEN) : '',
    nodes:      Array.isArray(chart.nodes) ? chart.nodes.slice(0, MAX_NODE_COUNT).map(sanitizeNode).filter(Boolean) : [],
    edges:      Array.isArray(chart.edges) ? chart.edges.slice(0, MAX_EDGE_COUNT) : [],
    counter:    chart.counter,
    saved_at:   chart.savedAt,
    updated_at: new Date().toISOString(),
    referrer:   getReferrer(),
  }
}

function fromDbRow(row) {
  return {
    id:          row.id,
    title:       row.title,
    nodes:       row.nodes,
    edges:       row.edges,
    counter:     row.counter,
    savedAt:     row.saved_at,
    shareToken:  row.share_token ?? null,
    isPublic:    row.is_public,
    isSample:    row.is_sample,
  }
}

export async function uploadChart(chart) {
  const sb = getClient()
  if (!sb) return { ok: false, error: 'Cloud sync not configured' }
  try {
    const { error } = await sb.from('charts').upsert(toDbRow(chart))
    return error ? { ok: false, error: error.message } : { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

export async function fetchCharts() {
  const sb = getClient()
  if (!sb) return []
  try {
    const { data, error } = await sb
      .from('charts')
      .select('id,title,nodes,edges,counter,saved_at,share_token,is_public,is_sample')
      .eq('device_id', getDeviceId())
      .order('updated_at', { ascending: false })
    if (error || !data) return []
    return data.map(fromDbRow)
  } catch {
    return []
  }
}

export async function deleteChartCloud(id) {
  const sb = getClient()
  if (!sb) return { ok: false, error: 'Cloud sync not configured' }
  try {
    const { error } = await sb.from('charts').delete().eq('id', id).eq('device_id', getDeviceId())
    return error ? { ok: false, error: error.message } : { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

export async function fetchPublicCharts() {
  const sb = getClient()
  if (!sb) return []
  try {
    const { data, error } = await sb
      .from('charts')
      .select('id,title,nodes,edges,counter,saved_at,is_sample')
      .or('is_public.eq.true,is_sample.eq.true')
      .order('updated_at', { ascending: false })
      .limit(20)
    if (error || !data) return []
    return data.map(fromDbRow)
  } catch {
    return []
  }
}

export async function fetchChartByToken(token) {
  const sb = getClient()
  if (!sb) return null
  try {
    const { data, error } = await sb
      .from('charts')
      .select('id,title,nodes,edges,counter,saved_at,share_token,is_public,is_sample')
      .eq('share_token', token)
      .single()
    if (error || !data) return null
    return fromDbRow(data)
  } catch {
    return null
  }
}

export async function generateShareToken(id) {
  const sb = getClient()
  if (!sb) return null
  try {
    const token = crypto.randomUUID()
    const { error } = await sb
      .from('charts')
      .update({ share_token: token })
      .eq('id', id)
      .eq('device_id', getDeviceId())
    if (error) return null
    return token
  } catch {
    return null
  }
}

export async function restoreChartsByEmail(email) {
  const sb = getClient()
  if (!sb) return { ok: false, error: 'Cloud sync not configured' }
  try {
    const { data, error } = await sb.rpc('restore_charts_by_email', {
      p_email:         email.trim(),
      p_new_device_id: getDeviceId(),
    })
    if (error) return { ok: false, error: error.message }
    return data  // { ok, count, error?, note? }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

export function isCloudEnabled() {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

// ── Device tracking ───────────────────────────────────────────────────────────

export function getReferrer() {
  const params = new URLSearchParams(window.location.search)
  const utm = params.get('utm_source')
  if (utm) return utm
  if (document.referrer) {
    try { return new URL(document.referrer).hostname } catch { return document.referrer }
  }
  return 'direct'
}

async function fetchGeo() {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return {}
    const d = await res.json()
    return {
      country: d.country_name?.slice(0, 100) ?? null,
      city:    d.city?.slice(0, 100)         ?? null,
    }
  } catch {
    return {}
  }
}

export async function upsertDevice() {
  const sb = getClient()
  if (!sb) return
  try {
    const id = getDeviceId()
    // Try insert first (new device)
    const geo = await fetchGeo()
    const { error: insertError } = await sb.from('devices').insert({
      id,
      referrer:    getReferrer(),
      timezone:    Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
      user_agent:  navigator.userAgent.slice(0, 300),
      country:     geo.country ?? null,
      city:        geo.city    ?? null,
    })
    if (insertError) {
      // Already exists — just update last_seen
      await sb.from('devices').update({ last_seen: new Date().toISOString() }).eq('id', id)
    }
  } catch {}
}

export async function updateDeviceEmail(email) {
  const sb = getClient()
  if (!sb) return { ok: false }
  try {
    const { error } = await sb
      .from('devices')
      .update({ email: email.trim().slice(0, 254), email_opt_in: true })
      .eq('id', getDeviceId())
    return error ? { ok: false } : { ok: true }
  } catch {
    return { ok: false }
  }
}
