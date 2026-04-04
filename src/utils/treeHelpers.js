import { getSunSign, getElement, getMoonSign } from './astrology.js'

// ── Edge style constants ─────────────────────────────────────────────────────
export const EDGE_STYLE      = { stroke: '#c9a84c', strokeWidth: 1.5 }
export const SPOUSE_STYLE    = { stroke: '#d4a0bc', strokeWidth: 1.5, strokeDasharray: '6,4' }
export const FRIEND_STYLE    = { stroke: '#5bc8f5', strokeWidth: 1.5, strokeDasharray: '4,4' }
export const COWORKER_STYLE  = { stroke: '#a0a0b8', strokeWidth: 1.5, strokeDasharray: '4,4' }

export const EDGE_STYLES = {
  'parent-child': EDGE_STYLE,
  'spouse':       SPOUSE_STYLE,
  'friend':       FRIEND_STYLE,
  'coworker':     COWORKER_STYLE,
}

// Derived maps for ConstellationView
export const EDGE_COLORS = {
  'parent-child': '#c9a84c',
  'spouse':       '#d4a0bc',
  'friend':       '#5bc8f5',
  'coworker':     '#a0a0b8',
}

export const EDGE_LABELS = {
  'parent-child': 'family',
  'spouse':       'partner',
  'friend':       'friend',
  'coworker':     'coworker',
}

export const EDGE_DASH = {
  'parent-child': 'none',
  'spouse':       '6,4',
  'friend':       '4,4',
  'coworker':     '4,4',
}

// ── Node + edge builders ─────────────────────────────────────────────────────
export function buildNodeData(member) {
  const { sign, symbol }   = getSunSign(member.birthdate)
  const { element, color } = getElement(sign)
  const { moonSign, moonSymbol } = getMoonSign(member.birthdate)
  return { name: member.name, birthdate: member.birthdate, sign, symbol, element, elementColor: color, moonSign, moonSymbol }
}

// Enrich existing saved nodes with any missing computed fields (e.g. moonSign)
export function hydrateNodes(nodes) {
  return nodes.map(n => {
    if (n.data?.moonSign || !n.data?.birthdate) return n
    const { moonSign, moonSymbol } = getMoonSign(n.data.birthdate)
    return { ...n, data: { ...n.data, moonSign, moonSymbol } }
  })
}

export function makeEdge(source, target, relationType = 'parent-child') {
  const isFamily = relationType === 'parent-child'
  return {
    id: `e-${source}-${target}`, source, target,
    data:     { relationType },
    animated: isFamily,
    style:    EDGE_STYLES[relationType] || EDGE_STYLE,
    type:     'smoothstep',
  }
}
