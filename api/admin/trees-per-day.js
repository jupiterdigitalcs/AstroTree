import { getSupabase } from '../_lib/supabase.js'
import { requireAdmin } from '../_lib/adminAuth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const { data, error } = await getSupabase().rpc('admin_trees_per_day')
    if (error) return res.status(500).json([])
    return res.status(200).json(data ?? [])
  } catch {
    return res.status(500).json([])
  }
}
