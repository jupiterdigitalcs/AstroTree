/**
 * Client-side wrapper for the server-side astrology API.
 * Celestine calculations run on the server — this module fetches the results.
 */

/** Compute astrology data for a single member */
export async function computeAstrology(birthdate, birthTime = null, birthTimezone = null) {
  try {
    const res = await fetch('/api/astrology', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birthdate,
        birthTime,
        birthTimezone,
        calculations: ['moon', 'innerPlanets', 'outerPlanets', 'sunAtTime', 'ingressWarnings', 'timezoneWarnings'],
      }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/** Compute astrology data for multiple members in a single request */
export async function computeAstrologyBatch(members) {
  try {
    const res = await fetch('/api/astrology', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        members,
        calculations: ['moon', 'innerPlanets', 'outerPlanets', 'ingressWarnings', 'timezoneWarnings'],
      }),
    })
    if (!res.ok) return {}
    return await res.json()
  } catch {
    return {}
  }
}
