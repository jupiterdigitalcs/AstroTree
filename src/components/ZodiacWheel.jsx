import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { ELEMENT_COLORS } from '../utils/astrology.js'
import { PlanetSign } from './PlanetSign.jsx'

const ZODIAC_ORDER = [
  { sign: 'Aries',       symbol: '♈', element: 'Fire' },
  { sign: 'Taurus',      symbol: '♉', element: 'Earth' },
  { sign: 'Gemini',      symbol: '♊', element: 'Air' },
  { sign: 'Cancer',      symbol: '♋', element: 'Water' },
  { sign: 'Leo',         symbol: '♌', element: 'Fire' },
  { sign: 'Virgo',       symbol: '♍', element: 'Earth' },
  { sign: 'Libra',       symbol: '♎', element: 'Air' },
  { sign: 'Scorpio',     symbol: '♏', element: 'Water' },
  { sign: 'Sagittarius', symbol: '♐', element: 'Fire' },
  { sign: 'Capricorn',   symbol: '♑', element: 'Earth' },
  { sign: 'Aquarius',    symbol: '♒', element: 'Air' },
  { sign: 'Pisces',      symbol: '♓', element: 'Water' },
]

const SEGMENT_ANGLE = 30
// Thema Mundi: Cancer at the ascendant (9 o'clock), shifted one slot CCW.
// Cancer end = 3*30 + offset + 30 = 270 → offset = 150
const START_OFFSET = 150

// Planet rings — ordered innermost to outermost.
// Sun uses element color (null = derive from node); others use fixed planet color.
// hardCap: node count above which the toggle is disabled (too crowded to read).
const PLANET_RINGS = [
  { key: 'mercury', label: 'Mercury', glyph: '☿', color: '#b8a0d4', r: 127, markerR: 7,  hoverR: 9,  defaultOn: false, hardCap: 14 },
  { key: 'venus',   label: 'Venus',   glyph: '♀', color: '#e879a8', r: 144, markerR: 7,  hoverR: 9,  defaultOn: false, hardCap: 14 },
  { key: 'mars',    label: 'Mars',    glyph: '♂', color: '#e87070', r: 161, markerR: 7,  hoverR: 9,  defaultOn: false, hardCap: 14 },
  { key: 'sun',     label: 'Sun',     glyph: '☀', color: null,      r: 182, markerR: 11, hoverR: 13, defaultOn: true,  hardCap: null },
  { key: 'moon',    label: 'Moon',    glyph: '☽', color: '#9dbbd4', r: 208, markerR: 9,  hoverR: 11, defaultOn: true,  hardCap: null },
]

// Separator dashed circles drawn between adjacent active rings
const SEP_RADII = [
  { r: 135.5, keys: ['mercury', 'venus'] },
  { r: 152.5, keys: ['venus',   'mars']  },
  { r: 171.5, keys: ['mars',    'sun']   },
  { r: 195,   keys: ['sun',     'moon']  },
]

const size   = 500
const cx     = size / 2
const cy     = size / 2
const outerR = 235
const innerR = 118
const labelR = 84

function nameInitial(name) { return (name || '?')[0].toUpperCase() }

function polarToXY(radius, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

function arcPath(r, startAngle, endAngle) {
  const s = polarToXY(r, endAngle)
  const e = polarToXY(r, startAngle)
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y} Z`
}

function spreadAngles(count, segStart) {
  if (count === 1) return [segStart + SEGMENT_ANGLE / 2]
  const pad = 4
  const usable = SEGMENT_ANGLE - pad * 2
  return Array.from({ length: count }, (_, i) => segStart + pad + (usable / (count - 1)) * i)
}

export default function ZodiacWheel({ nodes, edges, onSelectNode }) {
  const [hoveredNode, setHoveredNode] = useState(null)
  const [hoveredSign, setHoveredSign] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan,  setPan]  = useState({ x: 0, y: 0 })
  const dragBase = useRef(null)
  const zoomAreaRef = useRef(null)
  const [selectedGens, setSelectedGens] = useState(new Set()) // empty = all generations
  const [selectedSign, setSelectedSign] = useState(null)

  const [activeRings, setActiveRings] = useState(() =>
    Object.fromEntries(PLANET_RINGS.map(ring => [ring.key, ring.defaultOn]))
  )

  function toggleRing(key) {
    setActiveRings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // ── Generation levels from parent-child edges ──────────────────────────────
  const genLevels = useMemo(() => {
    const pcEdges = (edges || []).filter(e => e.data?.relationType === 'parent-child')
    const parentMap = {}
    nodes.forEach(n => { parentMap[n.id] = [] })
    pcEdges.forEach(e => { if (parentMap[e.target]) parentMap[e.target].push(e.source) })
    const levels = {}
    function level(id, visited = new Set()) {
      if (visited.has(id)) return 0
      if (levels[id] !== undefined) return levels[id]
      visited.add(id)
      const parents = parentMap[id] || []
      levels[id] = parents.length === 0
        ? 0
        : Math.max(...parents.map(pid => level(pid, new Set(visited)))) + 1
      return levels[id]
    }
    nodes.forEach(n => level(n.id))
    return levels
  }, [nodes, edges])

  const allGens = useMemo(() => {
    const gens = [...new Set(nodes.map(n => genLevels[n.id] ?? 0))].sort((a, b) => a - b)
    return gens
  }, [nodes, genLevels])

  const displayNodes = useMemo(() => {
    if (selectedGens.size === 0 || nodes.length <= 5) return nodes
    return nodes.filter(n => selectedGens.has(genLevels[n.id] ?? 0))
  }, [nodes, selectedGens, genLevels])

  const clampZoom = z => Math.max(0.35, Math.min(4, z))

  // Attach wheel listener with { passive: false } so preventDefault works
  useEffect(() => {
    const el = zoomAreaRef.current
    if (!el) return
    function handleWheel(e) {
      e.preventDefault()
      setZoom(z => clampZoom(z * (e.deltaY < 0 ? 1.12 : 0.9)))
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  function onPointerDown(e) {
    if (e.target.closest('.zodiac-member-marker')) return
    dragBase.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y, moved: false, target: e.target }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e) {
    if (!dragBase.current) return
    const dx = Math.abs(e.clientX - dragBase.current.mx)
    const dy = Math.abs(e.clientY - dragBase.current.my)
    if (dx > 4 || dy > 4) dragBase.current.moved = true
    setPan({ x: dragBase.current.px + (e.clientX - dragBase.current.mx),
              y: dragBase.current.py + (e.clientY - dragBase.current.my) })
  }
  function onPointerUp() {
    if (dragBase.current && !dragBase.current.moved) {
      // Treat as a click — check if it landed on a zodiac segment
      const sign = dragBase.current.target?.closest?.('[data-sign]')?.dataset?.sign
      if (sign && anyActiveBySign[sign]) {
        setSelectedSign(s => s === sign ? null : sign)
      } else if (!sign) {
        setSelectedSign(null) // click on empty area clears selection
      }
    }
    dragBase.current = null
  }
  function resetView()   { setZoom(1); setPan({ x: 0, y: 0 }) }

  // Inner planet data — computed only when a planet ring that needs it is active
  const needsInner = activeRings.mercury || activeRings.venus || activeRings.mars
  const innerByNode = useMemo(() => {
    if (!needsInner) return {}
    const m = {}
    nodes.forEach(n => { m[n.id] = n.data?.innerPlanets ?? { mercury: { sign: null, symbol: '☿' }, venus: { sign: null, symbol: '♀' }, mars: { sign: null, symbol: '♂' } } })
    return m
  }, [nodes, needsInner])

  // Build sign→nodes[] map for a given planet ring key (uses displayNodes)
  function nodesForRing(key) {
    const map = {}
    ZODIAC_ORDER.forEach(z => { map[z.sign] = [] })
    displayNodes.forEach(n => {
      let sign = null
      if      (key === 'sun')  sign = n.data.sign
      else if (key === 'moon') sign = (n.data.moonSign && n.data.moonSign !== 'Unknown') ? n.data.moonSign : null
      else                     sign = innerByNode[n.id]?.[key]?.sign ?? null
      if (sign && map[sign]) map[sign].push(n)
    })
    return map
  }

  // Max nodes in any single zodiac segment for a ring (crowding indicator)
  function maxPerSegment(key) {
    const bySign = nodesForRing(key)
    return Math.max(0, ...ZODIAC_ORDER.map(z => bySign[z.sign]?.length ?? 0))
  }

  // Pre-compute for the segment highlight (has ANY active planet in that sign)
  const anyActiveBySign = useMemo(() => {
    const m = {}
    ZODIAC_ORDER.forEach(z => { m[z.sign] = false })
    PLANET_RINGS.forEach(ring => {
      if (!activeRings[ring.key]) return
      const bySign = nodesForRing(ring.key)
      ZODIAC_ORDER.forEach(z => { if (bySign[z.sign]?.length) m[z.sign] = true })
    })
    return m
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRings, innerByNode, displayNodes])

  const sortedNodes = [...displayNodes].sort((a, b) =>
    (a.data.birthdate || '9999').localeCompare(b.data.birthdate || '9999')
  )

  // Tooltip data enrichment
  const hoveredInner = hoveredNode ? innerByNode[hoveredNode] : null

  return (
    <div className="zodiac-wheel-wrap">
      {/* ── Zoomable + pannable SVG ────────────────────────────────────────── */}
      <div
        ref={zoomAreaRef}
        className="zodiac-zoom-area"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="zodiac-zoom-inner"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <svg viewBox={`0 0 ${size} ${size}`} className="zodiac-wheel-svg">

            {/* Segment wedges */}
            {ZODIAC_ORDER.map((z, i) => {
              const startAngle = i * SEGMENT_ANGLE + START_OFFSET
              const endAngle   = startAngle + SEGMENT_ANGLE
              const color      = ELEMENT_COLORS[z.element] ?? '#c9a84c'
              const hasMembers = anyActiveBySign[z.sign]
              const isHov      = hoveredSign === z.sign
              const isSel      = selectedSign === z.sign
              return (
                <g key={z.sign} data-sign={z.sign}>
                  <path d={arcPath(outerR, startAngle, endAngle)}
                    fill={isSel ? `${color}35` : hasMembers ? `${color}18` : 'rgba(255,255,255,0.02)'}
                    stroke={isSel ? `${color}99` : `${color}44`}
                    strokeWidth={isSel ? 1.5 : 1}
                    className="zodiac-segment"
                    style={{ cursor: hasMembers ? 'pointer' : 'default', ...(isHov && !isSel ? { fill: `${color}28` } : {}) }}
                    onMouseEnter={() => setHoveredSign(z.sign)}
                    onMouseLeave={() => setHoveredSign(null)}
                  />
                  <path d={arcPath(innerR, startAngle, endAngle)}
                    fill={`${color}12`} stroke={`${color}33`} strokeWidth="0.5" />
                </g>
              )
            })}

            {/* Sign labels */}
            {ZODIAC_ORDER.map((z, i) => {
              const midAngle   = i * SEGMENT_ANGLE + START_OFFSET + SEGMENT_ANGLE / 2
              const pos        = polarToXY(labelR, midAngle)
              const color      = ELEMENT_COLORS[z.element] ?? '#c9a84c'
              const hasMembers = anyActiveBySign[z.sign]
              return (
                <g key={`lbl-${z.sign}`}>
                  <text x={pos.x} y={pos.y - 6} textAnchor="middle"
                    fontSize={13} fontWeight={600} fill={color}
                    style={{ opacity: hasMembers ? 1 : 0.4 }}>
                    {z.symbol}
                  </text>
                  <text x={pos.x} y={pos.y + 10} textAnchor="middle"
                    fontSize={6} fill={color}
                    fontFamily="Raleway, sans-serif"
                    style={{ opacity: hasMembers ? 0.9 : 0.3, letterSpacing: '0.04em' }}>
                    {z.sign}
                  </text>
                </g>
              )
            })}

            {/* Ring separator dashed lines */}
            {SEP_RADII.map(sep => {
              const [a, b] = sep.keys
              if (!activeRings[a] && !activeRings[b]) return null
              return (
                <circle key={sep.r} cx={cx} cy={cy} r={sep.r}
                  fill="none" stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.75" strokeDasharray="2 5" />
              )
            })}

            {/* Planet markers — render each active ring */}
            {PLANET_RINGS.map(ring => {
              if (!activeRings[ring.key]) return null
              const bySign = nodesForRing(ring.key)
              const large  = ring.markerR >= 9   // sun / moon get initials
              return ZODIAC_ORDER.map((z, si) => {
                const members = bySign[z.sign]
                if (!members.length) return null
                const angles = spreadAngles(members.length, si * SEGMENT_ANGLE + START_OFFSET)
                return members.map((n, mi) => {
                  const pos   = polarToXY(ring.r, angles[mi])
                  const isHov = hoveredNode === n.id
                  const r     = isHov ? ring.hoverR : ring.markerR
                  // Sun uses element color; all others use planet color
                  const strokeColor = ring.key === 'sun'
                    ? (ELEMENT_COLORS[n.data.element] ?? '#c9a84c')
                    : ring.color
                  const glyphFill = ring.key === 'sun'
                    ? 'rgba(201,168,76,0.7)'
                    : `${ring.color}cc`

                  return (
                    <g
                      key={`${ring.key}-${n.id}`}
                      className="zodiac-member-marker"
                      onClick={() => onSelectNode?.(n.id)}
                      onMouseEnter={() => setHoveredNode(n.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle
                        cx={pos.x} cy={pos.y} r={r}
                        fill="#0d0b1e"
                        stroke={strokeColor}
                        strokeWidth={isHov ? (large ? 2 : 1.5) : (large ? 1.2 : 1)}
                        strokeDasharray={!isHov && ring.key === 'moon' ? '3 2.5' : undefined}
                        style={{
                          filter: isHov
                            ? `drop-shadow(0 0 ${large ? 8 : 5}px ${strokeColor})`
                            : `drop-shadow(0 0 ${large ? 4 : 2}px ${strokeColor}55)`,
                          transition: 'all 0.15s ease',
                        }}
                      />
                      {large ? (
                        <>
                          {/* Initial centered in circle */}
                          <text x={pos.x} y={pos.y}
                            textAnchor="middle" dominantBaseline="central"
                            fontSize={9} fontWeight={700}
                            fontFamily="Cinzel, Georgia, serif"
                            fill={strokeColor}>
                            {nameInitial(n.data.name)}
                          </text>
                          {/* Glyph just below the circle */}
                          <text x={pos.x} y={pos.y + ring.markerR + 6}
                            textAnchor="middle" dominantBaseline="central"
                            fontSize={8} style={{ pointerEvents: 'none' }}
                            fill={glyphFill}>
                            {ring.glyph}
                          </text>
                        </>
                      ) : (
                        <>
                          {/* Initial centered in small circle */}
                          <text x={pos.x} y={pos.y}
                            textAnchor="middle" dominantBaseline="central"
                            fontSize={6} fontWeight={600}
                            style={{ pointerEvents: 'none' }}
                            fill={strokeColor}>
                            {nameInitial(n.data.name)}
                          </text>
                          {/* Planet glyph outside, below the circle */}
                          <text x={pos.x} y={pos.y + ring.markerR + 5}
                            textAnchor="middle" dominantBaseline="central"
                            fontSize={7} style={{ pointerEvents: 'none' }}
                            fill={glyphFill}>
                            {ring.glyph}
                          </text>
                        </>
                      )}
                    </g>
                  )
                })
              })
            })}

            {/* Center */}
            <circle cx={cx} cy={cy} r={52}
              fill="rgba(9,7,26,0.92)" stroke="rgba(201,168,76,0.2)" strokeWidth="1" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
              fontSize={20} fill="var(--gold)">✦</text>
          </svg>
        </div>

        {/* Zoom controls — hidden on mobile, gestures handle it there */}
        <div className="zodiac-zoom-controls">
          <button className="zodiac-zoom-btn" onClick={() => setZoom(z => clampZoom(z * 1.2))} title="Zoom in">+</button>
          <button className="zodiac-zoom-btn zodiac-zoom-btn--reset" onClick={resetView} title="Reset view">↺</button>
          <button className="zodiac-zoom-btn" onClick={() => setZoom(z => clampZoom(z * 0.83))} title="Zoom out">−</button>
        </div>

        {/* Mobile pan hint */}
        <p className="zodiac-mobile-hint">drag to pan · pinch to zoom</p>

        {/* Hover tooltip */}
        {hoveredNode && (() => {
          const n = nodes.find(nd => nd.id === hoveredNode)
          if (!n) return null
          return (
            <div className="zodiac-tooltip">
              <span className="zodiac-tooltip-symbol" style={{ color: n.data.elementColor }}>{n.data.symbol}</span>
              <span className="zodiac-tooltip-name">{n.data.name}</span>
              <span className="zodiac-tooltip-sign">{n.data.sign}</span>
              {n.data.moonSign && n.data.moonSign !== 'Unknown' && (
                <span className="zodiac-tooltip-moon">
                  <PlanetSign planet="moon" symbol={n.data.moonSymbol} sign={n.data.moonSign} />
                </span>
              )}
              {hoveredInner?.mercury?.sign && activeRings.mercury && (
                <span className="zodiac-tooltip-moon">
                  <PlanetSign planet="mercury" symbol={hoveredInner.mercury.symbol} sign={hoveredInner.mercury.sign} />
                </span>
              )}
              {hoveredInner?.venus?.sign && activeRings.venus && (
                <span className="zodiac-tooltip-moon">
                  <PlanetSign planet="venus" symbol={hoveredInner.venus.symbol} sign={hoveredInner.venus.sign} />
                </span>
              )}
              {hoveredInner?.mars?.sign && activeRings.mars && (
                <span className="zodiac-tooltip-moon">
                  <PlanetSign planet="mars" symbol={hoveredInner.mars.symbol} sign={hoveredInner.mars.sign} />
                </span>
              )}
            </div>
          )
        })()}
      </div>

      {/* ── Side panel: ring toggles + legend ─────────────────────────────── */}
      <div className="zodiac-side-panel">
      <div className="zodiac-ring-toggles">
        {PLANET_RINGS.map(ring => {
          const isOn      = activeRings[ring.key]
          const maxSeg    = maxPerSegment(ring.key)
          const isCrowded = maxSeg > 4
          return (
            <button
              key={ring.key}
              className={`zodiac-ring-btn${isOn ? ' zodiac-ring-btn--on' : ''}${isCrowded ? ' zodiac-ring-btn--crowded' : ''}`}
              onClick={() => toggleRing(ring.key)}
              title={isCrowded ? `${ring.label}: up to ${maxSeg} markers share one sign — use generation filter to reduce` : `Toggle ${ring.label} ring`}
              style={{ '--ring-color': ring.key === 'sun' ? '#c9a84c' : ring.color }}
            >
              {ring.glyph} {ring.label}
              {isCrowded && <span className="zodiac-ring-cap"> ⚠{maxSeg}</span>}
            </button>
          )
        })}
      </div>
      {nodes.length > 5 && allGens.length > 1 && (
        <div className="zodiac-gen-filter">
          <button
            className={`zodiac-gen-btn${selectedGens.size === 0 ? ' zodiac-gen-btn--on' : ''}`}
            onClick={() => setSelectedGens(new Set())}
          >All</button>
          {allGens.map(g => (
            <button
              key={g}
              className={`zodiac-gen-btn${selectedGens.has(g) ? ' zodiac-gen-btn--on' : ''}`}
              onClick={() => setSelectedGens(prev => {
                const next = new Set(prev)
                if (next.has(g)) next.delete(g); else next.add(g)
                return next
              })}
            >Gen {g + 1}</button>
          ))}
        </div>
      )}

      {/* ── Sign detail panel (hidden during export via filter) ────────────── */}
      {(() => {
        const z = selectedSign ? ZODIAC_ORDER.find(z => z.sign === selectedSign) : null
        const color = z ? (ELEMENT_COLORS[z.element] ?? '#c9a84c') : '#c9a84c'
        const groups = z ? PLANET_RINGS.filter(r => activeRings[r.key]).map(ring => ({
          ring,
          members: nodesForRing(ring.key)[selectedSign] ?? [],
        })).filter(g => g.members.length > 0) : []
        return (
          <div className="zodiac-sign-detail" style={{ display: selectedSign ? undefined : 'none' }}>
            {z && (
              <>
                <div className="zodiac-sign-detail-header" style={{ borderColor: `${color}55` }}>
                  <span className="zodiac-sign-detail-title" style={{ color }}>
                    {z.symbol} {selectedSign}
                    <span className="zodiac-sign-detail-element"> {z.element}</span>
                  </span>
                  <button className="zodiac-sign-detail-close" onClick={() => setSelectedSign(null)}>✕</button>
                </div>
                {groups.length === 0 ? (
                  <p className="zodiac-sign-detail-empty">No active rings have members here.</p>
                ) : groups.map(({ ring, members }) => (
                  <div key={ring.key} className="zodiac-sign-detail-group">
                    <span className="zodiac-sign-detail-planet"
                      style={{ color: ring.key === 'sun' ? '#c9a84c' : ring.color }}>
                      {ring.glyph} {ring.label}
                    </span>
                    <div className="zodiac-sign-detail-members">
                      {members.map(n => (
                        <button
                          key={n.id}
                          className="zodiac-sign-detail-member"
                          style={{ color: n.data.elementColor ?? '#c9a84c' }}
                          onClick={() => { onSelectNode?.(n.id); setSelectedSign(null) }}
                        >
                          {n.data.symbol} {n.data.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )
      })()}

      {/* ── Legend (always rendered; hidden on screen when sign detail is open) ── */}
      <div className="zodiac-legend" style={{ display: selectedSign ? 'none' : undefined }}>
        <div className="zodiac-legend-header">
          <span>
            {PLANET_RINGS.filter(r => activeRings[r.key]).map(r => r.glyph).join(' · ')}
          </span>
        </div>
        {sortedNodes.map(n => {
          const color = n.data.elementColor ?? '#c9a84c'
          const inner = innerByNode[n.id]
          return (
            <div
              key={n.id}
              className={`zodiac-legend-item${hoveredNode === n.id ? ' zodiac-legend-item--active' : ''}`}
              onMouseEnter={() => setHoveredNode(n.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onSelectNode?.(n.id)}
            >
              <span className="zodiac-legend-num" style={{ borderColor: color, color }}>
                {nameInitial(n.data.name)}
              </span>
              <div className="zodiac-legend-info">
                <span className="zodiac-legend-name">{n.data.name}</span>
                <span className="zodiac-legend-signs">
                  {activeRings.sun && (
                    <span style={{ color }}>{n.data.symbol} {n.data.sign}</span>
                  )}
                  {activeRings.moon && n.data.moonSign && n.data.moonSign !== 'Unknown' && (
                    <><span className="zodiac-legend-sep"> · </span>
                    <PlanetSign planet="moon" symbol={n.data.moonSymbol} sign={n.data.moonSign} /></>
                  )}
                  {activeRings.mercury && inner?.mercury?.sign && (
                    <><span className="zodiac-legend-sep"> · </span>
                    <PlanetSign planet="mercury" symbol={inner.mercury.symbol} sign={inner.mercury.sign} /></>
                  )}
                  {activeRings.venus && inner?.venus?.sign && (
                    <><span className="zodiac-legend-sep"> · </span>
                    <PlanetSign planet="venus" symbol={inner.venus.symbol} sign={inner.venus.sign} /></>
                  )}
                  {activeRings.mars && inner?.mars?.sign && (
                    <><span className="zodiac-legend-sep"> · </span>
                    <PlanetSign planet="mars" symbol={inner.mars.symbol} sign={inner.mars.sign} /></>
                  )}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      </div>{/* end zodiac-side-panel */}
    </div>
  )
}
