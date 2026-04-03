import { useState, useEffect, useRef, useCallback } from 'react'
import { ELEMENT_COLORS } from '../utils/astrology.js'

const EDGE_COLORS = {
  'parent-child': '#c9a84c',
  'spouse':       '#d4a0bc',
  'friend':       '#5bc8f5',
  'coworker':     '#a0a0b8',
}

const EDGE_LABELS = {
  'parent-child': 'family',
  'spouse':       'partner',
  'friend':       'friend',
  'coworker':     'coworker',
}

const EDGE_DASH = {
  'parent-child': 'none',
  'spouse':       '6,4',
  'friend':       '4,4',
  'coworker':     '4,4',
}

// Simple force-directed layout simulation
function runForceLayout(nodes, edges, width, height, iterations = 200) {
  if (nodes.length === 0) return []

  // Initialize positions in a circle
  const positions = nodes.map((_, i) => {
    const angle = (2 * Math.PI * i) / nodes.length
    const r = Math.min(width, height) * 0.25
    return {
      x: width / 2 + r * Math.cos(angle),
      y: height / 2 + r * Math.sin(angle),
      vx: 0, vy: 0,
    }
  })

  const nodeIndex = {}
  nodes.forEach((n, i) => { nodeIndex[n.id] = i })

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations // cooling

    // Repulsion between all pairs
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        let dx = positions[j].x - positions[i].x
        let dy = positions[j].y - positions[i].y
        let dist = Math.sqrt(dx * dx + dy * dy) || 1
        const repulse = (8000 * alpha) / (dist * dist)
        const fx = (dx / dist) * repulse
        const fy = (dy / dist) * repulse
        positions[i].vx -= fx
        positions[i].vy -= fy
        positions[j].vx += fx
        positions[j].vy += fy
      }
    }

    // Attraction along edges
    edges.forEach(e => {
      const si = nodeIndex[e.source]
      const ti = nodeIndex[e.target]
      if (si == null || ti == null) return
      const dx = positions[ti].x - positions[si].x
      const dy = positions[ti].y - positions[si].y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const idealDist = 120
      const attract = ((dist - idealDist) * 0.05 * alpha)
      const fx = (dx / dist) * attract
      const fy = (dy / dist) * attract
      positions[si].vx += fx
      positions[si].vy += fy
      positions[ti].vx -= fx
      positions[ti].vy -= fy
    })

    // Center gravity
    positions.forEach(p => {
      p.vx += (width / 2 - p.x) * 0.01 * alpha
      p.vy += (height / 2 - p.y) * 0.01 * alpha
    })

    // Apply velocity with damping
    positions.forEach(p => {
      p.vx *= 0.6
      p.vy *= 0.6
      p.x += p.vx
      p.y += p.vy
      // Keep in bounds
      p.x = Math.max(40, Math.min(width - 40, p.x))
      p.y = Math.max(40, Math.min(height - 40, p.y))
    })
  }

  return positions
}

export default function ConstellationView({ nodes, edges, onSelectNode }) {
  const [hoveredNode, setHoveredNode] = useState(null)
  const [positions, setPositions] = useState([])
  const containerRef = useRef(null)

  const size = 560

  useEffect(() => {
    const pos = runForceLayout(nodes, edges, size, size)
    setPositions(pos)
  }, [nodes, edges])

  const nodeIndex = {}
  nodes.forEach((n, i) => { nodeIndex[n.id] = i })

  // Group nodes by element for the legend
  const nodesByElement = {}
  nodes.forEach(n => {
    const el = n.data.element || 'Unknown'
    if (!nodesByElement[el]) nodesByElement[el] = []
    nodesByElement[el].push(n)
  })

  return (
    <div className="constellation-wrap" ref={containerRef}>
      <svg viewBox={`0 0 ${size} ${size}`} className="constellation-svg">
        {/* Background glow */}
        <defs>
          {nodes.map((n, i) => (
            <radialGradient key={`glow-${n.id}`} id={`node-glow-${n.id}`}>
              <stop offset="0%" stopColor={n.data.elementColor || '#c9a84c'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={n.data.elementColor || '#c9a84c'} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        {/* Edges */}
        {positions.length === nodes.length && edges.map(e => {
          const si = nodeIndex[e.source]
          const ti = nodeIndex[e.target]
          if (si == null || ti == null) return null
          const relType = e.data?.relationType || 'parent-child'
          const color = EDGE_COLORS[relType] || '#c9a84c'
          const dash = EDGE_DASH[relType] || 'none'
          return (
            <line
              key={e.id}
              x1={positions[si].x} y1={positions[si].y}
              x2={positions[ti].x} y2={positions[ti].y}
              stroke={color}
              strokeWidth={1.2}
              strokeDasharray={dash}
              opacity={0.5}
              className="constellation-edge"
            />
          )
        })}

        {/* Node glows */}
        {positions.length === nodes.length && nodes.map((n, i) => (
          <circle
            key={`glow-${n.id}`}
            cx={positions[i].x} cy={positions[i].y}
            r={hoveredNode === n.id ? 35 : 28}
            fill={`url(#node-glow-${n.id})`}
            style={{ transition: 'r 0.15s ease' }}
          />
        ))}

        {/* Nodes */}
        {positions.length === nodes.length && nodes.map((n, i) => {
          const color = n.data.elementColor || '#c9a84c'
          const isHovered = hoveredNode === n.id
          return (
            <g
              key={n.id}
              className="constellation-node"
              onClick={() => onSelectNode?.(n.id)}
              onMouseEnter={() => setHoveredNode(n.id)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={positions[i].x} cy={positions[i].y}
                r={isHovered ? 22 : 18}
                fill="#0d0b1e"
                stroke={color}
                strokeWidth={isHovered ? 2.5 : 1.5}
                style={{
                  filter: isHovered ? `drop-shadow(0 0 10px ${color})` : `drop-shadow(0 0 5px ${color}55)`,
                  transition: 'all 0.15s ease',
                }}
              />
              <text
                x={positions[i].x} y={positions[i].y - 2}
                textAnchor="middle"
                dominantBaseline="central"
                className="constellation-node-symbol"
                fill={color}
                style={{ fontSize: isHovered ? '14px' : '12px', transition: 'font-size 0.15s ease' }}
              >
                {n.data.symbol}
              </text>
              <text
                x={positions[i].x} y={positions[i].y + 32}
                textAnchor="middle"
                className="constellation-node-name"
                fill="rgba(184,170,212,0.85)"
                style={{
                  fontSize: '9px',
                  fontFamily: 'Cinzel, serif',
                  letterSpacing: '0.04em',
                  opacity: isHovered ? 1 : 0.7,
                }}
              >
                {n.data.name}
              </text>
            </g>
          )
        })}

        {/* Center label */}
        <text
          x={size / 2} y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(201,168,76,0.15)"
          style={{ fontSize: '11px', fontFamily: 'Cinzel, serif', letterSpacing: '0.15em' }}
        >
          ✦ CONSTELLATION
        </text>
      </svg>

      {/* Hover tooltip */}
      {hoveredNode && (() => {
        const n = nodes.find(nd => nd.id === hoveredNode)
        if (!n) return null
        // Find this node's connections
        const connections = edges
          .filter(e => e.source === n.id || e.target === n.id)
          .map(e => {
            const otherId = e.source === n.id ? e.target : e.source
            const other = nodes.find(nd => nd.id === otherId)
            const relType = e.data?.relationType || 'parent-child'
            return other ? `${other.data.name} (${EDGE_LABELS[relType] || relType})` : null
          })
          .filter(Boolean)
        return (
          <div className="zodiac-tooltip constellation-tooltip">
            <span className="zodiac-tooltip-symbol" style={{ color: n.data.elementColor }}>{n.data.symbol}</span>
            <span className="zodiac-tooltip-name">{n.data.name}</span>
            <span className="zodiac-tooltip-sign">{n.data.sign} · {n.data.element}</span>
            {connections.length > 0 && (
              <span className="constellation-tooltip-connections">
                {connections.join(' · ')}
              </span>
            )}
          </div>
        )
      })()}

      {/* Legend — edge type colors */}
      <div className="constellation-legend">
        <div className="constellation-legend-title">Connections</div>
        {Object.entries(EDGE_COLORS).map(([type, color]) => {
          const hasType = edges.some(e => (e.data?.relationType || 'parent-child') === type)
          if (!hasType) return null
          return (
            <div key={type} className="constellation-legend-item">
              <svg width="20" height="8" style={{ flexShrink: 0 }}>
                <line x1="0" y1="4" x2="20" y2="4"
                  stroke={color} strokeWidth="2"
                  strokeDasharray={EDGE_DASH[type]}
                />
              </svg>
              <span style={{ color: `${color}cc` }}>{EDGE_LABELS[type]}</span>
            </div>
          )
        })}
        <div className="constellation-legend-divider" />
        {nodes.map(n => (
          <div
            key={n.id}
            className={`zodiac-legend-item${hoveredNode === n.id ? ' zodiac-legend-item--active' : ''}`}
            onMouseEnter={() => setHoveredNode(n.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => onSelectNode?.(n.id)}
          >
            <span className="zodiac-legend-initial" style={{ borderColor: n.data.elementColor, color: n.data.elementColor }}>
              {n.data.name.charAt(0).toUpperCase()}
            </span>
            <span className="zodiac-legend-name">{n.data.name}</span>
            <span style={{ color: n.data.elementColor, fontSize: '0.65rem', opacity: 0.7 }}>{n.data.sign}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
