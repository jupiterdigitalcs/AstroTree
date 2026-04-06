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

async function handlePing(req, res) {
  const { deviceId } = req.body
  if (!deviceId) return res.status(400).json({ error: 'Missing device ID' })
  await getSupabase().rpc('device_ping', { p_device_id: deviceId })
  return res.status(200).json({ ok: true })
}

async function handleEvent(req, res) {
  const { deviceId, eventName } = req.body
  if (!deviceId || !eventName) return res.status(400).json({ ok: false })
  const name = String(eventName).slice(0, 64)
  await getSupabase().from('device_events').insert({ device_id: deviceId, event_name: name })
  return res.status(200).json({ ok: true })
}

const ROUTES = { register: handleRegister, email: handleEmail, ping: handlePing, event: handleEvent }

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
