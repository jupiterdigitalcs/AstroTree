import { getSupabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { deviceId, referrer, timezone, userAgent, country, city } = req.body
  if (!deviceId) return res.status(400).json({ error: 'Missing device ID' })

  try {
    const sb = getSupabase()
    const { error: insertError } = await sb.from('devices').insert({
      id: deviceId,
      referrer:    referrer ?? 'direct',
      timezone:    timezone ?? null,
      user_agent:  typeof userAgent === 'string' ? userAgent.slice(0, 300) : null,
      country:     country ?? null,
      city:        city ?? null,
    })
    if (insertError) {
      await sb.from('devices').update({ last_seen: new Date().toISOString() }).eq('id', deviceId)
    }
    return res.status(200).json({ ok: true })
  } catch {
    return res.status(200).json({ ok: true })
  }
}
