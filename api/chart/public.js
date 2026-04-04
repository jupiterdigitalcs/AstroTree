import { getSupabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { data, error } = await getSupabase()
      .from('charts')
      .select('id,title,nodes,edges,counter,saved_at,is_sample')
      .or('is_public.eq.true,is_sample.eq.true')
      .order('updated_at', { ascending: false })
      .limit(20)
    if (error || !data) return res.status(200).json([])
    return res.status(200).json(data.map(r => ({
      id: r.id, title: r.title, nodes: r.nodes, edges: r.edges,
      counter: r.counter, savedAt: r.saved_at, isSample: r.is_sample,
    })))
  } catch {
    return res.status(200).json([])
  }
}
