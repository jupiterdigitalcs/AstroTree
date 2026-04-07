/**
 * Dynamically selects 5-7 slides for The DIG based on chart data.
 * Slides are fun personality superlatives, NOT repeats of the Insights panel.
 */

const ELEMENT_MOOD = { Fire: 'fire', Earth: 'earth', Air: 'air', Water: 'water' }

// ── Superlative generators ──────────────────────────────────────────────────

// Count how many personal planet placements are in a given element for a node
function elementWeight(node, element) {
  const signs = {
    Fire: ['Aries', 'Leo', 'Sagittarius'],
    Earth: ['Taurus', 'Virgo', 'Capricorn'],
    Air: ['Gemini', 'Libra', 'Aquarius'],
    Water: ['Cancer', 'Scorpio', 'Pisces'],
  }
  const elSigns = signs[element] ?? []
  let count = 0
  if (elSigns.includes(node.data?.sign)) count++
  if (elSigns.includes(node.data?.moonSign)) count++
  const ip = node.data?.innerPlanets
  if (ip?.mercury?.sign && elSigns.includes(ip.mercury.sign)) count++
  if (ip?.venus?.sign && elSigns.includes(ip.venus.sign)) count++
  if (ip?.mars?.sign && elSigns.includes(ip.mars.sign)) count++
  return count
}

function totalPlanetCount(node) {
  let count = 0
  if (node.data?.sign) count++
  if (node.data?.moonSign && node.data.moonSign !== 'Unknown') count++
  const ip = node.data?.innerPlanets
  if (ip?.mercury?.sign) count++
  if (ip?.venus?.sign) count++
  if (ip?.mars?.sign) count++
  return count
}

// Sign-based superlatives
const SIGN_SUPERLATIVES = {
  Aries:       { title: 'Most Likely to Send It', sub: 'No hesitation. All gas, no brakes.' },
  Taurus:      { title: 'Most Likely to Skip Plans for a Nap', sub: 'Comfort is a lifestyle, not a choice.' },
  Gemini:      { title: 'Most Likely to Have 47 Tabs Open', sub: 'Their brain never stops multitasking.' },
  Cancer:      { title: 'Most Likely to Cry at a Commercial', sub: 'Big feelings. Bigger heart.' },
  Leo:         { title: 'Main Character Energy', sub: 'Born to be the center of attention.' },
  Virgo:       { title: 'Most Likely to Fix Everyone\'s Life', sub: 'Quietly holding everything together.' },
  Libra:       { title: 'Most Likely to Take 3 Hours to Decide', sub: 'But they\'ll look amazing doing it.' },
  Scorpio:     { title: 'Most Likely to Know Your Secret', sub: 'They see everything. They forget nothing.' },
  Sagittarius: { title: 'Most Likely to Book a One-Way Flight', sub: 'Freedom is the whole personality.' },
  Capricorn:   { title: 'Most Likely to Already Have a 5-Year Plan', sub: 'While everyone else is figuring it out.' },
  Aquarius:    { title: 'Most Likely to Start a Revolution', sub: 'The future lives rent-free in their head.' },
  Pisces:      { title: 'Most Likely to Live in a Daydream', sub: 'Reality is just one of their worlds.' },
}

// Moon-based emotional superlatives
const MOON_VIBES = {
  Aries:       'catches feelings fast and moves on faster',
  Taurus:      'processes everything at their own pace — don\'t rush them',
  Gemini:      'talks through every feeling (to literally everyone)',
  Cancer:      'feels everything for everyone, always',
  Leo:         'needs to be celebrated when they\'re feeling things',
  Virgo:       'overthinks their feelings, then overthinks the overthinking',
  Libra:       'can\'t feel anything until they\'ve talked it through with someone',
  Scorpio:     'feels DEEPLY but will never let you see it',
  Sagittarius: 'deals with hard feelings by booking a trip',
  Capricorn:   'compartmentalizes feelings into a very neat box',
  Aquarius:    'intellectualizes emotions instead of feeling them',
  Pisces:      'absorbs everyone else\'s emotions like a sponge',
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
  if (node.data?.sign) p.push({ planet: 'sun', sign: node.data.sign })
  if (node.data?.moonSign && node.data.moonSign !== 'Unknown') p.push({ planet: 'moon', sign: node.data.moonSign })
  const ip = node.data?.innerPlanets
  if (ip?.mercury?.sign) p.push({ planet: 'mercury', sign: ip.mercury.sign })
  if (ip?.venus?.sign) p.push({ planet: 'venus', sign: ip.venus.sign })
  if (ip?.mars?.sign) p.push({ planet: 'mars', sign: ip.mars.sign })
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

  // 2. Family Vibe Check
  slides.push({
    type: 'vibeCheck',
    data: {
      dominant: digData.dominant,
      dominantModality: digData.dominantModality,
      masculine: digData.masculine,
      feminine: digData.feminine,
      total: digData.total,
      missingElements: digData.missingElements,
    },
    mood: ELEMENT_MOOD[digData.dominant] || 'starfield',
  })

  // Pool of candidate slides — we'll pick the best ones
  const candidates = []

  // Superlative — strongest sign personality
  if (nodes.length >= 2) {
    const ranked = nodes
      .filter(n => n.data?.element)
      .map(n => ({ node: n, score: elementWeight(n, n.data.element) }))
      .filter(r => r.score >= 2)
      .sort((a, b) => b.score - a.score)
    if (ranked[0]) {
      const best = ranked[0]
      const sup = SIGN_SUPERLATIVES[best.node.data.sign]
      if (sup) {
        candidates.push(() => {
          featured.add(best.node.id)
          return { type: 'superlative', data: { node: best.node, title: sup.title, sub: sup.sub, score: best.score, total: totalPlanetCount(best.node) }, mood: ELEMENT_MOOD[best.node.data.element] || 'starfield' }
        })
      }
    }
  }

  // Emotional Forecast — most water placements
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

  // Cosmic Duo — top bond
  if (digData.topBonds?.length > 0) {
    candidates.push(() => {
      const bond = digData.topBonds[0]
      if (bond.a) featured.add(bond.a.id)
      if (bond.b) featured.add(bond.b.id)
      return { type: 'cosmicDuo', data: { bond, totalBonds: digData.topBonds.length }, mood: 'orbits' }
    })
  }

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

  // Cosmic DNA — zodiac thread
  if (digData.signThreadList?.length > 0) {
    candidates.push(() => {
      const thread = digData.signThreadList[0]
      return { type: 'cosmicDNA', data: { thread, totalThreads: digData.signThreadList.length }, mood: 'constellation' }
    })
  }

  // ── NEW SLIDES ────────────────────────────────────────────────────────────

  // The Glue — most connections
  if (edges && edges.length > 0 && nodes.length >= 3) {
    const connCount = {}
    nodes.forEach(n => { connCount[n.id] = 0 })
    edges.forEach(e => {
      if (connCount[e.source] !== undefined) connCount[e.source]++
      if (connCount[e.target] !== undefined) connCount[e.target]++
    })
    const sorted = nodes.slice().sort((a, b) => (connCount[b.id] || 0) - (connCount[a.id] || 0))
    if (sorted[0] && connCount[sorted[0].id] >= 2) {
      candidates.push(() => {
        const pick = sorted.find(n => !featured.has(n.id)) || sorted[0]
        featured.add(pick.id)
        return { type: 'glue', data: { node: pick, connectionCount: connCount[pick.id] }, mood: 'orbits' }
      })
    }
  }

  // Element Clash — two members with most opposing planet placements
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

  // Venus Vibes — person with Venus data, prefer unfeatured
  {
    const withVenus = nodes.filter(n => n.data?.innerPlanets?.venus?.sign)
    if (withVenus.length > 0) {
      candidates.push(() => {
        const pick = withVenus.find(n => !featured.has(n.id)) || withVenus[0]
        featured.add(pick.id)
        return { type: 'venusVibes', data: { node: pick }, mood: 'water' }
      })
    }
  }

  // Mars Energy — person with Mars data, prefer unfeatured
  {
    const withMars = nodes.filter(n => n.data?.innerPlanets?.mars?.sign)
    if (withMars.length > 0) {
      candidates.push(() => {
        const pick = withMars.find(n => !featured.has(n.id)) || withMars[0]
        featured.add(pick.id)
        return { type: 'marsEnergy', data: { node: pick }, mood: 'fire' }
      })
    }
  }

  // Moon Mirror — two people with the same moon sign
  if (nodes.length >= 2) {
    const moonGroups = {}
    nodes.forEach(n => {
      const ms = n.data?.moonSign
      if (ms && ms !== 'Unknown') { if (!moonGroups[ms]) moonGroups[ms] = []; moonGroups[ms].push(n) }
    })
    const pairs = Object.entries(moonGroups).filter(([, g]) => g.length >= 2)
    if (pairs.length > 0) {
      const [moonSign, group] = pairs[0]
      candidates.push(() => {
        const a = group.find(n => !featured.has(n.id)) || group[0]
        const b = group.find(n => n.id !== a.id && !featured.has(n.id)) || group.find(n => n.id !== a.id)
        if (a && b) {
          featured.add(a.id); featured.add(b.id)
          return { type: 'moonMirror', data: { nodeA: a, nodeB: b, moonSign }, mood: 'water' }
        }
        return null
      })
    }
  }

  // The Old Soul — most Earth placements
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

  // The Rebel — most Air placements
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
      rows += `<div style="margin-bottom:16px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.4);margin-bottom:4px">Family Vibe</div><div style="font-size:16px;color:#c9a84c">${s.data.dominant} ${s.data.dominantModality}</div></div>`
    } else if (s.type === 'superlative') {
      rows += `<div style="margin-bottom:16px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.4);margin-bottom:4px">${s.data.title}</div><div style="font-size:14px;color:#e8dcc8">${SYM[s.data.node.data?.sign] || ''} ${s.data.node.data?.name || '—'}</div><div style="font-size:11px;color:rgba(255,255,255,0.35)">${s.data.sub}</div></div>`
    } else if (s.type === 'emotionalForecast') {
      rows += `<div style="margin-bottom:16px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.4);margin-bottom:4px">The Empath</div><div style="font-size:14px;color:#e8dcc8">☽ ${s.data.node.data?.name || '—'}</div><div style="font-size:11px;color:rgba(255,255,255,0.35)">${s.data.moonVibe}</div></div>`
    } else if (s.type === 'cosmicDuo') {
      const b = s.data.bond
      rows += `<div style="margin-bottom:16px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.4);margin-bottom:4px">Cosmic Duo</div><div style="font-size:14px;color:#e8dcc8">${b.nameA || '—'} + ${b.nameB || '—'}</div><div style="font-size:11px;color:rgba(255,255,255,0.35)">${b.title || ''}</div></div>`
    } else if (s.type === 'wildcard') {
      rows += `<div style="margin-bottom:16px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.4);margin-bottom:4px">The Wildcard</div><div style="font-size:14px;color:#e8dcc8">${SYM[s.data.node.data?.sign] || ''} ${s.data.node.data?.name || '—'}</div><div style="font-size:11px;color:rgba(255,255,255,0.35)">Zero ${s.data.familyElement} energy</div></div>`
    } else if (s.type === 'cosmicDNA') {
      const t = s.data.thread
      rows += `<div style="margin-bottom:16px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.4);margin-bottom:4px">Cosmic DNA</div><div style="font-size:14px;color:#e8dcc8">${SYM[t.sign] || ''} The ${t.sign} Gene</div><div style="font-size:11px;color:rgba(255,255,255,0.35)">${(t.chain || t.members || []).map(m => typeof m === 'string' ? m : m.name).join(' → ')}</div></div>`
    } else if (s.type === 'glue') {
      rows += row('The Glue', `${s.data.node.data?.name || '—'} — ${s.data.connectionCount} connections`)
    } else if (s.type === 'elementClash') {
      rows += row('Element Clash', `${s.data.nodeA.data?.name} vs ${s.data.nodeB.data?.name}`, `${s.data.elementA} meets ${s.data.elementB}`)
    } else if (s.type === 'clone') {
      rows += row('The Clone', `${s.data.nodeA.data?.name} & ${s.data.nodeB.data?.name}`, `${s.data.matchCount} matching placements`)
    } else if (s.type === 'venusVibes') {
      rows += row('Venus Vibes', `♀ ${s.data.node.data?.name}`, `Venus in ${s.data.node.data?.innerPlanets?.venus?.sign}`)
    } else if (s.type === 'marsEnergy') {
      rows += row('Mars Energy', `♂ ${s.data.node.data?.name}`, `Mars in ${s.data.node.data?.innerPlanets?.mars?.sign}`)
    } else if (s.type === 'moonMirror') {
      rows += row('Moon Mirror', `${s.data.nodeA.data?.name} & ${s.data.nodeB.data?.name}`, `Shared ${s.data.moonSign} Moon`)
    } else if (s.type === 'oldSoul') {
      rows += row('The Old Soul', `${s.data.node.data?.name}`, `${s.data.earthCount} Earth placements`)
    } else if (s.type === 'rebel') {
      rows += row('The Rebel', `${s.data.node.data?.name}`, `${s.data.airCount} Air placements`)
    } else if (s.type === 'genBridge') {
      rows += row('Generational Bridge', `${s.data.parent.data?.name} → ${s.data.child.data?.name}`, `${s.data.sign} passed down`)
    } else if (s.type === 'rareOne') {
      rows += row('The Rare One', `${SYM[s.data.node.data?.sign] || ''} ${s.data.node.data?.name}`, `Only ${s.data.node.data?.sign} in the chart`)
    }
  }
  const stats = `<div style="display:flex;gap:24px;margin:16px 0"><div style="text-align:center"><span style="font-size:24px;color:#c9a84c">${digData.memberCount}</span><div style="font-size:10px;color:rgba(255,255,255,0.35)">members</div></div>${(digData.topBonds?.length ?? 0) > 0 ? `<div style="text-align:center"><span style="font-size:24px;color:#b8a0d4">${digData.topBonds.length}</span><div style="font-size:10px;color:rgba(255,255,255,0.35)">bonds</div></div>` : ''}${(digData.signThreadList?.length ?? 0) > 0 ? `<div style="text-align:center"><span style="font-size:24px;color:#5bc8f5">${digData.signThreadList.length}</span><div style="font-size:10px;color:rgba(255,255,255,0.35)">threads</div></div>` : ''}</div>`
  return `<div style="padding:32px;font-family:Raleway,sans-serif;color:#e8dcc8;max-width:420px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(255,255,255,0.3);margin-bottom:4px">The DIG</div><div style="font-size:22px;font-family:Cinzel,serif;color:#c9a84c;margin-bottom:20px">${name}</div>${rows}${stats}<div style="font-size:9px;color:rgba(255,255,255,0.2);margin-top:12px">✦ AstroDig · Jupiter Digital</div></div>`
}
