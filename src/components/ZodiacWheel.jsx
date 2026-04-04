import { useState, useRef, useCallback } from 'react'
import { ELEMENT_COLORS } from '../utils/astrology.js'
import { PlanetSign } from './PlanetSign.jsx'

// Traditional zodiac order starting from Aries, going counter-clockwise (astrological convention)
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

const SEGMENT_ANGLE = 360 / 12 // 30°

function nameInitial(name) {
  return (name || '?')[0].toUpperCase()
}

function polarToXY(cx, cy, radius, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180 // -90 so 0° = top
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToXY(cx, cy, r, endAngle)
  const end   = polarToXY(cx, cy, r, startAngle)
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`
}

export default function ZodiacWheel({ nodes, onSelectNode }) {
  const [hoveredNode, setHoveredNode] = useState(null)
  const [hoveredSign, setHoveredSign] = useState(null)

  // ── Zoom + pan ─────────────────────────────────────────────────────────────
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragBase = useRef(null) // { mx, my, px, py } while dragging

  const clampZoom = (z) => Math.max(0.35, Math.min(4, z))

  const onWheel = useCallback((e) => {
    e.preventDefault()
    setZoom(z => clampZoom(z * (e.deltaY < 0 ? 1.12 : 0.9)))
  }, [])

  function onPointerDown(e) {
    // Only pan on background — let member markers handle their own clicks
    if (e.target.closest('.zodiac-member-marker, .zodiac-moon-marker')) return
    dragBase.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e) {
    if (!dragBase.current) return
    setPan({
      x: dragBase.current.px + (e.clientX - dragBase.current.mx),
      y: dragBase.current.py + (e.clientY - dragBase.current.my),
    })
  }

  function onPointerUp() { dragBase.current = null }

  function resetView() { setZoom(1); setPan({ x: 0, y: 0 }) }

  const size = 500
  const cx = size / 2, cy = size / 2
  const outerR = 220
  const innerR = 120
  const labelR = 88   // centered in inner ring
  const moonColor = '#9dbbd4'

  // Show moon ring for all practical family sizes
  const showMoonRing = nodes.length <= 24

  // When showing moon ring, pull sun markers slightly inward so both fit inside outerR
  const memberR     = showMoonRing ? 162 : 175
  const moonSepR    = 180  // thin separator between sun and moon zones
  const moonMemberR = 196  // moon markers — both rings fit within outerR=220

  // Group nodes by sun sign
  const nodesBySign = {}
  ZODIAC_ORDER.forEach(z => { nodesBySign[z.sign] = [] })
  nodes.forEach(n => {
    if (nodesBySign[n.data.sign]) nodesBySign[n.data.sign].push(n)
  })

  // Group nodes by moon sign
  const nodesByMoonSign = {}
  ZODIAC_ORDER.forEach(z => { nodesByMoonSign[z.sign] = [] })
  nodes.forEach(n => {
    const ms = n.data.moonSign
    if (ms && ms !== 'Unknown' && nodesByMoonSign[ms]) nodesByMoonSign[ms].push(n)
  })

  // Sort by birthdate within each sign group
  Object.values(nodesBySign).forEach(arr => {
    arr.sort((a, b) => (a.data.birthdate || '9999').localeCompare(b.data.birthdate || '9999'))
  })

  // Flat sorted node list for legend (oldest first)
  const sortedNodes = [...nodes].sort((a, b) =>
    (a.data.birthdate || '9999').localeCompare(b.data.birthdate || '9999')
  )

  return (
    <div className="zodiac-wheel-wrap">
      {/* Zoomable + pannable SVG area */}
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
          const color = ELEMENT_COLORS[z.element] ?? '#c9a84c'
          const hasMembers = nodesBySign[z.sign].length > 0
          const isHovered = hoveredSign === z.sign

          return (
            <g key={z.sign}>
              {/* Outer segment (member zone) */}
              <path
                d={arcPath(cx, cy, outerR, startAngle, endAngle)}
                fill={hasMembers ? `${color}18` : 'rgba(255,255,255,0.02)'}
                stroke={`${color}44`}
                strokeWidth="1"
                className="zodiac-segment"
                style={isHovered ? { fill: `${color}28` } : undefined}
                onMouseEnter={() => setHoveredSign(z.sign)}
                onMouseLeave={() => setHoveredSign(null)}
              />
              {/* Inner ring segment (sign label zone) */}
              <path
                d={arcPath(cx, cy, innerR, startAngle, endAngle)}
                fill={`${color}12`}
                stroke={`${color}33`}
                strokeWidth="0.5"
              />
            </g>
          )
        })}

        {/* Sign labels in inner ring */}
        {ZODIAC_ORDER.map((z, i) => {
          const midAngle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
          const pos = polarToXY(cx, cy, labelR, midAngle)
          const color = ELEMENT_COLORS[z.element] ?? '#c9a84c'
          const hasMembers = nodesBySign[z.sign].length > 0
          return (
            <g key={`label-${z.sign}`}>
              <text
                x={pos.x} y={pos.y - 6}
                textAnchor="middle"
                className="zodiac-sign-symbol"
                fill={color}
                style={{ opacity: hasMembers ? 1 : 0.4 }}
              >
                {z.symbol}
              </text>
              <text
                x={pos.x} y={pos.y + 10}
                textAnchor="middle"
                className="zodiac-sign-name"
                fill={color}
                style={{ opacity: hasMembers ? 0.9 : 0.3 }}
              >
                {z.sign}
              </text>
            </g>
          )
        })}

        {/* Member markers in outer zone */}
        {ZODIAC_ORDER.map((z, i) => {
          const members = nodesBySign[z.sign]
          if (!members.length) return null
          const startAngle = i * SEGMENT_ANGLE
          const color = ELEMENT_COLORS[z.element] ?? '#c9a84c'

          return members.map((n, mi) => {
            // Spread members within the segment arc
            const count = members.length
            const pad = 4 // degrees padding from edges
            const usable = SEGMENT_ANGLE - pad * 2
            const offset = count === 1
              ? SEGMENT_ANGLE / 2
              : pad + (usable / (count - 1)) * mi
            const angle = startAngle + offset

            const pos = polarToXY(cx, cy, memberR, angle)
            const isHovered = hoveredNode === n.id

            return (
              <g
                key={n.id}
                className="zodiac-member-marker"
                onClick={() => onSelectNode?.(n.id)}
                onMouseEnter={() => setHoveredNode(n.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={pos.x} cy={pos.y} r={isHovered ? 20 : 17}
                  fill="#0d0b1e"
                  stroke={color}
                  strokeWidth={isHovered ? 2 : 1.2}
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 8px ${color})` : `drop-shadow(0 0 4px ${color}55)`,
                    transition: 'all 0.15s ease',
                  }}
                />
                <text
                  x={pos.x} y={pos.y - 3}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="zodiac-member-initial"
                  fill={color}
                >
                  {nameInitial(n.data.name)}
                </text>
                <text
                  x={pos.x} y={pos.y + 8}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="zodiac-member-sign-glyph"
                  fill="rgba(201,168,76,0.7)"
                >
                  ☀
                </text>
              </g>
            )
          })
        })}

        {/* Moon zone separator + markers — only shown when family is small enough */}
        {showMoonRing && <circle
          cx={cx} cy={cy} r={moonSepR}
          fill="none"
          stroke={`${moonColor}28`}
          strokeWidth="1"
          strokeDasharray="3 5"
        />}

        {showMoonRing && ZODIAC_ORDER.map((z, i) => {
          const members = nodesByMoonSign[z.sign]
          if (!members.length) return null
          const startAngle = i * SEGMENT_ANGLE

          return members.map((n, mi) => {
            const count = members.length
            const pad = 4
            const usable = SEGMENT_ANGLE - pad * 2
            const offset = count === 1
              ? SEGMENT_ANGLE / 2
              : pad + (usable / (count - 1)) * mi
            const angle = startAngle + offset
            const pos = polarToXY(cx, cy, moonMemberR, angle)
            const isHov = hoveredNode === n.id

            return (
              <g
                key={`moon-${n.id}`}
                onClick={() => onSelectNode?.(n.id)}
                onMouseEnter={() => setHoveredNode(n.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={pos.x} cy={pos.y} r={isHov ? 14 : 12}
                  fill="#0d0b1e"
                  stroke={moonColor}
                  strokeWidth={isHov ? 1.5 : 1}
                  strokeDasharray={isHov ? undefined : '3 2.5'}
                  style={{
                    filter: isHov ? `drop-shadow(0 0 6px ${moonColor})` : `drop-shadow(0 0 3px ${moonColor}55)`,
                    transition: 'all 0.15s ease',
                  }}
                />
                <text
                  x={pos.x} y={pos.y - 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="zodiac-moon-initial"
                  fill={moonColor}
                >
                  {nameInitial(n.data.name)}
                </text>
                <text
                  x={pos.x} y={pos.y + 6}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="zodiac-moon-sign-glyph"
                  fill={`${moonColor}bb`}
                >
                  ☽
                </text>
              </g>
            )
          })
        })}

        {/* Center circle */}
        <circle
          cx={cx} cy={cy} r={55}
          fill="rgba(9,7,26,0.9)"
          stroke="rgba(201,168,76,0.2)"
          strokeWidth="1"
        />
        <text
          x={cx} y={cy - 8}
          textAnchor="middle"
          className="zodiac-center-title"
          fill="var(--gold)"
        >
          ✦
        </text>
        <text
          x={cx} y={cy + 5}
          textAnchor="middle"
          className="zodiac-center-sub"
          fill="rgba(201,168,76,0.6)"
        >
          ☀ Sun
        </text>
        <text
          x={cx} y={cy + 19}
          textAnchor="middle"
          className="zodiac-center-sub"
          fill="rgba(157,187,212,0.6)"
        >
          ☽ Moon
        </text>
      </svg>
        </div>{/* zodiac-zoom-inner */}
        {/* Zoom controls — inside zoom area so they're always visible regardless of scroll */}
        <div className="zodiac-zoom-controls">
          <button className="zodiac-zoom-btn" onClick={() => setZoom(z => clampZoom(z * 1.2))} title="Zoom in">+</button>
          <button className="zodiac-zoom-btn zodiac-zoom-btn--reset" onClick={resetView} title="Reset view">↺</button>
          <button className="zodiac-zoom-btn" onClick={() => setZoom(z => clampZoom(z * 0.83))} title="Zoom out">−</button>
        </div>
        {/* Hover tooltip — inside zoom area for correct relative positioning */}
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
            </div>
          )
        })()}
      </div>{/* zodiac-zoom-area */}

      {/* Legend — flat numbered grid, 2 columns, sorted oldest→youngest */}
      <div className="zodiac-legend">
        <div className="zodiac-legend-header">
          <span>☀ Sun &nbsp;·&nbsp; ☽ Moon</span>
          {!showMoonRing && <span className="zodiac-legend-note">Moon hidden (large family)</span>}
        </div>
        {sortedNodes.map(n => {
          const color = n.data.elementColor ?? '#c9a84c'
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
                  <span style={{ color }}>{n.data.symbol} {n.data.sign}</span>
                  {n.data.moonSign && n.data.moonSign !== 'Unknown' && (
                    <><span className="zodiac-legend-sep"> · </span>
                    <PlanetSign planet="moon" symbol={n.data.moonSymbol} sign={n.data.moonSign} /></>
                  )}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
