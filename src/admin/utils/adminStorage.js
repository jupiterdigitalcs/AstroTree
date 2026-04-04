import { getAdminToken } from './adminAuth.js'

function adminHeaders() {
  return { 'Authorization': `Bearer ${getAdminToken()}` }
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
  try {
    const params = new URLSearchParams({ search, email, dateFrom, dateTo, page: String(page) })
    const res = await fetch(`/api/admin?action=charts&${params}`, { headers: adminHeaders() })
    if (!res.ok) return []
    const data = await res.json()
    return (data ?? []).map(fromRow)
  } catch (e) {
    console.error('admin_get_charts exception:', e)
    return []
  }
}

export async function fetchAdminStatsManual() {
  try {
    const res = await fetch('/api/admin?action=stats', { headers: adminHeaders() })
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    console.error('admin_get_stats exception:', e)
    return null
  }
}

export async function fetchDevicesGrouped() {
  try {
    const res = await fetch('/api/admin?action=devices', { headers: adminHeaders() })
    if (!res.ok) return []
    const data = await res.json()
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
  try {
    const res = await fetch('/api/admin?action=trees-per-day', { headers: adminHeaders() })
    if (!res.ok) return []
    const data = await res.json()
    return (data ?? []).map(r => ({ day: r.day, count: Number(r.count) }))
  } catch (e) {
    console.error('admin_trees_per_day exception:', e)
    return []
  }
}
