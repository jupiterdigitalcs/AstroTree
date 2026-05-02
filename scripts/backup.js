#!/usr/bin/env node
// scripts/backup.js
// Exports all Supabase tables to a local JSON file.
// Run with: node scripts/backup.js
// Reads credentials from .env.local — keep that file out of git.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Load .env.local ──────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env.local not found. Run this from the project root.')
    process.exit(1)
  }
  const env = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    env[key] = val
  }
  return env
}

// ── Fetch a table via Supabase REST API ──────────────────────────────────────

async function fetchTable(baseUrl, serviceKey, table, orderCol = 'created_at') {
  const url = `${baseUrl}/rest/v1/${table}?select=*&order=${orderCol}.desc&limit=10000`
  const res = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to fetch '${table}': ${res.status} ${body}`)
  }
  return res.json()
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const env = loadEnv()
  const supabaseUrl = env.SUPABASE_URL
  const serviceKey  = env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env.local')
    process.exit(1)
  }

  console.log('Fetching tables from Supabase...')

  const [devices, charts, purchases, userProfiles] = await Promise.all([
    fetchTable(supabaseUrl, serviceKey, 'devices', 'first_seen'),
    fetchTable(supabaseUrl, serviceKey, 'charts', 'saved_at'),
    fetchTable(supabaseUrl, serviceKey, 'purchases', 'created_at'),
    fetchTable(supabaseUrl, serviceKey, 'user_profiles', 'created_at'),
  ])

  const backup = {
    exported_at: new Date().toISOString(),
    counts: {
      devices:       devices.length,
      charts:        charts.length,
      purchases:     purchases.length,
      user_profiles: userProfiles.length,
    },
    devices,
    charts,
    purchases,
    user_profiles: userProfiles,
  }

  const outDir = path.join(__dirname, '..', 'backups')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)

  const date    = new Date().toISOString().split('T')[0]
  const outFile = path.join(outDir, `astrodig_backup_${date}.json`)
  fs.writeFileSync(outFile, JSON.stringify(backup, null, 2))

  console.log(`\n✓ Saved: backups/astrodig_backup_${date}.json`)
  console.log(`  devices: ${devices.length}`)
  console.log(`  charts: ${charts.length}`)
  console.log(`  purchases: ${purchases.length}`)
  console.log(`  user_profiles: ${userProfiles.length}`)
}

main().catch(err => {
  console.error('\nBackup failed:', err.message)
  process.exit(1)
})
