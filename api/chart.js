import { getSupabase } from './_lib/supabase.js'

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

function toRow(r) {
  return {
    id: r.id, title: r.title, nodes: r.nodes, edges: r.edges,
    counter: r.counter, savedAt: r.saved_at, shareToken: r.share_token ?? null,
    isPublic: r.is_public, isSample: r.is_sample,
  }
}

async function handleSave(req, res) {
  const deviceId = req.headers['x-device-id']
  if (!deviceId) return res.status(400).json({ error: 'Missing device ID' })
  const chart = req.body
  if (!chart?.id) return res.status(400).json({ error: 'Missing chart ID' })

  const row = {
    id: chart.id, device_id: deviceId,
    title:      typeof chart.title === 'string' ? chart.title.slice(0, MAX_TITLE_LEN) : '',
    nodes:      Array.isArray(chart.nodes) ? chart.nodes.slice(0, MAX_NODE_COUNT).map(sanitizeNode).filter(Boolean) : [],
    edges:      Array.isArray(chart.edges) ? chart.edges.slice(0, MAX_EDGE_COUNT) : [],
    counter:    chart.counter,
    saved_at:   chart.savedAt,
    updated_at: new Date().toISOString(),
    referrer:   chart.referrer || 'direct',
  }
  const { error } = await getSupabase().from('charts').upsert(row, { onConflict: 'id', ignoreDuplicates: false })
  return error ? res.status(500).json({ ok: false, error: error.message }) : res.status(200).json({ ok: true })
}

async function handleLoad(req, res) {
  const token = req.query.token
  if (!token) return res.status(400).json(null)
  const { data, error } = await getSupabase()
    .from('charts')
    .select('id,title,nodes,edges,counter,saved_at,share_token,is_public,is_sample')
    .eq('share_token', token).single()
  if (error || !data) return res.status(404).json(null)
  return res.status(200).json(toRow(data))
}

async function handleList(req, res) {
  const deviceId = req.headers['x-device-id']
  if (!deviceId) return res.status(200).json([])
  const { data, error } = await getSupabase()
    .from('charts')
    .select('id,title,nodes,edges,counter,saved_at,share_token,is_public,is_sample')
    .eq('device_id', deviceId).order('updated_at', { ascending: false })
  if (error || !data) return res.status(200).json([])
  return res.status(200).json(data.map(toRow))
}

async function handleDelete(req, res) {
  const deviceId = req.headers['x-device-id']
  if (!deviceId || !req.body?.id) return res.status(400).json({ ok: false })
  const { error } = await getSupabase().from('charts').delete().eq('id', req.body.id).eq('device_id', deviceId)
  return error ? res.status(500).json({ ok: false }) : res.status(200).json({ ok: true })
}

async function handlePublic(req, res) {
  const { data, error } = await getSupabase()
    .from('charts')
    .select('id,title,nodes,edges,counter,saved_at,is_sample')
    .or('is_public.eq.true,is_sample.eq.true')
    .order('updated_at', { ascending: false }).limit(20)
  if (error || !data) return res.status(200).json([])
  return res.status(200).json(data.map(toRow))
}

async function handleShare(req, res) {
  const deviceId = req.headers['x-device-id']
  if (!deviceId || !req.body?.id) return res.status(400).json({ token: null })
  const token = crypto.randomUUID()
  const { error } = await getSupabase()
    .from('charts').update({ share_token: token })
    .eq('id', req.body.id).eq('device_id', deviceId)
  return error ? res.status(500).json({ token: null }) : res.status(200).json({ token })
}

async function handleRestore(req, res) {
  const { email, deviceId } = req.body
  if (!email || !deviceId) return res.status(400).json({ ok: false, error: 'Missing fields' })
  const { data, error } = await getSupabase().rpc('restore_charts_by_email', {
    p_email: email.trim(), p_new_device_id: deviceId,
  })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  return res.status(200).json(data)
}

const ROUTES = { save: handleSave, load: handleLoad, list: handleList, delete: handleDelete, public: handlePublic, share: handleShare, restore: handleRestore }

export default async function handler(req, res) {
  try {
    const action = req.query.action
    const fn = ROUTES[action]
    if (!fn) return res.status(400).json({ error: `Unknown action: ${action}` })
    return await fn(req, res)
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
}
