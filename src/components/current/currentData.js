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

