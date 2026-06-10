// Tonight's moon — phase computed locally, sign fetched from /api/astrology.
// Used as an ambient touch on the welcome cards.

import { computeAstrology } from './astrologyAPI.js'

const SYNODIC = 29.53058867
// Reference new moon: 2000-01-06 18:14 UTC
const NEW_MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14)

export function getMoonPhase(date = new Date()) {
  const days = (date.getTime() - NEW_MOON_EPOCH) / 86400000
  const age = ((days % SYNODIC) + SYNODIC) % SYNODIC
  const frac = age / SYNODIC
  const illumination = (1 - Math.cos(2 * Math.PI * frac)) / 2
  const waxing = frac < 0.5
  let name
  if (age < 1.85) name = 'New Moon'
  else if (age < 5.54) name = 'Waxing Crescent'
  else if (age < 9.23) name = 'First Quarter'
  else if (age < 12.92) name = 'Waxing Gibbous'
  else if (age < 16.61) name = 'Full Moon'
  else if (age < 20.3) name = 'Waning Gibbous'
  else if (age < 23.99) name = 'Last Quarter'
  else if (age < 27.68) name = 'Waning Crescent'
  else name = 'New Moon'
  return { age, illumination, waxing, name }
}

const CACHE_KEY = 'astrodig_moon_tonight'

// Phase is instant; the sign arrives async (cached per calendar day).
export async function getMoonTonight() {
  const today = new Date().toISOString().slice(0, 10)
  const phase = getMoonPhase()
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null')
    if (cached?.date === today) return { ...phase, moonSign: cached.moonSign }
  } catch {}
  let moonSign = null
  try {
    const astro = await computeAstrology(today)
    moonSign = astro?.moon?.moonSign ?? null
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, moonSign }))
  } catch {}
  return { ...phase, moonSign }
}
