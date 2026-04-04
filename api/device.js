import { getSupabase } from './_lib/supabase.js'

async function handleRegister(req, res) {
  const { deviceId, referrer, timezone, userAgent, country, city } = req.body
  if (!deviceId) return res.status(400).json({ error: 'Missing device ID' })
  const sb = getSupabase()
  const { error: insertError } = await sb.from('devices').insert({
    id: deviceId, referrer: referrer ?? 'direct', timezone: timezone ?? null,
    user_agent: typeof userAgent === 'string' ? userAgent.slice(0, 300) : null,
    country: country ?? null, city: city ?? null,
  })
  if (insertError) {
    await sb.from('devices').update({ last_seen: new Date().toISOString() }).eq('id', deviceId)
  }
  return res.status(200).json({ ok: true })
}

async function handleEmail(req, res) {
  const { deviceId, email } = req.body
  if (!deviceId || !email) return res.status(400).json({ ok: false })
  const { error } = await getSupabase()
    .from('devices')
    .update({ email: email.trim().slice(0, 254), email_opt_in: true })
    .eq('id', deviceId)
  return res.status(200).json({ ok: !error })
}

const ROUTES = { register: handleRegister, email: handleEmail }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const fn = ROUTES[req.query.action]
    if (!fn) return res.status(400).json({ error: `Unknown action: ${req.query.action}` })
    return await fn(req, res)
  } catch {
    return res.status(200).json({ ok: true })
  }
}
