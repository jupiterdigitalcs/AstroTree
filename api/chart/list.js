import { getSupabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const deviceId = req.headers['x-device-id']
  if (!deviceId) return res.status(400).json([])

  try {
    const { data, error } = await getSupabase()
      .from('charts')
      .select('id,title,nodes,edges,counter,saved_at,share_token,is_public,is_sample')
      .eq('device_id', deviceId)
      .order('updated_at', { ascending: false })
    if (error || !data) return res.status(200).json([])
    return res.status(200).json(data.map(r => ({
      id: r.id, title: r.title, nodes: r.nodes, edges: r.edges,
      counter: r.counter, savedAt: r.saved_at, shareToken: r.share_token,
      isPublic: r.is_public, isSample: r.is_sample,
    })))
  } catch {
    return res.status(200).json([])
  }
}
