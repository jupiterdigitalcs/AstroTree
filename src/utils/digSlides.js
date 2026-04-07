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

// ── Slide builder ───────────────────────────────────────────────────────────

export function buildSlides(digData) {
  const slides = []
  const { nodes } = digData

  // 1. Intro — always
  slides.push({
    type: 'intro',
    data: { memberCount: digData.memberCount, familyName: digData.familyName },
    mood: 'starfield',
  })

  // 2. Family Vibe Check — the signature but fun
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

  // 3. Superlative — pick the person with the strongest sign personality
  if (nodes.length >= 2) {
    // Find who has the most placements in their sun sign's element (most "on brand")
    let bestNode = null, bestScore = 0
    nodes.forEach(n => {
      const el = n.data?.element
      if (!el) return
      const score = elementWeight(n, el)
      if (score > bestScore) { bestScore = score; bestNode = n }
    })
    if (bestNode && bestScore >= 2) {
      const sup = SIGN_SUPERLATIVES[bestNode.data.sign]
      if (sup) {
        slides.push({
          type: 'superlative',
          data: { node: bestNode, title: sup.title, sub: sup.sub, score: bestScore, total: totalPlanetCount(bestNode) },
          mood: ELEMENT_MOOD[bestNode.data.element] || 'starfield',
        })
      }
    }
  }

  // 4. Emotional Forecast — the most emotional person (most Water placements)
  if (nodes.length >= 2) {
    let mostEmotional = null, waterMax = 0
    nodes.forEach(n => {
      const w = elementWeight(n, 'Water')
      if (w > waterMax) { waterMax = w; mostEmotional = n }
    })
    if (mostEmotional && waterMax >= 2 && mostEmotional.data?.moonSign && MOON_VIBES[mostEmotional.data.moonSign]) {
      slides.push({
        type: 'emotionalForecast',
        data: { node: mostEmotional, moonVibe: MOON_VIBES[mostEmotional.data.moonSign], waterCount: waterMax },
        mood: 'water',
      })
    }
  }

  // 5. Power Couple or Cosmic Duo — rarest bond but fun framing
  if (digData.topBonds?.length > 0) {
    const bond = digData.topBonds[0]
    slides.push({
      type: 'cosmicDuo',
      data: { bond, totalBonds: digData.topBonds.length },
      mood: 'orbits',
    })
  }

  // 6. The Wildcard — person whose chart is most different from family dominant
  if (nodes.length >= 3) {
    const domEl = digData.dominant
    let wildcard = null, lowestMatch = 999
    nodes.forEach(n => {
      const match = elementWeight(n, domEl)
      if (match < lowestMatch) { lowestMatch = match; wildcard = n }
    })
    if (wildcard && lowestMatch === 0) {
      slides.push({
        type: 'wildcard',
        data: { node: wildcard, familyElement: domEl },
        mood: ELEMENT_MOOD[wildcard.data?.element] || 'starfield',
      })
    }
  }

  // 7. Zodiac Thread — if exists, fun framing
  if (digData.signThreadList?.length > 0) {
    const thread = digData.signThreadList[0]
    slides.push({
      type: 'cosmicDNA',
      data: { thread, totalThreads: digData.signThreadList.length },
      mood: 'constellation',
    })
  }

  // 8. Outro — always
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

  // Cap at 7
  if (slides.length > 7) {
    const intro = slides[0]
    const outro = slides[slides.length - 1]
    const content = slides.slice(1, -1).slice(0, 5)
    return [intro, ...content, outro]
  }

  return slides
}
