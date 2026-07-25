import { NextResponse } from 'next/server'
import { searchCities } from '@/utils/citySearch'
import cities from '@/data/cities.json'

/**
 * GET /api/hour/cities?q=<query>
 *
 * Birthplace search for The Hour, over the bundled GeoNames dataset
 * (no external geocoding service). Returns up to 8 matches:
 * [{ name, region, country, lat, lon, tz }]
 */
export async function GET(request) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  const results = searchCities(cities, q)
  return NextResponse.json(
    { results },
    { headers: { 'Cache-Control': 'public, max-age=86400' } },
  )
}
