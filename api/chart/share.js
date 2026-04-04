import { getSupabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const deviceId = req.headers['x-device-id']
  if (!deviceId) return res.status(400).json({ token: null })

  const { id } = req.body
  if (!id) return res.status(400).json({ token: null })

  try {
    const token = crypto.randomUUID()
    const { error } = await getSupabase()
      .from('charts')
      .update({ share_token: token })
      .eq('id', id)
      .eq('device_id', deviceId)
    if (error) return res.status(500).json({ token: null })
    return res.status(200).json({ token })
  } catch {
    return res.status(500).json({ token: null })
  }
}
