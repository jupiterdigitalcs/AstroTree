import { getDeviceId } from './identity.js'

// Cloud is enabled when API endpoints are available (always true in production)
export function isCloudEnabled() {
  return true
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
    const res = await fetch('/api/chart/save', {
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
    const data = await res.json()
    return data
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

export async function fetchCharts() {
  try {
    const res = await fetch('/api/chart/list', {
      headers: { 'x-device-id': getDeviceId() },
    })
    return await res.json()
  } catch {
    return []
  }
}

export async function deleteChartCloud(id) {
  try {
    const res = await fetch('/api/chart/delete', {
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
    const res = await fetch('/api/chart/public')
    return await res.json()
  } catch {
    return []
  }
}

export async function fetchChartByToken(token) {
  try {
    const res = await fetch(`/api/chart/load?token=${encodeURIComponent(token)}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function generateShareToken(id) {
  try {
    const res = await fetch('/api/chart/share', {
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
    const res = await fetch('/api/chart/restore', {
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
    await fetch('/api/device/register', {
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
    const res = await fetch('/api/device/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: getDeviceId(), email }),
    })
    return await res.json()
  } catch {
    return { ok: false }
  }
}
