import { describe, it, expect } from 'vitest'
import {
  toAbsolute,
  angularDistance,
  findAspect,
  getAllPlacements,
  collectiveElementMap,
  findHotspots,
  findGaps,
  deriveRoles,
  saturnLines,
  jupiterGifts,
  allPlanetsBySign,
  findBridgePerson,
  findGroupAspects,
  ELEMENTS,
  SIGN_ORDER,
} from './groupChartCalc.js'

// ── Fixtures ──────────────────────────────────────────────────────────────────

/**
 * Build a React Flow-style node with astrology data.
 * `planets` values are [sign, degree] tuples, e.g. { sun: ['Aries', 10] }.
 * `extra` is merged into node.data (birthTime, ingressWarnings, element, ...).
 */
function member(id, planets = {}, extra = {}) {
  const data = { name: id, ...extra }
  if (planets.sun) { data.sign = planets.sun[0]; data.sunDegree = planets.sun[1] }
  if (planets.moon) { data.moonSign = planets.moon[0]; data.moonDegree = planets.moon[1] }
  const inner = {}
  for (const p of ['mercury', 'venus', 'mars']) {
    if (planets[p]) inner[p] = { sign: planets[p][0], degree: planets[p][1] }
  }
  if (Object.keys(inner).length) data.innerPlanets = inner
  const outer = {}
  for (const p of ['jupiter', 'saturn']) {
    if (planets[p]) outer[p] = { sign: planets[p][0], degree: planets[p][1] }
  }
  if (Object.keys(outer).length) data.outerPlanets = outer
  return { id, data }
}

// A member with all 7 supported planets, one in each of 7 distinct signs.
const FULL_MEMBER = member('full', {
  sun:     ['Aries', 10],       // Fire,  abs 10
  moon:    ['Cancer', 5],       // Water, abs 95
  mercury: ['Gemini', 20],      // Air,   abs 80
  venus:   ['Taurus', 15],      // Earth, abs 45
  mars:    ['Leo', 0],          // Fire,  abs 120
  jupiter: ['Sagittarius', 12], // Fire,  abs 252
  saturn:  ['Capricorn', 28],   // Earth, abs 298
})

// ── toAbsolute ────────────────────────────────────────────────────────────────

describe('toAbsolute', () => {
  it('converts sign + degree to absolute zodiac position', () => {
    expect(toAbsolute('Aries', 0)).toBe(0)
    expect(toAbsolute('Taurus', 15)).toBe(45)
    expect(toAbsolute('Pisces', 29.5)).toBe(359.5)
  })

  it('returns null for unknown sign or missing degree', () => {
    expect(toAbsolute('NotASign', 10)).toBeNull()
    expect(toAbsolute('Aries', null)).toBeNull()
    expect(toAbsolute('Aries', undefined)).toBeNull()
  })

  it('treats degree 0 as valid (not falsy-trapped)', () => {
    expect(toAbsolute('Leo', 0)).toBe(120)
  })
})

// ── angularDistance ───────────────────────────────────────────────────────────

describe('angularDistance', () => {
  it('returns shortest arc between two positions, including wraparound', () => {
    expect(angularDistance(10, 40)).toBe(30)
    expect(angularDistance(350, 10)).toBe(20) // across the Pisces→Aries boundary
    expect(angularDistance(0, 180)).toBe(180)
    expect(angularDistance(90, 90)).toBe(0)
  })

  it('returns null when either position is null', () => {
    expect(angularDistance(null, 40)).toBeNull()
    expect(angularDistance(10, null)).toBeNull()
  })
})

// ── findAspect ────────────────────────────────────────────────────────────────

describe('findAspect', () => {
  it('detects a conjunction within orb, with separation and deviation', () => {
    const asp = findAspect(10, 15)
    expect(asp.name).toBe('conjunction')
    expect(asp.separation).toBe(5)
    expect(asp.deviation).toBe(5)
  })

  it('detects an exact trine and an opposition', () => {
    expect(findAspect(0, 120).name).toBe('trine')
    expect(findAspect(0, 180).name).toBe('opposition')
  })

  it('respects a tighter orb passed explicitly', () => {
    expect(findAspect(0, 5, 2)).toBeNull()       // 5° apart, orb 2 → no conjunction
    expect(findAspect(0, 5, 6)?.name).toBe('conjunction')
  })

  it('returns null when no major aspect is within orb', () => {
    expect(findAspect(0, 40)).toBeNull() // 40° matches nothing within default orb 8
    expect(findAspect(null, 100)).toBeNull()
  })

  it('treats exactly-at-orb separation as a match (boundary)', () => {
    expect(findAspect(0, 8).name).toBe('conjunction') // deviation 8 ≤ orb 8
  })
})

// ── getAllPlacements ──────────────────────────────────────────────────────────

describe('getAllPlacements', () => {
  it('extracts all 7 planets with sign, element, and absolute position', () => {
    const placements = getAllPlacements(FULL_MEMBER)
    expect(placements).toHaveLength(7)
    const byPlanet = Object.fromEntries(placements.map(p => [p.planet, p]))
    expect(Object.keys(byPlanet).sort()).toEqual(
      ['jupiter', 'mars', 'mercury', 'moon', 'saturn', 'sun', 'venus'],
    )
    expect(byPlanet.sun).toMatchObject({ sign: 'Aries', degree: 10, element: 'Fire', absPos: 10, uncertain: false })
    expect(byPlanet.moon.element).toBe('Water')
    expect(byPlanet.saturn.absPos).toBe(298)
  })

  it('returns [] for a node without data', () => {
    expect(getAllPlacements({ id: 'x' })).toEqual([])
  })

  it('skips Unknown signs and missing planet groups', () => {
    const node = member('partial', { sun: ['Virgo', 3] })
    node.data.moonSign = 'Unknown'
    const placements = getAllPlacements(node)
    expect(placements).toHaveLength(1)
    expect(placements[0].planet).toBe('sun')
  })

  it('keeps a placement with missing degree but absPos is null', () => {
    const node = { id: 'nodeg', data: { name: 'nodeg', sign: 'Libra' } }
    const placements = getAllPlacements(node)
    expect(placements).toHaveLength(1)
    expect(placements[0].sign).toBe('Libra')
    expect(placements[0].absPos).toBeNull()
  })

  it('flags ingress-warned planets as uncertain only when birth time is missing', () => {
    const noTime = member('a', { sun: ['Aries', 29], moon: ['Cancer', 0] },
      { ingressWarnings: [{ planet: 'moon' }] })
    const withTime = member('b', { sun: ['Aries', 29], moon: ['Cancer', 0] },
      { ingressWarnings: [{ planet: 'moon' }], birthTime: '14:30' })

    const p1 = Object.fromEntries(getAllPlacements(noTime).map(p => [p.planet, p]))
    expect(p1.moon.uncertain).toBe(true)
    expect(p1.sun.uncertain).toBe(false)

    const p2 = Object.fromEntries(getAllPlacements(withTime).map(p => [p.planet, p]))
    expect(p2.moon.uncertain).toBe(false)
  })
})

// ── collectiveElementMap ──────────────────────────────────────────────────────

describe('collectiveElementMap', () => {
  it('tallies elements across members with per-planet breakdown', () => {
    // FULL_MEMBER: Fire 3 (sun, mars, jupiter), Earth 2 (venus, saturn), Air 1, Water 1
    // B: sun Taurus (Earth), moon Scorpio (Water)
    const b = member('b', { sun: ['Taurus', 1], moon: ['Scorpio', 2] })
    const map = collectiveElementMap([FULL_MEMBER, b])

    expect(map.Fire).toBe(3)
    expect(map.Earth).toBe(3)
    expect(map.Air).toBe(1)
    expect(map.Water).toBe(2)
    expect(map.total).toBe(9)
    expect(map.missing).toEqual([])
    // Fire and Earth tie at 3 — reduce keeps the earlier element (Fire)
    expect(map.dominant).toBe('Fire')
    expect(map.breakdown.Fire).toMatchObject({ sun: 1, mars: 1, jupiter: 1 })
    expect(map.breakdown.Earth).toMatchObject({ sun: 1, venus: 1, saturn: 1 })
  })

  it('applies the onlyPlanets filter', () => {
    const b = member('b', { sun: ['Taurus', 1], moon: ['Scorpio', 2] })
    const map = collectiveElementMap([FULL_MEMBER, b], ['sun'])
    expect(map.total).toBe(2)
    expect(map.Fire).toBe(1)
    expect(map.Earth).toBe(1)
    expect(map.missing.sort()).toEqual(['Air', 'Water'])
  })

  it('excludes uncertain placements from counts', () => {
    const a = member('a', { sun: ['Aries', 29] }, { ingressWarnings: [{ planet: 'sun' }] })
    const map = collectiveElementMap([a])
    expect(map.total).toBe(0)
    expect(map.Fire).toBe(0)
  })

  it('handles empty input: all elements missing, dominant defaults to Fire', () => {
    const map = collectiveElementMap([])
    expect(map.total).toBe(0)
    expect(map.missing).toEqual(['Fire', 'Earth', 'Air', 'Water'])
    expect(map.dominant).toBe('Fire') // documented tie behavior of the reduce
  })
})

// ── findHotspots ──────────────────────────────────────────────────────────────

describe('findHotspots', () => {
  it('finds a cluster of 3+ planets from 2+ people within orb', () => {
    const a = member('a', { sun: ['Leo', 5], moon: ['Leo', 8] })
    const b = member('b', { sun: ['Leo', 10] })
    const spots = findHotspots([a, b])

    expect(spots).toHaveLength(1)
    expect(spots[0].sign).toBe('Leo')
    expect(spots[0].position).toBe('early') // anchor degree 5 ≤ 10
    expect(spots[0].planets).toHaveLength(3)
    expect(spots[0].peopleCount).toBe(2)
    expect(spots[0].description).toBeTruthy()
  })

  it('merges multiple clusters in the same sign into one entry', () => {
    const a = member('a', { sun: ['Leo', 2], moon: ['Leo', 5], venus: ['Leo', 25] })
    const b = member('b', { sun: ['Leo', 3], mars: ['Leo', 22], venus: ['Leo', 27] })
    const spots = findHotspots([a, b])

    expect(spots).toHaveLength(1)
    expect(spots[0].sign).toBe('Leo')
    expect(spots[0].planets).toHaveLength(6)
    expect(spots[0].peopleCount).toBe(2)
  })

  it('detects clusters across the Pisces→Aries wraparound', () => {
    const a = member('a', { sun: ['Pisces', 28], moon: ['Aries', 2] })
    const b = member('b', { sun: ['Aries', 3] })
    const spots = findHotspots([a, b])

    expect(spots).toHaveLength(1)
    expect(spots[0].planets).toHaveLength(3)
    expect(spots[0].peopleCount).toBe(2)
  })

  it('returns [] with fewer than 3 placements or only one person', () => {
    expect(findHotspots([member('a', { sun: ['Leo', 5] })])).toEqual([])
    // 3 tightly clustered planets, but all from the same person
    const solo = member('a', { sun: ['Leo', 5], moon: ['Leo', 7], venus: ['Leo', 9] })
    expect(findHotspots([solo])).toEqual([])
  })
})

// ── findGaps ──────────────────────────────────────────────────────────────────

describe('findGaps', () => {
  it('finds the largest empty stretch with fully-contained signs and qualities', () => {
    // Placements at abs 25 (Aries 25°) and abs 215 (Scorpio 5°) → gap of 190°
    const a = member('a', { sun: ['Aries', 25] })
    const b = member('b', { sun: ['Scorpio', 5] })
    const gap = findGaps([a, b])

    expect(gap.startSign).toBe('Aries')
    expect(gap.endSign).toBe('Scorpio')
    expect(gap.arcDegrees).toBe(190)
    expect(gap.gapSigns).toEqual(['Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra'])
    expect(gap.qualities).toHaveLength(6)
    expect(gap.description).toBeTruthy()
  })

  it('handles a wraparound gap (largest gap crosses 0° Aries)', () => {
    // abs 100 (Cancer 10°) and abs 0 (Aries 0°) → wraparound gap of 260°
    const a = member('a', { sun: ['Cancer', 10] })
    const b = member('b', { sun: ['Aries', 0] })
    const gap = findGaps([a, b])

    expect(gap.startSign).toBe('Cancer')
    expect(gap.endSign).toBe('Aries')
    expect(gap.arcDegrees).toBe(260)
    expect(gap.gapSigns[0]).toBe('Leo')
    expect(gap.gapSigns[gap.gapSigns.length - 1]).toBe('Pisces')
    expect(gap.gapSigns).toHaveLength(8)
  })

  it('returns null when no gap reaches 60° or with fewer than 2 placements', () => {
    // 8 suns evenly spread 45° apart → max gap 45° < 60°
    const spread = [
      member('m0', { sun: ['Aries', 0] }),       // 0
      member('m1', { sun: ['Taurus', 15] }),     // 45
      member('m2', { sun: ['Cancer', 0] }),      // 90
      member('m3', { sun: ['Leo', 15] }),        // 135
      member('m4', { sun: ['Libra', 0] }),       // 180
      member('m5', { sun: ['Scorpio', 15] }),    // 225
      member('m6', { sun: ['Capricorn', 0] }),   // 270
      member('m7', { sun: ['Aquarius', 15] }),   // 315
    ]
    expect(findGaps(spread)).toBeNull()
    expect(findGaps([member('a', { sun: ['Aries', 0] })])).toBeNull()
    expect(findGaps([])).toBeNull()
  })

  it('excludes the signs holding the gap-edge planets from gapSigns', () => {
    // Gap from abs 10 (Aries 10°) to abs 230 (Scorpio 20°), arc 220°.
    // Only Taurus..Libra are fully empty — Aries and Scorpio hold the
    // gap-edge suns and must not be reported as empty.
    const a = member('a', { sun: ['Aries', 10] })
    const b = member('b', { sun: ['Scorpio', 20] })
    const gap = findGaps([a, b])

    expect(gap.gapSigns).toEqual(['Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra'])
    expect(gap.gapSigns).not.toContain('Scorpio')
    expect(gap.gapSigns).not.toContain('Aries')
  })
})

// ── deriveRoles ───────────────────────────────────────────────────────────────

describe('deriveRoles', () => {
  it('returns [] for fewer than 2 members', () => {
    expect(deriveRoles([])).toEqual([])
    expect(deriveRoles([FULL_MEMBER])).toEqual([])
  })

  it('identifies sole element carriers and element leaders', () => {
    const a = member('a', { sun: ['Aries', 5], moon: ['Leo', 10], mercury: ['Sagittarius', 20] })   // 3× Fire
    const b = member('b', { sun: ['Taurus', 5], moon: ['Virgo', 10], mercury: ['Capricorn', 20] })  // 3× Earth
    const roles = deriveRoles([a, b])

    expect(roles).toHaveLength(2)
    const roleA = roles.find(r => r.node.id === 'a')
    const roleB = roles.find(r => r.node.id === 'b')
    expect(roleA.contributions.some(c => c.type === 'sole_element')).toBe(true)
    expect(roleA.contributions.some(c => c.type === 'element_leader')).toBe(true)
    expect(roleB.contributions.some(c => c.type === 'sole_element')).toBe(true)
    expect(roleA.summary).toBeTruthy()
  })

  it('detects sun-moon elemental tension (requires data.element)', () => {
    const a = member('a', { sun: ['Aries', 5], moon: ['Cancer', 10] }, { element: 'Fire' })
    const b = member('b', { sun: ['Leo', 5], moon: ['Sagittarius', 10] }, { element: 'Fire' })
    const roles = deriveRoles([a, b])

    const roleA = roles.find(r => r.node.id === 'a')
    expect(roleA.contributions.some(c => c.type === 'tension')).toBe(true)
    // b's sun and moon are both Fire — no tension
    const roleB = roles.find(r => r.node.id === 'b')
    expect(roleB?.contributions.some(c => c.type === 'tension') ?? false).toBe(false)
  })

  it('flags modality standouts and four-element balance', () => {
    // 3 Cardinal placements (Aries, Cancer, Libra) + all four elements present
    const a = member('a', {
      sun: ['Aries', 5],      // Fire, Cardinal
      moon: ['Cancer', 10],   // Water, Cardinal
      mercury: ['Libra', 15], // Air, Cardinal
      venus: ['Taurus', 20],  // Earth, Fixed
    })
    const b = member('b', { sun: ['Capricorn', 5] })
    const roles = deriveRoles([a, b])

    const roleA = roles.find(r => r.node.id === 'a')
    expect(roleA.contributions.some(c => c.type === 'modality')).toBe(true)
    expect(roleA.contributions.some(c => c.type === 'balanced')).toBe(true)
  })

  it('filters out members with no distinctive contribution', () => {
    // Three identical sun-only members: nobody is a sole carrier or leader
    const nodes = [
      member('a', { sun: ['Aries', 5] }),
      member('b', { sun: ['Aries', 5] }),
      member('c', { sun: ['Aries', 5] }),
    ]
    expect(deriveRoles(nodes)).toEqual([])
  })
})

// ── saturnLines / jupiterGifts ────────────────────────────────────────────────

describe('saturnLines', () => {
  it('groups members by Saturn sign, sorted by group size, with themes', () => {
    const a = member('a', { saturn: ['Capricorn', 10] })
    const b = member('b', { saturn: ['Capricorn', 22] })
    const c = member('c', { saturn: ['Aries', 5] })
    const lines = saturnLines([a, b, c])

    expect(lines).toHaveLength(2)
    expect(lines[0].sign).toBe('Capricorn')
    expect(lines[0].names.sort()).toEqual(['a', 'b'])
    expect(lines[0].members).toHaveLength(2)
    expect(lines[0].theme).toBeTruthy()
    expect(lines[1].sign).toBe('Aries')
  })

  it('returns [] when no member has Saturn data', () => {
    expect(saturnLines([member('a', { sun: ['Aries', 5] })])).toEqual([])
    expect(saturnLines([])).toEqual([])
  })
})

describe('jupiterGifts', () => {
  it('groups members by Jupiter sign with growth themes', () => {
    const a = member('a', { jupiter: ['Pisces', 10] })
    const b = member('b', { jupiter: ['Pisces', 4] })
    const c = member('c', { jupiter: ['Virgo', 9] })
    const gifts = jupiterGifts([a, b, c])

    expect(gifts).toHaveLength(2)
    expect(gifts[0].sign).toBe('Pisces')
    expect(gifts[0].names.sort()).toEqual(['a', 'b'])
    expect(gifts[0].theme).toBeTruthy()
  })
})

// ── allPlanetsBySign ──────────────────────────────────────────────────────────

describe('allPlanetsBySign', () => {
  it('returns all 12 signs with totals and capitalized planet labels', () => {
    const result = allPlanetsBySign([FULL_MEMBER])

    expect(Object.keys(result)).toEqual(SIGN_ORDER)
    expect(result.Aries).toEqual({ total: 1, planets: { Sun: 1 } })
    expect(result.Cancer.planets.Moon).toBe(1)
    expect(result.Capricorn.planets.Saturn).toBe(1)
    expect(result.Libra).toEqual({ total: 0, planets: {} })
  })

  it('accumulates counts across members and excludes uncertain placements', () => {
    const b = member('b', { sun: ['Aries', 1] })
    const c = member('c', { sun: ['Aries', 2] }, { ingressWarnings: [{ planet: 'sun' }] })
    const result = allPlanetsBySign([FULL_MEMBER, b, c])
    expect(result.Aries.total).toBe(2) // c's sun is uncertain → excluded
    expect(result.Aries.planets.Sun).toBe(2)
  })
})

// ── findBridgePerson ──────────────────────────────────────────────────────────

describe('findBridgePerson', () => {
  it('returns null with fewer than 3 members', () => {
    const a = member('a', { sun: ['Aries', 0] })
    const b = member('b', { sun: ['Aries', 2] })
    expect(findBridgePerson([a, b])).toBeNull()
  })

  it('finds the member whose planets aspect the most others', () => {
    // a: sun 0° Aries (abs 0), moon 0° Leo (abs 120), mercury 0° Sag (abs 240)
    // b: sun 2° Aries (abs 2)   → conj a.sun, trine a.moon, trine a.mercury
    // c: sun 0° Libra (abs 180) → opp a.sun, sextile a.moon, sextile a.mercury
    // a makes 6 aspects within the 4° orb → a is the bridge
    const a = member('a', { sun: ['Aries', 0], moon: ['Leo', 0], mercury: ['Sagittarius', 0] })
    const b = member('b', { sun: ['Aries', 2] })
    const c = member('c', { sun: ['Libra', 0] })
    const bridge = findBridgePerson([a, b, c])

    expect(bridge.node.id).toBe('a')
    expect(bridge.aspectCount).toBe(6)
    expect(bridge.connectedTo.sort()).toEqual(['b', 'c'])
    expect(bridge.description).toContain('a')
  })

  it('returns null when the best member has fewer than 5 aspects', () => {
    // Positions 0, 25, 50 — no pair forms a major aspect within orb 6
    const a = member('a', { sun: ['Aries', 0] })
    const b = member('b', { sun: ['Aries', 25] })
    const c = member('c', { sun: ['Taurus', 20] })
    expect(findBridgePerson([a, b, c])).toBeNull()
  })
})

// ── findGroupAspects ──────────────────────────────────────────────────────────

describe('findGroupAspects', () => {
  it('returns [] with fewer than 2 members', () => {
    expect(findGroupAspects([], [])).toEqual([])
    expect(findGroupAspects([FULL_MEMBER], [])).toEqual([])
  })

  it('finds cross-chart aspects with names, signs, and strength', () => {
    const a = member('a', { sun: ['Aries', 0] })
    const b = member('b', { sun: ['Leo', 0] }) // exact trine
    const aspects = findGroupAspects([a, b], [])

    expect(aspects).toHaveLength(1)
    expect(aspects[0]).toMatchObject({
      aspect: 'trine',
      symbol: '△',
      strength: 100,
      personA: 'a',
      planetA: 'Sun',
      signA: 'Aries',
      personB: 'b',
      planetB: 'Sun',
      signB: 'Leo',
    })
  })

  it('computes strength from the aspect definition orb and sorts tightest first', () => {
    const a = member('a', { sun: ['Aries', 0] })
    const b = member('b', { sun: ['Leo', 0] })   // exact trine with a → 100
    const c = member('c', { sun: ['Aries', 4] }) // conj a (dev 4 of orb 8 → 50), trine b (dev 4 → 50)
    const aspects = findGroupAspects([a, b, c], [])

    expect(aspects).toHaveLength(3)
    expect(aspects[0].strength).toBe(100)
    expect(aspects[1].strength).toBe(50)
    expect(aspects[2].strength).toBe(50)
  })

  it('excludes uncertain placements from aspect matching', () => {
    const a = member('a', { sun: ['Aries', 0] })
    const b = member('b', { sun: ['Leo', 0] }, { ingressWarnings: [{ planet: 'sun' }] })
    expect(findGroupAspects([a, b], [])).toEqual([])
  })
})

// ── Re-exported constants ─────────────────────────────────────────────────────

describe('re-exported constants', () => {
  it('exposes the 12 signs in zodiac order and 4 elements', () => {
    expect(SIGN_ORDER).toHaveLength(12)
    expect(SIGN_ORDER[0]).toBe('Aries')
    expect(SIGN_ORDER[11]).toBe('Pisces')
    expect(ELEMENTS).toEqual(['Fire', 'Earth', 'Air', 'Water'])
  })
})
