import { NextResponse } from 'next/server'
import { getSupabase } from '../_lib/supabase.js'
import { createAdminToken, requireAdmin } from '../_lib/adminAuth.js'

async function handleLogin(request) {
  const { password } = await request.json()
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: 'Invalid password' }, { status: 401 })
  }
  return NextResponse.json({ ok: true, token: createAdminToken() })
}

async function handleCharts(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') ?? ''
  const email = searchParams.get('email') ?? ''
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''
  const page = searchParams.get('page') ?? '0'
  const { data, error } = await getSupabase().rpc('admin_get_charts', {
    p_search: search.trim(), p_email: email.trim(),
    p_date_from: dateFrom ? new Date(dateFrom).toISOString() : null,
    p_date_to:   dateTo   ? new Date(dateTo + 'T23:59:59').toISOString() : null,
    p_limit: 50, p_offset: parseInt(page, 10) * 50,
  })
  return error ? NextResponse.json([], { status: 500 }) : NextResponse.json(data ?? [])
}

async function handleStats(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabase().rpc('admin_get_stats')
  return error ? NextResponse.json(null, { status: 500 }) : NextResponse.json(data)
}

async function handleDevices(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabase().rpc('admin_get_devices')
  return error ? NextResponse.json([], { status: 500 }) : NextResponse.json(data ?? [])
}

async function handleTreesPerDay(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabase().rpc('admin_trees_per_day')
  return error ? NextResponse.json([], { status: 500 }) : NextResponse.json(data ?? [])
}

async function handleEngagement(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabase().rpc('admin_get_engagement_stats')
  return error ? NextResponse.json(null, { status: 500 }) : NextResponse.json(data)
}

async function handleMarkTest(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { deviceId, isTest } = await request.json()
  if (!deviceId) return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 })
  // Mark device as test by setting a recognizable email prefix
  const marker = isTest ? 'test@internal' : null
  const { error } = await getSupabase()
    .from('devices')
    .update({ email: marker })
    .eq('id', deviceId)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  // Also mark all charts from this device as sample
  if (isTest) {
    await getSupabase()
      .from('charts')
      .update({ is_sample: true })
      .eq('device_id', deviceId)
  }
  return NextResponse.json({ ok: true })
}

async function handleMarkChartTest(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { chartId, isTest } = await request.json()
  if (!chartId) return NextResponse.json({ error: 'Missing chartId' }, { status: 400 })
  const { error } = await getSupabase()
    .from('charts')
    .update({ is_test: !!isTest })
    .eq('id', chartId)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

async function handleCelestialUsers(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sb = getSupabase()
  // Get all user_profiles with premium tier
  const { data, error } = await sb
    .from('user_profiles')
    .select('auth_user_id, tier, tier_updated_at, stripe_customer_id')
    .eq('tier', 'premium')
  if (error) return NextResponse.json([], { status: 500 })
  if (!data?.length) return NextResponse.json([])

  // Single call to get all auth users, then match by ID
  const { data: { users } } = await sb.auth.admin.listUsers({ perPage: 1000 })
  const userMap = {}
  if (users) users.forEach(u => { userMap[u.id] = u.email })

  const results = (data ?? []).map(profile => ({
    authUserId: profile.auth_user_id,
    email: userMap[profile.auth_user_id] ?? null,
    tier: profile.tier,
    tierUpdatedAt: profile.tier_updated_at,
    stripeCustomerId: profile.stripe_customer_id,
  }))
  return NextResponse.json(results)
}

async function handleDowngradeUser(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { authUserId, email } = await request.json()
  if (!authUserId) return NextResponse.json({ error: 'Missing authUserId' }, { status: 400 })

  const sb = getSupabase()

  // Downgrade user_profiles
  const { error: profileErr } = await sb
    .from('user_profiles')
    .update({ tier: 'free', tier_updated_at: new Date().toISOString() })
    .eq('auth_user_id', authUserId)
  if (profileErr) return NextResponse.json({ ok: false, error: profileErr.message }, { status: 500 })

  // Also downgrade any devices linked to this user
  await sb
    .from('devices')
    .update({ tier: 'free', tier_updated_at: new Date().toISOString() })
    .eq('auth_user_id', authUserId)

  return NextResponse.json({ ok: true })
}

async function handleFunnel(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('dateFrom')
  const dateTo   = searchParams.get('dateTo')
  const since    = dateFrom ? new Date(dateFrom).toISOString() : new Date(Date.now() - 30 * 86400000).toISOString()
  const excludeDevices = searchParams.get('excludeDevices') ?? ''
  const excludeEmails  = searchParams.get('excludeEmails') ?? ''
  const sb = getSupabase()

  // Get test device IDs to exclude (email = 'test@internal')
  const { data: testDevices } = await sb.from('devices').select('id').eq('email', 'test@internal')
  const testIds = new Set((testDevices ?? []).map(d => d.id))

  // Exclude devices linked to specific emails (e.g. the owner's account)
  if (excludeEmails) {
    for (const email of excludeEmails.split(',')) {
      const trimmed = email.trim()
      if (!trimmed) continue
      // Find auth users with this email, then find their linked devices
      const { data: { users } } = await sb.auth.admin.listUsers({ perPage: 1000 })
      const matchedAuthIds = (users ?? []).filter(u => u.email === trimmed).map(u => u.id)
      if (matchedAuthIds.length) {
        const { data: linked } = await sb.from('devices').select('id').in('auth_user_id', matchedAuthIds)
        for (const d of linked ?? []) testIds.add(d.id)
      }
      // Also match devices by email field directly
      const { data: byEmail } = await sb.from('devices').select('id').eq('email', trimmed)
      for (const d of byEmail ?? []) testIds.add(d.id)
    }
  }

  // Also exclude any device IDs passed from the client (e.g. the admin's own device)
  if (excludeDevices) {
    for (const id of excludeDevices.split(',')) {
      const trimmed = id.trim()
      if (trimmed) testIds.add(trimmed)
    }
  }

  let query = sb
    .from('device_events')
    .select('event_name, device_id, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000)
  if (dateTo) query = query.lte('created_at', new Date(dateTo + 'T23:59:59').toISOString())

  const { data, error } = await query
  if (error) return NextResponse.json([], { status: 500 })

  // Filter out test/owner devices
  const filtered = (data ?? []).filter(r => !testIds.has(r.device_id))

  // Aggregate: count of unique devices per event
  const byEvent = {}
  const countByEvent = {}
  for (const row of filtered) {
    if (!byEvent[row.event_name]) { byEvent[row.event_name] = new Set(); countByEvent[row.event_name] = 0 }
    byEvent[row.event_name].add(row.device_id)
    countByEvent[row.event_name]++
  }
  const result = Object.entries(byEvent).map(([event, devices]) => ({
    event, uniqueDevices: devices.size, totalCount: countByEvent[event],
  }))
  result.sort((a, b) => b.uniqueDevices - a.uniqueDevices)
  return NextResponse.json(result)
}

async function handlePaywallConfig(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabase().from('paywall_config').select('key, value, updated_at')
  if (error) return NextResponse.json([], { status: 500 })
  return NextResponse.json(data ?? [])
}

async function handlePaywallConfigSet(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { key, value } = await request.json()
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  const { error } = await getSupabase().rpc('admin_set_paywall_config', { p_key: key, p_value: value })
  return error
    ? NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    : NextResponse.json({ ok: true })
}

async function handlePurchases(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabase().rpc('admin_get_purchases')
  return error ? NextResponse.json([], { status: 500 }) : NextResponse.json(data ?? [])
}

// ── Research ────────────────────────────────────────────────────────────────

const SIGN_OFFSETS = {
  Aries: 0, Taurus: 30, Gemini: 60, Cancer: 90, Leo: 120, Virgo: 150,
  Libra: 180, Scorpio: 210, Sagittarius: 240, Capricorn: 270, Aquarius: 300, Pisces: 330,
}
const SIGN_TO_ELEMENT = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
}

// ── Statistical helpers ─────────────────────────────────────────────────────

// Birthday problem: probability that at least 2 of n people share one of k categories
function birthdayProbSharing(n, k) {
  if (n >= k) return 1
  let pNoMatch = 1
  for (let i = 0; i < n; i++) pNoMatch *= (k - i) / k
  return 1 - pNoMatch
}

// Expected number of pairs within `window` degrees out of 360, given nPairs random pairs
function expectedDegreePairs(nPairs, windowDeg) {
  return nPairs * (2 * windowDeg) / 360
}

// Confidence assessment: combines effect size (ratio) with sample size
function assessConfidence(ratio, sampleSize, label) {
  if (sampleSize < 5) return { level: 'insufficient', color: '#888', label: 'Too few data points', n: sampleSize }
  if (sampleSize < 10) {
    if (ratio >= 2.5) return { level: 'promising', color: '#e8a043', label: `Promising (n=${sampleSize}, need more data)`, n: sampleSize }
    return { level: 'insufficient', color: '#888', label: `Inconclusive (n=${sampleSize})`, n: sampleSize }
  }
  if (sampleSize < 20) {
    if (ratio >= 2.0) return { level: 'strong', color: '#7ec845', label: `Strong signal (n=${sampleSize})`, n: sampleSize }
    if (ratio >= 1.3) return { level: 'promising', color: '#e8a043', label: `Promising (n=${sampleSize})`, n: sampleSize }
    return { level: 'weak', color: '#888', label: `Weak signal (n=${sampleSize})`, n: sampleSize }
  }
  // n >= 20
  if (ratio >= 1.5) return { level: 'strong', color: '#7ec845', label: `Strong signal (n=${sampleSize})`, n: sampleSize }
  if (ratio >= 1.2) return { level: 'promising', color: '#e8a043', label: `Promising (n=${sampleSize})`, n: sampleSize }
  return { level: 'weak', color: '#888', label: `Near random (n=${sampleSize})`, n: sampleSize }
}


const SIGN_TO_MODALITY = {
  Aries: 'Cardinal', Cancer: 'Cardinal', Libra: 'Cardinal', Capricorn: 'Cardinal',
  Taurus: 'Fixed', Leo: 'Fixed', Scorpio: 'Fixed', Aquarius: 'Fixed',
  Gemini: 'Mutable', Sagittarius: 'Mutable', Virgo: 'Mutable', Pisces: 'Mutable',
}
const OPPOSITE_SIGNS = {
  Aries: 'Libra', Libra: 'Aries', Taurus: 'Scorpio', Scorpio: 'Taurus',
  Gemini: 'Sagittarius', Sagittarius: 'Gemini', Cancer: 'Capricorn', Capricorn: 'Cancer',
  Leo: 'Aquarius', Aquarius: 'Leo', Virgo: 'Pisces', Pisces: 'Virgo',
}

async function handleResearch(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await getSupabase().rpc('admin_research_raw')
  if (error) return NextResponse.json(null, { status: 500 })

  // RPC now returns { members: [...], edges: [...] }
  const raw = data ?? {}
  const rows = raw.members ?? []
  const allEdges = raw.edges ?? []
  if (!rows.length) return NextResponse.json({ overview: { uniqueIndividuals: 0, totalCharts: 0, avgFamilySize: 0 } })

  // --- Dedup by birthdate (for overview count only) ---
  const seen = new Map()
  for (const r of rows) {
    if (r.birthdate && !seen.has(r.birthdate)) seen.set(r.birthdate, r)
  }
  const uniqueCount = seen.size

  // --- Overview ---
  const chartIds = new Set(rows.map(r => r.chart_id))
  const chartsArr = [...chartIds]
  const chartSizes = {}
  for (const r of rows) chartSizes[r.chart_id] = (chartSizes[r.chart_id] || 0) + 1
  const avgSize = chartsArr.length ? Math.round(Object.values(chartSizes).reduce((s, n) => s + n, 0) / chartsArr.length * 10) / 10 : 0
  const overview = { uniqueIndividuals: uniqueCount, totalCharts: chartsArr.length, avgFamilySize: avgSize }

  // --- Group rows by chart (all per-chart analyses use this) ---
  const byChart = {}
  for (const r of rows) {
    if (!byChart[r.chart_id]) byChart[r.chart_id] = { title: r.title, members: [], nodeMap: {} }
    byChart[r.chart_id].members.push(r)
    if (r.node_id) byChart[r.chart_id].nodeMap[r.node_id] = r
  }
  // Attach edges to charts
  for (const e of allEdges) {
    if (byChart[e.chart_id]) {
      if (!byChart[e.chart_id].edges) byChart[e.chart_id].edges = []
      byChart[e.chart_id].edges.push(e)
    }
  }
  const charts = Object.values(byChart)

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. SUN SIGN SHARING — do family members share sun signs more than chance?
  // ═══════════════════════════════════════════════════════════════════════════
  const sharedSuns = []
  for (const chart of charts) {
    const sunGroups = {}
    for (const m of chart.members) {
      if (m.sun_sign) {
        if (!sunGroups[m.sun_sign]) sunGroups[m.sun_sign] = []
        sunGroups[m.sun_sign].push(m.name)
      }
    }
    for (const [sign, names] of Object.entries(sunGroups)) {
      if (names.length >= 2) sharedSuns.push({ family: chart.title, sign, count: names.length, members: names })
    }
  }
  sharedSuns.sort((a, b) => b.count - a.count)

  const sunFamilySizes = charts.map(c => c.members.filter(m => m.sun_sign).length).filter(n => n >= 2)
  const familiesWithSharedSun = new Set(sharedSuns.map(s => s.family)).size
  let observedSunPairs = 0
  for (const s of sharedSuns) observedSunPairs += s.count * (s.count - 1) / 2
  let expectedSunPairs = 0
  for (const n of sunFamilySizes) expectedSunPairs += (n * (n - 1) / 2) * (1 / 12)
  expectedSunPairs = Math.round(expectedSunPairs * 10) / 10

  // Normalized: average sharing rate per family (each family weighted equally)
  let sunShareRatePerFamily = 0
  for (const chart of charts) {
    const n = chart.members.filter(m => m.sun_sign).length
    if (n < 2) continue
    const pairs = n * (n - 1) / 2
    let sharedPairsInChart = 0
    const groups = {}
    for (const m of chart.members) { if (m.sun_sign) { groups[m.sun_sign] = (groups[m.sun_sign] || 0) + 1 } }
    for (const cnt of Object.values(groups)) if (cnt >= 2) sharedPairsInChart += cnt * (cnt - 1) / 2
    sunShareRatePerFamily += sharedPairsInChart / pairs // fraction of pairs that share, for this family
  }
  const avgSunShareRate = sunFamilySizes.length ? Math.round(sunShareRatePerFamily / sunFamilySizes.length * 1000) / 10 : 0
  const expectedSunShareRate = Math.round(1 / 12 * 1000) / 10 // 8.3%

  const sunRatio = expectedSunPairs > 0 ? Math.round(observedSunPairs / expectedSunPairs * 10) / 10 : null
  const sunSharingStats = {
    familiesWithSharing: familiesWithSharedSun, totalFamilies: sunFamilySizes.length,
    observedRate: sunFamilySizes.length ? Math.round(familiesWithSharedSun / sunFamilySizes.length * 1000) / 10 : 0,
    expectedRate: sunFamilySizes.length ? Math.round(sunFamilySizes.reduce((s, n) => s + birthdayProbSharing(n, 12), 0) / sunFamilySizes.length * 1000) / 10 : 0,
    observedPairs: observedSunPairs, expectedPairs: expectedSunPairs,
    ratio: sunRatio,
    normalizedRate: avgSunShareRate, expectedNormalizedRate: expectedSunShareRate,
    confidence: assessConfidence(sunRatio ?? 1, sunFamilySizes.length),
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. MOON SIGN SHARING — do family members share moon signs?
  // ═══════════════════════════════════════════════════════════════════════════
  const sharedMoons = []
  for (const chart of charts) {
    const moonGroups = {}
    for (const m of chart.members) {
      if (m.moon_sign && m.moon_sign !== 'Unknown') {
        if (!moonGroups[m.moon_sign]) moonGroups[m.moon_sign] = []
        moonGroups[m.moon_sign].push(m.name)
      }
    }
    for (const [moon, names] of Object.entries(moonGroups)) {
      if (names.length >= 2) sharedMoons.push({ family: chart.title, moonSign: moon, count: names.length, members: names })
    }
  }
  sharedMoons.sort((a, b) => b.count - a.count)

  const moonFamilySizes = charts.map(c => c.members.filter(m => m.moon_sign && m.moon_sign !== 'Unknown').length).filter(n => n >= 2)
  const familiesWithSharedMoon = new Set(sharedMoons.map(sm => sm.family)).size
  let observedMoonPairs = 0
  for (const sm of sharedMoons) observedMoonPairs += sm.count * (sm.count - 1) / 2
  let expectedMoonPairs = 0
  for (const n of moonFamilySizes) expectedMoonPairs += (n * (n - 1) / 2) * (1 / 12)
  expectedMoonPairs = Math.round(expectedMoonPairs * 10) / 10

  // Normalized: per-family average moon sharing rate
  let moonShareRatePerFamily = 0
  for (const chart of charts) {
    const ms = chart.members.filter(m => m.moon_sign && m.moon_sign !== 'Unknown')
    const n = ms.length
    if (n < 2) continue
    const pairs = n * (n - 1) / 2
    const groups = {}
    for (const m of ms) groups[m.moon_sign] = (groups[m.moon_sign] || 0) + 1
    let sharedInChart = 0
    for (const cnt of Object.values(groups)) if (cnt >= 2) sharedInChart += cnt * (cnt - 1) / 2
    moonShareRatePerFamily += sharedInChart / pairs
  }
  const avgMoonShareRate = moonFamilySizes.length ? Math.round(moonShareRatePerFamily / moonFamilySizes.length * 1000) / 10 : 0

  const moonRatio = expectedMoonPairs > 0 ? Math.round(observedMoonPairs / expectedMoonPairs * 10) / 10 : null
  const moonSharingStats = {
    familiesWithSharing: familiesWithSharedMoon, totalFamilies: moonFamilySizes.length,
    observedRate: moonFamilySizes.length ? Math.round(familiesWithSharedMoon / moonFamilySizes.length * 1000) / 10 : 0,
    expectedRate: moonFamilySizes.length ? Math.round(moonFamilySizes.reduce((s, n) => s + birthdayProbSharing(n, 12), 0) / moonFamilySizes.length * 1000) / 10 : 0,
    observedPairs: observedMoonPairs, expectedPairs: expectedMoonPairs,
    ratio: moonRatio,
    normalizedRate: avgMoonShareRate, expectedNormalizedRate: Math.round(1 / 12 * 1000) / 10,
    confidence: assessConfidence(moonRatio ?? 1, moonFamilySizes.length),
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. ELEMENT CONCENTRATION — do families cluster around one element?
  // ═══════════════════════════════════════════════════════════════════════════
  // For each family: what % of members share the dominant element?
  // Random expectation: dominant element in a family of n would average ~25% + variance
  const elementConcentration = []
  let totalDominantPct = 0, totalExpectedDominantPct = 0
  for (const chart of charts) {
    if (chart.members.length < 3) continue
    const elCounts = { Fire: 0, Earth: 0, Air: 0, Water: 0 }
    for (const m of chart.members) if (m.sun_element && elCounts[m.sun_element] != null) elCounts[m.sun_element]++
    const n = chart.members.filter(m => m.sun_element).length
    if (n < 3) continue
    const dominant = Object.entries(elCounts).sort((a, b) => b[1] - a[1])[0]
    const dominantPct = Math.round(dominant[1] / n * 100)
    // Expected: for n people and 4 elements, expected max proportion via order statistics
    // Approximation: E[max of 4 multinomial(n, 1/4)] ~ 25% + correction
    // Simpler: probability any element has k of n people = C(n,k) * (1/4)^k * (3/4)^(n-k)
    // Expected max count ~ n/4 + sqrt(3n/16) (normal approx)
    const expectedMaxCount = n / 4 + Math.sqrt(3 * n / 16)
    const expectedDominantPct = Math.round(expectedMaxCount / n * 100)
    elementConcentration.push({ family: chart.title, element: dominant[0], count: dominant[1], total: n, pct: dominantPct, expectedPct: expectedDominantPct })
    totalDominantPct += dominantPct
    totalExpectedDominantPct += expectedDominantPct
  }
  elementConcentration.sort((a, b) => b.pct - a.pct)
  const avgDominantPct = elementConcentration.length ? Math.round(totalDominantPct / elementConcentration.length) : 0
  const avgExpectedDominantPct = elementConcentration.length ? Math.round(totalExpectedDominantPct / elementConcentration.length) : 0

  const elRatio = avgExpectedDominantPct > 0 ? Math.round(avgDominantPct / avgExpectedDominantPct * 10) / 10 : null
  const elementStats = {
    families: elementConcentration,
    avgDominantPct, avgExpectedDominantPct,
    ratio: elRatio,
    confidence: assessConfidence(elRatio ?? 1, elementConcentration.length),
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. OPPOSITE SIGN AXES — do families attract along polarity lines?
  // ═══════════════════════════════════════════════════════════════════════════
  let observedOpposites = 0, totalPairsForOpp = 0
  const oppositeDetail = []
  for (const chart of charts) {
    const members = chart.members.filter(m => m.sun_sign)
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        totalPairsForOpp++
        if (OPPOSITE_SIGNS[members[i].sun_sign] === members[j].sun_sign) {
          observedOpposites++
          const axis = [members[i].sun_sign, members[j].sun_sign].sort().join('–')
          oppositeDetail.push({ family: chart.title, personA: members[i].name, personB: members[j].name, axis })
        }
      }
    }
  }
  // Random expectation: each pair has 1/12 chance of being opposite (1 opposite out of 12 possible for any sign)
  // Actually: given person A's sign, prob person B is their opposite = 1/12
  const expectedOpposites = Math.round(totalPairsForOpp / 12 * 10) / 10
  // Normalize: per-family opposite rate (each family weighted equally)
  let oppRatePerFamily = 0, oppFamilyCount = 0
  for (const chart of charts) {
    const ms = chart.members.filter(m => m.sun_sign)
    if (ms.length < 2) continue
    oppFamilyCount++
    const pairs = ms.length * (ms.length - 1) / 2
    let oppInChart = 0
    for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) {
      if (OPPOSITE_SIGNS[ms[i].sun_sign] === ms[j].sun_sign) oppInChart++
    }
    oppRatePerFamily += oppInChart / pairs
  }
  const oppRatio = expectedOpposites > 0 ? Math.round(observedOpposites / expectedOpposites * 10) / 10 : null
  const oppositeStats = {
    observed: observedOpposites, expected: expectedOpposites, totalPairs: totalPairsForOpp,
    ratio: oppRatio,
    normalizedRate: oppFamilyCount ? Math.round(oppRatePerFamily / oppFamilyCount * 1000) / 10 : 0,
    expectedNormalizedRate: Math.round(1 / 12 * 1000) / 10,
    detail: oppositeDetail,
    confidence: assessConfidence(oppRatio ?? 1, oppFamilyCount),
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. MODALITY CLUSTERING — do families group by cardinal/fixed/mutable?
  // ═══════════════════════════════════════════════════════════════════════════
  const modalityConcentration = []
  let totalModalDomPct = 0, totalExpModalDomPct = 0
  for (const chart of charts) {
    if (chart.members.length < 3) continue
    const modCounts = { Cardinal: 0, Fixed: 0, Mutable: 0 }
    for (const m of chart.members) {
      const mod = SIGN_TO_MODALITY[m.sun_sign]
      if (mod) modCounts[mod]++
    }
    const n = chart.members.filter(m => SIGN_TO_MODALITY[m.sun_sign]).length
    if (n < 3) continue
    const dominant = Object.entries(modCounts).sort((a, b) => b[1] - a[1])[0]
    const domPct = Math.round(dominant[1] / n * 100)
    // 3 modalities: expected dominant ~ n/3 + sqrt(2n/9)
    const expectedMax = n / 3 + Math.sqrt(2 * n / 9)
    const expPct = Math.round(expectedMax / n * 100)
    modalityConcentration.push({ family: chart.title, modality: dominant[0], count: dominant[1], total: n, pct: domPct, expectedPct: expPct })
    totalModalDomPct += domPct
    totalExpModalDomPct += expPct
  }
  modalityConcentration.sort((a, b) => b.pct - a.pct)
  const avgModalDomPct = modalityConcentration.length ? Math.round(totalModalDomPct / modalityConcentration.length) : 0
  const avgExpModalDomPct = modalityConcentration.length ? Math.round(totalExpModalDomPct / modalityConcentration.length) : 0

  const modRatio = avgExpModalDomPct > 0 ? Math.round(avgModalDomPct / avgExpModalDomPct * 10) / 10 : null
  const modalityStats = {
    families: modalityConcentration,
    avgDominantPct: avgModalDomPct, avgExpectedDominantPct: avgExpModalDomPct,
    ratio: modRatio,
    confidence: assessConfidence(modRatio ?? 1, modalityConcentration.length),
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. DEGREE CLUSTERING — are family members' sun positions close?
  // ═══════════════════════════════════════════════════════════════════════════
  const degreeClusters = []
  let totalPairsWithDegrees = 0
  for (const chart of charts) {
    const withDeg = chart.members.filter(m => m.sun_degree != null && m.sun_sign && SIGN_OFFSETS[m.sun_sign] != null)
    totalPairsWithDegrees += withDeg.length * (withDeg.length - 1) / 2
    for (let i = 0; i < withDeg.length; i++) {
      for (let j = i + 1; j < withDeg.length; j++) {
        const a = withDeg[i], b = withDeg[j]
        const absA = SIGN_OFFSETS[a.sun_sign] + a.sun_degree
        const absB = SIGN_OFFSETS[b.sun_sign] + b.sun_degree
        const gap = Math.min(Math.abs(absA - absB), 360 - Math.abs(absA - absB))
        if (gap <= 5) {
          degreeClusters.push({
            family: chart.title, personA: a.name, personB: b.name,
            signA: a.sun_sign, degA: a.sun_degree, signB: b.sun_sign, degB: b.sun_degree, gap,
          })
        }
      }
    }
  }
  degreeClusters.sort((a, b) => a.gap - b.gap)
  const expectedDegClusters = expectedDegreePairs(totalPairsWithDegrees, 5)
  const degRatio = expectedDegClusters > 0 ? Math.round(degreeClusters.length / expectedDegClusters * 10) / 10 : null
  // Count families that contributed degree data
  const familiesWithDegreeData = charts.filter(c => c.members.some(m => m.sun_degree != null && m.sun_sign && SIGN_OFFSETS[m.sun_sign] != null)).length
  const degreeStats = {
    observedPairs: degreeClusters.length,
    expectedPairs: Math.round(expectedDegClusters * 10) / 10,
    totalPairsAnalyzed: totalPairsWithDegrees,
    ratio: degRatio,
    confidence: assessConfidence(degRatio ?? 1, familiesWithDegreeData),
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. TOP SIGN PAIRINGS — which sign combos appear most within families?
  // ═══════════════════════════════════════════════════════════════════════════
  // Normalized: weight each family equally by using per-family fractions
  const normalizedPairCounts = {}
  let familiesForPairs = 0
  for (const chart of charts) {
    const ms = chart.members.filter(m => m.sun_sign)
    if (ms.length < 2) continue
    familiesForPairs++
    const totalInChart = ms.length * (ms.length - 1) / 2
    for (let i = 0; i < ms.length; i++) {
      for (let j = i + 1; j < ms.length; j++) {
        const a = ms[i].sun_sign, b = ms[j].sun_sign
        const key = a <= b ? `${a} + ${b}` : `${b} + ${a}`
        // Each family contributes weight 1/totalInChart per pair, so each family totals 1.0
        normalizedPairCounts[key] = (normalizedPairCounts[key] || 0) + (1 / totalInChart)
      }
    }
  }
  // Expected: if random, each same-sign pair gets 1/144 weight per family, diff-sign gets 2/144
  const topPairings = Object.entries(normalizedPairCounts)
    .map(([pair, weightedCount]) => {
      const [a, b] = pair.split(' + ')
      const isSame = a === b
      const expectedWeight = isSame ? familiesForPairs / 144 : familiesForPairs * 2 / 144
      const ratio = expectedWeight > 0 ? Math.round(weightedCount / expectedWeight * 10) / 10 : null
      return { pair, count: Math.round(weightedCount * 100) / 100, expected: Math.round(expectedWeight * 100) / 100, ratio }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. SHARED PLANETARY PLACEMENTS — invisible threads only visible through charts
  // ═══════════════════════════════════════════════════════════════════════════
  const PLANETS = [
    { key: 'venus_sign', label: 'Venus', desc: 'love language' },
    { key: 'mars_sign', label: 'Mars', desc: 'drive & conflict style' },
    { key: 'mercury_sign', label: 'Mercury', desc: 'communication style' },
    { key: 'jupiter_sign', label: 'Jupiter', desc: 'growth & luck' },
    { key: 'saturn_sign', label: 'Saturn', desc: 'lessons & discipline' },
  ]
  const planetarySharing = []
  for (const chart of charts) {
    for (const planet of PLANETS) {
      const groups = {}
      for (const m of chart.members) {
        const sign = m[planet.key]
        if (sign) {
          if (!groups[sign]) groups[sign] = []
          groups[sign].push(m.name)
        }
      }
      for (const [sign, names] of Object.entries(groups)) {
        if (names.length >= 2) {
          planetarySharing.push({ family: chart.title, planet: planet.label, desc: planet.desc, sign, count: names.length, members: names })
        }
      }
    }
  }
  planetarySharing.sort((a, b) => b.count - a.count || a.planet.localeCompare(b.planet))

  // Stats: total shared planetary pairs observed vs expected (1/12 per planet per pair)
  let observedPlanetPairs = 0
  for (const ps of planetarySharing) observedPlanetPairs += ps.count * (ps.count - 1) / 2
  let expectedPlanetPairs = 0
  for (const chart of charts) {
    const n = chart.members.length
    // For each of 5 planets, expected shared pairs = C(n,2) * 1/12
    expectedPlanetPairs += 5 * (n * (n - 1) / 2) * (1 / 12)
  }
  expectedPlanetPairs = Math.round(expectedPlanetPairs * 10) / 10
  const planetRatio = expectedPlanetPairs > 0 ? Math.round(observedPlanetPairs / expectedPlanetPairs * 10) / 10 : null
  const planetaryStats = {
    observedPairs: observedPlanetPairs, expectedPairs: expectedPlanetPairs,
    ratio: planetRatio,
    totalInstances: planetarySharing.length,
    confidence: assessConfidence(planetRatio ?? 1, charts.length),
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. THE COMPLEMENT CHILD — did the newest family member fill a gap?
  // ═══════════════════════════════════════════════════════════════════════════
  // For families with 3+ members, sort by birthdate, then check: did the youngest
  // child bring an element or modality the family was missing?
  const complementChildren = []
  for (const chart of charts) {
    if (chart.members.length < 3) continue
    const sorted = [...chart.members].filter(m => m.birthdate && m.sun_element).sort((a, b) => a.birthdate.localeCompare(b.birthdate))
    if (sorted.length < 3) continue

    // Check last 1-2 members (the youngest) for element/modality they introduced
    for (let idx = sorted.length - 1; idx >= Math.max(1, sorted.length - 2); idx--) {
      const child = sorted[idx]
      const olderMembers = sorted.slice(0, idx)
      if (olderMembers.length < 2) continue

      const existingElements = new Set(olderMembers.map(m => m.sun_element).filter(Boolean))
      const existingModalities = new Set(olderMembers.map(m => SIGN_TO_MODALITY[m.sun_sign]).filter(Boolean))

      const childElement = child.sun_element
      const childModality = SIGN_TO_MODALITY[child.sun_sign]

      const newElement = childElement && !existingElements.has(childElement) ? childElement : null
      const newModality = childModality && !existingModalities.has(childModality) ? childModality : null

      // Also check: did child bring a new planet sign the family lacked?
      const newPlanets = []
      for (const planet of PLANETS) {
        const childSign = child[planet.key]
        if (!childSign) continue
        const existingSigns = new Set(olderMembers.map(m => m[planet.key]).filter(Boolean))
        if (!existingSigns.has(childSign)) {
          newPlanets.push({ planet: planet.label, sign: childSign })
        }
      }

      if (newElement || newModality || newPlanets.length >= 2) {
        complementChildren.push({
          family: chart.title, child: child.name, sign: child.sun_sign,
          newElement, newModality,
          newPlanets: newPlanets.slice(0, 3), // cap to keep readable
          familySizeBefore: olderMembers.length,
          elementsBefore: [...existingElements].sort(),
        })
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA QUALITY — flag unrealistic charts
  // ═══════════════════════════════════════════════════════════════════════════
  const today = new Date().toISOString().slice(0, 10)
  const suspects = []
  for (const chart of charts) {
    const flags = []
    const nodeMap = chart.nodeMap ?? {}
    const edges = chart.edges ?? []

    for (const m of chart.members) {
      if (m.birthdate > today) flags.push({ type: 'future', detail: `${m.name} has a future birthdate (${m.birthdate})` })
      if (m.birthdate < '1900-01-01') flags.push({ type: 'ancient', detail: `${m.name} born before 1900 (${m.birthdate})` })
    }

    // Use edges + birthdates to detect impossible relationships
    // Edge types are NOT reliable indicators of relationship type (smoothstep is used
    // for both parent-child and spouse connections). Instead, use birthdate heuristics:
    // - If source is 12+ years older than target → likely parent-child (valid)
    // - If source and target are within ~15 years → likely spouses/same-gen (valid)
    // - Flag: source is younger than target by 12+ years (backwards parent-child)
    // - Flag: any connected pair with 60+ year gap
    for (const e of edges) {
      const a = nodeMap[e.source]
      const b = nodeMap[e.target]
      if (!a?.birthdate || !b?.birthdate) continue
      const yearA = parseInt(a.birthdate.slice(0, 4), 10)
      const yearB = parseInt(b.birthdate.slice(0, 4), 10)
      const gap = Math.abs(yearA - yearB)

      // Looks like parent-child (big age gap) — check if plausible
      if (gap >= 12) {
        const older = yearA < yearB ? a : b
        const younger = yearA < yearB ? b : a
        const olderYear = Math.min(yearA, yearB)
        const youngerYear = Math.max(yearA, yearB)
        // Parent must be at least 12 at child's birth
        if (youngerYear - olderYear < 12) {
          flags.push({ type: 'parent-too-young', detail: `${older.name} → ${younger.name}: only ${youngerYear - olderYear} year age gap` })
        }
      }

      // Extreme age gap for any relationship
      if (gap > 60) {
        flags.push({ type: 'age-gap', detail: `${a.name} and ${b.name}: ${gap} year age gap` })
      }
    }

    if (flags.length > 0) {
      suspects.push({ chartId: chart.members[0]?.chart_id, title: chart.title, flags })
    }
  }

  return NextResponse.json({
    overview, sharedSuns, sharedMoons, degreeClusters, topPairings,
    elementConcentration: elementStats, modalityConcentration: modalityStats, opposites: oppositeStats,
    planetarySharing: { instances: planetarySharing, stats: planetaryStats },
    complementChildren, suspects,
    significance: { sunSharing: sunSharingStats, moonSharing: moonSharingStats, degreeClustering: degreeStats },
  })
}

// ── Route handlers ──────────────────────────────────────────────────────────

const ROUTES = {
  login: handleLogin, charts: handleCharts, stats: handleStats,
  devices: handleDevices, 'trees-per-day': handleTreesPerDay,
  engagement: handleEngagement, funnel: handleFunnel, 'paywall-config': handlePaywallConfig,
  'paywall-config-set': handlePaywallConfigSet, purchases: handlePurchases,
  'mark-test': handleMarkTest, 'mark-chart-test': handleMarkChartTest,
  'celestial-users': handleCelestialUsers,
  'downgrade-user': handleDowngradeUser,
  research: handleResearch,
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const fn = ROUTES[action]
    if (!fn) return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    return await fn(request)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const fn = ROUTES[action]
    if (!fn) return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    return await fn(request)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
