import { createClient } from '@supabase/supabase-js'

let _client = null

function getClient() {
  if (_client) return _client
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  _client = createClient(url, key)
  return _client
}

function fromRow(row) {
  return {
    id:          row.id,
    title:       row.title,
    nodes:       row.nodes ?? [],
    edges:       row.edges ?? [],
    deviceId:    row.device_id,
    createdAt:   row.created_at,
    savedAt:     row.saved_at,
    updatedAt:   row.updated_at,
    referrer:    row.referrer,
    isPublic:    row.is_public,
    isSample:    row.is_sample,
    shareToken:  row.share_token ?? null,
    memberCount: row.member_count ?? (row.nodes?.length ?? 0),
    email:       row.email ?? null,
    timezone:    row.timezone ?? null,
    lastSeen:    row.last_seen ?? null,
    country:     row.country ?? null,
    city:        row.city ?? null,
  }
}

export async function fetchAllCharts({ search = '', email = '', dateFrom = '', dateTo = '', page = 0 } = {}) {
  const sb = getClient()
  if (!sb) return []
  try {
    const { data, error } = await sb.rpc('admin_get_charts', {
      p_search:    search.trim(),
      p_email:     email.trim(),
      p_date_from: dateFrom ? new Date(dateFrom).toISOString() : null,
      p_date_to:   dateTo   ? new Date(dateTo + 'T23:59:59').toISOString() : null,
      p_limit:     50,
      p_offset:    page * 50,
    })
    if (error) { console.error('admin_get_charts error:', error); return [] }
    return (data ?? []).map(fromRow)
  } catch (e) {
    console.error('admin_get_charts exception:', e)
    return []
  }
}

export async function fetchAdminStatsManual() {
  const sb = getClient()
  if (!sb) return null
  try {
    const { data, error } = await sb.rpc('admin_get_stats')
    if (error) { console.error('admin_get_stats error:', error); return null }
    return data
  } catch (e) {
    console.error('admin_get_stats exception:', e)
    return null
  }
}

export async function fetchDevicesGrouped() {
  const sb = getClient()
  if (!sb) return []
  try {
    const { data, error } = await sb.rpc('admin_get_devices')
    if (error) { console.error('admin_get_devices error:', error); return [] }
    return (data ?? []).map(r => ({
      deviceId:   r.device_id,
      email:      r.email ?? null,
      country:    r.country ?? null,
      city:       r.city ?? null,
      timezone:   r.timezone ?? null,
      lastSeen:   r.last_seen ?? null,
      referrer:   r.referrer ?? null,
      treeCount:  Number(r.tree_count),
      treeTitles: r.tree_titles ?? [],
    }))
  } catch (e) {
    console.error('admin_get_devices exception:', e)
    return []
  }
}

export async function fetchTreesPerDay() {
  const sb = getClient()
  if (!sb) return []
  try {
    const { data, error } = await sb.rpc('admin_trees_per_day')
    if (error) { console.error('admin_trees_per_day error:', error); return [] }
    return (data ?? []).map(r => ({ day: r.day, count: Number(r.count) }))
  } catch (e) {
    console.error('admin_trees_per_day exception:', e)
    return []
  }
}
