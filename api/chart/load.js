import { getSupabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.query.token
  if (!token) return res.status(400).json({ error: 'Missing token' })

  try {
    const { data, error } = await getSupabase()
      .from('charts')
      .select('id,title,nodes,edges,counter,saved_at,share_token,is_public,is_sample')
      .eq('share_token', token)
      .single()
    if (error || !data) return res.status(404).json(null)
    return res.status(200).json({
      id: data.id, title: data.title, nodes: data.nodes, edges: data.edges,
      counter: data.counter, savedAt: data.saved_at, shareToken: data.share_token,
      isPublic: data.is_public, isSample: data.is_sample,
    })
  } catch {
    return res.status(500).json(null)
  }
}
