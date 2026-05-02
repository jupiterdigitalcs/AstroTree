import { getSunSign, getElement } from './astrology.js'
import { computeAstrology, computeAstrologyBatch } from './astrologyAPI.js'

// ── Edge style constants ─────────────────────────────────────────────────────
export const EDGE_STYLE        = { stroke: '#c9a84c', strokeWidth: 1.5 }
export const SPOUSE_STYLE      = { stroke: '#d4a0bc', strokeWidth: 1.5, strokeDasharray: '6,4' }
export const STEP_PARENT_STYLE = { stroke: '#c9a84c', strokeWidth: 1.5, strokeDasharray: '6,4' }
export const SIBLING_STYLE     = { stroke: '#b8845c', strokeWidth: 1.5, strokeDasharray: '6,4' }
export const FRIEND_STYLE      = { stroke: '#5bc8f5', strokeWidth: 1.5, strokeDasharray: '4,4' }
export const COWORKER_STYLE    = { stroke: '#a0a0b8', strokeWidth: 1.5, strokeDasharray: '4,4' }

export const EDGE_STYLES = {
  'parent-child': EDGE_STYLE,
  'step-parent':  STEP_PARENT_STYLE,
  'sibling':      SIBLING_STYLE,
  'spouse':       SPOUSE_STYLE,
  'friend':       FRIEND_STYLE,
  'coworker':     COWORKER_STYLE,
}

// Derived maps for ConstellationView
export const EDGE_COLORS = {
  'parent-child': '#c9a84c',
  'step-parent':  '#c9a84c',
  'sibling':      '#b8845c',
  'spouse':       '#d4a0bc',
  'friend':       '#5bc8f5',
  'coworker':     '#a0a0b8',
}

export const EDGE_LABELS = {
  'parent-child': 'family',
  'step-parent':  'step-family',
  'sibling':      'sibling',
  'spouse':       'partner',
  'friend':       'friend',
  'coworker':     'coworker',
}

export const EDGE_DASH = {
  'parent-child': 'none',
  'step-parent':  '6,4',
  'sibling':      '6,4',
  'spouse':       '6,4',
  'friend':       '4,4',
  'coworker':     '4,4',
}

// ── Node + edge builders ─────────────────────────────────────────────────────
export async function buildNodeData(member) {
  const { sign, symbol }   = getSunSign(member.birthdate)
  const { element, color } = getElement(sign)
  const base = { name: member.name, birthdate: member.birthdate, birthTime: member.birthTime ?? null, exactBirthTime: member.exactBirthTime ?? false, birthTimezone: member.birthTimezone ?? null, sign, symbol, element, elementColor: color, moonSign: 'Unknown', moonSymbol: '☽' }

  const astro = await computeAstrology(member.birthdate, member.birthTime ?? null, member.birthTimezone ?? null)
  if (astro) {
    if (astro.moon) Object.assign(base, astro.moon)
    if (astro.innerPlanets) {
      base.innerPlanets = astro.innerPlanets
      if (astro.innerPlanets.sunDegree != null) base.sunDegree = astro.innerPlanets.sunDegree
    }
    if (astro.outerPlanets) base.outerPlanets = astro.outerPlanets
    if (astro.ingressWarnings) base.ingressWarnings = astro.ingressWarnings
    if (astro.timezoneWarnings) base.timezoneWarnings = astro.timezoneWarnings
    if (astro.natalAspects) base.natalAspects = astro.natalAspects
    if (astro.sunAtTime?.sign) {
      const { element: el, color: c } = getElement(astro.sunAtTime.sign)
      Object.assign(base, { sign: astro.sunAtTime.sign, symbol: astro.sunAtTime.symbol, element: el, elementColor: c })
    }
  }
  return base
}

// Enrich existing saved nodes with any missing computed fields
export async function hydrateNodes(nodes) {
  const needsHydration = nodes.filter(n => (!n.data?.innerPlanets || !n.data?.outerPlanets || !n.data?.natalAspects) && n.data?.birthdate)
  if (needsHydration.length === 0) return nodes

  const batch = await computeAstrologyBatch(
    needsHydration.map(n => ({ id: n.id, birthdate: n.data.birthdate, birthTime: n.data.birthTime ?? null, birthTimezone: n.data.birthTimezone ?? null }))
  )

  return nodes.map(n => {
    const astro = batch[n.id]
    if (!astro) return n
    const enriched = { ...n.data }
    if (astro.moon && !n.data.moonSign) Object.assign(enriched, astro.moon)
    if (astro.innerPlanets) {
      enriched.innerPlanets = astro.innerPlanets
      if (astro.innerPlanets.sunDegree != null) enriched.sunDegree = astro.innerPlanets.sunDegree
    }
    if (astro.outerPlanets) enriched.outerPlanets = astro.outerPlanets
    if (astro.ingressWarnings) enriched.ingressWarnings = astro.ingressWarnings
    if (astro.timezoneWarnings) enriched.timezoneWarnings = astro.timezoneWarnings
    if (astro.natalAspects) enriched.natalAspects = astro.natalAspects
    return { ...n, data: enriched }
  })
}

export function makeEdge(source, target, relationType = 'parent-child') {
  const isFamily = relationType === 'parent-child'
  const isHierarchical = relationType === 'parent-child' || relationType === 'step-parent'
  return {
    id: `e-${source}-${target}`, source, target,
    data:     { relationType },
    animated: isFamily,
    style:    EDGE_STYLES[relationType] || EDGE_STYLE,
    type:     'smoothstep',
  }
}
