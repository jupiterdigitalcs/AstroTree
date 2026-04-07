import { getSupabase } from './_lib/supabase.js'
import { createAdminToken, requireAdmin } from './_lib/adminAuth.js'

async function handleLogin(req, res) {
  const { password } = req.body
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'Invalid password' })
  }
  return res.status(200).json({ ok: true, token: createAdminToken() })
}

async function handleCharts(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })
  const { search = '', email = '', dateFrom = '', dateTo = '', page = '0' } = req.query
  const { data, error } = await getSupabase().rpc('admin_get_charts', {
    p_search: search.trim(), p_email: email.trim(),
    p_date_from: dateFrom ? new Date(dateFrom).toISOString() : null,
    p_date_to:   dateTo   ? new Date(dateTo + 'T23:59:59').toISOString() : null,
    p_limit: 50, p_offset: parseInt(page, 10) * 50,
  })
  return error ? res.status(500).json([]) : res.status(200).json(data ?? [])
}

async function handleStats(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })
  const { data, error } = await getSupabase().rpc('admin_get_stats')
  return error ? res.status(500).json(null) : res.status(200).json(data)
}

async function handleDevices(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })
  const { data, error } = await getSupabase().rpc('admin_get_devices')
  return error ? res.status(500).json([]) : res.status(200).json(data ?? [])
}

async function handleTreesPerDay(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })
  const { data, error } = await getSupabase().rpc('admin_trees_per_day')
  return error ? res.status(500).json([]) : res.status(200).json(data ?? [])
}

async function handleEngagement(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })
  const { data, error } = await getSupabase().rpc('admin_get_engagement_stats')
  return error ? res.status(500).json(null) : res.status(200).json(data)
}

async function handlePaywallConfig(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })
  const { data, error } = await getSupabase().from('paywall_config').select('key, value, updated_at')
  if (error) return res.status(500).json([])
  return res.status(200).json(data ?? [])
}

async function handlePaywallConfigSet(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })
  const { key, value } = req.body ?? {}
  if (!key) return res.status(400).json({ error: 'Missing key' })
  const { error } = await getSupabase().rpc('admin_set_paywall_config', { p_key: key, p_value: value })
  return error ? res.status(500).json({ ok: false, error: error.message }) : res.status(200).json({ ok: true })
}

async function handlePurchases(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })
  const { data, error } = await getSupabase().rpc('admin_get_purchases')
  return error ? res.status(500).json([]) : res.status(200).json(data ?? [])
}

const ROUTES = { login: handleLogin, charts: handleCharts, stats: handleStats, devices: handleDevices, 'trees-per-day': handleTreesPerDay, engagement: handleEngagement, 'paywall-config': handlePaywallConfig, 'paywall-config-set': handlePaywallConfigSet, purchases: handlePurchases }

export default async function handler(req, res) {
  try {
    const fn = ROUTES[req.query.action]
    if (!fn) return res.status(400).json({ error: `Unknown action: ${req.query.action}` })
    return await fn(req, res)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
