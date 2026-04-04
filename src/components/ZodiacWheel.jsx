import { useState, useRef, useCallback, useMemo } from 'react'
import { ELEMENT_COLORS, getInnerPlanetSigns } from '../utils/astrology.js'
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

export default function ZodiacWheel({ nodes, onSelectNode }) {
  const [hoveredNode, setHoveredNode] = useState(null)
  const [hoveredSign, setHoveredSign] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan,  setPan]  = useState({ x: 0, y: 0 })
  const dragBase = useRef(null)

  const [activeRings, setActiveRings] = useState(() =>
    Object.fromEntries(PLANET_RINGS.map(ring => [
      ring.key,
      ring.defaultOn && (ring.hardCap === null || nodes.length <= ring.hardCap),
    ]))
  )

  function toggleRing(key) {
    setActiveRings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const clampZoom = z => Math.max(0.35, Math.min(4, z))

  const onWheel = useCallback(e => {
    e.preventDefault()
    setZoom(z => clampZoom(z * (e.deltaY < 0 ? 1.12 : 0.9)))
  }, [])

  function onPointerDown(e) {
    if (e.target.closest('.zodiac-member-marker')) return
    dragBase.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e) {
    if (!dragBase.current) return
    setPan({ x: dragBase.current.px + (e.clientX - dragBase.current.mx),
              y: dragBase.current.py + (e.clientY - dragBase.current.my) })
  }
  function onPointerUp() { dragBase.current = null }
  function resetView()   { setZoom(1); setPan({ x: 0, y: 0 }) }

  // Inner planet data — computed only when a planet ring that needs it is active
  const needsInner = activeRings.mercury || activeRings.venus || activeRings.mars
  const innerByNode = useMemo(() => {
    if (!needsInner) return {}
    const m = {}
    nodes.forEach(n => { m[n.id] = getInnerPlanetSigns(n.data.birthdate, n.data.birthTime ?? null) })
    return m
  }, [nodes, needsInner])

  // Build sign→nodes[] map for a given planet ring key
  function nodesForRing(key) {
    const map = {}
    ZODIAC_ORDER.forEach(z => { map[z.sign] = [] })
    nodes.forEach(n => {
      let sign = null
      if      (key === 'sun')  sign = n.data.sign
      else if (key === 'moon') sign = (n.data.moonSign && n.data.moonSign !== 'Unknown') ? n.data.moonSign : null
      else                     sign = innerByNode[n.id]?.[key]?.sign ?? null
      if (sign && map[sign]) map[sign].push(n)
    })
    return map
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
  }, [activeRings, innerByNode, nodes])

  const sortedNodes = [...nodes].sort((a, b) =>
    (a.data.birthdate || '9999').localeCompare(b.data.birthdate || '9999')
  )

  // Tooltip data enrichment
  const hoveredInner = hoveredNode ? innerByNode[hoveredNode] : null

  return (
    <div className="zodiac-wheel-wrap">
      {/* ── Zoomable + pannable SVG ────────────────────────────────────────── */}
      <div
        className="zodiac-zoom-area"
        onWheel={onWheel}
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
              const startAngle = i * SEGMENT_ANGLE
              const endAngle   = startAngle + SEGMENT_ANGLE
              const color      = ELEMENT_COLORS[z.element] ?? '#c9a84c'
              const hasMembers = anyActiveBySign[z.sign]
              const isHov      = hoveredSign === z.sign
              return (
                <g key={z.sign}>
                  <path d={arcPath(outerR, startAngle, endAngle)}
                    fill={hasMembers ? `${color}18` : 'rgba(255,255,255,0.02)'}
                    stroke={`${color}44`} strokeWidth="1"
                    className="zodiac-segment"
                    style={isHov ? { fill: `${color}28` } : undefined}
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
              const midAngle   = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
              const pos        = polarToXY(labelR, midAngle)
              const color      = ELEMENT_COLORS[z.element] ?? '#c9a84c'
              const hasMembers = anyActiveBySign[z.sign]
              return (
                <g key={`lbl-${z.sign}`}>
                  <text x={pos.x} y={pos.y - 6} textAnchor="middle"
                    className="zodiac-sign-symbol" fill={color}
                    style={{ opacity: hasMembers ? 1 : 0.4 }}>
                    {z.symbol}
                  </text>
                  <text x={pos.x} y={pos.y + 10} textAnchor="middle"
                    className="zodiac-sign-name" fill={color}
                    style={{ opacity: hasMembers ? 0.9 : 0.3 }}>
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
                const angles = spreadAngles(members.length, si * SEGMENT_ANGLE)
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
                            className="zodiac-member-initial" fill={strokeColor}>
                            {nameInitial(n.data.name)}
                          </text>
                          {/* Glyph just below the circle */}
                          <text x={pos.x} y={pos.y + ring.markerR + 6}
                            textAnchor="middle" dominantBaseline="central"
                            style={{ fontSize: '8px', pointerEvents: 'none' }}
                            fill={glyphFill}>
                            {ring.glyph}
                          </text>
                        </>
                      ) : (
                        <text x={pos.x} y={pos.y + 1}
                          textAnchor="middle" dominantBaseline="central"
                          style={{ fontSize: '7px', pointerEvents: 'none' }}
                          fill={glyphFill}>
                          {ring.glyph}
                        </text>
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
              className="zodiac-center-title" fill="var(--gold)">✦</text>
          </svg>
        </div>

        {/* Zoom controls */}
        <div className="zodiac-zoom-controls">
          <button className="zodiac-zoom-btn" onClick={() => setZoom(z => clampZoom(z * 1.2))} title="Zoom in">+</button>
          <button className="zodiac-zoom-btn zodiac-zoom-btn--reset" onClick={resetView} title="Reset view">↺</button>
          <button className="zodiac-zoom-btn" onClick={() => setZoom(z => clampZoom(z * 0.83))} title="Zoom out">−</button>
        </div>

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
          const isCapped = ring.hardCap !== null && nodes.length > ring.hardCap
          const isOn     = activeRings[ring.key]
          return (
            <button
              key={ring.key}
              className={`zodiac-ring-btn${isOn ? ' zodiac-ring-btn--on' : ''}${isCapped ? ' zodiac-ring-btn--capped' : ''}`}
              onClick={() => !isCapped && toggleRing(ring.key)}
              disabled={isCapped}
              title={isCapped ? `Too many people for a clear ${ring.label} ring (max ${ring.hardCap})` : `Toggle ${ring.label} ring`}
              style={{ '--ring-color': ring.key === 'sun' ? '#c9a84c' : ring.color }}
            >
              {ring.glyph} {ring.label}
              {isCapped && <span className="zodiac-ring-cap"> crowded</span>}
            </button>
          )
        })}
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div className="zodiac-legend">
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
