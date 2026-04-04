import { getSupabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })

  const { deviceId, email } = req.body
  if (!deviceId || !email) return res.status(400).json({ ok: false })

  try {
    const { error } = await getSupabase()
      .from('devices')
      .update({ email: email.trim().slice(0, 254), email_opt_in: true })
      .eq('id', deviceId)
    return res.status(200).json({ ok: !error })
  } catch {
    return res.status(200).json({ ok: false })
  }
}
