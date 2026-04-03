import { getSunSign, getElement } from './astrology.js'

function buildNodeData(member) {
  const { sign, symbol }   = getSunSign(member.birthdate)
  const { element, color } = getElement(sign)
  return { name: member.name, birthdate: member.birthdate, sign, symbol, element, elementColor: color }
}

const EDGE_STYLE   = { stroke: '#c9a84c', strokeWidth: 1.5 }
const SPOUSE_STYLE = { stroke: '#d4a0bc', strokeWidth: 1.5, strokeDasharray: '6,4' }

function makeEdge(source, target, relationType = 'parent-child') {
  const isSpouse = relationType === 'spouse'
  return {
    id: `e-${source}-${target}`, source, target,
    data:     { relationType },
    animated: !isSpouse,
    style:    isSpouse ? SPOUSE_STYLE : EDGE_STYLE,
    type:     'smoothstep',
  }
}

const DEMO_MEMBERS = [
  { name: 'Margaret', birthdate: '1948-03-22' },  // Aries
  { name: 'Robert',   birthdate: '1945-11-15' },  // Scorpio
  { name: 'Susan',    birthdate: '1972-07-08' },   // Cancer
  { name: 'David',    birthdate: '1970-01-25' },   // Aquarius
  { name: 'Lisa',     birthdate: '1975-04-12' },   // Aries
  { name: 'James',    birthdate: '1974-09-03' },   // Virgo
  { name: 'Emily',    birthdate: '1998-12-19' },   // Sagittarius
  { name: 'Ryan',     birthdate: '2001-06-21' },   // Cancer
  { name: 'Olivia',   birthdate: '2003-02-14' },   // Aquarius
]

const DEMO_EDGE_DEFS = [
  ['node-1', 'node-2', 'spouse'],      // Margaret & Robert
  ['node-1', 'node-3'],                 // Margaret → Susan
  ['node-1', 'node-6'],                 // Margaret → James
  ['node-3', 'node-4', 'spouse'],       // Susan & David
  ['node-6', 'node-5', 'spouse'],       // James & Lisa
  ['node-3', 'node-7'],                 // Susan → Emily
  ['node-3', 'node-8'],                 // Susan → Ryan
  ['node-6', 'node-9'],                 // James → Olivia
]

export function buildDemoChart() {
  const nodes = DEMO_MEMBERS.map((m, i) => ({
    id: `node-${i + 1}`, type: 'astro',
    position: { x: 0, y: 0 }, data: buildNodeData(m),
  }))
  const edges = DEMO_EDGE_DEFS.map(([s, t, r]) => makeEdge(s, t, r))
  return {
    id: '__sample_andersons__',
    title: 'The Andersons',
    isSample: true,
    nodes,
    edges,
    counter: DEMO_MEMBERS.length + 1,
  }
}
