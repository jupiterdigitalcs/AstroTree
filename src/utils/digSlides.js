/**
 * Dynamically selects 5-7 slides for The DIG based on chart data.
 * Each slide: { type, data, mood }
 *   type  → maps to a slide component
 *   data  → props for that slide
 *   mood  → background theme (starfield, fire, water, earth, air, constellation, orbits)
 */

const ELEMENT_MOOD = { Fire: 'fire', Earth: 'earth', Air: 'air', Water: 'water' }

export function buildSlides(digData) {
  const slides = []

  // 1. Intro — always
  slides.push({
    type: 'intro',
    data: { memberCount: digData.memberCount, familyName: digData.familyName },
    mood: 'starfield',
  })

  // 2. Family Signature — always
  slides.push({
    type: 'signature',
    data: {
      dominant: digData.dominant,
      dominantModality: digData.dominantModality,
      masculine: digData.masculine,
      feminine: digData.feminine,
      total: digData.total,
      missingElements: digData.missingElements,
      signatureDesc: digData.signatureDesc,
    },
    mood: ELEMENT_MOOD[digData.dominant] || 'starfield',
  })

  // 3. Rarest Bond — if notable bonds exist
  if (digData.topBonds?.length > 0) {
    const bond = digData.topBonds[0]
    slides.push({
      type: 'rarestBond',
      data: {
        bond,
        totalBonds: digData.topBonds.length,
        rareCount: digData.topBonds.filter(b => b.noteType === 'cosmic-echo' || b.noteType === 'rare-alignment').length,
      },
      mood: 'orbits',
    })
  }

  // 4. Zodiac Thread — if threads exist
  if (digData.signThreadList?.length > 0) {
    const thread = digData.signThreadList[0] // longest thread
    slides.push({
      type: 'zodiacThread',
      data: { thread, totalThreads: digData.signThreadList.length },
      mood: 'constellation',
    })
  }

  // 5. Lone Wolf — if someone is the only element and a bridge
  const loneWolf = digData.memberRoles?.find(r => r.isOnlyElement)
  if (loneWolf) {
    slides.push({
      type: 'loneWolf',
      data: { role: loneWolf },
      mood: ELEMENT_MOOD[loneWolf.node.data.element] || 'starfield',
    })
  }

  // 6. Pluto Generations — if 2+ generations
  if (digData.plutoGroups?.length >= 2) {
    slides.push({
      type: 'plutoGens',
      data: { groups: digData.plutoGroups },
      mood: 'starfield',
    })
  }

  // If we have fewer than 5 content slides (excl intro+outro), add couple if available
  if (slides.length < 5 && digData.couples?.length > 0) {
    const couple = digData.couples[0]
    slides.push({
      type: 'couple',
      data: { couple },
      mood: 'orbits',
    })
  }

  // 7. Outro — always
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

  // Cap at 7 slides (intro + 5 content + outro)
  if (slides.length > 7) {
    const intro = slides[0]
    const outro = slides[slides.length - 1]
    const content = slides.slice(1, -1).slice(0, 5)
    return [intro, ...content, outro]
  }

  return slides
}
