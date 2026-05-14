/**
 * currentData.js — Static copy and theme data for "The Current"
 *
 * Planet themes, mood labels, natal target descriptions, and color mappings.
 */

// ── Planet season themes ────────────────────────────────────────────────────

export const PLANET_THEMES = {
  Jupiter: {
    glyph: '♃',
    season: 'Jupiter Season',
    theme: 'Expansion, opportunity, and growth',
    color: '#c9a84c',
    description: 'Jupiter is opening doors across your group. This is a stretch of optimism, generosity, and forward motion.',
  },
  Saturn: {
    glyph: '♄',
    season: 'Saturn Season',
    theme: 'Structure, responsibility, and tests',
    color: '#8899cc',
    description: 'Saturn is pressing your group to get serious. Accountability, limits, and long-term building are the themes.',
  },
  Uranus: {
    glyph: '♅',
    season: 'Uranus Season',
    theme: 'Disruption, breakthroughs, and change',
    color: '#56c8c0',
    description: 'Uranus is shaking things up. Expect the unexpected — sudden shifts, new directions, and freedom impulses.',
  },
  Neptune: {
    glyph: '♆',
    season: 'Neptune Season',
    theme: 'Imagination, intuition, and dissolving boundaries',
    color: '#7bafd4',
    description: 'Neptune is softening the edges. Creativity flows, but clarity may be harder to find. Trust intuition over logic.',
  },
  Pluto: {
    glyph: '♇',
    season: 'Pluto Season',
    theme: 'Transformation, power, and depth',
    color: '#b06cbf',
    description: 'Pluto is working beneath the surface. Deep changes are underway — things that no longer serve fall away.',
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
  if (ratio >= 0.6) return 'Leaning toward growth'
  if (ratio >= 0.4) return 'Mixed energy'
  if (ratio >= 0.2) return 'Leaning toward pressure'
  return 'Heavy weather'
}

export function getPhaseLabel(mood) {
  if (mood.total === 0) return null
  const applyingRatio = mood.applying / mood.total
  if (applyingRatio >= 0.65) return 'Energy is building — most transits haven\'t peaked yet'
  if (applyingRatio <= 0.35) return 'Energy is releasing — your group is coming through the other side'
  return null // balanced — not worth mentioning
}

// ── Rarity labels ───────────────────────────────────────────────────────────

export const RARITY_LABELS = {
  once: 'Once in a lifetime',
  rare: 'Rare',
  notable: 'Notable',
  common: '',
}

