/**
 * groupCurrent.js — Group-level transit analysis for "The Current"
 *
 * Pure functions — no Celestine dependency.
 * Takes the output of calcGroupTransits() and computes group patterns:
 * dominant planet, shared storms, natal targets, mood, rare events.
 */

import { getChapter, hasChapter } from '../../utils/transitChapters.js'

// Planet weight for sorting (heavier = slower = more significant)
const PLANET_WEIGHT = { Pluto: 5, Neptune: 4, Uranus: 3, Saturn: 2, Jupiter: 1 }

/**
 * Filter transit arrays to only include transits with curated chapter copy.
 * This is the discernment layer: if we didn't write a chapter for it,
 * it's not impactful enough to surface in group analysis.
 */
function filterCurated(memberTransits) {
  const filtered = {}
  for (const [id, transits] of Object.entries(memberTransits)) {
    filtered[id] = transits.filter(t =>
      hasChapter(t.transitingPlanet, t.aspect, t.natalPlanet)
    )
  }
  return filtered
}

// ── Individual analysis helpers ─────────────────────────────────────────────

/**
 * Find the dominant transiting planet across the group.
 * Counts total transit occurrences per planet, breaks ties by unique member count.
 */
export function findDominantPlanet(memberTransits) {
  const counts = {} // { planet: { transitCount, members: Set, glyph } }

  let totalMembers = 0
  for (const [memberId, transits] of Object.entries(memberTransits)) {
    totalMembers++
    for (const t of transits) {
      if (!counts[t.transitingPlanet]) {
        counts[t.transitingPlanet] = { transitCount: 0, members: new Set(), glyph: t.transitingGlyph }
      }
      counts[t.transitingPlanet].transitCount++
      counts[t.transitingPlanet].members.add(memberId)
    }
  }

  const sorted = Object.entries(counts)
    .map(([planet, data]) => ({
      planet,
      glyph: data.glyph,
      transitCount: data.transitCount,
      memberCount: data.members.size,
      totalMembers,
    }))
    .sort((a, b) => {
      // Sort by member count first, then transit count, then planet weight
      if (b.memberCount !== a.memberCount) return b.memberCount - a.memberCount
      if (b.transitCount !== a.transitCount) return b.transitCount - a.transitCount
      return (PLANET_WEIGHT[b.planet] ?? 0) - (PLANET_WEIGHT[a.planet] ?? 0)
    })

  return sorted[0] ?? null
}

/**
 * Find shared storms — when 2+ members are being hit by the same transiting
 * planet on the same natal planet (ignoring aspect type).
 *
 * Saturn-square-Sun and Saturn-conjunction-Sun are both "Saturn testing identity."
 */
export function findSharedStorms(memberTransits, memberNames = {}, memberAges = {}) {
  const storms = {} // key: "transitingPlanet:natalPlanet"

  for (const [memberId, transits] of Object.entries(memberTransits)) {
    for (const t of transits) {
      const key = `${t.transitingPlanet}:${t.natalPlanet}`
      if (!storms[key]) {
        storms[key] = {
          transitingPlanet: t.transitingPlanet,
          transitingGlyph:  t.transitingGlyph,
          natalPlanet:      t.natalPlanet,
          natalGlyph:       t.natalGlyph,
          members:          [],
        }
      }
      const age = memberAges[memberId] ?? 99
      const chapter = getChapter(t.transitingPlanet, t.aspect, t.natalPlanet, age)
      storms[key].members.push({
        id:     memberId,
        name:   memberNames[memberId] ?? memberId,
        age:    age < 13 ? age : null,
        aspect: t.aspect,
        aspectSymbol: t.aspectSymbol,
        orb:    t.orb,
        phase:  t.phase,
        exact:  t.exact,
        title:  chapter.title,
      })
    }
  }

  return Object.values(storms)
    .filter(s => s.members.length >= 2)
    .sort((a, b) => {
      if (b.members.length !== a.members.length) return b.members.length - a.members.length
      return (PLANET_WEIGHT[b.transitingPlanet] ?? 0) - (PLANET_WEIGHT[a.transitingPlanet] ?? 0)
    })
}

/**
 * Count which natal planets are getting hit most across the group.
 */
export function findNatalTargets(memberTransits) {
  const counts = {} // { planet: { count, glyph } }

  for (const transits of Object.values(memberTransits)) {
    for (const t of transits) {
      if (!counts[t.natalPlanet]) {
        counts[t.natalPlanet] = { count: 0, glyph: t.natalGlyph }
      }
      counts[t.natalPlanet].count++
    }
  }

  return Object.entries(counts)
    .map(([planet, data]) => ({ planet, glyph: data.glyph, count: data.count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Calculate the group mood: expansion vs pressure, applying vs separating,
 * and retrograde count.
 */
export function calcMood(memberTransits) {
  let expansion = 0
  let pressure = 0
  let applying = 0
  let separating = 0
  let retrograde = 0
  let total = 0
  const planets = {} // per-planet transit count

  for (const transits of Object.values(memberTransits)) {
    for (const t of transits) {
      total++
      if (t.transitingPlanet === 'Jupiter') expansion++
      else pressure++

      planets[t.transitingPlanet] = (planets[t.transitingPlanet] ?? 0) + 1

      if (t.phase === 'applying') applying++
      else separating++

      if (t.transitingRetrograde) retrograde++
    }
  }

  return { expansion, pressure, applying, separating, retrograde, total, planets }
}

/**
 * Find rare/once-in-a-lifetime transits active for any member.
 */
export function findRareTransits(memberTransits, memberNames = {}, memberAges = {}) {
  const rare = []

  for (const [memberId, transits] of Object.entries(memberTransits)) {
    for (const t of transits) {
      const age = memberAges[memberId] ?? 99
      const chapter = getChapter(t.transitingPlanet, t.aspect, t.natalPlanet, age)
      if (chapter.rarity === 'rare' || chapter.rarity === 'once') {
        rare.push({
          memberId,
          memberName: memberNames[memberId] ?? memberId,
          age: age < 13 ? age : null,
          transit: t,
          rarity: chapter.rarity,
          title: chapter.title,
          description: chapter.description,
          frequency: chapter.frequency,
        })
      }
    }
  }

  // Sort: 'once' before 'rare', then by tightest orb
  return rare.sort((a, b) => {
    if (a.rarity !== b.rarity) return a.rarity === 'once' ? -1 : 1
    return a.transit.orb - b.transit.orb
  })
}

/**
 * Find transits at exact peak (orb < 0.5°).
 */
export function findExactTransits(memberTransits, memberNames = {}) {
  const exact = []

  for (const [memberId, transits] of Object.entries(memberTransits)) {
    for (const t of transits) {
      if (t.exact) {
        const chapter = getChapter(t.transitingPlanet, t.aspect, t.natalPlanet)
        exact.push({
          memberId,
          memberName: memberNames[memberId] ?? memberId,
          transit: t,
          title: chapter.title,
        })
      }
    }
  }

  return exact.sort((a, b) => a.transit.orb - b.transit.orb)
}

/**
 * Find the member carrying the most active transits.
 */
export function findMostActive(memberTransits, memberNames = {}) {
  let most = null

  for (const [memberId, transits] of Object.entries(memberTransits)) {
    if (!most || transits.length > most.count) {
      most = { id: memberId, name: memberNames[memberId] ?? memberId, count: transits.length }
    }
  }

  return most
}

/**
 * Find members with zero active transits.
 */
export function findQuietMembers(memberTransits, memberNames = {}) {
  return Object.entries(memberTransits)
    .filter(([, transits]) => transits.length === 0)
    .map(([id]) => ({ id, name: memberNames[id] ?? id }))
}

// ── Quick transit analysis (Venus & Mars as transiting bodies) ───────────────

const QUICK_ASPECT_VERBS = {
  conjunction: 'meeting',
  opposition:  'opposing',
  square:      'challenging',
}

const QUICK_BLURBS = {
  'Venus:Sun':  'social warmth and self-expression',
  'Venus:Moon': 'emotional ease and comfort',
  'Venus:Mars': 'attraction and creative spark',
  'Mars:Sun':   'drive and assertiveness',
  'Mars:Moon':  'emotional intensity and restlessness',
  'Mars:Venus': 'passion and desire',
}

/**
 * Analyze quick Venus/Mars transits for the group.
 * Returns a flat list of activations sorted by orb, with blurbs.
 */
export function analyzeQuickTransits(quickTransits, memberNames = {}, memberAges = {}) {
  const activations = []

  for (const [memberId, transits] of Object.entries(quickTransits)) {
    for (const t of transits) {
      const blurbKey = `${t.transitingPlanet}:${t.natalPlanet}`
      activations.push({
        memberId,
        memberName: memberNames[memberId] ?? memberId,
        age: memberAges[memberId] ?? null,
        transit: t,
        verb: QUICK_ASPECT_VERBS[t.aspect] ?? t.aspect,
        blurb: QUICK_BLURBS[blurbKey] ?? null,
      })
    }
  }

  return activations.sort((a, b) => a.transit.orb - b.transit.orb)
}

// ── Main entry point ────────────────────────────────────────────────────────

/**
 * Run all group-level analysis on transit data.
 *
 * @param {Record<string, Transit[]>} memberTransits — output of calcGroupTransits()
 * @param {Record<string, string>}    memberNames    — { memberId: displayName }
 * @param {Record<string, Transit[]>} [quickTransits] — output of calcGroupQuickTransits()
 * @param {Record<string, number>}    [memberAges]   — { memberId: age }
 * @returns {GroupAnalysis}
 */
export function analyzeGroupTransits(memberTransits, memberNames = {}, quickTransits = null, memberAges = {}) {
  // Only analyze transits that have curated chapter copy.
  // This filters out noise (trines, sextiles, minor natal targets).
  const curated = filterCurated(memberTransits)

  const result = {
    dominantPlanet:  findDominantPlanet(curated),
    natalTargets:    findNatalTargets(curated),
    sharedStorms:    findSharedStorms(curated, memberNames, memberAges),
    mood:            calcMood(curated),
    rareTransits:    findRareTransits(curated, memberNames, memberAges),
    exactTransits:   findExactTransits(curated, memberNames),
    mostActive:      findMostActive(curated, memberNames),
    quietMembers:    findQuietMembers(curated, memberNames),
  }

  if (quickTransits) {
    result.quickHits = analyzeQuickTransits(quickTransits, memberNames, memberAges)
  }

  return result
}
