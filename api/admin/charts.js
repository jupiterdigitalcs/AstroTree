import { getSupabase } from '../_lib/supabase.js'
import { requireAdmin } from '../_lib/adminAuth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })

  const { search = '', email = '', dateFrom = '', dateTo = '', page = '0' } = req.query

  try {
    const { data, error } = await getSupabase().rpc('admin_get_charts', {
      p_search:    search.trim(),
      p_email:     email.trim(),
      p_date_from: dateFrom ? new Date(dateFrom).toISOString() : null,
      p_date_to:   dateTo   ? new Date(dateTo + 'T23:59:59').toISOString() : null,
      p_limit:     50,
      p_offset:    parseInt(page, 10) * 50,
    })
    if (error) return res.status(500).json([])
    return res.status(200).json(data ?? [])
  } catch {
    return res.status(500).json([])
  }
}
