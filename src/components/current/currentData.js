/**
 * currentData.js — Static copy and theme data for "The Current"
 *
 * Planet themes, mood labels, natal target descriptions, and color mappings.
 */

// ── Planet season themes ────────────────────────────────────────────────────

export const PLANET_THEMES = {
  Jupiter: {
    glyph: '♃',
    season: 'Expansion and Opportunity',
    theme: 'Optimism, growth, and forward motion',
    color: '#c9a84c',
    description: 'Your group is in an expansive stretch right now. This energy tends to open doors, boost confidence, and make things feel possible. A good time to say yes. (Jupiter)',
  },
  Saturn: {
    glyph: '♄',
    season: 'Structure and Accountability',
    theme: 'Responsibility, limits, and long-term building',
    color: '#8899cc',
    description: 'Your group is in a stretch that can feel heavy or demanding. This energy often shows up as tests, boundaries, and pressure to get serious about what matters. (Saturn)',
  },
  Uranus: {
    glyph: '♅',
    season: 'Breakthroughs and Disruption',
    theme: 'Sudden shifts, new directions, and freedom',
    color: '#56c8c0',
    description: 'Your group is in a restless, unpredictable stretch. This energy tends to shake up routines and push toward change, even when it feels uncomfortable. (Uranus)',
  },
  Neptune: {
    glyph: '♆',
    season: 'Imagination and Fog',
    theme: 'Intuition, creativity, and blurred edges',
    color: '#7bafd4',
    description: 'Your group is in a dreamy, unclear stretch. Creativity may flow more easily, but clarity can be harder to find. Trust your gut over the details right now. (Neptune)',
  },
  Pluto: {
    glyph: '♇',
    season: 'Transformation and Depth',
    theme: 'Power, change, and letting go',
    color: '#b06cbf',
    description: 'Your group is in a deep, transformative stretch. This energy works beneath the surface. Things that no longer fit tend to fall away on their own. (Pluto)',
  },
}

// ── Natal target descriptions ───────────────────────────────────────────────

export const NATAL_TARGET_THEMES = {
  Sun:     { glyph: '☀', area: 'Identity and purpose',         short: 'identity' },
  Moon:    { glyph: '☽', area: 'Emotions and inner world',     short: 'emotions' },
  Mercury: { glyph: '☿', area: 'Communication and thinking',   short: 'communication' },
  Venus:   { glyph: '♀', area: 'Relationships and values',     short: 'relationships' },
  Mars:    { glyph: '♂', area: 'Action and drive',             short: 'action' },
  Jupiter: { glyph: '♃', area: 'Growth and beliefs',           short: 'growth' },
  Saturn:  { glyph: '♄', area: 'Structure and commitments',    short: 'commitments' },
}

// ── Group headline copy (natal target × mood lean) ─────────────────────────

const HEADLINE_COPY = {
  Sun: {
    ease:      { title: 'Purpose is Opening Up',     desc: 'Identity, direction, and confidence are getting a boost across your group right now. A good stretch for bold moves.' },
    intense:   { title: 'Identity Under Pressure',   desc: 'Who you are and where you are headed is being tested across your group. This energy can feel heavy, but it tends to clarify what actually matters.' },
    mixed:     { title: 'Purpose is in Motion',      desc: 'Your group\'s sense of direction and identity is being activated from multiple angles right now. Some of it flows, some of it pushes.' },
  },
  Moon: {
    ease:      { title: 'Emotions are Flowing',      desc: 'Your group is in an emotionally open stretch. Comfort, warmth, and connection tend to come more easily right now.' },
    intense:   { title: 'Emotions are Running Deep', desc: 'The inner world is stirred up across your group. Big feelings, sensitivity, and emotional processing are the theme.' },
    mixed:     { title: 'The Inner World is Active',  desc: 'Emotions, moods, and inner needs are getting attention across your group. Some of it feels easy, some of it does not.' },
  },
  Mercury: {
    ease:      { title: 'Communication is Flowing',  desc: 'Thinking, conversations, and decisions are moving smoothly across your group right now.' },
    intense:   { title: 'Minds are Busy',            desc: 'Communication, thinking, and mental energy are under pressure across your group. Expect overthinking and important conversations.' },
    mixed:     { title: 'Thinking is Activated',     desc: 'Your group\'s mental energy is being stirred up. Some clarity, some noise. A stretch for processing.' },
  },
  Venus: {
    ease:      { title: 'Relationships are Thriving', desc: 'Love, connection, and what your group values are getting a warm boost right now. A good stretch for closeness.' },
    intense:   { title: 'Relationships are Being Tested', desc: 'Love, values, and what matters to your group is under examination. This energy can feel uncomfortable but tends to deepen what is real.' },
    mixed:     { title: 'Love and Values in Motion', desc: 'Relationships and priorities are being activated across your group. Some warmth, some tension. A stretch for honesty.' },
  },
  Mars: {
    ease:      { title: 'Energy and Drive are Up',   desc: 'Motivation, physical energy, and the impulse to act are flowing across your group. A good stretch for getting things done.' },
    intense:   { title: 'Tension and Drive are High', desc: 'Action, conflict, and restless energy are running through your group. This can feel pushy, but it also gets things moving.' },
    mixed:     { title: 'Action is in the Air',      desc: 'Drive, ambition, and the urge to do something are activated across your group. Some momentum, some friction.' },
  },
  Jupiter: {
    ease:      { title: 'Growth is Expanding',       desc: 'Optimism, opportunity, and forward motion are building across your group. A stretch that tends to open doors.' },
    intense:   { title: 'Growth is Being Challenged', desc: 'Your group\'s beliefs, direction, and sense of possibility are being tested. Growth often comes through friction.' },
    mixed:     { title: 'Beliefs are Shifting',      desc: 'How your group sees the future and what feels possible is being activated. Some expansion, some recalibration.' },
  },
  Saturn: {
    ease:      { title: 'Structure is Strengthening', desc: 'Commitments, responsibilities, and long-term foundations are getting reinforced across your group.' },
    intense:   { title: 'Commitments are Being Tested', desc: 'Your group\'s structures, boundaries, and responsibilities are under pressure. This energy is demanding but builds something lasting.' },
    mixed:     { title: 'Foundations are Shifting',  desc: 'The structures and commitments your group relies on are being activated. Some stability, some stress.' },
  },
}

/**
 * Get a personalized group headline based on which natal planet
 * is getting the most transits and whether the mood leans toward ease or intensity.
 */
export function getGroupHeadline(topNatalPlanet, mood) {
  const copy = HEADLINE_COPY[topNatalPlanet]
  if (!copy) return null

  let lean = 'mixed'
  if (mood?.total > 0) {
    const ratio = mood.expansion / mood.total
    if (ratio >= 0.5) lean = 'ease'
    else if (ratio < 0.3) lean = 'intense'
  }

  return copy[lean]
}

// ── Mood labels ─────────────────────────────────────────────────────────────

export function getMoodLabel(mood) {
  if (mood.total === 0) return 'All quiet'
  const ratio = mood.expansion / mood.total
  if (ratio >= 0.6) return 'Leaning toward ease. Expansion energy is leading right now.'
  if (ratio >= 0.4) return 'A mix of ease and intensity. Both sides are active.'
  if (ratio >= 0.2) return 'Leaning toward intensity. The slower, heavier energy is setting the tone.'
  return 'A demanding stretch. Your group is carrying a lot of intense energy right now.'
}

export function getPhaseLabel(mood) {
  if (mood.total === 0) return null
  const applyingRatio = mood.applying / mood.total
  if (applyingRatio >= 0.65) return 'Most of this energy is still building. The peak is ahead.'
  if (applyingRatio <= 0.35) return 'Most of this energy is winding down. Your group is coming through the other side.'
  return null // balanced, not worth mentioning
}

// ── Rarity labels ───────────────────────────────────────────────────────────

export const RARITY_LABELS = {
  once: 'Once in a lifetime',
  rare: 'Rare',
  notable: 'Notable',
  common: '',
}

