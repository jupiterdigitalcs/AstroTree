import { ELEMENT_COLORS } from '../utils/astrology.js'

const ELEMENTS = ['Fire', 'Earth', 'Air', 'Water']

const ELEMENT_ENERGY = {
  Fire:  'passionate and driven',
  Earth: 'grounded and practical',
  Air:   'communicative and curious',
  Water: 'intuitive and emotional',
}

function areCompatible(a, b) {
  if (a === b) return true
  return (
    (a === 'Fire'  && b === 'Air'  ) || (a === 'Air'   && b === 'Fire' ) ||
    (a === 'Earth' && b === 'Water') || (a === 'Water'  && b === 'Earth')
  )
}

export default function InsightsPanel({ nodes, edges }) {
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
          <p className="insight-note">🌿 <strong>Sign inheritance</strong> — signs that pass through generations</p>
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

  // ── Sign inheritance (parent & child share same sign) ─────────────────────
  const parentChildEdges = edges.filter(e => e.data?.relationType === 'parent-child')
  const signMatches = parentChildEdges
    .map(e => {
      const parent = nodes.find(n => n.id === e.source)
      const child  = nodes.find(n => n.id === e.target)
      if (!parent || !child || parent.data.sign !== child.data.sign) return null
      return { parent, child }
    })
    .filter(Boolean)

  return (
    <div className="insights-panel">
      <h2 className="form-title">✦ Family Insights</h2>

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

      {/* ── Sign inheritance ────────────────────────────────────────────── */}
      {signMatches.length > 0 && (
        <div className="insight-card">
          <h3 className="insight-heading">Sun Sign Inheritance</h3>
          {signMatches.map(({ parent, child }, i) => (
            <p key={i} className="insight-note">
              {parent.data.symbol} {parent.data.name} passed their{' '}
              <strong>{parent.data.sign}</strong> energy to {child.data.name}
            </p>
          ))}
        </div>
      )}

      {/* ── Coming soon ─────────────────────────────────────────────────── */}
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
