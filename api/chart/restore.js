import { getSupabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const { email, deviceId } = req.body
  if (!email || !deviceId) return res.status(400).json({ ok: false, error: 'Missing email or device ID' })

  try {
    const { data, error } = await getSupabase().rpc('restore_charts_by_email', {
      p_email:         email.trim(),
      p_new_device_id: deviceId,
    })
    if (error) return res.status(500).json({ ok: false, error: error.message })
    return res.status(200).json(data)
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
}
