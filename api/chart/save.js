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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const deviceId = req.headers['x-device-id']
  if (!deviceId) return res.status(400).json({ error: 'Missing device ID' })

  const chart = req.body
  if (!chart?.id) return res.status(400).json({ error: 'Missing chart ID' })

  const row = {
    id:         chart.id,
    device_id:  deviceId,
    title:      typeof chart.title === 'string' ? chart.title.slice(0, MAX_TITLE_LEN) : '',
    nodes:      Array.isArray(chart.nodes) ? chart.nodes.slice(0, MAX_NODE_COUNT).map(sanitizeNode).filter(Boolean) : [],
    edges:      Array.isArray(chart.edges) ? chart.edges.slice(0, MAX_EDGE_COUNT) : [],
    counter:    chart.counter,
    saved_at:   chart.savedAt,
    updated_at: new Date().toISOString(),
    referrer:   chart.referrer || 'direct',
  }

  try {
    const { error } = await getSupabase().from('charts').upsert(row, {
      onConflict: 'id',
      ignoreDuplicates: false,
    })
    if (error) return res.status(500).json({ ok: false, error: error.message })
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
}
