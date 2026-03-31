import { ELEMENT_COLORS } from '../utils/astrology.js'

const ELEMENTS = ['Fire', 'Earth', 'Air', 'Water']

const ELEMENT_ENERGY = {
  Fire:  'passionate and driven',
  Earth: 'grounded and practical',
  Air:   'communicative and curious',
  Water: 'intuitive and emotional',
}

const OPPOSITE_SIGNS = {
  Aries: 'Libra',       Libra:       'Aries',
  Taurus: 'Scorpio',    Scorpio:     'Taurus',
  Gemini: 'Sagittarius',Sagittarius: 'Gemini',
  Cancer: 'Capricorn',  Capricorn:   'Cancer',
  Leo:    'Aquarius',   Aquarius:    'Leo',
  Virgo:  'Pisces',     Pisces:      'Virgo',
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

export default function InsightsPanel({ nodes, edges, onExport, exporting, onAddMore }) {
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
          <p className="insight-note">🌙 <strong>Moon Sign</strong> — add birth time for emotional depth</p>
          <p className="insight-note">⬆️ <strong>Rising Sign</strong> — add birth location for the full picture</p>
          <p className="insight-note">🔮 <strong>Full Chart Overlays</strong> — planetary alignments across generations</p>
          <p className="insight-note">📅 <strong>Birthday Reminders</strong> — connect to your Jupiter Digital calendar</p>
        </div>
      </div>
    )
  }

  // ── Element breakdown ──────────────────────────────────────────────────────
  const elementCounts = Object.fromEntries(ELEMENTS.map(e => [e, 0]))
  nodes.forEach(n => {
    if (elementCounts[n.data.element] !== undefined) elementCounts[n.data.element]++
  })
  const total    = nodes.length
  const dominant = ELEMENTS.reduce((a, b) => elementCounts[a] >= elementCounts[b] ? a : b)

  // ── Shared sun signs ───────────────────────────────────────────────────────
  const signCounts = {}
  nodes.forEach(n => { signCounts[n.data.sign] = (signCounts[n.data.sign] || 0) + 1 })
  const sharedSigns = Object.entries(signCounts)
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])

  // ── Couple / partner compatibility ────────────────────────────────────────
  const spouseEdges = edges.filter(e => e.data?.relationType === 'spouse')
  const couples = spouseEdges
    .map(e => {
      const src = nodes.find(n => n.id === e.source)
      const tgt = nodes.find(n => n.id === e.target)
      if (!src || !tgt) return null
      return { src, tgt, compatible: areCompatible(src.data.element, tgt.data.element) }
    })
    .filter(Boolean)

  // ── Build child→parents map (shared by both thread features) ─────────────
  const parentChildEdges = edges.filter(e => e.data?.relationType === 'parent-child')
  const parentMap = {}
  parentChildEdges.forEach(e => {
    if (!parentMap[e.target]) parentMap[e.target] = []
    parentMap[e.target].push(e.source)
  })

  // Walk ancestors collecting the longest consecutive chain matching a key
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

  // ── Sign threads (multi-generation same sun sign) ─────────────────────────
  const signThreads = {}
  nodes.forEach(n => {
    const sign = n.data.sign
    if (signThreads[sign]) return
    const chain = getLongestChain(n.id, x => x.data.sign, sign, new Set())
    if (chain.length >= 2) signThreads[sign] = chain
  })

  // ── Elemental family threads (multi-generation same element) ──────────────
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

  // ── Notable bonds: score every pair, surface the top 5 ───────────────────
  // Build sibling pairs (share a parent)
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

  // Build cousin pairs (parents are siblings)
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

  // Pairs already shown in other cards (parent-child, spouse) — skip them
  const shownKeys = new Set()
  parentChildEdges.forEach(e => shownKeys.add([e.source, e.target].sort().join('|')))
  spouseEdges.forEach(e => shownKeys.add([e.source, e.target].sort().join('|')))

  const notableBonds = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]
      const key = pairKey(a, b)
      if (shownKeys.has(key)) continue

      const sameSign   = a.data.sign === b.data.sign
      const isOpposite = OPPOSITE_SIGNS[a.data.sign] === b.data.sign
      const compatElem = areCompatible(a.data.element, b.data.element)
      const isSibling  = siblingKeys.has(key)
      const isCousin   = cousinKeys.has(key)

      let score = 0
      let note  = ''

      if (sameSign) {
        score = 10
        note  = `Both ${a.data.symbol} ${a.data.sign} — cosmic twins`
      } else if (isOpposite) {
        score = 8
        note  = `${a.data.symbol} ${a.data.sign} & ${b.data.symbol} ${b.data.sign} — mirror signs`
      } else if (compatElem && (isSibling || isCousin)) {
        score = 5
        note  = `${a.data.element} & ${b.data.element} — natural flow`
      }

      if (score === 0) continue
      const rel = isSibling ? 'siblings' : isCousin ? 'cousins' : ''
      notableBonds.push({ a, b, score, note, rel })
    }
  }
  notableBonds.sort((x, y) => y.score - x.score)
  const topBonds = notableBonds.slice(0, 5)

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

      {/* ── Elemental makeup ───────────────────────────────────────────── */}
      <div className="insight-card">
        <h3 className="insight-heading">Elemental Makeup</h3>
        {ELEMENTS.map(el => {
          const count = elementCounts[el]
          const pct   = Math.round(count / total * 100)
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
          Your family is{' '}
          <strong style={{ color: ELEMENT_COLORS[dominant] }}>{ELEMENT_ENERGY[dominant]}</strong>.
        </p>
      </div>

      {/* ── Shared signs ───────────────────────────────────────────────── */}
      {sharedSigns.length > 0 && (
        <div className="insight-card">
          <h3 className="insight-heading">Shared Signs</h3>
          {sharedSigns.map(([sign]) => {
            const members = nodes.filter(n => n.data.sign === sign)
            return (
              <p key={sign} className="insight-note">
                {members[0].data.symbol} <strong>{sign}</strong> —{' '}
                {members.map(m => m.data.name).join(', ')}
              </p>
            )
          })}
        </div>
      )}

      {/* ── Partner compatibility ───────────────────────────────────────── */}
      {couples.length > 0 && (
        <div className="insight-card">
          <h3 className="insight-heading">Partner Compatibility</h3>
          {couples.map(({ src, tgt, compatible }, i) => (
            <div key={i} className="insight-couple">
              <p className="insight-note">
                {src.data.symbol} <strong>{src.data.name}</strong> ({src.data.element}) &amp;{' '}
                {tgt.data.symbol} <strong>{tgt.data.name}</strong> ({tgt.data.element})
              </p>
              <p className="insight-compat" style={{ color: compatible ? '#7ec845' : '#c9a84c' }}>
                {compatible ? '✓ Harmonious elements' : '◇ Complementary energies'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Sign threads ────────────────────────────────────────────────── */}
      {Object.keys(signThreads).length > 0 && (
        <div className="insight-card">
          <h3 className="insight-heading">Sign Threads</h3>
          {Object.entries(signThreads).map(([sign, chain]) => {
            const symbol = chain[0].data.symbol
            return (
              <p key={sign} className="insight-note">
                <strong>{symbol} {sign}</strong> runs through{' '}
                {chain.length === 2 ? '2 generations' : `${chain.length} generations`}:{' '}
                {chain.map(n => n.data.name).join(' → ')}
              </p>
            )
          })}
        </div>
      )}

      {/* ── Elemental threads ───────────────────────────────────────────── */}
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

      {/* ── Notable bonds ───────────────────────────────────────────────── */}
      {topBonds.length > 0 && (
        <div className="insight-card">
          <h3 className="insight-heading">Notable Bonds</h3>
          {topBonds.map(({ a, b, note, rel }) => {
            const color = note.includes('twins') ? 'var(--gold)'
              : note.includes('mirror') ? 'var(--rose)' : '#7ec845'
            return (
              <div key={pairKey(a, b)} className="insight-couple">
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

      {/* ── Add more prompt (shown when only elemental makeup is visible) ── */}
      {sharedSigns.length === 0 && couples.length === 0 &&
       Object.keys(signThreads).length === 0 && Object.keys(elementThreads).length === 0 &&
       topBonds.length === 0 && onAddMore && (
        <div className="insight-add-more">
          <p className="insight-add-more-text">Add more family members &amp; connect them to unlock shared signs, compatibility, and generational patterns.</p>
          <button type="button" className="insight-add-more-btn" onClick={onAddMore}>
            ＋ Add Family Members
          </button>
        </div>
      )}

      {/* ── Coming soon ─────────────────────────────────────────────────── */}
      <div className="insight-card insight-coming-soon">
        <h3 className="insight-heading">Coming in future updates ✨</h3>
        <p className="insight-note">🌙 <strong>Moon Sign</strong> — add birth time for emotional depth</p>
        <p className="insight-note">⬆️ <strong>Rising Sign</strong> — add birth location for the full picture</p>
        <p className="insight-note">🔮 <strong>Deeper Insights</strong> — themes across generations</p>
      </div>
    </div>
  )
}
