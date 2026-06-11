import { describe, it, expect } from 'vitest'
import { buildSlides, buildDigSummaryHtml } from './digSlides.js'

// ── Fixtures ──────────────────────────────────────────────────────────────────
// Nodes mirror the React Flow shape produced by buildNodeData (treeHelpers.js):
// astrology data lives on node.data (sign, element, moonSign, innerPlanets, …).

function makeNode(id, data) {
  return { id, type: 'astro', position: { x: 0, y: 0 }, data: { name: id, ...data } }
}

function makeDigData(nodes, overrides = {}) {
  return {
    nodes,
    edges: [],
    memberCount: nodes.length,
    familyName: 'family',
    dominant: 'Fire',
    dominantModality: 'Cardinal',
    masculine: 0,
    feminine: 0,
    total: nodes.length,
    ...overrides,
  }
}

function types(slides) {
  return slides.map(s => s.type)
}

// Rich five-member chart that triggers nearly every candidate slide.
function buildRichDigData() {
  const ava = makeNode('n1', {
    name: 'Ava', sign: 'Aries', element: 'Fire', sunDegree: 5,
    moonSign: 'Leo', moonDegree: 10,
    innerPlanets: { mercury: { sign: 'Aries', degree: 8 }, venus: { sign: 'Leo', degree: 12 }, mars: { sign: 'Sagittarius', degree: 20 } },
  })
  const ben = makeNode('n2', {
    name: 'Ben', sign: 'Cancer', element: 'Water', sunDegree: 6,
    moonSign: 'Scorpio', moonDegree: 15,
    innerPlanets: { mercury: { sign: 'Cancer', degree: 9 }, venus: { sign: 'Pisces', degree: 2 }, mars: { sign: 'Scorpio', degree: 18 } },
  })
  const cleo = makeNode('n3', {
    name: 'Cleo', sign: 'Taurus', element: 'Earth', sunDegree: 10,
    moonSign: 'Virgo', moonDegree: 5,
    innerPlanets: { mercury: { sign: 'Taurus', degree: 12 }, venus: { sign: 'Capricorn', degree: 3 }, mars: { sign: 'Virgo', degree: 25 } },
  })
  const dan = makeNode('n4', {
    name: 'Dan', sign: 'Gemini', element: 'Air', sunDegree: 14,
    moonSign: 'Aquarius', moonDegree: 8,
    innerPlanets: { mercury: { sign: 'Gemini', degree: 20 }, venus: { sign: 'Libra', degree: 6 }, mars: { sign: 'Aquarius', degree: 11 } },
  })
  // Eve is an exact placement clone of Ava (clone + moonMirror + hotspot fodder)
  const eve = makeNode('n5', {
    name: 'Eve', sign: 'Aries', element: 'Fire', sunDegree: 5,
    moonSign: 'Leo', moonDegree: 10,
    innerPlanets: { mercury: { sign: 'Aries', degree: 8 }, venus: { sign: 'Leo', degree: 12 }, mars: { sign: 'Sagittarius', degree: 20 } },
  })
  const nodes = [ava, ben, cleo, dan, eve]
  return makeDigData(nodes, {
    edges: [{ id: 'e1', source: 'n1', target: 'n5', data: { relationType: 'parent' } }],
    topBonds: [{ a: ava, b: ben, title: 'Strongest cosmic bond' }],
    signThreadList: [{ sign: 'Aries', chain: ['Ava', 'Eve'] }],
    aspectThreads: {
      totalCount: 2,
      heredThreads: [{ planet1: 'Sun', planet2: 'Moon', aspect: 'trine', blurb: 'Sun trine Moon runs in the family', chainNames: 'Ava → Eve' }],
      rareBonds: [],
      famSigs: [],
    },
  })
}

// ── buildSlides — minimal input ───────────────────────────────────────────────

describe('buildSlides — minimal input', () => {
  it('returns only intro, vibeCheck, outro for an empty chart', () => {
    const slides = buildSlides(makeDigData([]))
    expect(types(slides)).toEqual(['intro', 'vibeCheck', 'outro'])
  })

  it('returns only intro, vibeCheck, outro for a single member', () => {
    const slides = buildSlides(makeDigData([makeNode('n1', { sign: 'Aries', element: 'Fire', moonSign: 'Leo' })]))
    expect(types(slides)).toEqual(['intro', 'vibeCheck', 'outro'])
  })

  it('intro carries memberCount and familyName, outro carries bond/thread counts', () => {
    const slides = buildSlides(makeDigData([], { memberCount: 0, familyName: 'group' }))
    const intro = slides[0]
    const outro = slides[slides.length - 1]
    expect(intro.type).toBe('intro')
    expect(intro.data).toEqual({ memberCount: 0, familyName: 'group' })
    expect(intro.mood).toBe('starfield')
    expect(outro.type).toBe('outro')
    expect(outro.data.bondCount).toBe(0)
    expect(outro.data.threadCount).toBe(0)
  })
})

// ── buildSlides — vibeCheck (always second) ───────────────────────────────────

describe('buildSlides — vibeCheck slide', () => {
  it('computes dominant element, counts, and missing elements from nodes', () => {
    const nodes = [
      makeNode('n1', { sign: 'Aries', element: 'Fire' }),
      makeNode('n2', { sign: 'Leo', element: 'Fire' }),
    ]
    const slides = buildSlides(makeDigData(nodes))
    const vibe = slides[1]
    expect(vibe.type).toBe('vibeCheck')
    expect(vibe.data.dominant).toBe('Fire')
    expect(vibe.data.elementCounts).toEqual({ Fire: 2, Earth: 0, Air: 0, Water: 0 })
    expect(vibe.data.missingElements).toEqual(['Earth', 'Air', 'Water'])
    expect(vibe.data.collectiveTotal).toBe(2)
    expect(vibe.mood).toBe('fire')
  })
})

// ── buildSlides — deterministic ordering ──────────────────────────────────────

describe('buildSlides — ordering and structure', () => {
  it('two-member fire/earth chart yields exact sequence intro → vibeCheck → superlative → oldSoul → outro', () => {
    const nodes = [
      makeNode('n1', { name: 'Blaze', sign: 'Aries', element: 'Fire', moonSign: 'Leo' }),
      makeNode('n2', { name: 'Stone', sign: 'Taurus', element: 'Earth', moonSign: 'Virgo' }),
    ]
    const slides = buildSlides(makeDigData(nodes))
    expect(types(slides)).toEqual(['intro', 'vibeCheck', 'superlative', 'oldSoul', 'outro'])

    const sup = slides[2]
    expect(sup.data.node.id).toBe('n1')
    expect(sup.data.title).toBe('The Spark')
    expect(sup.data.sub.length).toBeGreaterThan(0)
    expect(sup.data.score).toBe(2) // sun + moon both Fire
    expect(sup.data.total).toBe(2) // only 2 known placements
    expect(sup.mood).toBe('fire')

    const anchor = slides[3]
    expect(anchor.data.node.id).toBe('n2')
    expect(anchor.data.earthCount).toBe(2)
    expect(anchor.mood).toBe('earth')
  })

  it('rich chart is capped at 12 slides with intro first and outro last, in tier order', () => {
    const slides = buildSlides(buildRichDigData())
    expect(slides.length).toBe(12)
    expect(types(slides)).toEqual([
      'intro', 'vibeCheck', 'superlative', 'cosmicDuo', 'elementClash',
      'cosmicDNA', 'genBridge', 'aspectThreads', 'moonMirror',
      'emotionalForecast', 'wildcard', 'outro',
    ])
  })

  it('rich chart spreads features across members (wildcard skips already-featured nodes)', () => {
    const slides = buildSlides(buildRichDigData())
    const wildcard = slides.find(s => s.type === 'wildcard')
    // Ben (zero Fire) was already featured by cosmicDuo, so wildcard picks Cleo
    expect(wildcard.data.node.data.name).toBe('Cleo')
    expect(wildcard.data.familyElement).toBe('Fire')
  })
})

// ── buildSlides — condition-gated slides ──────────────────────────────────────

describe('buildSlides — cosmicDuo and cosmicDNA gating', () => {
  const nodes = [
    makeNode('n1', { sign: 'Aries', element: 'Fire' }),
    makeNode('n2', { sign: 'Cancer', element: 'Water' }),
  ]

  it('cosmicDuo appears when topBonds is non-empty and feeds outro bondCount', () => {
    const bond = { a: nodes[0], b: nodes[1], title: 'Sun trine Moon' }
    const slides = buildSlides(makeDigData(nodes, { topBonds: [bond] }))
    const duo = slides.find(s => s.type === 'cosmicDuo')
    expect(duo).toBeDefined()
    expect(duo.data.bond).toBe(bond)
    expect(duo.data.totalBonds).toBe(1)
    expect(duo.mood).toBe('orbits')
    expect(slides[slides.length - 1].data.bondCount).toBe(1)
  })

  it('cosmicDuo and cosmicDNA are absent without topBonds/signThreadList', () => {
    const slides = buildSlides(makeDigData(nodes))
    expect(types(slides)).not.toContain('cosmicDuo')
    expect(types(slides)).not.toContain('cosmicDNA')
  })

  it('cosmicDNA uses the first sign thread and reports total threads', () => {
    const threads = [{ sign: 'Aries', chain: ['A', 'B'] }, { sign: 'Leo', chain: ['C', 'D'] }]
    const slides = buildSlides(makeDigData(nodes, { signThreadList: threads }))
    const dna = slides.find(s => s.type === 'cosmicDNA')
    expect(dna.data.thread).toBe(threads[0])
    expect(dna.data.totalThreads).toBe(2)
  })
})

describe('buildSlides — aspectThreads gating', () => {
  it('prefers heredThreads over rareBonds and famSigs', () => {
    const aspectThreads = {
      totalCount: 3,
      heredThreads: [{ planet1: 'Sun', planet2: 'Moon', aspect: 'trine', blurb: 'hered blurb', chainNames: 'A → B' }],
      rareBonds: [{ planet1: 'Venus', planet2: 'Mars', aspect: 'square', blurb: 'rare blurb', chainNames: 'C & D' }],
      famSigs: [],
    }
    const slides = buildSlides(makeDigData([], { aspectThreads }))
    const slide = slides.find(s => s.type === 'aspectThreads')
    expect(slide.data.topType).toBe('heredThread')
    expect(slide.data.planetLabel).toBe('Sun–Moon')
    expect(slide.data.blurb).toBe('hered blurb')
    expect(slide.data.totalCount).toBe(3)
  })

  it('falls back to rareBonds when heredThreads is empty', () => {
    const aspectThreads = {
      totalCount: 1,
      heredThreads: [],
      rareBonds: [{ planet1: 'Venus', planet2: 'Mars', aspect: 'square', blurb: 'rare blurb', chainNames: 'C & D' }],
      famSigs: [],
    }
    const slides = buildSlides(makeDigData([], { aspectThreads }))
    const slide = slides.find(s => s.type === 'aspectThreads')
    expect(slide.data.topType).toBe('rareBond')
    expect(slide.data.aspect).toBe('square')
  })
})

describe('buildSlides — elementClash gating', () => {
  it('triggers when two members have 3+ opposing-element placement pairs (Fire vs Water)', () => {
    const nodes = [
      makeNode('n1', { sign: 'Aries', element: 'Fire', moonSign: 'Leo' }),     // 2 Fire
      makeNode('n2', { sign: 'Cancer', element: 'Water', moonSign: 'Scorpio' }), // 2 Water → 4 clash pairs
    ]
    const slides = buildSlides(makeDigData(nodes))
    const clash = slides.find(s => s.type === 'elementClash')
    expect(clash).toBeDefined()
    expect(clash.data.elementA).toBe('Fire')
    expect(clash.data.elementB).toBe('Water')
    expect(clash.data.clashScore).toBe(4)
    expect(clash.mood).toBe('fire')
  })

  it('does not trigger for non-opposing elements (Fire vs Earth)', () => {
    const nodes = [
      makeNode('n1', { sign: 'Aries', element: 'Fire', moonSign: 'Leo' }),
      makeNode('n2', { sign: 'Taurus', element: 'Earth', moonSign: 'Virgo' }),
    ]
    const slides = buildSlides(makeDigData(nodes))
    expect(types(slides)).not.toContain('elementClash')
  })
})

describe('buildSlides — genBridge gating', () => {
  const parent = makeNode('p1', { name: 'Mom', sign: 'Aries', element: 'Fire' })
  const edge = { id: 'e1', source: 'p1', target: 'c1', data: { relationType: 'parent' } }

  it('triggers when a parent and child share a sign across different planets', () => {
    const child = makeNode('c1', { name: 'Kid', sign: 'Taurus', element: 'Earth', moonSign: 'Aries' })
    const slides = buildSlides(makeDigData([parent, child], { edges: [edge] }))
    const bridge = slides.find(s => s.type === 'genBridge')
    expect(bridge).toBeDefined()
    expect(bridge.data.sign).toBe('Aries')
    expect(bridge.data.parentPlanet).toBe('sun')
    expect(bridge.data.childPlanet).toBe('moon')
    expect(bridge.data.parent.id).toBe('p1')
    expect(bridge.data.child.id).toBe('c1')
  })

  it('does not trigger when the shared sign is on the same planet, or no sign is shared', () => {
    const sameSunChild = makeNode('c1', { name: 'Kid', sign: 'Aries', element: 'Fire' })
    const noShareChild = makeNode('c1', { name: 'Kid', sign: 'Taurus', element: 'Earth', moonSign: 'Virgo' })
    expect(types(buildSlides(makeDigData([parent, sameSunChild], { edges: [edge] })))).not.toContain('genBridge')
    expect(types(buildSlides(makeDigData([parent, noShareChild], { edges: [edge] })))).not.toContain('genBridge')
  })
})

describe('buildSlides — moonMirror gating', () => {
  it('triggers with two members sharing a moon sign', () => {
    const nodes = [
      makeNode('n1', { sign: 'Aries', element: 'Fire', moonSign: 'Cancer' }),
      makeNode('n2', { sign: 'Leo', element: 'Fire', moonSign: 'Cancer' }),
    ]
    const slides = buildSlides(makeDigData(nodes))
    const mirror = slides.find(s => s.type === 'moonMirror')
    expect(mirror).toBeDefined()
    expect(mirror.data.moonSign).toBe('Cancer')
    expect(mirror.data.noSharedMoons).toBe(false)
    expect([mirror.data.nodeA.id, mirror.data.nodeB.id].sort()).toEqual(['n1', 'n2'])
    expect(mirror.mood).toBe('water')
  })

  it('emits the "all different" variant with 4+ distinct moon signs', () => {
    const nodes = [
      makeNode('n1', { sign: 'Aries', element: 'Fire', moonSign: 'Taurus' }),
      makeNode('n2', { sign: 'Gemini', element: 'Air', moonSign: 'Cancer' }),
      makeNode('n3', { sign: 'Leo', element: 'Fire', moonSign: 'Virgo' }),
      makeNode('n4', { sign: 'Sagittarius', element: 'Fire', moonSign: 'Scorpio' }),
    ]
    const slides = buildSlides(makeDigData(nodes))
    const mirror = slides.find(s => s.type === 'moonMirror')
    expect(mirror).toBeDefined()
    expect(mirror.data.noSharedMoons).toBe(true)
    expect(mirror.data.moonCount).toBe(4)
  })

  it('does not trigger with only 2-3 members and no shared moons', () => {
    const nodes = [
      makeNode('n1', { sign: 'Aries', element: 'Fire', moonSign: 'Taurus' }),
      makeNode('n2', { sign: 'Gemini', element: 'Air', moonSign: 'Cancer' }),
    ]
    expect(types(buildSlides(makeDigData(nodes)))).not.toContain('moonMirror')
  })
})

describe('buildSlides — individual spotlight slides', () => {
  it('emotionalForecast features the most water-heavy member with a moon vibe', () => {
    const nodes = [
      makeNode('n1', { sign: 'Cancer', element: 'Water', moonSign: 'Scorpio' }), // 2 Water
      makeNode('n2', { sign: 'Leo', element: 'Fire' }),
    ]
    const slides = buildSlides(makeDigData(nodes))
    const forecast = slides.find(s => s.type === 'emotionalForecast')
    expect(forecast).toBeDefined()
    expect(forecast.data.node.id).toBe('n1')
    expect(forecast.data.waterCount).toBe(2)
    expect(forecast.data.moonVibe).toMatch(/intensity/)
    expect(forecast.mood).toBe('water')
  })

  it('wildcard picks a zero-dominant-element member, then rareOne prefers unfeatured members', () => {
    const nodes = [
      makeNode('n1', { sign: 'Leo', element: 'Fire' }),
      makeNode('n2', { sign: 'Aries', element: 'Fire' }),
      makeNode('n3', { sign: 'Taurus', element: 'Earth' }),
    ]
    const slides = buildSlides(makeDigData(nodes, { dominant: 'Fire' }))
    const wildcard = slides.find(s => s.type === 'wildcard')
    expect(wildcard.data.node.id).toBe('n3') // zero Fire placements
    expect(wildcard.data.familyElement).toBe('Fire')
    // All three suns are unique, but n3 was just featured by wildcard → rareOne takes n1
    const rare = slides.find(s => s.type === 'rareOne')
    expect(rare.data.node.id).toBe('n1')
    expect(rare.data.totalMembers).toBe(3)
  })

  it('clone triggers on 2+ matching placements (and clash below threshold stays hidden)', () => {
    const nodes = [
      makeNode('n1', { name: 'Twin A', sign: 'Aries', element: 'Fire', moonSign: 'Cancer' }),
      makeNode('n2', { name: 'Twin B', sign: 'Aries', element: 'Fire', moonSign: 'Cancer' }),
    ]
    const slides = buildSlides(makeDigData(nodes))
    const clone = slides.find(s => s.type === 'clone')
    expect(clone).toBeDefined()
    expect(clone.data.matchCount).toBe(2)
    expect(clone.data.matches).toContain('☀ sun in Aries')
    expect(clone.data.matches).toContain('☽ moon in Cancer')
    // Fire vs Water pairs here only score 2 — below the 3+ clash threshold
    expect(types(slides)).not.toContain('elementClash')
  })
})

describe('buildSlides — group pattern slides', () => {
  it('venusVibes and marsEnergy summarize the top element when 2+ members have those planets', () => {
    const nodes = [
      makeNode('n1', { name: 'A', sign: 'Aries', element: 'Fire', innerPlanets: { venus: { sign: 'Gemini' }, mars: { sign: 'Leo' } } }),
      makeNode('n2', { name: 'B', sign: 'Taurus', element: 'Earth', innerPlanets: { venus: { sign: 'Libra' }, mars: { sign: 'Aries' } } }),
    ]
    const slides = buildSlides(makeDigData(nodes))
    const venus = slides.find(s => s.type === 'venusVibes')
    expect(venus.data.topElement).toBe('Air')
    expect(venus.data.topCount).toBe(2)
    expect(venus.data.topNames).toEqual(['A', 'B'])
    const mars = slides.find(s => s.type === 'marsEnergy')
    expect(mars.data.topElement).toBe('Fire')
    expect(mars.data.topCount).toBe(2)
  })

  it('hotspot triggers when 3+ planets from 2+ people cluster within orb', () => {
    const nodes = [
      makeNode('n1', { name: 'Asha', sign: 'Leo', element: 'Fire', sunDegree: 5 }),
      makeNode('n2', { name: 'Bo', sign: 'Aries', element: 'Fire', moonSign: 'Leo', moonDegree: 8 }),
      makeNode('n3', { name: 'Cy', sign: 'Taurus', element: 'Earth', innerPlanets: { venus: { sign: 'Leo', degree: 3 } } }),
    ]
    const slides = buildSlides(makeDigData(nodes))
    const hotspot = slides.find(s => s.type === 'hotspot')
    expect(hotspot).toBeDefined()
    expect(hotspot.data.spot.sign).toBe('Leo')
    expect(hotspot.data.spot.peopleCount).toBe(3)
    expect(hotspot.mood).toBe('fire')
  })

  it('hotspot does not trigger without degree data', () => {
    const nodes = [
      makeNode('n1', { sign: 'Leo', element: 'Fire' }),
      makeNode('n2', { sign: 'Leo', element: 'Fire', moonSign: 'Leo' }),
      makeNode('n3', { sign: 'Leo', element: 'Fire' }),
    ]
    expect(types(buildSlides(makeDigData(nodes)))).not.toContain('hotspot')
  })
})

describe('buildSlides — connector and bridge slides', () => {
  // Four suns at Aries 10°, Aries 12°, Leo 10°, Sagittarius 10° — everyone
  // aspects everyone (conjunction + trines), first node wins the tie.
  // n1 also carries tight Mercury/Venus squares to n2 so their aspect count
  // clears findBridgePerson's 5-aspect floor without making n1 an element
  // superlative (which would feature them and suppress the bridge slide)
  const fireSuns = () => [
    makeNode('n1', {
      name: 'W', sign: 'Aries', element: 'Fire', sunDegree: 10,
      innerPlanets: { mercury: { sign: 'Capricorn', degree: 12 }, venus: { sign: 'Cancer', degree: 13 } },
    }),
    makeNode('n2', { name: 'X', sign: 'Aries', element: 'Fire', sunDegree: 12 }),
    makeNode('n3', { name: 'Y', sign: 'Leo', element: 'Fire', sunDegree: 10 }),
    makeNode('n4', { name: 'Z', sign: 'Sagittarius', element: 'Fire', sunDegree: 10 }),
  ]

  it('bridge appears (without connector) when the bridge person has no Air/Libra/Venus support', () => {
    const slides = buildSlides(makeDigData(fireSuns()))
    const bridge = slides.find(s => s.type === 'bridge')
    expect(bridge).toBeDefined()
    expect(bridge.data.node.id).toBe('n1')
    expect(bridge.data.aspectCount).toBeGreaterThanOrEqual(3)
    expect(types(slides)).not.toContain('connector')
  })

  it('connector appears when the bridge person has Air energy — and suppresses the bridge slide for the same person', () => {
    const nodes = fireSuns()
    nodes[0].data.moonSign = 'Gemini'
    nodes[0].data.moonDegree = 10 // sextiles/opposes the other suns within 4°
    const slides = buildSlides(makeDigData(nodes))
    const connector = slides.find(s => s.type === 'connector')
    expect(connector).toBeDefined()
    expect(connector.data.node.id).toBe('n1')
    expect(connector.data.chartBacked).toBe(true)
    expect(types(slides)).not.toContain('bridge')
  })
})

// ── buildSlides — uncertain & missing data ────────────────────────────────────

describe('buildSlides — uncertain and missing data', () => {
  it('skips placements with ingress warnings when no birth time is set', () => {
    const nodes = [
      makeNode('n1', { sign: 'Aries', element: 'Fire', moonSign: 'Leo', ingressWarnings: [{ planet: 'moon' }] }),
      makeNode('n2', { sign: 'Taurus', element: 'Earth' }),
    ]
    const slides = buildSlides(makeDigData(nodes))
    // Moon is uncertain → n1 only has 1 confident Fire placement → no superlative
    expect(types(slides)).toEqual(['intro', 'vibeCheck', 'outro'])
    expect(slides[1].data.collectiveTotal).toBe(2) // uncertain moon excluded
  })

  it('counts the same placement once a birth time resolves the ingress warning', () => {
    const nodes = [
      makeNode('n1', { sign: 'Aries', element: 'Fire', moonSign: 'Leo', birthTime: '08:30', ingressWarnings: [{ planet: 'moon' }] }),
      makeNode('n2', { sign: 'Taurus', element: 'Earth' }),
    ]
    const slides = buildSlides(makeDigData(nodes))
    expect(types(slides)).toContain('superlative')
    expect(slides[1].data.collectiveTotal).toBe(3)
  })

  it('handles members missing moon/planet data (and an empty data node) without throwing', () => {
    const nodes = [
      makeNode('n1', { sign: 'Aries', element: 'Fire' }),
      makeNode('n2', { sign: 'Gemini', element: 'Air' }),
      makeNode('n3', {}),
    ]
    const slides = buildSlides(makeDigData(nodes, { dominant: 'Air' }))
    expect(slides[0].type).toBe('intro')
    expect(slides[slides.length - 1].type).toBe('outro')
    const t = types(slides)
    expect(t).not.toContain('moonMirror')
    expect(t).not.toContain('emotionalForecast')
    expect(t).not.toContain('venusVibes')
    expect(t).not.toContain('marsEnergy')
  })
})

// ── buildDigSummaryHtml ───────────────────────────────────────────────────────

describe('buildDigSummaryHtml', () => {
  it('uses chartTitle when provided and falls back to Your Group / Your Family', () => {
    const empty = makeDigData([])
    expect(buildDigSummaryHtml(empty, [], 'The Andersons')).toContain('The Andersons')
    expect(buildDigSummaryHtml({ ...empty, familyName: 'group' }, [], null)).toContain('Your Group')
    expect(buildDigSummaryHtml({ ...empty, familyName: 'family' }, [], null)).toContain('Your Family')
  })

  it('lists member names, member count, and brand footer', () => {
    const nodes = [
      makeNode('n1', { name: 'Blaze', sign: 'Aries', element: 'Fire', moonSign: 'Leo' }),
      makeNode('n2', { name: 'Stone', sign: 'Taurus', element: 'Earth', moonSign: 'Virgo' }),
    ]
    const digData = makeDigData(nodes)
    const html = buildDigSummaryHtml(digData, buildSlides(digData), 'Test Chart')
    expect(html).toContain('Blaze · Stone')
    expect(html).toContain('AstroDig')
    expect(html).toContain('The DIG')
  })

  it('renders rows for content slides (superlative title, anchor earth count)', () => {
    const nodes = [
      makeNode('n1', { name: 'Blaze', sign: 'Aries', element: 'Fire', moonSign: 'Leo' }),
      makeNode('n2', { name: 'Stone', sign: 'Taurus', element: 'Earth', moonSign: 'Virgo' }),
    ]
    const digData = makeDigData(nodes)
    const html = buildDigSummaryHtml(digData, buildSlides(digData), 'Test Chart')
    expect(html).toContain('The Spark')
    expect(html).toContain('The Anchor')
    expect(html).toContain('2 Earth placements')
  })

  it('renders venusVibes and marsEnergy rows from group-level slide data', () => {
    const nodes = [
      makeNode('n1', { name: 'A', sign: 'Aries', element: 'Fire', innerPlanets: { venus: { sign: 'Gemini' }, mars: { sign: 'Leo' } } }),
      makeNode('n2', { name: 'B', sign: 'Taurus', element: 'Earth', innerPlanets: { venus: { sign: 'Libra' }, mars: { sign: 'Aries' } } }),
    ]
    const digData = makeDigData(nodes)
    const slides = buildSlides(digData)
    expect(types(slides)).toContain('venusVibes')
    const html = buildDigSummaryHtml(digData, slides, 'Fixed')
    expect(html).toContain('Venus Vibes')
    expect(html).toContain('Venus in Air signs')
    expect(html).toContain('A, B')
  })

  it('renders the no-shared-moons moonMirror variant without throwing', () => {
    const nodes = [
      makeNode('n1', { sign: 'Aries', element: 'Fire', moonSign: 'Taurus' }),
      makeNode('n2', { sign: 'Gemini', element: 'Air', moonSign: 'Cancer' }),
      makeNode('n3', { sign: 'Leo', element: 'Fire', moonSign: 'Virgo' }),
      makeNode('n4', { sign: 'Sagittarius', element: 'Fire', moonSign: 'Scorpio' }),
    ]
    const digData = makeDigData(nodes)
    const slides = buildSlides(digData)
    expect(slides.find(s => s.type === 'moonMirror')?.data.noSharedMoons).toBe(true)
    const html = buildDigSummaryHtml(digData, slides, 'Fixed')
    expect(html).toContain('Moon Mirror')
    expect(html).toContain('no twins')
  })
})
