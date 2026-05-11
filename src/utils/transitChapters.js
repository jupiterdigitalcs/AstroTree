/**
 * transitChapters.js — Plain-English life chapter names for transit events
 *
 * Maps (transitingPlanet, aspect, natalPlanet) → { title, description, frequency, rarity }
 * Key format: 'TransitingPlanet_aspect_NatalPlanet'
 *
 * ── Frequency accuracy notes ─────────────────────────────────────────────────
 * Cross-transits (outer planet → different natal planet):
 *   Timing is chart-dependent — we describe how often, not when.
 *   Orbital periods: Jupiter ~12yr | Saturn ~29yr | Uranus ~84yr | Neptune ~165yr | Pluto ~248yr
 *   Aspect cycle = period ÷ (360 / angle): sq = period÷4, opp = period÷2, conj = full period
 *
 * Self-returns (planet conjunct its OWN natal position — e.g. Saturn Return):
 *   Ages ARE predictable. Only these get age references.
 *
 * rarity: 'common' | 'notable' | 'rare' | 'once'
 *   common  — 6+ times in a typical lifetime
 *   notable — 3–5 times in a lifetime
 *   rare    — 1–2 times in a lifetime
 *   once    — most people experience it 0–1 times
 */

const CHAPTERS = {
  // ── Jupiter (~12yr orbit) ────────────────────────────────────────────────────
  // conj/opp: every ~12yr → ~7× in an 85yr life
  Jupiter_conjunction_Sun: {
    title:       'A Lucky Break',
    description: 'Doors open. Confidence rises. This is a window to expand — say yes.',
    frequency:   'Every 12 years or so',
    rarity:      'common',
  },
  Jupiter_opposition_Sun: {
    title:       'The Reach',
    description: 'Big opportunity arrives, but it may overextend you. Balance is the lesson.',
    frequency:   'Every 12 years or so',
    rarity:      'common',
  },
  Jupiter_conjunction_Moon: {
    title:       'The Heart Opens',
    description: 'Emotional warmth and generosity flow easily. A feel-good chapter.',
    frequency:   'Every 12 years or so',
    rarity:      'common',
  },
  // Self-return — ages are predictable
  Jupiter_conjunction_Jupiter: {
    title:       'A Fresh Chapter',
    description: 'Your 12-year cycle resets. What new direction is calling you forward?',
    frequency:   'Every 12 years (around age 12, 24, 36, 48…)',
    rarity:      'common',
  },

  // ── Saturn (~29yr orbit) ─────────────────────────────────────────────────────
  // sq:   every ~7yr  → ~10× in a lifetime
  // opp:  every ~14yr → ~5× in a lifetime
  // conj: every ~29yr → ~3× in a lifetime
  Saturn_conjunction_Sun: {
    title:       'The Weight of the World',
    description: 'A demanding stretch. You\'re being asked to build something real — on your own terms.',
    frequency:   'A few times in a lifetime',
    rarity:      'notable',
  },
  Saturn_square_Sun: {
    title:       'The Proving Ground',
    description: 'Obstacles show up to test what you\'re made of. Push through — it compounds.',
    frequency:   'Every 7 years or so',
    rarity:      'common',
  },
  Saturn_opposition_Sun: {
    title:       'Midcourse Correction',
    description: 'A reality check on the path you\'ve built so far. Adjust what isn\'t working.',
    frequency:   'Every 14–15 years',
    rarity:      'notable',
  },
  Saturn_conjunction_Moon: {
    title:       'The Hard Feelings',
    description: 'Emotional weight and responsibility arrive together. Grief, duty, growing pains.',
    frequency:   'A few times in a lifetime',
    rarity:      'notable',
  },
  Saturn_square_Moon: {
    title:       'Processing the Past',
    description: 'What you\'ve been carrying surfaces. This is the season to finally deal with it.',
    frequency:   'Every 7 years or so',
    rarity:      'common',
  },
  Saturn_conjunction_Venus: {
    title:       'Love Gets Real',
    description: 'Relationships are tested for depth. The ones that hold are worth keeping.',
    frequency:   'A few times in a lifetime',
    rarity:      'notable',
  },
  // Self-return — ages are predictable
  Saturn_conjunction_Saturn: {
    title:       'Growing Up for Real',
    description: 'The Saturn Return. A defining life reckoning that reshapes nearly everything.',
    frequency:   'Two or three times in a lifetime (around age 29 and 58)',
    rarity:      'rare',
  },

  // ── Uranus (~84yr orbit) ─────────────────────────────────────────────────────
  // sq:   every ~21yr → ~4× in a lifetime  — timing is chart-dependent
  // opp:  every ~42yr → ~2× in a lifetime  — timing is chart-dependent
  // conj: every ~84yr → 0–1× in a lifetime — timing is chart-dependent
  Uranus_conjunction_Sun: {
    title:       'Lightning Strike',
    description: 'A rare, electric upheaval. Life reinvents itself suddenly, with or without a plan.',
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },
  Uranus_square_Sun: {
    title:       'Breaking Free',
    description: 'A restless pull toward something completely different. It\'s okay to follow it.',
    frequency:   'A few times in a lifetime',
    rarity:      'notable',
  },
  Uranus_opposition_Sun: {
    title:       'The Great Awakening',
    description: 'An electric jolt that reframes everything. What\'s been real, and what\'s been a performance?',
    frequency:   'Once or twice in a lifetime',
    rarity:      'rare',
  },
  Uranus_conjunction_Moon: {
    title:       'The Inner Earthquake',
    description: 'A sudden, electric shift in your emotional world. Who you\'ve been at your core is changing.',
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },
  Uranus_square_Moon: {
    title:       'Emotional Revolution',
    description: 'Your inner world shifts without warning. Old emotional patterns start to break.',
    frequency:   'A few times in a lifetime',
    rarity:      'notable',
  },
  Uranus_opposition_Moon: {
    title:       'Freedom vs. Security',
    description: 'A tension between what nurtures you and what you\'ve outgrown. Both are real.',
    frequency:   'Once or twice in a lifetime',
    rarity:      'rare',
  },
  Uranus_conjunction_Venus: {
    title:       'Everything Changes in Love',
    description: 'Relationships or desires overturn suddenly. What you want is transforming.',
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },

  // ── Neptune (~165yr orbit) ───────────────────────────────────────────────────
  // sq:   every ~82yr → 0–1× in a lifetime
  // conj: every ~165yr → never in a single lifetime
  Neptune_conjunction_Sun: {
    title:       'Becoming Someone New',
    description: 'Identity softens and reshapes slowly. A quiet but total reinvention.',
    frequency:   'Once in a generation',
    rarity:      'once',
  },
  Neptune_square_Sun: {
    title:       'Who Am I, Really?',
    description: 'The fog chapter. Clarity is coming — but not yet. Trust the drift.',
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },
  Neptune_square_Moon: {
    title:       'The Fog',
    description: 'Emotional boundaries dissolve. Intuition rises; grounding is everything.',
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },
  Neptune_conjunction_Venus: {
    title:       'Rose-Colored Everything',
    description: 'Love and creativity reach a dreamy, idealized peak. Beautiful, but hard to see clearly.',
    frequency:   'Once in a generation',
    rarity:      'once',
  },

  // ── Pluto (~248yr orbit, highly eccentric) ───────────────────────────────────
  // sq:       every ~62–124yr (varies widely) → 0–1× in a lifetime
  // conj/opp: every ~248yr → once in multiple generations
  Pluto_conjunction_Sun: {
    title:       'Rebirth',
    description: 'Total transformation of who you are. Nothing looks quite the same after this.',
    frequency:   'Once in a generation',
    rarity:      'once',
  },
  Pluto_square_Sun: {
    title:       'The Pressure Chamber',
    description: 'Deep, unavoidable transformation. What doesn\'t serve you is falling away.',
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },
  Pluto_opposition_Sun: {
    title:       'The Reckoning',
    description: 'Power, control, and truth collide. A chapter of profound and lasting change.',
    frequency:   'Once in a generation',
    rarity:      'once',
  },
  Pluto_conjunction_Moon: {
    title:       'The Underworld',
    description: 'What\'s buried rises. Deep emotional transformation — often through loss or intensity.',
    frequency:   'Once in a generation',
    rarity:      'once',
  },
  Pluto_square_Moon: {
    title:       'Emotional Overhaul',
    description: 'Old wounds surface for healing. Intense, yes — but ultimately freeing.',
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },
  Pluto_conjunction_Venus: {
    title:       'Obsession & Intensity',
    description: 'Love and desire go deep. Power dynamics in relationships come into sharp focus.',
    frequency:   'Once in a generation',
    rarity:      'once',
  },
}

/**
 * Get chapter metadata for a transit combination.
 *
 * @param {string} transitingPlanet — e.g. 'Saturn'
 * @param {string} aspect           — e.g. 'conjunction'
 * @param {string} natalPlanet      — e.g. 'Sun'
 * @returns {{ title, description, frequency, rarity }}
 */
export function getChapter(transitingPlanet, aspect, natalPlanet) {
  const key = `${transitingPlanet}_${aspect}_${natalPlanet}`
  return CHAPTERS[key] ?? {
    title:       `${transitingPlanet} ${aspect} ${natalPlanet}`,
    description: 'A significant planetary influence.',
    frequency:   null,
    rarity:      'notable',
  }
}
