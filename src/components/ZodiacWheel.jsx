import { useState } from 'react'
import { ELEMENT_COLORS } from '../utils/astrology.js'

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

  const size = 500
  const cx = size / 2, cy = size / 2
  const outerR = 220
  const innerR = 120
  const labelR = 88   // centered in inner ring (between center circle r≈55 and innerR)
  const memberR = 175  // centered in outer ring

  // Group nodes by sign
  const nodesBySign = {}
  ZODIAC_ORDER.forEach(z => { nodesBySign[z.sign] = [] })
  nodes.forEach(n => {
    if (nodesBySign[n.data.sign]) nodesBySign[n.data.sign].push(n)
  })

  // Sort nodes in each sign by birthdate (oldest first)
  Object.values(nodesBySign).forEach(arr => {
    arr.sort((a, b) => (a.data.birthdate || '9999').localeCompare(b.data.birthdate || '9999'))
  })

  return (
    <div className="zodiac-wheel-wrap">
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
                  cx={pos.x} cy={pos.y} r={isHovered ? 18 : 15}
                  fill="#0d0b1e"
                  stroke={color}
                  strokeWidth={isHovered ? 2 : 1.2}
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 8px ${color})` : `drop-shadow(0 0 4px ${color}55)`,
                    transition: 'all 0.15s ease',
                  }}
                />
                <text
                  x={pos.x} y={pos.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="zodiac-member-initial"
                  fill={color}
                >
                  {n.data.name.charAt(0).toUpperCase()}
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
          x={cx} y={cy + 10}
          textAnchor="middle"
          className="zodiac-center-sub"
          fill="rgba(184,170,212,0.7)"
        >
          Sun Signs
        </text>
      </svg>

      {/* Hover tooltip */}
      {hoveredNode && (() => {
        const n = nodes.find(nd => nd.id === hoveredNode)
        if (!n) return null
        return (
          <div className="zodiac-tooltip">
            <span className="zodiac-tooltip-symbol" style={{ color: n.data.elementColor }}>{n.data.symbol}</span>
            <span className="zodiac-tooltip-name">{n.data.name}</span>
            <span className="zodiac-tooltip-sign">{n.data.sign}</span>
          </div>
        )
      })()}

      {/* Legend — grouped by zodiac sign */}
      <div className="zodiac-legend">
        {ZODIAC_ORDER
          .filter(z => nodesBySign[z.sign].length > 0)
          .map(z => {
            const color = ELEMENT_COLORS[z.element] ?? '#c9a84c'
            return (
              <div key={z.sign} className="zodiac-legend-group">
                <div className="zodiac-legend-sign-header" style={{ color }}>
                  <span className="zodiac-legend-sign-symbol">{z.symbol}</span>
                  <span className="zodiac-legend-sign-label">{z.sign}</span>
                </div>
                {nodesBySign[z.sign].map(n => (
                  <div
                    key={n.id}
                    className={`zodiac-legend-item${hoveredNode === n.id ? ' zodiac-legend-item--active' : ''}`}
                    onMouseEnter={() => setHoveredNode(n.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => onSelectNode?.(n.id)}
                  >
                    <span className="zodiac-legend-initial" style={{ borderColor: color, color }}>
                      {n.data.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="zodiac-legend-name">{n.data.name}</span>
                  </div>
                ))}
              </div>
            )
          })}
      </div>
    </div>
  )
}
