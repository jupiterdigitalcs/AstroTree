/**
 * Dynamically selects slides for The DIG based on chart data.
 * Group-level insights — earned from chart math, not sign lookups.
 */

import {
  collectiveElementMap, findHotspots, findBridgePerson,
} from './groupChartCalc.js'

const ELEMENT_MOOD = { Fire: 'fire', Earth: 'earth', Air: 'air', Water: 'water' }

// ── Superlative generators ──────────────────────────────────────────────────

// Set of uncertain planets for a node (ingress warning + no birth time)
function uncertainPlanets(node) {
  if (node.data?.birthTime) return new Set()
  return new Set((node.data?.ingressWarnings || []).map(w => w.planet))
}

// Count how many personal planet placements are in a given element for a node
// Skips planets that are uncertain (ingress warning without birth time)
function elementWeight(node, element) {
  const signs = {
    Fire: ['Aries', 'Leo', 'Sagittarius'],
    Earth: ['Taurus', 'Virgo', 'Capricorn'],
    Air: ['Gemini', 'Libra', 'Aquarius'],
    Water: ['Cancer', 'Scorpio', 'Pisces'],
  }
  const elSigns = signs[element] ?? []
  const skip = uncertainPlanets(node)
  let count = 0
  if (!skip.has('sun') && elSigns.includes(node.data?.sign)) count++
  if (!skip.has('moon') && elSigns.includes(node.data?.moonSign)) count++
  const ip = node.data?.innerPlanets
  if (!skip.has('mercury') && ip?.mercury?.sign && elSigns.includes(ip.mercury.sign)) count++
  if (!skip.has('venus') && ip?.venus?.sign && elSigns.includes(ip.venus.sign)) count++
  if (!skip.has('mars') && ip?.mars?.sign && elSigns.includes(ip.mars.sign)) count++
  return count
}

function totalPlanetCount(node) {
  const skip = uncertainPlanets(node)
  let count = 0
  if (!skip.has('sun') && node.data?.sign) count++
  if (!skip.has('moon') && node.data?.moonSign && node.data.moonSign !== 'Unknown') count++
  const ip = node.data?.innerPlanets
  if (!skip.has('mercury') && ip?.mercury?.sign) count++
  if (!skip.has('venus') && ip?.venus?.sign) count++
  if (!skip.has('mars') && ip?.mars?.sign) count++
  return count
}

// Data-derived superlatives — titles earned from chart math, not sign lookups
const ELEMENT_SUPERLATIVES = {
  Fire:  { title: 'The Spark', sub: 'The most Fire energy in the group. Tends to be the one who gets things started.' },
  Earth: { title: 'The Anchor', sub: 'The most Earth energy in the group. Often the steadying presence others rely on.' },
  Air:   { title: 'The Connector', sub: 'The most Air energy in the group. Tends to be the one linking people and ideas.' },
  Water: { title: 'The Empath', sub: 'The most Water energy in the group. Often the first to sense what others are feeling.' },
}

// Moon-based emotional processing styles — genuine, hedging
const MOON_VIBES = {
  Aries:       'tends to process emotions quickly. May need action or movement to work through feelings.',
  Taurus:      'takes time to open up. May need comfort, routine, and physical reassurance to feel safe.',
  Gemini:      'tends to process feeling through conversation. Often needs a sounding board to make sense of things.',
  Cancer:      'deeply attuned to emotional undercurrents. May carry feelings for others without realizing it.',
  Leo:         'often needs to feel seen and valued. May express emotions more openly than most.',
  Virgo:       'tends to analyze feelings before expressing them. May show care through practical gestures.',
  Libra:       'often processes emotions in relationship to others. May need dialogue to find their own center.',
  Scorpio:     'feels things with unusual intensity. Tends to hold emotions close and process privately.',
  Sagittarius: 'may need space and perspective to process. Tends to look for meaning in difficult feelings.',
  Capricorn:   'often keeps emotions contained. May process through structure, work, or taking responsibility.',
  Aquarius:    'tends to step back and observe emotions before engaging. May need intellectual space to process.',
  Pisces:      'highly permeable to the feelings of others. May need solitude to distinguish their own emotions.',
}

// ── Helpers for new slides ──────────────────────────────────────────────────

const ELEMENT_SIGNS = {
  Fire: ['Aries', 'Leo', 'Sagittarius'],
  Earth: ['Taurus', 'Virgo', 'Capricorn'],
  Air: ['Gemini', 'Libra', 'Aquarius'],
  Water: ['Cancer', 'Scorpio', 'Pisces'],
}

const OPPOSING_ELEMENTS = [['Fire', 'Water'], ['Earth', 'Air']]

function getNodePlacements(node) {
  const p = []
  const skip = uncertainPlanets(node)
  if (!skip.has('sun') && node.data?.sign) p.push({ planet: 'sun', sign: node.data.sign })
  if (!skip.has('moon') && node.data?.moonSign && node.data.moonSign !== 'Unknown') p.push({ planet: 'moon', sign: node.data.moonSign })
  const ip = node.data?.innerPlanets
  if (!skip.has('mercury') && ip?.mercury?.sign) p.push({ planet: 'mercury', sign: ip.mercury.sign })
  if (!skip.has('venus') && ip?.venus?.sign) p.push({ planet: 'venus', sign: ip.venus.sign })
  if (!skip.has('mars') && ip?.mars?.sign) p.push({ planet: 'mars', sign: ip.mars.sign })
  return p
}

function signElement(sign) {
  for (const [el, signs] of Object.entries(ELEMENT_SIGNS)) {
    if (signs.includes(sign)) return el
  }
  return null
}

function preferUnfeatured(featured) {
  return (a, b) => {
    const af = featured.has(a.node?.id ?? a.id) ? 1 : 0
    const bf = featured.has(b.node?.id ?? b.id) ? 1 : 0
    return af - bf
  }
}

// ── Slide builder ───────────────────────────────────────────────────────────

export function buildSlides(digData) {
  const slides = []
  const { nodes, edges } = digData
  const featured = new Set()

  // 1. Intro — always
  slides.push({
    type: 'intro',
    data: { memberCount: digData.memberCount, familyName: digData.familyName },
    mood: 'starfield',
  })

  // 2. The Collective Chart (replaces Family Vibe Check)
  const collectiveMap = collectiveElementMap(nodes)
  slides.push({
    type: 'vibeCheck',
    data: {
      dominant: collectiveMap.dominant,
      dominantModality: digData.dominantModality,
      masculine: digData.masculine,
      feminine: digData.feminine,
      total: digData.total,
      collectiveTotal: collectiveMap.total,
      elementCounts: { Fire: collectiveMap.Fire, Earth: collectiveMap.Earth, Air: collectiveMap.Air, Water: collectiveMap.Water },
      missingElements: collectiveMap.missing,
    },
    mood: ELEMENT_MOOD[collectiveMap.dominant] || 'starfield',
  })

  // Pool of candidate slides — ordered by engagement priority
  const candidates = []

  // ── TIER 1: Personal hook + relationships (strongest openers) ─────────────

  // Superlative — strongest element concentration (data-derived, not sign lookup)
  if (nodes.length >= 2) {
    const elements = ['Fire', 'Earth', 'Air', 'Water']
    let bestEl = null, bestNode = null, bestScore = 0
    for (const el of elements) {
      const ranked = nodes
        .filter(n => n.data?.element)
        .map(n => ({ node: n, score: elementWeight(n, el) }))
        .filter(r => r.score >= 2)
        .sort((a, b) => b.score - a.score)
      if (ranked[0] && ranked[0].score > bestScore) {
        bestScore = ranked[0].score
        bestNode = ranked[0].node
        bestEl = el
      }
    }
    if (bestNode && bestEl) {
      const sup = ELEMENT_SUPERLATIVES[bestEl]
      if (sup) {
        candidates.push(() => {
          featured.add(bestNode.id)
          return { type: 'superlative', data: { node: bestNode, title: sup.title, sub: sup.sub, score: bestScore, total: totalPlanetCount(bestNode) }, mood: ELEMENT_MOOD[bestEl] || 'starfield' }
        })
      }
    }
  }

  // Cosmic Duo — top bond (relationships are the #1 thing people want to see)
  if (digData.topBonds?.length > 0) {
    candidates.push(() => {
      const bond = digData.topBonds[0]
      if (bond.a) featured.add(bond.a.id)
      if (bond.b) featured.add(bond.b.id)
      return { type: 'cosmicDuo', data: { bond, totalBonds: digData.topBonds.length }, mood: 'orbits' }
    })
  }

  // Element Clash — dynamic tension
  if (nodes.length >= 2) {
    let bestClash = null, bestScore = 0
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const pA = getNodePlacements(nodes[i])
        const pB = getNodePlacements(nodes[j])
        let clashScore = 0
        for (const a of pA) {
          const elA = signElement(a.sign)
          for (const b of pB) {
            const elB = signElement(b.sign)
            if (OPPOSING_ELEMENTS.some(([x, y]) => (elA === x && elB === y) || (elA === y && elB === x))) {
              clashScore++
            }
          }
        }
        if (clashScore > bestScore) {
          bestScore = clashScore
          const domA = signElement(nodes[i].data?.sign)
          const domB = signElement(nodes[j].data?.sign)
          bestClash = { nodeA: nodes[i], nodeB: nodes[j], elementA: domA, elementB: domB, clashScore }
        }
      }
    }
    if (bestClash && bestScore >= 3) {
      candidates.push(() => {
        featured.add(bestClash.nodeA.id)
        featured.add(bestClash.nodeB.id)
        return { type: 'elementClash', data: bestClash, mood: 'fire' }
      })
    }
  }

  // ── TIER 2: Family story + emotional depth ────────────────────────────────

  // Cosmic DNA — zodiac thread (family narrative)
  if (digData.signThreadList?.length > 0) {
    candidates.push(() => {
      const thread = digData.signThreadList[0]
      return { type: 'cosmicDNA', data: { thread, totalThreads: digData.signThreadList.length }, mood: 'constellation' }
    })
  }

  // Generational Bridge — parent-child sharing a sign across different planets
  if (edges && edges.length > 0) {
    const parentChildEdges = edges.filter(e => {
      const t = e.data?.relationType
      return t === 'parent' || t === 'child'
    })
    let bestBridge = null
    for (const edge of parentChildEdges) {
      const parent = nodes.find(n => n.id === edge.source)
      const child = nodes.find(n => n.id === edge.target)
      if (!parent || !child) continue
      const pP = getNodePlacements(parent)
      const pC = getNodePlacements(child)
      for (const pp of pP) {
        for (const cp of pC) {
          if (pp.sign === cp.sign && pp.planet !== cp.planet && !bestBridge) {
            bestBridge = { parent, child, sign: pp.sign, parentPlanet: pp.planet, childPlanet: cp.planet }
          }
        }
      }
    }
    if (bestBridge) {
      candidates.push(() => {
        featured.add(bestBridge.parent.id)
        featured.add(bestBridge.child.id)
        return { type: 'genBridge', data: bestBridge, mood: 'constellation' }
      })
    }
  }

  // Cosmic Inheritance — shared natal aspect patterns
  if (digData.aspectThreads?.totalCount > 0) {
    const { rareBonds, heredThreads, famSigs } = digData.aspectThreads
    let topItem = null
    let topType = null
    if (heredThreads.length > 0) {
      topItem = heredThreads[0]
      topType = 'heredThread'
    } else if (rareBonds.length > 0) {
      topItem = rareBonds[0]
      topType = 'rareBond'
    } else if (famSigs.length > 0) {
      topItem = famSigs[0]
      topType = 'famSig'
    }
    if (topItem) {
      candidates.push(() => ({
        type: 'aspectThreads',
        data: {
          blurb:       topItem.blurb ?? `${topItem.planet1}–${topItem.planet2}`,
          chainNames:  topItem.chainNames,
          planetLabel: topItem.planet1 + '–' + topItem.planet2,
          aspect:      topItem.aspect ?? null,
          topType,
          totalCount:  digData.aspectThreads.totalCount,
        },
        mood: 'constellation',
      }))
    }
  }

  // Moon Mirror — same moon sign or "all different"
  if (nodes.length >= 2) {
    const moonNodes = nodes.filter(n => n.data?.moonSign && n.data.moonSign !== 'Unknown')
    const moonGroups = {}
    moonNodes.forEach(n => {
      const ms = n.data.moonSign
      if (!moonGroups[ms]) moonGroups[ms] = []
      moonGroups[ms].push(n)
    })
    const pairs = Object.entries(moonGroups).filter(([, g]) => g.length >= 2)
    if (pairs.length > 0) {
      const [moonSign, group] = pairs[0]
      candidates.push(() => {
        const a = group.find(n => !featured.has(n.id)) || group[0]
        const b = group.find(n => n.id !== a.id && !featured.has(n.id)) || group.find(n => n.id !== a.id)
        if (a && b) {
          featured.add(a.id); featured.add(b.id)
          return { type: 'moonMirror', data: { nodeA: a, nodeB: b, moonSign, noSharedMoons: false }, mood: 'water' }
        }
        return null
      })
    } else if (moonNodes.length >= 4) {
      candidates.push(() => {
        return { type: 'moonMirror', data: { noSharedMoons: true, moonCount: moonNodes.length }, mood: 'water' }
      })
    }
  }

  // Emotional Landscape — most water placements
  if (nodes.length >= 2) {
    const ranked = nodes
      .filter(n => n.data?.moonSign && MOON_VIBES[n.data.moonSign])
      .map(n => ({ node: n, water: elementWeight(n, 'Water') }))
      .filter(r => r.water >= 2)
      .sort((a, b) => b.water - a.water)
    if (ranked[0]) {
      candidates.push(() => {
        const pick = ranked.find(r => !featured.has(r.node.id)) || ranked[0]
        featured.add(pick.node.id)
        return { type: 'emotionalForecast', data: { node: pick.node, moonVibe: MOON_VIBES[pick.node.data.moonSign], waterCount: pick.water }, mood: 'water' }
      })
    }
  }

  // ── TIER 3: Individual spotlights ─────────────────────────────────────────

  // Wildcard — most different from family dominant
  if (nodes.length >= 3) {
    const domEl = digData.dominant
    const wild = nodes.filter(n => elementWeight(n, domEl) === 0)
    if (wild.length > 0) {
      candidates.push(() => {
        const pick = wild.find(n => !featured.has(n.id)) || wild[0]
        featured.add(pick.id)
        return { type: 'wildcard', data: { node: pick, familyElement: domEl }, mood: ELEMENT_MOOD[pick.data?.element] || 'starfield' }
      })
    }
  }

  // The Rare One — unique sun sign
  if (nodes.length >= 3) {
    const signCount = {}
    nodes.forEach(n => { if (n.data?.sign) signCount[n.data.sign] = (signCount[n.data.sign] || 0) + 1 })
    const unique = nodes.filter(n => n.data?.sign && signCount[n.data.sign] === 1)
    if (unique.length > 0) {
      candidates.push(() => {
        const pick = unique.find(n => !featured.has(n.id)) || unique[0]
        featured.add(pick.id)
        return { type: 'rareOne', data: { node: pick, totalMembers: nodes.length }, mood: ELEMENT_MOOD[pick.data?.element] || 'starfield' }
      })
    }
  }

  // The Anchor — most Earth placements
  if (nodes.length >= 2) {
    const ranked = nodes
      .map(n => ({ node: n, earth: elementWeight(n, 'Earth') }))
      .filter(r => r.earth >= 2)
      .sort((a, b) => b.earth - a.earth)
    if (ranked[0]) {
      candidates.push(() => {
        const pick = ranked.find(r => !featured.has(r.node.id)) || ranked[0]
        featured.add(pick.node.id)
        return { type: 'oldSoul', data: { node: pick.node, earthCount: pick.earth }, mood: 'earth' }
      })
    }
  }

  // The Free Thinker — most Air placements
  if (nodes.length >= 2) {
    const ranked = nodes
      .map(n => ({ node: n, air: elementWeight(n, 'Air') }))
      .filter(r => r.air >= 2)
      .sort((a, b) => b.air - a.air)
    if (ranked[0]) {
      candidates.push(() => {
        const pick = ranked.find(r => !featured.has(r.node.id)) || ranked[0]
        featured.add(pick.node.id)
        return { type: 'rebel', data: { node: pick.node, airCount: pick.air }, mood: 'air' }
      })
    }
  }

  // ── TIER 4: Group patterns ────────────────────────────────────────────────

  // Venus Vibes — group Venus patterns
  {
    const withVenus = nodes.filter(n => n.data?.innerPlanets?.venus?.sign)
    if (withVenus.length >= 2) {
      const venusElements = { Fire: [], Earth: [], Air: [], Water: [] }
      withVenus.forEach(n => {
        const el = signElement(n.data.innerPlanets.venus.sign)
        if (el) venusElements[el].push(n)
      })
      const topEl = Object.entries(venusElements).sort((a, b) => b[1].length - a[1].length)[0]
      candidates.push(() => {
        return { type: 'venusVibes', data: { nodes: withVenus, topElement: topEl[0], topCount: topEl[1].length, topNames: topEl[1].map(n => n.data?.name) }, mood: 'water' }
      })
    }
  }

  // Mars Energy — group Mars patterns
  {
    const withMars = nodes.filter(n => n.data?.innerPlanets?.mars?.sign)
    if (withMars.length >= 2) {
      const marsElements = { Fire: [], Earth: [], Air: [], Water: [] }
      withMars.forEach(n => {
        const el = signElement(n.data.innerPlanets.mars.sign)
        if (el) marsElements[el].push(n)
      })
      const topEl = Object.entries(marsElements).sort((a, b) => b[1].length - a[1].length)[0]
      candidates.push(() => {
        return { type: 'marsEnergy', data: { nodes: withMars, topElement: topEl[0], topCount: topEl[1].length, topNames: topEl[1].map(n => n.data?.name) }, mood: 'fire' }
      })
    }
  }

  // Hotspot — group's strongest degree cluster
  {
    const hotspots = findHotspots(nodes)
    if (hotspots.length > 0) {
      candidates.push(() => {
        const spot = hotspots[0]
        return { type: 'hotspot', data: { spot }, mood: ELEMENT_MOOD[signElement(spot.sign)] || 'starfield' }
      })
    }
  }

  // ── TIER 5: Chart-derived connectors (replaces structural Glue) ───────────

  // The Connector — chart-backed; only shows if the person with most aspect connections
  // ALSO has Air/Libra/Venus energy supporting the archetype
  if (nodes.length >= 4) {
    const bridge = findBridgePerson(nodes)
    if (bridge) {
      // Check if this person has chart support for "connector" archetype
      const bn = bridge.node
      const hasAir = elementWeight(bn, 'Air') >= 1
      const hasLibra = bn.data?.sign === 'Libra' ||
        bn.data?.moonSign === 'Libra' ||
        bn.data?.innerPlanets?.venus?.sign === 'Libra' ||
        bn.data?.innerPlanets?.mercury?.sign === 'Libra'
      const hasVenusProminence = bn.data?.innerPlanets?.venus?.sign &&
        signElement(bn.data.innerPlanets.venus.sign) === 'Air'

      if (hasAir || hasLibra || hasVenusProminence) {
        candidates.push(() => {
          featured.add(bridge.node.id)
          return { type: 'connector', data: { ...bridge, chartBacked: true }, mood: 'orbits' }
        })
      }
    }
  }

  // Bridge — person whose chart touches the most others (always chart-based)
  if (nodes.length >= 4) {
    const bridge = findBridgePerson(nodes)
    if (bridge && !featured.has(bridge.node.id)) {
      candidates.push(() => {
        featured.add(bridge.node.id)
        return { type: 'bridge', data: bridge, mood: 'orbits' }
      })
    }
  }

  // ── TIER 6: Nice-to-have ──────────────────────────────────────────────────

  // The Clone — two members with the most matching placements
  if (nodes.length >= 2) {
    let bestPair = null, bestMatches = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const pA = getNodePlacements(nodes[i])
        const pB = getNodePlacements(nodes[j])
        const matches = []
        for (const a of pA) {
          if (pB.some(b => b.planet === a.planet && b.sign === a.sign)) {
            const glyph = { sun: '☀', moon: '☽', mercury: '☿', venus: '♀', mars: '♂' }[a.planet] || ''
            matches.push(`${glyph} ${a.planet} in ${a.sign}`)
          }
        }
        if (matches.length > bestMatches.length) {
          bestMatches = matches
          bestPair = { nodeA: nodes[i], nodeB: nodes[j] }
        }
      }
    }
    if (bestPair && bestMatches.length >= 2) {
      candidates.push(() => {
        featured.add(bestPair.nodeA.id)
        featured.add(bestPair.nodeB.id)
        return { type: 'clone', data: { ...bestPair, matchCount: bestMatches.length, matches: bestMatches }, mood: 'starfield' }
      })
    }
  }

  // ── Pick from candidates to build a balanced show ──────────────────────────
  // Take candidates in order (first = highest priority), skip nulls
  for (const fn of candidates) {
    const slide = fn()
    if (slide) slides.push(slide)
  }

  // Outro — always last
  slides.push({
    type: 'outro',
    data: {
      memberCount: digData.memberCount,
      dominant: digData.dominant,
      bondCount: digData.topBonds?.length ?? 0,
      threadCount: digData.signThreadList?.length ?? 0,
    },
    mood: 'starfield',
  })

  // Cap content slides at 10 (plus intro + outro = 12 max)
  if (slides.length > 12) {
    const intro = slides[0]
    const outro = slides[slides.length - 1]
    const content = slides.slice(1, -1).slice(0, 10)
    return [intro, ...content, outro]
  }

  return slides
}

// ── Summary card for export ─────────────────────────────────────────────────

const SYM = {
  Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍',
  Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓',
}

function row(label, main, sub) {
  return `<div style="margin-bottom:16px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.4);margin-bottom:4px">${label}</div><div style="font-size:14px;color:#e8dcc8">${main}</div>${sub ? `<div style="font-size:11px;color:rgba(255,255,255,0.35)">${sub}</div>` : ''}</div>`
}

export function buildDigSummaryHtml(digData, slides, chartTitle) {
  const name = chartTitle || (digData.familyName === 'group' ? 'Your Group' : 'Your Family')
  const contentSlides = slides.filter(s => s.type !== 'intro' && s.type !== 'outro')
  let rows = ''
  for (const s of contentSlides) {
    if (s.type === 'vibeCheck') {
      const missing = s.data.missingElements?.length > 0 ? ` · Missing: ${s.data.missingElements.join(', ')}` : ''
      rows += row('Family Vibe', `${s.data.dominant} ${s.data.dominantModality}`, `Dominant element: ${s.data.dominant} · ${s.data.dominantModality} energy${missing}`)
    } else if (s.type === 'superlative') {
      rows += row(s.data.title, `${SYM[s.data.node.data?.sign] || ''} ${s.data.node.data?.name || '—'}`, `${s.data.sub} · ${s.data.score} of ${s.data.total} placements in ${s.data.node.data?.element}`)
    } else if (s.type === 'emotionalForecast') {
      rows += row('Emotional Landscape', `☽ ${s.data.node.data?.name || '—'}`, `${s.data.node.data?.moonSign} Moon — ${s.data.moonVibe}`)
    } else if (s.type === 'cosmicDuo') {
      const b = s.data.bond
      rows += row('Cosmic Duo', `${b.a?.data?.name || '—'} + ${b.b?.data?.name || '—'}`, `${b.title || 'Strongest cosmic bond in the chart'}${s.data.totalBonds > 1 ? ` · ${s.data.totalBonds} total bonds found` : ''}`)
    } else if (s.type === 'wildcard') {
      rows += row('The Wildcard', `${SYM[s.data.node.data?.sign] || ''} ${s.data.node.data?.name || '—'}`, `The one who breaks the mold — zero ${s.data.familyElement} energy in a ${s.data.familyElement}-dominant family`)
    } else if (s.type === 'cosmicDNA') {
      const t = s.data.thread
      const chain = (t.chain || t.members || []).map(m => typeof m === 'string' ? m : m.name).join(' → ')
      rows += row('Cosmic DNA', `${SYM[t.sign] || ''} The ${t.sign} Gene`, `${chain}${s.data.totalThreads > 1 ? ` · ${s.data.totalThreads} zodiac threads running through the family` : ''}`)
    } else if (s.type === 'connector') {
      rows += row('The Connector', `${s.data.node.data?.name || '—'}`, `Chart aspects to ${s.data.connectedTo?.length || 0} people — chart-backed linking energy`)
    } else if (s.type === 'elementClash') {
      rows += row('Element Clash', `${s.data.nodeA.data?.name} vs ${s.data.nodeB.data?.name}`, `${s.data.elementA} meets ${s.data.elementB} — the most cosmically opposed pair`)
    } else if (s.type === 'clone') {
      rows += row('The Clone', `${s.data.nodeA.data?.name} & ${s.data.nodeB.data?.name}`, `${s.data.matchCount} matching placements — ${s.data.matches.join(', ')}`)
    } else if (s.type === 'venusVibes') {
      const venusSign = s.data.node.data?.innerPlanets?.venus?.sign
      rows += row('Venus Vibes', `♀ ${s.data.node.data?.name}`, `Venus in ${venusSign} — how they love and what they value`)
    } else if (s.type === 'marsEnergy') {
      const marsSign = s.data.node.data?.innerPlanets?.mars?.sign
      rows += row('Mars Energy', `♂ ${s.data.node.data?.name}`, `Mars in ${marsSign} — how they fight, chase, and get things done`)
    } else if (s.type === 'moonMirror') {
      rows += row('Moon Mirror', `${s.data.nodeA.data?.name} & ${s.data.nodeB.data?.name}`, `Both carry a ${s.data.moonSign} Moon — emotional twins`)
    } else if (s.type === 'oldSoul') {
      rows += row('The Anchor', `${s.data.node.data?.name}`, `${s.data.earthCount} Earth placements — the steadying presence in the chart`)
    } else if (s.type === 'rebel') {
      rows += row('The Free Thinker', `${s.data.node.data?.name}`, `${s.data.airCount} Air placements — leads with ideas and perspective`)
    } else if (s.type === 'genBridge') {
      rows += row('Generational Bridge', `${s.data.parent.data?.name} → ${s.data.child.data?.name}`, `${SYM[s.data.sign] || ''} ${s.data.sign} energy passed from ${s.data.parentPlanet} to ${s.data.childPlanet}`)
    } else if (s.type === 'rareOne') {
      rows += row('The Rare One', `${SYM[s.data.node.data?.sign] || ''} ${s.data.node.data?.name}`, `The only ${s.data.node.data?.sign} in a chart of ${s.data.totalMembers}`)
    } else if (s.type === 'aspectThreads') {
      const tierLabel = s.data.topType === 'heredThread' ? 'Passed Down' : s.data.topType === 'rareBond' ? 'Rare Bond' : 'Family Pattern'
      rows += row('Cosmic Inheritance', `${tierLabel} — ${s.data.planetLabel}`, s.data.blurb ?? s.data.chainNames)
    } else if (s.type === 'paywall') {
      // Skip paywall slide in summary export
    }
  }
  const stats = `<div style="display:flex;gap:24px;margin:16px 0"><div style="text-align:center"><span style="font-size:24px;color:#c9a84c">${digData.memberCount}</span><div style="font-size:10px;color:rgba(255,255,255,0.35)">members</div></div>${(digData.topBonds?.length ?? 0) > 0 ? `<div style="text-align:center"><span style="font-size:24px;color:#b8a0d4">${digData.topBonds.length}</span><div style="font-size:10px;color:rgba(255,255,255,0.35)">bonds</div></div>` : ''}${(digData.signThreadList?.length ?? 0) > 0 ? `<div style="text-align:center"><span style="font-size:24px;color:#5bc8f5">${digData.signThreadList.length}</span><div style="font-size:10px;color:rgba(255,255,255,0.35)">threads</div></div>` : ''}</div>`
  // Member names list
  const members = (digData.nodes || []).map(n => n.data?.name).filter(Boolean)
  const memberLine = members.length > 0
    ? `<div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:16px;line-height:1.5">${members.join(' · ')}</div>`
    : ''
  const brand = `<div style="border-top:2px solid rgba(201,168,76,0.25);padding-top:18px;margin-top:24px;display:flex;align-items:center;gap:14px"><div style="font-size:32px;line-height:1;filter:drop-shadow(0 0 10px rgba(201,168,76,0.5))">♃</div><div><div style="font-size:16px;font-family:Cinzel,serif;color:#c9a84c;letter-spacing:0.06em">AstroDig</div><div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:3px;font-family:Raleway,sans-serif">Jupiter Digital · astrodig.com · IG @jupreturn</div></div></div>`
  return `<div style="padding:32px;font-family:Raleway,sans-serif;color:#e8dcc8;max-width:420px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(255,255,255,0.3);margin-bottom:4px">The DIG</div><div style="font-size:22px;font-family:Cinzel,serif;color:#c9a84c;margin-bottom:6px">${name}</div>${memberLine}${rows}${stats}${brand}</div>`
}
