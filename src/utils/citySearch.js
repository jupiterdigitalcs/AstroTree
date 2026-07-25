/**
 * citySearch.js — birthplace lookup for The Hour
 *
 * Pure search over the bundled GeoNames dataset (src/data/cities.json).
 * The dataset is passed in by the caller so this stays testable and the
 * 2.5 MB JSON import lives only in the API route that needs it.
 *
 * Dataset rows: [name, region, country, lat, lon, ianaTimezone, population]
 */

const COMBINING_MARKS = /[̀-ͯ]/g

/** Lowercase + strip diacritics so "Sao Paulo" finds "São Paulo" */
export function normalizePlace(str) {
  return (str ?? '')
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .trim()
}

/**
 * Search cities by name. Prefix matches rank above substring matches;
 * population breaks ties (rows arrive pre-sorted by population).
 * Returns up to `limit` results as objects.
 */
export function searchCities(cities, query, limit = 8) {
  const q = normalizePlace(query)
  if (q.length < 2) return []

  const prefix = []
  const within = []
  for (const row of cities) {
    const name = normalizePlace(row[0])
    if (name.startsWith(q)) {
      prefix.push(row)
      if (prefix.length >= limit) break
    } else if (within.length < limit && name.includes(q)) {
      within.push(row)
    }
  }

  return [...prefix, ...within].slice(0, limit).map(row => ({
    name:    row[0],
    region:  row[1],
    country: row[2],
    lat:     row[3],
    lon:     row[4],
    tz:      row[5],
  }))
}
