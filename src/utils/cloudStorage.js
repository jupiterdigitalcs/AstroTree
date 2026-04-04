import { getDeviceId } from './identity.js'

// Cloud is enabled when running on the deployed site (API routes exist)
export function isCloudEnabled() {
  // Vercel serverless functions aren't available in local vite dev
  return window.location.hostname !== 'localhost'
}

export function getReferrer() {
  const params = new URLSearchParams(window.location.search)
  const utm = params.get('utm_source')
  if (utm) return utm
  if (document.referrer) {
    try { return new URL(document.referrer).hostname } catch { return document.referrer }
  }
  return 'direct'
}

async function fetchGeo() {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return {}
    const d = await res.json()
    return {
      country: d.country_name?.slice(0, 100) ?? null,
      city:    d.city?.slice(0, 100)         ?? null,
    }
  } catch {
    return {}
  }
}

// ── Chart CRUD ───────────────────────────────────────────────────────────────

export async function uploadChart(chart) {
  try {
    const res = await fetch('/api/chart?action=save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': getDeviceId(),
      },
      body: JSON.stringify({
        ...chart,
        referrer: getReferrer(),
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('[cloud] save failed:', res.status, text)
      return { ok: false, error: `HTTP ${res.status}` }
    }
    return await res.json()
  } catch (e) {
    console.error('[cloud] save error:', e)
    return { ok: false, error: e.message }
  }
}

export async function fetchCharts() {
  try {
    const res = await fetch('/api/chart?action=list', {
      headers: { 'x-device-id': getDeviceId() },
    })
    return await res.json()
  } catch {
    return []
  }
}

export async function deleteChartCloud(id) {
  try {
    const res = await fetch('/api/chart?action=delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': getDeviceId(),
      },
      body: JSON.stringify({ id }),
    })
    return await res.json()
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

export async function fetchPublicCharts() {
  try {
    const res = await fetch('/api/chart?action=public')
    return await res.json()
  } catch {
    return []
  }
}

export async function fetchChartByToken(token) {
  try {
    const res = await fetch(`/api/chart?action=load&token=${encodeURIComponent(token)}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function generateShareToken(id) {
  try {
    const res = await fetch('/api/chart?action=share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': getDeviceId(),
      },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    return data.token ?? null
  } catch {
    return null
  }
}

export async function restoreChartsByEmail(email) {
  try {
    const res = await fetch('/api/chart?action=restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, deviceId: getDeviceId() }),
    })
    return await res.json()
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

// ── Device tracking ──────────────────────────────────────────────────────────

export async function upsertDevice() {
  try {
    const geo = await fetchGeo()
    await fetch('/api/device?action=register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId:  getDeviceId(),
        referrer:  getReferrer(),
        timezone:  Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
        userAgent: navigator.userAgent.slice(0, 300),
        country:   geo.country ?? null,
        city:      geo.city    ?? null,
      }),
    })
  } catch {}
}

export async function updateDeviceEmail(email) {
  try {
    const res = await fetch('/api/device?action=email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: getDeviceId(), email }),
    })
    return await res.json()
  } catch {
    return { ok: false }
  }
}
