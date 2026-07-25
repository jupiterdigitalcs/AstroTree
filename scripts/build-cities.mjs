/**
 * build-cities.mjs — dev-only generator for src/data/cities.json
 *
 * Downloads the free GeoNames "cities15000" dataset (every city with
 * population 15,000+) plus the admin1 region names, and emits a compact
 * JSON array for The Hour's birthplace search.
 *
 * Run:  node scripts/build-cities.mjs
 * Data license: CC BY 4.0 — requires a visible "GeoNames.org" credit
 * wherever the data is shown (The Hour result/entry screens carry it).
 *
 * Output rows: [name, region, country, lat, lon, ianaTimezone, population]
 * Coordinates rounded to 2 decimals (~1.1 km) — far finer than ascendant
 * math needs.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT  = join(ROOT, 'src', 'data', 'cities.json')

const CITIES_URL = 'https://download.geonames.org/export/dump/cities15000.zip'
const ADMIN1_URL = 'https://download.geonames.org/export/dump/admin1CodesASCII.txt'

const work = mkdtempSync(join(tmpdir(), 'geonames-'))

console.log('Downloading', CITIES_URL)
execFileSync('curl', ['-sSfL', '-o', join(work, 'cities.zip'), CITIES_URL])
execFileSync('unzip', ['-o', '-q', join(work, 'cities.zip'), '-d', work])

console.log('Downloading', ADMIN1_URL)
execFileSync('curl', ['-sSfL', '-o', join(work, 'admin1.txt'), ADMIN1_URL])

// admin1CodesASCII.txt: "US.NY\tNew York\tNew York\t5128638"
const admin1 = new Map()
for (const line of readFileSync(join(work, 'admin1.txt'), 'utf8').split('\n')) {
  const [code, name] = line.split('\t')
  if (code && name) admin1.set(code, name)
}

const countryName = new Intl.DisplayNames(['en'], { type: 'region' })

// cities15000.txt columns (tab-separated):
// 0 geonameid, 1 name, 2 asciiname, 3 altnames, 4 lat, 5 lon, 6 fclass,
// 7 fcode, 8 country, 9 cc2, 10 admin1, 11-13 admin2-4, 14 population,
// 15 elevation, 16 dem, 17 timezone, 18 moddate
const rows = []
for (const line of readFileSync(join(work, 'cities15000.txt'), 'utf8').split('\n')) {
  const f = line.split('\t')
  if (f.length < 18) continue
  const name = f[1]
  const cc   = f[8]
  const lat  = Math.round(parseFloat(f[4]) * 100) / 100
  const lon  = Math.round(parseFloat(f[5]) * 100) / 100
  const pop  = parseInt(f[14], 10) || 0
  const tz   = f[17]
  if (!name || !cc || !tz || Number.isNaN(lat) || Number.isNaN(lon)) continue
  let country
  try { country = countryName.of(cc) ?? cc } catch { country = cc }
  const region = admin1.get(`${cc}.${f[10]}`) ?? ''
  rows.push([name, region, country, lat, lon, tz, pop])
}

rows.sort((a, b) => b[6] - a[6])

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(rows))
console.log(`Wrote ${rows.length} cities to ${OUT} (${(JSON.stringify(rows).length / 1e6).toFixed(1)} MB)`)
