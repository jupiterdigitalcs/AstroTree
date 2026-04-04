import { getSupabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const deviceId = req.headers['x-device-id']
  if (!deviceId) return res.status(400).json({ ok: false, error: 'Missing device ID' })

  const { id } = req.body
  if (!id) return res.status(400).json({ ok: false, error: 'Missing chart ID' })

  try {
    const { error } = await getSupabase().from('charts').delete().eq('id', id).eq('device_id', deviceId)
    if (error) return res.status(500).json({ ok: false, error: error.message })
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
}
