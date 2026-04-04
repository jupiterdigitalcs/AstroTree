import { useState, useMemo } from 'react'
import {
  getElement, getInnerPlanetSigns, checkIngressWarnings,
  ELEMENT_COLORS, SIGN_MODALITY, POLARITY_GROUP,
  FAMILY_SIGNATURE_DESCRIPTIONS, ELEMENT_ROLE_BLURB, MODALITY_MODIFIER,
} from '../utils/astrology.js'
import { PlanetSign } from './PlanetSign.jsx'

const ELEMENTS = ['Fire', 'Earth', 'Air', 'Water']

const ELEMENT_ENERGY = {
  Fire:  'passionate and driven',
  Earth: 'grounded and practical',
  Air:   'communicative and curious',
  Water: 'intuitive and emotional',
}

const OPPOSITE_SIGNS = {
  Aries: 'Libra',        Libra:       'Aries',
  Taurus: 'Scorpio',     Scorpio:     'Taurus',
  Gemini: 'Sagittarius', Sagittarius: 'Gemini',
  Cancer: 'Capricorn',   Capricorn:   'Cancer',
  Leo:    'Aquarius',    Aquarius:    'Leo',
  Virgo:  'Pisces',      Pisces:      'Virgo',
}

function areCompatible(a, b) {
  if (a === b) return true
  return (
    (a === 'Fire'  && b === 'Air'  ) || (a === 'Air'   && b === 'Fire' ) ||
    (a === 'Earth' && b === 'Water') || (a === 'Water'  && b === 'Earth')
  )
}

function pairKey(a, b) {
  return [a.id, b.id].sort().join('|')
}

function buildRoleBlurb({ modalityMod, elementBlurb, node }) {
  return `${node.data.name} is ${modalityMod} ${elementBlurb}.`
}

function byAge(a, b) {
  return (a.data.birthdate || '9999').localeCompare(b.data.birthdate || '9999')
}
function byAgeNode(a, b) {
  return (a.node.data.birthdate || '9999').localeCompare(b.node.data.birthdate || '9999')
}

// ── Inner components ──────────────────────────────────────────────────────────

function FamilySignatureCard({ dominant, dominantModality, masculine, feminine, total, missingElements }) {
  const desc = FAMILY_SIGNATURE_DESCRIPTIONS[dominant]?.[dominantModality]
  const mascPct = total > 0 ? Math.round(masculine / total * 100) : 50
  const femPct  = total > 0 ? Math.round(feminine  / total * 100) : 50
  return (
    <div className="insight-card insight-signature-card">
      <h3 className="insight-heading">Family Signature</h3>
      <div className="signature-hero">
        <span className="signature-element" style={{ color: ELEMENT_COLORS[dominant] }}>{dominant}</span>
        {' / '}
        <span className="signature-modality">{dominantModality}</span>
      </div>
      {desc && (
        <p className="insight-note signature-desc">Your family {desc}.</p>
      )}
      <div className="signature-polarity-row">
        <span className="signature-polarity-label">Active</span>
        <div className="signature-polarity-track">
          <div className="signature-polarity-fill signature-polarity-fill--masc" style={{ width: `${mascPct}%` }} />
          <div className="signature-polarity-fill signature-polarity-fill--fem"  style={{ width: `${femPct}%` }} />
          <div className="signature-polarity-marker" style={{ left: `${mascPct}%` }}>
            <span className="signature-polarity-marker-pct">{mascPct}%</span>
          </div>
        </div>
        <span className="signature-polarity-label signature-polarity-label--right">Receptive</span>
      </div>
      <p className="signature-polarity-note">
        {masculine} active (Fire + Air) · {feminine} receptive (Earth + Water)
      </p>
      {missingElements.length > 0 && (
        <p className="insight-note signature-missing">
          No {missingElements.join(' or ')} energy — the family may seek this outside the home
        </p>
      )}
    </div>
  )
}

function FullCompatPairs({ pairs }) {
  const [showAll, setShowAll] = useState(false)
  const displayed = showAll ? pairs : pairs.slice(0, 10)
  return (
    <div className="insight-card">
      <h3 className="insight-heading">Full Compatibility Report</h3>
      <p className="insight-note compat-pair-count">{pairs.length} pair{pairs.length !== 1 ? 's' : ''} across your family</p>
      <div className="compat-pair-list">
        {displayed.map(pair => (
          <div key={pairKey(pair.a, pair.b)} className="compat-pair-row">
            <div className="compat-pair-names">
              <span>{pair.a.data.symbol} <strong>{pair.a.data.name}</strong></span>
              <span className="compat-pair-amp">&amp;</span>
              <span>{pair.b.data.symbol} <strong>{pair.b.data.name}</strong></span>
              <span className="compat-pair-rel">{pair.relationLabel}</span>
            </div>
            <p className="insight-compat" style={{ color: pair.color }}>{pair.compatLabel}</p>
            {pair.moonNote && (
              <p className="insight-compat" style={{ color: '#9dbbd4', fontSize: '0.72rem', marginTop: '0.1rem' }}>
                ☽ {pair.moonNote}
              </p>
            )}
          </div>
        ))}
      </div>
      {pairs.length > 10 && (
        <button type="button" className="compat-show-more-btn" onClick={() => setShowAll(v => !v)}>
          {showAll ? 'Show less' : `Show all ${pairs.length} pairs`}
        </button>
      )}
    </div>
  )
}

function FamilyRoles({ memberRoles }) {
  const [expanded, setExpanded] = useState(null)
  return (
    <div className="insight-card">
      <h3 className="insight-heading">Family Roles</h3>
      <p className="insight-note" style={{ marginBottom: '0.4rem' }}>Each member's cosmic role in the family dynamic</p>
      {memberRoles.map(role => {
        const isOpen = expanded === role.node.id
        return (
          <div
            key={role.node.id}
            className={`family-role-item${isOpen ? ' family-role-item--open' : ''}`}
            onClick={() => setExpanded(v => v === role.node.id ? null : role.node.id)}
          >
            <div className="family-role-header">
              <span className="family-role-symbol" style={{ color: role.node.data.elementColor }}>{role.node.data.symbol}</span>
              <span className="family-role-name"><strong>{role.node.data.name}</strong></span>
              <span className="family-role-sign">{role.node.data.sign}</span>
              <span className="family-role-chevron">{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
              <div className="family-role-body">
                <p className="insight-note">{buildRoleBlurb(role)}</p>
                {role.isOnlyElement && (
                  <p className="insight-note family-role-special">✦ Sole {role.node.data.element} energy in the family</p>
                )}
                {!role.isOnlyElement && role.sameElementPeers.length > 0 && (
                  <p className="insight-note family-role-special">
                    Fellow {role.node.data.element} spirit alongside {role.sameElementPeers.join(', ')}
                  </p>
                )}
                {role.isBridge && (
                  <p className="insight-note family-role-special">✦ The Bridge — brings {role.node.data.element} energy no one else carries</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InsightsPanel({ nodes, edges, onExport, exporting, onAddMore, onGoToTree }) {
  if (nodes.length < 2) {
    return (
      <div className="insights-panel">
        <h2 className="form-title">✦ Family Insights</h2>
        <p className="bulk-hint">Add at least two family members to reveal your celestial patterns.</p>
        <div className="insight-card insight-coming-soon">
          <h3 className="insight-heading">What you'll unlock</h3>
          <p className="insight-note">🔥 <strong>Elemental makeup</strong> — which elements dominate your family</p>
          <p className="insight-note">♊ <strong>Shared signs</strong> — who carries the same cosmic energy</p>
          <p className="insight-note">💞 <strong>Partner harmony</strong> — elemental compatibility for couples</p>
          <p className="insight-note">🔁 <strong>Sign &amp; element threads</strong> — cosmic patterns across generations</p>
        </div>
        <div className="insight-card insight-coming-soon">
          <h3 className="insight-heading">Coming in future updates ✨</h3>
          <p className="insight-note">⬆️ <strong>Rising Sign</strong> — add birth location for the full picture</p>
          <p className="insight-note">🔮 <strong>Full Chart Overlays</strong> — planetary alignments across generations</p>
        </div>
      </div>
    )
  }

  if (edges.length === 0) {
    return (
      <div className="insights-panel">
        <h2 className="form-title">✦ Family Insights</h2>
        <div className="insight-card insight-connect-prompt">
          <h3 className="insight-heading">Connect your group members</h3>
          <p className="insight-note">Your members are added — now connect them on the tree to unlock relationship insights.</p>
          <p className="insight-note" style={{ marginTop: '0.5rem' }}>
            Tap any member card in the <strong>Family</strong> tab, or click a node on the tree, to add connections.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem', opacity: 0.75 }}>
            <span>💞 Partner harmony — unlocked with spouse connections</span>
            <span>🔁 Sign threads — unlocked with parent-child connections</span>
            <span>🌿 Element threads — unlocked with parent-child connections</span>
            <span>✨ Notable bonds — unlocked with any connections</span>
          </div>
          {onGoToTree && (
            <button type="button" className="add-more-toggle" style={{ marginTop: '1rem' }} onClick={onGoToTree}>
              → Go to Tree
            </button>
          )}
        </div>
        <div className="insight-card insight-coming-soon">
          <h3 className="insight-heading">Coming in future updates ✨</h3>
          <p className="insight-note">⬆️ <strong>Rising Sign</strong> — add birth location for the full picture</p>
          <p className="insight-note">🔮 <strong>Full Chart Overlays</strong> — planetary alignments across generations</p>
        </div>
      </div>
    )
  }

  // ── Sun element breakdown (display only) ─────────────────────────────────────
  const elementCounts = Object.fromEntries(ELEMENTS.map(e => [e, 0]))
  nodes.forEach(n => {
    if (elementCounts[n.data.element] !== undefined) elementCounts[n.data.element]++
  })
  const sunDominant = ELEMENTS.reduce((a, b) => elementCounts[a] >= elementCounts[b] ? a : b)

  // ── Moon element breakdown (display only) ────────────────────────────────────
  const moonNodes = nodes.filter(n => n.data.moonSign && n.data.moonSign !== 'Unknown')
  const moonElementCounts = Object.fromEntries(ELEMENTS.map(e => [e, 0]))
  moonNodes.forEach(n => {
    const el = getElement(n.data.moonSign).element
    if (el && moonElementCounts[el] !== undefined) moonElementCounts[el]++
  })
  const moonDominant = moonNodes.length >= 2
    ? ELEMENTS.reduce((a, b) => moonElementCounts[a] >= moonElementCounts[b] ? a : b)
    : null

  // ── Inner planet data (Mercury/Venus/Mars) ────────────────────────────────────
  const innerPlanetData = useMemo(() => {
    return nodes.map(n => ({
      node: n,
      ...getInnerPlanetSigns(n.data.birthdate, n.data.birthTime ?? null),
    }))
  }, [nodes])

  // ── Per-node warned planets — a planet is excluded if ingress + no birth time ─
  const warningsPerNode = useMemo(() => {
    const map = new Map()
    nodes.forEach(n => {
      if (!n.data?.birthdate) { map.set(n.id, new Set()); return }
      const ws = checkIngressWarnings(n.data.birthdate, n.data.birthTime ?? null)
      map.set(n.id, new Set(ws.map(w => w.planet)))
    })
    return map
  }, [nodes])

  // ── All-planet element/modality/polarity — for Family Signature ───────────────
  // Counts each definite planet contribution (skips planet if ingress+no birth time)
  const allPlanetCounts = useMemo(() => {
    const elC  = Object.fromEntries(ELEMENTS.map(e => [e, 0]))
    const modC = { Cardinal: 0, Fixed: 0, Mutable: 0 }
    let masc = 0, fem = 0
    nodes.forEach(n => {
      const warned = warningsPerNode.get(n.id) ?? new Set()
      const inner  = innerPlanetData.find(d => d.node.id === n.id)
      const candidates = [
        { planet: 'sun',     sign: n.data.sign },
        { planet: 'moon',    sign: (n.data.moonSign && n.data.moonSign !== 'Unknown') ? n.data.moonSign : null },
        { planet: 'mercury', sign: inner?.mercury?.sign ?? null },
        { planet: 'venus',   sign: inner?.venus?.sign   ?? null },
        { planet: 'mars',    sign: inner?.mars?.sign    ?? null },
      ]
      candidates.forEach(({ planet, sign }) => {
        if (!sign || warned.has(planet)) return
        const el  = getElement(sign).element
        const mod = SIGN_MODALITY[sign]
        const pol = POLARITY_GROUP[el]
        if (el && elC[el] !== undefined) elC[el]++
        if (mod) modC[mod]++
        if (pol === 'Masculine') masc++
        else if (pol === 'Feminine') fem++
      })
    })
    return { elC, modC, masc, fem }
  }, [nodes, warningsPerNode, innerPlanetData])

  const dominant        = ELEMENTS.reduce((a, b) => allPlanetCounts.elC[a] >= allPlanetCounts.elC[b] ? a : b)
  const dominantModality = Object.entries(allPlanetCounts.modC).reduce((a, b) => b[1] > a[1] ? b : a)[0]
  const masculine       = allPlanetCounts.masc
  const feminine        = allPlanetCounts.fem
  const total           = masculine + feminine
  const missingElements = ELEMENTS.filter(el => allPlanetCounts.elC[el] === 0)

  // ── Shared sun signs ─────────────────────────────────────────────────────────
  const signCounts = {}
  nodes.forEach(n => { signCounts[n.data.sign] = (signCounts[n.data.sign] || 0) + 1 })
  const sharedSigns = Object.entries(signCounts)
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])

  // ── Shared moon signs ─────────────────────────────────────────────────────────
  const moonSignCounts = {}
  moonNodes.forEach(n => { moonSignCounts[n.data.moonSign] = (moonSignCounts[n.data.moonSign] || 0) + 1 })
  const sharedMoonSigns = Object.entries(moonSignCounts)
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])

  function sharedInnerSign(planet) {
    const counts = {}
    innerPlanetData.forEach(d => {
      const sign = d[planet]?.sign
      if (sign) counts[sign] = (counts[sign] || 0) + 1
    })
    return Object.entries(counts)
      .filter(([, c]) => c > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([sign]) => ({
        sign,
        symbol: innerPlanetData.find(d => d[planet]?.sign === sign)?.[planet]?.symbol,
        members: innerPlanetData
          .filter(d => d[planet]?.sign === sign)
          .map(d => d.node)
          .sort(byAge),
      }))
  }

  const sharedVenusSigns = sharedInnerSign('venus')
  const sharedMarsSigns  = sharedInnerSign('mars')

  // ── Couple / partner compatibility ──────────────────────────────────────────
  const spouseEdges = edges.filter(e => e.data?.relationType === 'spouse')
  const couples = spouseEdges
    .map(e => {
      const src = nodes.find(n => n.id === e.source)
      const tgt = nodes.find(n => n.id === e.target)
      if (!src || !tgt) return null
      return { src, tgt, compatible: areCompatible(src.data.element, tgt.data.element) }
    })
    .filter(Boolean)

  // ── Build child→parents map ──────────────────────────────────────────────────
  const parentChildEdges = edges.filter(e => e.data?.relationType === 'parent-child')
  const parentMap = {}
  parentChildEdges.forEach(e => {
    if (!parentMap[e.target]) parentMap[e.target] = []
    parentMap[e.target].push(e.source)
  })

  function getLongestChain(nodeId, keyFn, keyValue, visited = new Set()) {
    if (visited.has(nodeId)) return []
    visited.add(nodeId)
    const node = nodes.find(n => n.id === nodeId)
    if (!node || keyFn(node) !== keyValue) return []
    const parents = (parentMap[nodeId] || []).flatMap(
      pid => getLongestChain(pid, keyFn, keyValue, visited)
    )
    return parents.length > 0 ? [...parents, node] : [node]
  }

  // ── Sign threads ─────────────────────────────────────────────────────────────
  const signThreads = {}
  nodes.forEach(n => {
    const sign = n.data.sign
    if (signThreads[sign]) return
    const chain = getLongestChain(n.id, x => x.data.sign, sign, new Set())
    if (chain.length >= 2) signThreads[sign] = chain
  })

  // ── Elemental family threads ─────────────────────────────────────────────────
  const elementThreads = {}
  ELEMENTS.forEach(el => {
    let longest = []
    nodes.forEach(n => {
      if (n.data.element !== el) return
      const chain = getLongestChain(n.id, x => x.data.element, el, new Set())
      if (chain.length >= 2 && chain.length > longest.length) longest = chain
    })
    if (longest.length >= 2) elementThreads[el] = longest
  })

  // ── Sibling / cousin sets ────────────────────────────────────────────────────
  const childrenByParent = {}
  parentChildEdges.forEach(e => {
    if (!childrenByParent[e.source]) childrenByParent[e.source] = []
    childrenByParent[e.source].push(e.target)
  })
  const siblingKeys = new Set()
  Object.values(childrenByParent).forEach(children => {
    for (let i = 0; i < children.length; i++)
      for (let j = i + 1; j < children.length; j++)
        siblingKeys.add([children[i], children[j]].sort().join('|'))
  })
  const cousinKeys = new Set()
  ;[...siblingKeys].forEach(sibKey => {
    const [pA, pB] = sibKey.split('|')
    ;(childrenByParent[pA] || []).forEach(ca =>
      (childrenByParent[pB] || []).forEach(cb => {
        const k = [ca, cb].sort().join('|')
        if (!siblingKeys.has(k)) cousinKeys.add(k)
      })
    )
  })

  // ── Notable bonds ────────────────────────────────────────────────────────────
  const shownKeys = new Set()
  parentChildEdges.forEach(e => shownKeys.add([e.source, e.target].sort().join('|')))
  spouseEdges.forEach(e => shownKeys.add([e.source, e.target].sort().join('|')))

  // Quick lookup for inner planet data in the bond loops
  const innerPlanetMap = new Map(innerPlanetData.map(d => [d.node.id, d]))

  const notableBonds = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]
      const key = pairKey(a, b)
      if (shownKeys.has(key)) continue

      const aMoon   = a.data.moonSign && a.data.moonSign !== 'Unknown' ? a.data.moonSign : null
      const bMoon   = b.data.moonSign && b.data.moonSign !== 'Unknown' ? b.data.moonSign : null
      const aInner  = innerPlanetMap.get(a.id)
      const bInner  = innerPlanetMap.get(b.id)
      const aVenus  = aInner?.venus?.sign  ?? null
      const bVenus  = bInner?.venus?.sign  ?? null
      const aMars   = aInner?.mars?.sign   ?? null
      const bMars   = bInner?.mars?.sign   ?? null

      const sameSun    = a.data.sign === b.data.sign
      const sameMoon   = !!(aMoon && bMoon && aMoon === bMoon)
      const sameVenus  = !!(aVenus && bVenus && aVenus === bVenus)
      const sameMars   = !!(aMars && bMars && aMars === bMars)
      const isOpposite = OPPOSITE_SIGNS[a.data.sign] === b.data.sign
      const compatElem = areCompatible(a.data.element, b.data.element)
      const isSibling  = siblingKeys.has(key)
      const isCousin   = cousinKeys.has(key)
      const aSunBMoon  = !!(bMoon && bMoon === a.data.sign)
      const bSunAMoon  = !!(aMoon && aMoon === b.data.sign)

      // Count planet matches across all four personal planets
      const matchedPlanets = []
      if (sameSun)   matchedPlanets.push(`${a.data.symbol} ${a.data.sign} ☀`)
      if (sameMoon)  matchedPlanets.push(`☽ ${aMoon}`)
      if (sameVenus) matchedPlanets.push(`♀ ${aVenus}`)
      if (sameMars)  matchedPlanets.push(`♂ ${aMars}`)

      let score = 0, note = '', noteType = ''

      if (matchedPlanets.length >= 3) {
        // Rare multi-planet alignment — highest tier
        const is4 = matchedPlanets.length === 4
        score    = is4 ? 25 : 20
        noteType = is4 ? 'cosmic-echo' : 'rare-alignment'
        const label = is4
          ? 'Once-in-a-generation cosmic echo — all four personal planets aligned'
          : 'Rare triple alignment — an extraordinarily uncommon bond'
        note = `${matchedPlanets.join(' · ')} — ${label}`
      } else if (sameSun && sameMoon) {
        score = 12; noteType = 'soul-twins'
        note = `Both ${a.data.symbol} ${a.data.sign} ☀ & ☽ ${aMoon} moon — soul twins`
      } else if (sameSun) {
        score = 10; noteType = 'cosmic-twins'
        note = `Both ${a.data.symbol} ${a.data.sign} ☀ — cosmic twins`
      } else if (sameMoon) {
        score = 9; noteType = 'lunar-bond'
        note = `Both ☽ ${aMoon} moon — lunar bond`
      } else if (isOpposite) {
        score = 8; noteType = 'mirror'
        note = `${a.data.symbol} ${a.data.sign} & ${b.data.symbol} ${b.data.sign} — mirror signs`
      } else if (aSunBMoon) {
        score = 7; noteType = 'sun-moon-reflection'
        note = `${a.data.symbol} ${a.data.sign} ☀ meets ${b.data.name}'s ☽ ${bMoon} moon`
      } else if (bSunAMoon) {
        score = 7; noteType = 'sun-moon-reflection'
        note = `${b.data.symbol} ${b.data.sign} ☀ meets ${a.data.name}'s ☽ ${aMoon} moon`
      } else if (compatElem && (isSibling || isCousin)) {
        score = 5; noteType = 'natural-flow'
        note = `${a.data.element} & ${b.data.element} — natural flow`
      }
      if (score === 0) continue
      const rel = isSibling ? 'siblings' : isCousin ? 'cousins' : ''
      notableBonds.push({ a, b, score, note, noteType, rel })
    }
  }
  notableBonds.sort((x, y) => y.score - x.score)
  const topBonds = notableBonds.slice(0, 5)

  // ── All compat pairs (Feature 2) ─────────────────────────────────────────────
  const spouseEdgeSet      = new Set(spouseEdges.map(e => [e.source, e.target].sort().join('|')))
  const parentChildEdgeSet = new Set(parentChildEdges.map(e => [e.source, e.target].sort().join('|')))

  const allCompatPairs = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]
      const key = pairKey(a, b)
      let relationLabel = 'extended family'
      if (spouseEdgeSet.has(key))           relationLabel = 'partners'
      else if (parentChildEdgeSet.has(key)) relationLabel = 'parent & child'
      else if (siblingKeys.has(key))        relationLabel = 'siblings'
      else if (cousinKeys.has(key))         relationLabel = 'cousins'

      const aMoon  = a.data.moonSign && a.data.moonSign !== 'Unknown' ? a.data.moonSign : null
      const bMoon  = b.data.moonSign && b.data.moonSign !== 'Unknown' ? b.data.moonSign : null
      const aInn   = innerPlanetMap.get(a.id)
      const bInn   = innerPlanetMap.get(b.id)
      const aVenus = aInn?.venus?.sign ?? null
      const bVenus = bInn?.venus?.sign ?? null
      const aMars  = aInn?.mars?.sign  ?? null
      const bMars  = bInn?.mars?.sign  ?? null

      const sameSun    = a.data.sign === b.data.sign
      const sameMoon   = !!(aMoon && bMoon && aMoon === bMoon)
      const sameVenus  = !!(aVenus && bVenus && aVenus === bVenus)
      const sameMars   = !!(aMars && bMars && aMars === bMars)
      const oppSun     = OPPOSITE_SIGNS[a.data.sign] === b.data.sign
      const sameEl     = a.data.element === b.data.element
      const compatEl   = areCompatible(a.data.element, b.data.element)
      const sunMoonMirror = !!(aMoon && aMoon === b.data.sign) || !!(bMoon && bMoon === a.data.sign)

      const matchCount = [sameSun, sameMoon, sameVenus, sameMars].filter(Boolean).length

      let score, compatLabel, color, moonNote = null
      if (matchCount >= 4) {
        score = 11; compatLabel = 'Cosmic Echo'; color = 'var(--gold)'
      } else if (matchCount === 3) {
        score = 10; compatLabel = 'Rare Triple Alignment'; color = 'var(--gold)'
      } else if (sameSun && sameMoon) {
        score = 8; compatLabel = 'Soul Twins'; color = 'var(--gold)'
      } else if (sameSun) {
        score = 6; compatLabel = 'Cosmic Twins'; color = 'var(--gold)'
        if (aMoon && bMoon) moonNote = `Different moons: ☽ ${aMoon} & ☽ ${bMoon}`
      } else if (oppSun) {
        score = 5; compatLabel = 'Mirror Signs'; color = 'var(--rose)'
        if (sameMoon) moonNote = `Same ☽ ${aMoon} moon — emotional mirror too`
      } else if (sameMoon) {
        score = 4; compatLabel = 'Lunar Bond'; color = '#9dbbd4'
      } else if (sunMoonMirror) {
        score = 3; compatLabel = 'Sun-Moon Reflection'; color = '#c4a8d4'
      } else if (sameEl) {
        score = 2; compatLabel = 'Kindred Spirits'; color = ELEMENT_COLORS[a.data.element]
      } else if (compatEl) {
        score = 1; compatLabel = 'Natural Flow'; color = '#7ec845'
      } else {
        score = 0; compatLabel = 'Unique Dynamic'; color = 'var(--text-muted)'
      }
      allCompatPairs.push({ a, b, relationLabel, score, compatLabel, color, moonNote })
    }
  }
  allCompatPairs.sort((x, y) => y.score - x.score || (x.a.data.birthdate || '9999').localeCompare(y.a.data.birthdate || '9999'))

  // ── Member roles (Feature 3) ─────────────────────────────────────────────────
  const distinctEls = new Set(nodes.map(n => n.data.element)).size
  const memberRoles = nodes.map(node => {
    const modality = SIGN_MODALITY[node.data.sign] ?? 'Unknown'
    const sameEl   = nodes.filter(n => n.id !== node.id && n.data.element === node.data.element)
    const sameSgn  = nodes.filter(n => n.id !== node.id && n.data.sign    === node.data.sign)
    return {
      node, modality,
      elementBlurb:     ELEMENT_ROLE_BLURB[node.data.element] ?? 'brings a unique presence',
      modalityMod:      MODALITY_MODIFIER[modality]            ?? 'a unique spirit who',
      isOnlyElement:    sameEl.length === 0,
      isOnlySign:       sameSgn.length === 0,
      sameElementPeers: sameEl.map(n => n.data.name),
      sameSignPeers:    sameSgn.map(n => n.data.name),
      isBridge:         sameEl.length === 0 && distinctEls >= 3,
    }
  }).sort(byAgeNode)

  return (
    <div className="insights-panel">
      <div className="insights-header">
        <h2 className="form-title">✦ Family Insights</h2>
        {onExport && (
          <button
            type="button"
            className="relayout-btn relayout-btn--share insights-export-btn"
            onClick={onExport}
            disabled={exporting}
          >
            {exporting ? '…' : (<>
              <span className="export-label-desktop">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px'}}><path d="M6 1v7M3 6l3 3 3-3M1 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Download
              </span>
              <span className="export-label-mobile">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px'}}><path d="M6 7V1M3 4l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 8v2.5h10V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Share
              </span>
            </>)}
          </button>
        )}
      </div>

      {/* 1. Combined Element Makeup */}
      <div className="insight-card">
        <h3 className="insight-heading">Elemental Makeup</h3>

        <p className="insight-note" style={{ marginBottom: '0.35rem', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>☀ Sun</p>
        {ELEMENTS.map(el => {
          const count = elementCounts[el]
          const pct   = Math.round(count / nodes.length * 100)
          const color = ELEMENT_COLORS[el]
          return (
            <div key={el} className="element-bar-row">
              <span className="element-bar-label" style={{ color }}>{el}</span>
              <div className="element-bar-track">
                <div className="element-bar-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
              <span className="element-bar-count" style={{ color }}>{count}</span>
            </div>
          )
        })}

        {moonNodes.length >= 2 && moonDominant && (
          <>
            <p className="insight-note" style={{ margin: '0.6rem 0 0.35rem', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>☽ Moon</p>
            {ELEMENTS.map(el => {
              const count = moonElementCounts[el]
              if (count === 0) return null
              const pct   = Math.round(count / moonNodes.length * 100)
              const color = ELEMENT_COLORS[el]
              return (
                <div key={el} className="element-bar-row">
                  <span className="element-bar-label" style={{ color }}>{el}</span>
                  <div className="element-bar-track">
                    <div className="element-bar-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="element-bar-count" style={{ color }}>{count}</span>
                </div>
              )
            })}
          </>
        )}

        <p className="insight-note" style={{ marginTop: '0.5rem' }}>
          ☀ <strong style={{ color: ELEMENT_COLORS[sunDominant] }}>{ELEMENT_ENERGY[sunDominant]}</strong>
          {moonDominant && moonNodes.length >= 2 && (
            <> · ☽ emotionally <strong style={{ color: ELEMENT_COLORS[moonDominant] }}>{ELEMENT_ENERGY[moonDominant]}</strong></>
          )}
          {moonNodes.length < nodes.length && moonNodes.length > 0 && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              {' '}({nodes.length - moonNodes.length} without moon data)
            </span>
          )}
        </p>
      </div>

      {/* 2. Family Signature */}
      <FamilySignatureCard
        dominant={dominant}
        dominantModality={dominantModality}
        masculine={masculine}
        feminine={feminine}
        total={total}
        missingElements={missingElements}
      />

      {/* 3. Moon Element Makeup — only when enough moon data */}
      {moonNodes.length >= 2 && moonDominant && (
        <div className="insight-card">
          <h3 className="insight-heading">☽ Moon Element Makeup</h3>
          {ELEMENTS.map(el => {
            const count = moonElementCounts[el]
            if (count === 0) return null
            const pct   = Math.round(count / moonNodes.length * 100)
            const color = ELEMENT_COLORS[el]
            return (
              <div key={el} className="element-bar-row">
                <span className="element-bar-label" style={{ color }}>{el}</span>
                <div className="element-bar-track">
                  <div className="element-bar-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="element-bar-count" style={{ color }}>{count}</span>
              </div>
            )
          })}
          <p className="insight-note" style={{ marginTop: '0.4rem' }}>
            Emotionally, your family is{' '}
            <strong style={{ color: ELEMENT_COLORS[moonDominant] }}>{ELEMENT_ENERGY[moonDominant]}</strong>.
            {moonNodes.length < nodes.length && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                {' '}({nodes.length - moonNodes.length} member{nodes.length - moonNodes.length > 1 ? 's' : ''} without moon data)
              </span>
            )}
          </p>
        </div>
      )}

      {/* 4. Shared Sun Signs */}
      {sharedSigns.length > 0 && (
        <div className="insight-card">
          <h3 className="insight-heading">☀ Shared Sun Signs</h3>
          {sharedSigns.map(([sign]) => {
            const members = nodes.filter(n => n.data.sign === sign).sort(byAge)
            return (
              <p key={sign} className="insight-note">
                {members[0].data.symbol} <strong>{sign}</strong> —{' '}
                {members.map(m => m.data.name).join(', ')}
              </p>
            )
          })}
        </div>
      )}

      {/* 5. Shared Moon Signs */}
      {sharedMoonSigns.length > 0 && (
        <div className="insight-card">
          <h3 className="insight-heading">☽ Shared Moon Signs</h3>
          {sharedMoonSigns.map(([sign]) => {
            const members = moonNodes.filter(n => n.data.moonSign === sign).sort(byAge)
            return (
              <p key={sign} className="insight-note">
                <PlanetSign planet="moon" symbol={members[0].data.moonSymbol} sign={sign} />
                {' '}— {members.map(m => m.data.name).join(', ')}
              </p>
            )
          })}
          <p className="insight-note" style={{ marginTop: '0.3rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            Shared moon signs suggest similar emotional needs and instincts.
          </p>
        </div>
      )}

      {/* 6. Shared Venus & Mars Signs */}
      {(sharedVenusSigns.length > 0 || sharedMarsSigns.length > 0) && (
        <div className="insight-card">
          <h3 className="insight-heading">♀ Venus · ♂ Mars — Shared Signs</h3>
          {sharedVenusSigns.map(({ sign, symbol, members }) => (
            <p key={`v-${sign}`} className="insight-note">
              <PlanetSign planet="venus" symbol={symbol} sign={sign} />
              {' '}— {members.map(m => m.data.name).join(', ')}
            </p>
          ))}
          {sharedMarsSigns.map(({ sign, symbol, members }) => (
            <p key={`m-${sign}`} className="insight-note">
              <PlanetSign planet="mars" symbol={symbol} sign={sign} />
              {' '}— {members.map(m => m.data.name).join(', ')}
            </p>
          ))}
          <p className="insight-note" style={{ marginTop: '0.3rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            ♀ Venus reflects how someone loves and what they value. ♂ Mars reflects drive and how they act.
            {nodes.some(n => !n.data.birthTime) && ' Signs use noon EST for members without a birth time.'}
          </p>
        </div>
      )}

      {/* 7. Partner Compatibility */}
      {couples.length > 0 && (
        <div className="insight-card">
          <h3 className="insight-heading">Partner Compatibility</h3>
          {couples.map(({ src, tgt, compatible }, i) => {
            const srcMoonEl = src.data.moonSign && src.data.moonSign !== 'Unknown' ? getElement(src.data.moonSign).element : null
            const tgtMoonEl = tgt.data.moonSign && tgt.data.moonSign !== 'Unknown' ? getElement(tgt.data.moonSign).element : null
            const moonCompat = srcMoonEl && tgtMoonEl ? areCompatible(srcMoonEl, tgtMoonEl) : null
            return (
              <div key={i} className="insight-couple">
                <p className="insight-note">
                  {src.data.symbol} <strong>{src.data.name}</strong> &amp;{' '}
                  {tgt.data.symbol} <strong>{tgt.data.name}</strong>
                </p>
                <p className="insight-compat" style={{ color: compatible ? '#7ec845' : '#c9a84c' }}>
                  ☀ {compatible ? 'Harmonious sun elements' : 'Complementary sun energies'}
                  {' '}({src.data.element} & {tgt.data.element})
                </p>
                {moonCompat !== null && (
                  <p className="insight-compat" style={{ color: moonCompat ? '#9dbbd4' : '#c9a84c', marginTop: '0.15rem' }}>
                    ☽ {moonCompat ? 'Compatible emotional natures' : 'Different emotional styles'}
                    {' '}({srcMoonEl} & {tgtMoonEl} moon)
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 8. Sign Threads */}
      {Object.keys(signThreads).length > 0 && (
        <div className="insight-card">
          <h3 className="insight-heading">Sign Threads</h3>
          {Object.entries(signThreads).map(([sign, chain]) => (
            <p key={sign} className="insight-note">
              <strong>{chain[0].data.symbol} {sign}</strong> runs through{' '}
              {chain.length === 2 ? '2 generations' : `${chain.length} generations`}:{' '}
              {chain.map(n => n.data.name).join(' → ')}
            </p>
          ))}
        </div>
      )}

      {/* 9. Elemental Threads */}
      {Object.keys(elementThreads).length > 0 && (
        <div className="insight-card">
          <h3 className="insight-heading">Elemental Family Threads</h3>
          {Object.entries(elementThreads).map(([el, chain]) => (
            <p key={el} className="insight-note">
              <span style={{ color: ELEMENT_COLORS[el] }}>
                {el === 'Fire' ? '🔥' : el === 'Earth' ? '🌿' : el === 'Air' ? '💨' : '💧'}{' '}
                <strong>{el}</strong>
              </span>
              {' '}flows through {chain.length} generations:{' '}
              <strong>{chain.map(n => n.data.name).join(' → ')}</strong>
            </p>
          ))}
        </div>
      )}

      {/* 10. Notable Bonds */}
      {topBonds.length > 0 && (
        <div className="insight-card">
          <h3 className="insight-heading">Notable Bonds</h3>
          {topBonds.map(({ a, b, note, noteType, rel }) => {
            const isRare = noteType === 'cosmic-echo' || noteType === 'rare-alignment'
            const color  = isRare                             ? 'var(--gold)'
                         : noteType === 'soul-twins'          ? 'var(--gold)'
                         : noteType === 'cosmic-twins'        ? 'var(--gold)'
                         : noteType === 'lunar-bond'          ? '#9dbbd4'
                         : noteType === 'mirror'              ? 'var(--rose)'
                         : noteType === 'sun-moon-reflection' ? '#c4a8d4'
                         : '#7ec845'
            return (
              <div
                key={pairKey(a, b)}
                className={`insight-couple${isRare ? ' insight-couple--rare' : ''}`}
              >
                {isRare && (
                  <p className="insight-rare-badge">
                    {noteType === 'cosmic-echo' ? '✦✦✦ Extremely Rare' : '✦✦ Rare'}
                  </p>
                )}
                <p className="insight-note">
                  <strong>{a.data.name}</strong> &amp; <strong>{b.data.name}</strong>
                  {rel && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}> — {rel}</span>}
                </p>
                <p className="insight-compat" style={{ color }}>{note}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* 11. Full Compatibility Report */}
      {allCompatPairs.length > 0 && (
        <FullCompatPairs pairs={allCompatPairs} />
      )}

      {/* 12. Family Roles */}
      {memberRoles.length >= 2 && (
        <FamilyRoles memberRoles={memberRoles} />
      )}

      {/* 13. Add more prompt */}
      {sharedSigns.length === 0 && couples.length === 0 &&
       Object.keys(signThreads).length === 0 && Object.keys(elementThreads).length === 0 &&
       topBonds.length === 0 && onAddMore && (
        <div className="insight-add-more">
          <p className="insight-add-more-text">Add more group members &amp; connect them to unlock shared signs, compatibility, and generational patterns.</p>
          <button type="button" className="insight-add-more-btn" onClick={onAddMore}>
            ＋ Add Family Members
          </button>
        </div>
      )}

      {/* 14. Coming Soon */}
      <div className="insight-card insight-coming-soon">
        <h3 className="insight-heading">Coming in future updates ✨</h3>
        <p className="insight-note">⬆️ <strong>Rising Sign</strong> — add birth location for the full picture</p>
        <p className="insight-note">🔮 <strong>Full Chart Overlays</strong> — planetary alignments across generations</p>
      </div>

      {/* 15. Brand footer — hidden normally, shown during export */}
      <div className="insights-brand-footer">
        <span className="insights-brand-name">✦ AstroDig by Jupiter Digital</span>
        <span className="insights-brand-contact">
          jupreturns@gmail.com · <svg style={{display:'inline',verticalAlign:'middle',marginRight:'2px'}} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>@jupreturn
        </span>
      </div>
    </div>
  )
}
