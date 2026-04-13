/**
 * Group chart calculation utilities.
 *
 * Pure functions that take arrays of React Flow nodes (with astrology data
 * on node.data) and return group-level insights. Used by InsightsPanel and
 * the DIG slide builder.
 *
 * Degrees are used internally for calculations but are NEVER surfaced to users.
 */

import { getElement } from './astrology.js'

// ── Constants ────────────────────────────────────────────────────────────────

const SIGN_ORDER = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

const SIGN_INDEX = Object.fromEntries(SIGN_ORDER.map((s, i) => [s, i]))

const ELEMENT_SIGNS = {
  Fire:  ['Aries', 'Leo', 'Sagittarius'],
  Earth: ['Taurus', 'Virgo', 'Capricorn'],
  Air:   ['Gemini', 'Libra', 'Aquarius'],
  Water: ['Cancer', 'Scorpio', 'Pisces'],
}

const ELEMENTS = ['Fire', 'Earth', 'Air', 'Water']

const PLANET_LABELS = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus',
  mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn',
}

const PLANET_GLYPHS = {
  sun: '☀', moon: '☽', mercury: '☿', venus: '♀',
  mars: '♂', jupiter: '♃', saturn: '♄',
}

// Major aspect angles and their names
const ASPECTS = [
  { name: 'conjunction', angle: 0,   orb: 8, symbol: '☌' },
  { name: 'sextile',    angle: 60,  orb: 6, symbol: '⚹' },
  { name: 'square',     angle: 90,  orb: 8, symbol: '□' },
  { name: 'trine',      angle: 120, orb: 8, symbol: '△' },
  { name: 'opposition', angle: 180, orb: 8, symbol: '☍' },
]

// Saturn sign themes — responsibility, structure, lessons
const SATURN_THEMES = {
  Aries:       'learning to lead without burning out — finding patience within urgency',
  Taurus:      'building real security — lessons around self-worth and material stability',
  Gemini:      'learning to commit to ideas — depth over breadth in thinking',
  Cancer:      'carrying emotional responsibility early — lessons around home and belonging',
  Leo:         'earning recognition through discipline — learning that confidence takes work',
  Virgo:       'holding themselves to high standards — learning when "good enough" is enough',
  Libra:       'navigating partnership with care — lessons around fairness and compromise',
  Scorpio:     'facing hard truths — learning to let go and rebuild from deep places',
  Sagittarius: 'grounding big ideas into action — learning that freedom requires structure',
  Capricorn:   'taking on responsibility naturally — learning to balance ambition with rest',
  Aquarius:    'questioning the rules — learning to build new systems, not just critique old ones',
  Pisces:      'holding boundaries in a boundless inner world — lessons around trust and faith',
}

// Jupiter sign themes — growth, expansion, gifts
const JUPITER_THEMES = {
  Aries:       'growth through bold action and taking initiative',
  Taurus:      'abundance through patience, sensory pleasure, and steady effort',
  Gemini:      'expansion through learning, conversation, and new ideas',
  Cancer:      'growth through nurturing connections and emotional honesty',
  Leo:         'abundance through creative expression and generosity',
  Virgo:       'growth through service, skill-building, and attention to detail',
  Libra:       'expansion through partnership, beauty, and collaboration',
  Scorpio:     'growth through depth, transformation, and facing what others avoid',
  Sagittarius: 'abundance through exploration, philosophy, and big-picture thinking',
  Capricorn:   'growth through discipline, long-term planning, and earned authority',
  Aquarius:    'expansion through innovation, community, and unconventional paths',
  Pisces:      'growth through compassion, imagination, and spiritual connection',
}

// Sign quality descriptions for the Gaps card
const SIGN_QUALITIES = {
  Aries:       'initiative and courage',
  Taurus:      'patience and sensory grounding',
  Gemini:      'curiosity and quick thinking',
  Cancer:      'emotional nurturing and intuition',
  Leo:         'creative confidence and warmth',
  Virgo:       'careful analysis and service',
  Libra:       'balance and relational awareness',
  Scorpio:     'emotional depth and transformation',
  Sagittarius: 'expansive vision and meaning-making',
  Capricorn:   'structure and long-term commitment',
  Aquarius:    'innovation and independent thought',
  Pisces:      'empathy and spiritual sensitivity',
}

// ── Zodiac math helpers ──────────────────────────────────────────────────────

/** Convert sign name + degree-within-sign (0-30) to absolute zodiac position (0-360) */
export function toAbsolute(sign, degree) {
  const idx = SIGN_INDEX[sign]
  if (idx == null || degree == null) return null
  return idx * 30 + degree
}

/** Shortest angular distance between two absolute positions (0-180) */
export function angularDistance(pos1, pos2) {
  if (pos1 == null || pos2 == null) return null
  const d = Math.abs(pos1 - pos2) % 360
  return d > 180 ? 360 - d : d
}

/** Check if two absolute positions form a major aspect within orb. Returns aspect info or null. */
export function findAspect(pos1, pos2, orb = 8) {
  const dist = angularDistance(pos1, pos2)
  if (dist == null) return null
  for (const asp of ASPECTS) {
    if (Math.abs(dist - asp.angle) <= (orb ?? asp.orb)) {
      return { ...asp, separation: dist, deviation: Math.abs(dist - asp.angle) }
    }
  }
  return null
}

/** Get the sign name for an absolute zodiac position */
function signAt(absPos) {
  return SIGN_ORDER[Math.floor(((absPos % 360) + 360) % 360 / 30)]
}

/** Get the element for a sign */
function signElement(sign) {
  for (const [el, signs] of Object.entries(ELEMENT_SIGNS)) {
    if (signs.includes(sign)) return el
  }
  return null
}

// ── Node data extraction ─────────────────────────────────────────────────────

/**
 * Extract all planet placements from a node.
 * Returns array of { planet, sign, degree, element, uncertain, absPos }
 * Flags placements as uncertain when the planet changed signs on that day
 * and no birth time was provided.
 */
export function getAllPlacements(node) {
  const d = node.data
  if (!d) return []

  const warnings = new Set(
    (d.ingressWarnings || []).map(w => w.planet)
  )
  const hasBirthTime = !!d.birthTime

  const placements = []

  function add(planet, sign, degree) {
    if (!sign || sign === 'Unknown') return
    const el = signElement(sign)
    const uncertain = !hasBirthTime && warnings.has(planet)
    const absPos = toAbsolute(sign, degree)
    placements.push({ planet, sign, degree, element: el, uncertain, absPos })
  }

  add('sun', d.sign, d.sunDegree)
  add('moon', d.moonSign, d.moonDegree)

  const ip = d.innerPlanets
  if (ip) {
    add('mercury', ip.mercury?.sign, ip.mercury?.degree)
    add('venus', ip.venus?.sign, ip.venus?.degree)
    add('mars', ip.mars?.sign, ip.mars?.degree)
  }

  const op = d.outerPlanets
  if (op) {
    add('jupiter', op.jupiter?.sign, op.jupiter?.degree)
    add('saturn', op.saturn?.sign, op.saturn?.degree)
  }

  return placements
}

// ── Group analysis functions ─────────────────────────────────────────────────

/**
 * Count planet placements across all members by element.
 * @param {Array} nodes
 * @param {Array} [onlyPlanets] - optional filter, e.g. ['sun','moon','mercury','venus','mars']
 * Returns { Fire, Earth, Air, Water, total, breakdown: { Fire: { sun: N, ... }, ... } }
 */
export function collectiveElementMap(nodes, onlyPlanets) {
  const counts = { Fire: 0, Earth: 0, Air: 0, Water: 0 }
  const breakdown = {
    Fire:  { sun: 0, moon: 0, mercury: 0, venus: 0, mars: 0, jupiter: 0, saturn: 0 },
    Earth: { sun: 0, moon: 0, mercury: 0, venus: 0, mars: 0, jupiter: 0, saturn: 0 },
    Air:   { sun: 0, moon: 0, mercury: 0, venus: 0, mars: 0, jupiter: 0, saturn: 0 },
    Water: { sun: 0, moon: 0, mercury: 0, venus: 0, mars: 0, jupiter: 0, saturn: 0 },
  }
  let total = 0

  for (const node of nodes) {
    for (const p of getAllPlacements(node)) {
      if (p.element && !p.uncertain) {
        if (onlyPlanets && !onlyPlanets.includes(p.planet)) continue
        counts[p.element]++
        breakdown[p.element][p.planet]++
        total++
      }
    }
  }

  const missing = ELEMENTS.filter(e => counts[e] === 0)
  const dominant = ELEMENTS.reduce((a, b) => counts[a] >= counts[b] ? a : b)

  return { ...counts, total, breakdown, missing, dominant }
}

/**
 * Find degree zones where planets from different people cluster.
 * Returns array of hotspot objects sorted by participant count.
 */
export function findHotspots(nodes, orb = 8) {
  // Collect all placements with absolute positions
  const all = []
  for (const node of nodes) {
    for (const p of getAllPlacements(node)) {
      if (p.absPos != null && !p.uncertain) {
        all.push({ ...p, personName: node.data?.name, personId: node.id })
      }
    }
  }

  if (all.length < 3) return []

  // Sort by absolute position
  all.sort((a, b) => a.absPos - b.absPos)

  // Sliding window: find clusters where 3+ planets from different people
  // fall within `orb` degrees of each other
  const hotspots = []

  for (let i = 0; i < all.length; i++) {
    const cluster = [all[i]]
    for (let j = i + 1; j < all.length; j++) {
      // Handle wraparound (Pisces → Aries boundary)
      const dist = angularDistance(all[i].absPos, all[j].absPos)
      if (dist <= orb) {
        cluster.push(all[j])
      }
    }
    // Also check wraparound from end to start
    for (let j = 0; j < i; j++) {
      const dist = angularDistance(all[i].absPos, all[j].absPos)
      if (dist <= orb && !cluster.includes(all[j])) {
        cluster.push(all[j])
      }
    }

    // Need 3+ planets from at least 2 different people
    const uniquePeople = new Set(cluster.map(c => c.personId))
    if (cluster.length >= 3 && uniquePeople.size >= 2) {
      // Avoid duplicate hotspots — check if we already have one covering these planets
      const key = cluster.map(c => c.personId + c.planet).sort().join('|')
      if (!hotspots.some(h => h._key === key)) {
        const centerSign = signAt(cluster[0].absPos)
        const degree = cluster[0].degree
        const position = degree <= 10 ? 'early' : degree >= 20 ? 'late' : 'mid'
        hotspots.push({
          _key: key,
          sign: centerSign,
          position,
          planets: cluster.map(c => ({
            planet: c.planet,
            label: PLANET_LABELS[c.planet],
            glyph: PLANET_GLYPHS[c.planet],
            person: c.personName,
            sign: c.sign,
          })),
          peopleCount: uniquePeople.size,
          description: `${uniquePeople.size} people have planets packed into ${position} ${centerSign}`,
        })
      }
    }
  }

  // Merge hotspots in the same sign — early/mid/late Leo should be one entry
  const bySign = {}
  for (const spot of hotspots) {
    if (!bySign[spot.sign]) {
      bySign[spot.sign] = { ...spot, planets: [...spot.planets], peopleIds: new Set(spot.planets.map(p => p.person)) }
    } else {
      const merged = bySign[spot.sign]
      for (const p of spot.planets) {
        // Avoid duplicate person+planet entries
        if (!merged.planets.some(mp => mp.person === p.person && mp.planet === p.planet)) {
          merged.planets.push(p)
        }
        merged.peopleIds.add(p.person)
      }
      merged.peopleCount = merged.peopleIds.size
    }
  }

  return Object.values(bySign)
    .map(({ _key, peopleIds, ...rest }) => ({ ...rest, peopleCount: (peopleIds?.size ?? rest.peopleCount) }))
    .sort((a, b) => b.planets.length - a.planets.length)
}

/**
 * Find the longest stretch of the zodiac with zero group planets.
 * Returns { startSign, endSign, arcDegrees, description, qualities } or null.
 */
export function findGaps(nodes) {
  const all = []
  for (const node of nodes) {
    for (const p of getAllPlacements(node)) {
      if (p.absPos != null && !p.uncertain) {
        all.push(p.absPos)
      }
    }
  }

  if (all.length < 2) return null

  // Sort positions and find largest gap
  const sorted = [...new Set(all)].sort((a, b) => a - b)
  let maxGap = 0, gapStart = 0, gapEnd = 0

  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1] - sorted[i]
    if (gap > maxGap) { maxGap = gap; gapStart = sorted[i]; gapEnd = sorted[i + 1] }
  }
  // Check wraparound gap
  const wrapGap = (360 - sorted[sorted.length - 1]) + sorted[0]
  if (wrapGap > maxGap) { maxGap = wrapGap; gapStart = sorted[sorted.length - 1]; gapEnd = sorted[0] }

  // Only report gaps of 60°+ (2 full signs)
  if (maxGap < 60) return null

  const startSign = signAt(gapStart)
  const endSign = signAt(gapEnd)

  // Collect all signs fully within the gap
  const gapSigns = []
  const startIdx = Math.ceil(gapStart / 30)
  const numSigns = Math.floor(maxGap / 30)
  for (let i = 0; i < numSigns; i++) {
    const idx = (startIdx + i) % 12
    gapSigns.push(SIGN_ORDER[idx])
  }

  const qualities = gapSigns.map(s => SIGN_QUALITIES[s]).filter(Boolean)

  return {
    startSign,
    endSign,
    arcDegrees: Math.round(maxGap),
    gapSigns,
    qualities,
    description: gapSigns.length > 0
      ? `No one in this group has planets in ${gapSigns.join(', ')} — the qualities of ${qualities.slice(0, 3).join(', ')} may not come naturally to the group as a whole.`
      : null,
  }
}

/**
 * Derive each person's unique contribution/role in the group chart.
 * Looks at what elements, planets, or signs a person uniquely carries.
 */
export function deriveRoles(nodes) {
  if (nodes.length < 2) return []

  const groupMap = collectiveElementMap(nodes)
  const allNodePlacements = new Map()
  const elementCarriers = { Fire: [], Earth: [], Air: [], Water: [] }
  const personElementCounts = new Map()
  const personPlanetSigns = new Map() // nodeId → { sun, moon, venus, mars, mercury }

  for (const node of nodes) {
    const placements = getAllPlacements(node)
    allNodePlacements.set(node.id, placements)
    const eCounts = { Fire: 0, Earth: 0, Air: 0, Water: 0 }
    const personEls = new Set()
    for (const p of placements) {
      if (p.element && !p.uncertain) { eCounts[p.element]++; personEls.add(p.element) }
    }
    personElementCounts.set(node.id, eCounts)
    for (const el of personEls) elementCarriers[el].push(node)
    personPlanetSigns.set(node.id, {
      sun: node.data?.sign,
      moon: node.data?.moonSign !== 'Unknown' ? node.data?.moonSign : null,
      venus: node.data?.innerPlanets?.venus?.sign ?? null,
      mars: node.data?.innerPlanets?.mars?.sign ?? null,
      mercury: node.data?.innerPlanets?.mercury?.sign ?? null,
    })
  }

  // Pre-compute: who has the most of each element
  const elementLeaders = {}
  for (const el of ELEMENTS) {
    let best = null, bestCount = 0
    for (const node of nodes) {
      const c = personElementCounts.get(node.id)[el]
      if (c > bestCount) { bestCount = c; best = node }
    }
    elementLeaders[el] = best
  }

  // Pre-compute: modality counts per person
  const MODALITIES = { Cardinal: 0, Fixed: 0, Mutable: 0 }
  const SIGN_TO_MOD = {}
  for (const [mod, signs] of Object.entries({
    Cardinal: ['Aries','Cancer','Libra','Capricorn'],
    Fixed: ['Taurus','Leo','Scorpio','Aquarius'],
    Mutable: ['Gemini','Virgo','Sagittarius','Pisces'],
  })) signs.forEach(s => { SIGN_TO_MOD[s] = mod })

  const personModCounts = new Map()
  for (const node of nodes) {
    const mods = { ...MODALITIES }
    for (const p of (allNodePlacements.get(node.id) || [])) {
      if (!p.uncertain && SIGN_TO_MOD[p.sign]) mods[SIGN_TO_MOD[p.sign]]++
    }
    personModCounts.set(node.id, mods)
  }

  // Check if sun and moon contradict (different elements)
  function hasSunMoonTension(node) {
    const sunEl = node.data?.element
    const moonSign = node.data?.moonSign
    if (!moonSign || moonSign === 'Unknown') return null
    const moonEl = signElement(moonSign)
    if (!sunEl || !moonEl || sunEl === moonEl) return null
    return { sunEl, moonEl }
  }

  const roles = []

  for (const node of nodes) {
    const contributions = []
    const eCounts = personElementCounts.get(node.id)
    const mods = personModCounts.get(node.id)
    const planets = personPlanetSigns.get(node.id)

    // Sole element carrier — most distinctive
    for (const el of ELEMENTS) {
      if (elementCarriers[el].length === 1 && elementCarriers[el][0].id === node.id) {
        contributions.push({
          type: 'sole_element',
          description: `the only one bringing ${el} energy to the group — without them, that quality would be entirely absent`,
        })
      }
    }

    // Strongest of their element in the group (only if they clearly lead)
    for (const el of ELEMENTS) {
      if (elementLeaders[el]?.id === node.id && eCounts[el] >= 3) {
        contributions.push({
          type: 'element_leader',
          description: `the group's strongest source of ${el} energy — ${eCounts[el]} of their personal planets are in ${el} signs`,
        })
      }
    }

    // Sun-Moon tension — they carry internal complexity
    const tension = hasSunMoonTension(node)
    if (tension) {
      contributions.push({
        type: 'tension',
        description: `shows up as ${tension.sunEl} but processes emotions through ${tension.moonEl} — they may carry a push-pull the group senses but can't quite name`,
      })
    }

    // Modality standout
    const topMod = Object.entries(mods).sort((a, b) => b[1] - a[1])[0]
    if (topMod[1] >= 3) {
      const modDesc = { Cardinal: 'an initiator — tends to be the one who starts things', Fixed: 'a stabilizer — tends to hold things together once started', Mutable: 'an adapter — tends to be the one who shifts when things change' }
      contributions.push({
        type: 'modality',
        description: modDesc[topMod[0]] || `strongly ${topMod[0]}`,
      })
    }

    // All four elements — rare balance
    const presentElements = ELEMENTS.filter(e => eCounts[e] > 0)
    if (presentElements.length === 4) {
      contributions.push({
        type: 'balanced',
        description: `has all four elements represented — may naturally mediate between different energies in the group`,
      })
    }

    // Venus in a rare element for the group
    if (planets.venus) {
      const venusEl = signElement(planets.venus)
      if (venusEl && groupMap[venusEl] <= 2) {
        const venusRole = { Water: 'emotional vulnerability', Fire: 'passionate expression', Air: 'intellectual connection', Earth: 'grounded, physical affection' }
        contributions.push({
          type: 'rare_venus',
          description: `one of the few with Venus in ${venusEl} — may be the group's access point to ${venusRole[venusEl] || 'a different way of connecting'}`,
        })
      }
    }

    // Mars in a rare element — how they take action is unusual for the group
    if (planets.mars) {
      const marsEl = signElement(planets.mars)
      if (marsEl && groupMap[marsEl] <= 2) {
        const marsRole = { Water: 'emotionally driven action', Fire: 'impulsive directness', Air: 'strategic thinking', Earth: 'steady, methodical follow-through' }
        contributions.push({
          type: 'rare_mars',
          description: `Mars in ${marsEl} — may approach conflict and motivation differently than the rest of the group, through ${marsRole[marsEl] || 'a distinct style'}`,
        })
      }
    }

    roles.push({
      node,
      contributions,
      summary: contributions.length > 0 ? contributions[0].description : null,
    })
  }

  return roles.filter(r => r.summary)
}

/**
 * Group members by Saturn sign with shared themes.
 */
export function saturnLines(nodes) {
  const groups = {}

  for (const node of nodes) {
    const sign = node.data?.outerPlanets?.saturn?.sign
    if (!sign) continue
    if (!groups[sign]) groups[sign] = []
    groups[sign].push(node)
  }

  return Object.entries(groups)
    .filter(([, members]) => members.length > 0)
    .map(([sign, members]) => ({
      sign,
      members,
      theme: SATURN_THEMES[sign] || '',
      names: members.map(n => n.data?.name).filter(Boolean),
    }))
    .sort((a, b) => b.members.length - a.members.length)
}

/**
 * Group members by Jupiter sign with growth/expansion themes.
 */
export function jupiterGifts(nodes) {
  const groups = {}

  for (const node of nodes) {
    const sign = node.data?.outerPlanets?.jupiter?.sign
    if (!sign) continue
    if (!groups[sign]) groups[sign] = []
    groups[sign].push(node)
  }

  return Object.entries(groups)
    .filter(([, members]) => members.length > 0)
    .map(([sign, members]) => ({
      sign,
      members,
      theme: JUPITER_THEMES[sign] || '',
      names: members.map(n => n.data?.name).filter(Boolean),
    }))
    .sort((a, b) => b.members.length - a.members.length)
}

/**
 * Count ALL planet placements per zodiac sign across all members.
 * Returns object keyed by sign with total and per-planet breakdown.
 */
export function allPlanetsBySign(nodes) {
  const result = {}
  for (const sign of SIGN_ORDER) {
    result[sign] = { total: 0, planets: {} }
  }

  for (const node of nodes) {
    for (const p of getAllPlacements(node)) {
      if (!p.uncertain && result[p.sign]) {
        result[p.sign].total++
        const label = PLANET_LABELS[p.planet] || p.planet
        result[p.sign].planets[label] = (result[p.sign].planets[label] || 0) + 1
      }
    }
  }

  return result
}

/**
 * Find the person whose planets make the most aspects to other people's planets.
 * This is the "bridge" — the person whose chart connects the most others.
 */
export function findBridgePerson(nodes) {
  if (nodes.length < 3) return null

  const placementsByNode = new Map()
  for (const node of nodes) {
    placementsByNode.set(node.id, getAllPlacements(node).filter(p => p.absPos != null && !p.uncertain))
  }

  let bestNode = null, bestCount = 0, bestConnected = new Set()

  for (const node of nodes) {
    const myPlacements = placementsByNode.get(node.id) || []
    let aspectCount = 0
    const connectedTo = new Set()

    for (const other of nodes) {
      if (other.id === node.id) continue
      const otherPlacements = placementsByNode.get(other.id) || []

      for (const mine of myPlacements) {
        for (const theirs of otherPlacements) {
          if (findAspect(mine.absPos, theirs.absPos, 6)) {
            aspectCount++
            connectedTo.add(other.data?.name || other.id)
          }
        }
      }
    }

    if (aspectCount > bestCount) {
      bestCount = aspectCount
      bestNode = node
      bestConnected = connectedTo
    }
  }

  if (!bestNode || bestCount < 3) return null

  return {
    node: bestNode,
    aspectCount: bestCount,
    connectedTo: [...bestConnected],
    description: `${bestNode.data?.name}'s chart touches ${bestConnected.size} other people's — the cosmic connector of the group`,
  }
}

/**
 * Find degree-level aspects between people's charts, framed as group dynamics.
 * Returns notable aspects between different members' planets.
 */
export function findGroupAspects(nodes, edges) {
  if (nodes.length < 2) return []

  const placementsByNode = new Map()
  for (const node of nodes) {
    placementsByNode.set(node.id, {
      name: node.data?.name,
      placements: getAllPlacements(node).filter(p => p.absPos != null && !p.uncertain),
    })
  }

  const aspects = []

  const nodeIds = [...placementsByNode.keys()]
  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = i + 1; j < nodeIds.length; j++) {
      const a = placementsByNode.get(nodeIds[i])
      const b = placementsByNode.get(nodeIds[j])

      for (const pA of a.placements) {
        for (const pB of b.placements) {
          const asp = findAspect(pA.absPos, pB.absPos, 6)
          if (asp) {
            aspects.push({
              aspect: asp.name,
              symbol: asp.symbol,
              strength: Math.round(100 - (asp.deviation / asp.orb) * 100),
              personA: a.name,
              planetA: PLANET_LABELS[pA.planet],
              signA: pA.sign,
              personB: b.name,
              planetB: PLANET_LABELS[pB.planet],
              signB: pB.sign,
            })
          }
        }
      }
    }
  }

  // Sort by strength (tightest aspects first), limit to top 15
  return aspects.sort((a, b) => b.strength - a.strength).slice(0, 15)
}

// Re-export constants for use in UI
export { ELEMENTS, SIGN_ORDER, PLANET_LABELS, PLANET_GLYPHS, SATURN_THEMES, JUPITER_THEMES }
