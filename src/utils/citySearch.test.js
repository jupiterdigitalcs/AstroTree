import { describe, it, expect } from 'vitest'
import { normalizePlace, searchCities } from './citySearch.js'

// Rows: [name, region, country, lat, lon, tz, population] — pre-sorted by population
const CITIES = [
  ['New York City', 'New York', 'United States', 40.71, -74.01, 'America/New_York', 8804190],
  ['São Paulo', 'São Paulo', 'Brazil', -23.55, -46.64, 'America/Sao_Paulo', 12325232],
  ['London', 'England', 'United Kingdom', 51.51, -0.13, 'Europe/London', 8961989],
  ['Newark', 'New Jersey', 'United States', 40.74, -74.17, 'America/New_York', 311549],
  ['London', 'Ontario', 'Canada', 42.98, -81.25, 'America/Toronto', 346765],
  ['East London', 'Eastern Cape', 'South Africa', -33.02, 27.91, 'Africa/Johannesburg', 267007],
]

describe('normalizePlace', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalizePlace('São Paulo')).toBe('sao paulo')
    expect(normalizePlace('  ReykjavíK ')).toBe('reykjavik')
  })

  it('handles null and empty input', () => {
    expect(normalizePlace(null)).toBe('')
    expect(normalizePlace('')).toBe('')
  })
})

describe('searchCities', () => {
  it('returns empty for queries under 2 characters', () => {
    expect(searchCities(CITIES, 'L')).toEqual([])
    expect(searchCities(CITIES, '')).toEqual([])
  })

  it('finds prefix matches and maps rows to objects', () => {
    const results = searchCities(CITIES, 'lond')
    expect(results[0]).toEqual({
      name: 'London', region: 'England', country: 'United Kingdom',
      lat: 51.51, lon: -0.13, tz: 'Europe/London',
    })
  })

  it('ranks prefix matches above substring matches', () => {
    const results = searchCities(CITIES, 'london')
    const names = results.map(r => `${r.name}, ${r.region}`)
    expect(names.indexOf('London, England')).toBeLessThan(names.indexOf('East London, Eastern Cape'))
  })

  it('matches diacritic-free queries against accented names', () => {
    const results = searchCities(CITIES, 'sao pa')
    expect(results[0].name).toBe('São Paulo')
  })

  it('respects the result limit', () => {
    expect(searchCities(CITIES, 'ne', 1)).toHaveLength(1)
  })

  it('keeps population order among prefix matches', () => {
    const results = searchCities(CITIES, 'new')
    expect(results[0].name).toBe('New York City')
    expect(results[1].name).toBe('Newark')
  })
})
