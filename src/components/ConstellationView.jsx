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

// Force-directed layout simulation with cluster-aware spacing
function runForceLayout(nodes, edges, width, height) {
  if (nodes.length === 0) return []
  if (nodes.length === 1) return [{ x: width / 2, y: height / 2 }]

  // Scale layout params to node count
  const n = nodes.length
  const idealEdgeLen = Math.max(80, Math.min(140, 300 / Math.sqrt(n)))
  const repulseK = Math.max(4000, 1200 * n)
  const iterations = Math.min(400, 150 + n * 15)

  // Initialize in a circle
  const positions = nodes.map((_, i) => {
    const angle = (2 * Math.PI * i) / n
    const r = Math.min(width, height) * 0.28
    return { x: width / 2 + r * Math.cos(angle), y: height / 2 + r * Math.sin(angle), vx: 0, vy: 0 }
  })

  const nodeIndex = {}
  nodes.forEach((nd, i) => { nodeIndex[nd.id] = i })

  // Build adjacency for connected-component awareness
  const adj = new Array(n).fill(null).map(() => new Set())
  edges.forEach(e => {
    const si = nodeIndex[e.source], ti = nodeIndex[e.target]
    if (si != null && ti != null) { adj[si].add(ti); adj[ti].add(si) }
  })

  const pad = 50

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = Math.pow(1 - iter / iterations, 1.5) // ease-out cooling

    // Repulsion between all pairs
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = positions[j].x - positions[i].x
        const dy = positions[j].y - positions[i].y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (repulseK * alpha) / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        positions[i].vx -= fx; positions[i].vy -= fy
        positions[j].vx += fx; positions[j].vy += fy
      }
    }

    // Edge attraction — stronger pull for tighter clusters
    edges.forEach(e => {
      const si = nodeIndex[e.source], ti = nodeIndex[e.target]
      if (si == null || ti == null) return
      const dx = positions[ti].x - positions[si].x
      const dy = positions[ti].y - positions[si].y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const force = (dist - idealEdgeLen) * 0.08 * alpha
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      positions[si].vx += fx; positions[si].vy += fy
      positions[ti].vx -= fx; positions[ti].vy -= fy
    })

    // Center gravity
    const cx = width / 2, cy = height / 2
    positions.forEach(p => {
      p.vx += (cx - p.x) * 0.008 * alpha
      p.vy += (cy - p.y) * 0.008 * alpha
    })

    // Apply velocity with damping
    const damping = 0.55
    positions.forEach(p => {
      p.vx *= damping; p.vy *= damping
      p.x += p.vx; p.y += p.vy
      p.x = Math.max(pad, Math.min(width - pad, p.x))
      p.y = Math.max(pad, Math.min(height - pad, p.y))
    })
  }

  // Post-process: separate any remaining overlaps (min distance between nodes)
  const minDist = 50
  for (let pass = 0; pass < 20; pass++) {
    let moved = false
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = positions[j].x - positions[i].x
        const dy = positions[j].y - positions[i].y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        if (dist < minDist) {
          const push = (minDist - dist) / 2
          const nx = (dx / dist) * push, ny = (dy / dist) * push
          positions[i].x -= nx; positions[i].y -= ny
          positions[j].x += nx; positions[j].y += ny
          moved = true
        }
      }
    }
    if (!moved) break
  }

  // Clamp final positions
  positions.forEach(p => {
    p.x = Math.max(pad, Math.min(width - pad, p.x))
    p.y = Math.max(pad, Math.min(height - pad, p.y))
  })

  return positions
}

export default function ConstellationView({ nodes, edges, onSelectNode, layoutTick }) {
  const [hoveredNode, setHoveredNode] = useState(null)
  const [positions, setPositions] = useState([])
  const [dragging, setDragging] = useState(null) // index of node being dragged
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [locked, setLocked] = useState(false)
  const panStart = useRef(null)
  const svgRef = useRef(null)

  const size = 560

  useEffect(() => {
    const pos = runForceLayout(nodes, edges, size, size)
    setPositions(pos)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [nodes, edges, layoutTick])

  const nodeIndex = {}
  nodes.forEach((n, i) => { nodeIndex[n.id] = i })

  // ── Drag handling ──────────────────────────────────────────────────────────
  const getSVGPoint = useCallback((clientX, clientY) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const svgSize = size // viewBox size
    const scaleX = svgSize / rect.width
    const scaleY = svgSize / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }, [size])

  const handlePointerDown = useCallback((e, nodeIdx) => {
    if (locked) return
    e.stopPropagation()
    e.preventDefault()
    setDragging(nodeIdx)
    e.target.setPointerCapture?.(e.pointerId)
  }, [locked])

  const handlePointerMove = useCallback((e) => {
    if (dragging != null && !locked) {
      const pt = getSVGPoint(e.clientX, e.clientY)
      setPositions(prev => {
        const next = [...prev]
        next[dragging] = { ...next[dragging], x: pt.x, y: pt.y }
        return next
      })
    } else if (isPanning && panStart.current) {
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy })
    }
  }, [dragging, locked, isPanning, getSVGPoint])

  const handlePointerUp = useCallback(() => {
    setDragging(null)
    setIsPanning(false)
    panStart.current = null
  }, [])

  const handleBgPointerDown = useCallback((e) => {
    if (locked) return
    setIsPanning(true)
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
  }, [locked, pan])

  const handleWheel = useCallback((e) => {
    if (locked) return
    e.preventDefault()
    setZoom(z => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)))
  }, [locked])

  // Active edge types for compact legend
  const activeEdgeTypes = [...new Set(
    edges.map(e => e.data?.relationType || 'parent-child')
  )]

  return (
    <div
      className="constellation-wrap"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        className="constellation-svg"
        onWheel={handleWheel}
        onPointerDown={handleBgPointerDown}
        style={{ cursor: dragging != null ? 'grabbing' : isPanning ? 'grabbing' : locked ? 'default' : 'grab' }}
      >
        <g transform={`translate(${pan.x / (size / 560) * (1/zoom)}, ${pan.y / (size / 560) * (1/zoom)}) scale(${zoom})`}
           style={{ transformOrigin: `${size/2}px ${size/2}px` }}>

          {/* Defs */}
          <defs>
            {nodes.map((n) => (
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
              style={{ transition: dragging != null ? 'none' : 'all 0.15s ease' }}
            />
          ))}

          {/* Nodes */}
          {positions.length === nodes.length && nodes.map((n, i) => {
            const color = n.data.elementColor || '#c9a84c'
            const isHovered = hoveredNode === n.id
            const isDragged = dragging === i
            return (
              <g
                key={n.id}
                onClick={() => { if (!isDragged) onSelectNode?.(n.id) }}
                onMouseEnter={() => setHoveredNode(n.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onPointerDown={(e) => handlePointerDown(e, i)}
                style={{ cursor: locked ? 'pointer' : isDragged ? 'grabbing' : 'grab' }}
              >
                <circle
                  cx={positions[i].x} cy={positions[i].y}
                  r={isHovered ? 22 : 18}
                  fill="#0d0b1e"
                  stroke={color}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 10px ${color})` : `drop-shadow(0 0 5px ${color}55)`,
                    transition: dragging != null ? 'none' : 'all 0.15s ease',
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
            fill="rgba(201,168,76,0.12)"
            style={{ fontSize: '11px', fontFamily: 'Cinzel, serif', letterSpacing: '0.15em', pointerEvents: 'none' }}
          >
            ✦ CONSTELLATION
          </text>
        </g>
      </svg>

      {/* Zoom / lock controls */}
      <div className="constellation-controls">
        <button type="button" onClick={() => setZoom(z => Math.min(3, z + 0.2))} title="Zoom in">+</button>
        <button type="button" onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} title="Zoom out">−</button>
        <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} title="Reset view">⟲</button>
        <button
          type="button"
          onClick={() => setLocked(l => !l)}
          title={locked ? 'Unlock' : 'Lock positions'}
          className={locked ? 'constellation-ctrl--active' : ''}
        >
          {locked ? '🔒' : '🔓'}
        </button>
      </div>

      {/* Hover tooltip */}
      {hoveredNode && (() => {
        const n = nodes.find(nd => nd.id === hoveredNode)
        if (!n) return null
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

      {/* Compact legend — inline, bottom of view */}
      <div className="constellation-legend">
        {activeEdgeTypes.length > 0 && (
          <div className="constellation-legend-edges">
            {activeEdgeTypes.map(type => (
              <span key={type} className="constellation-legend-edge">
                <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke={EDGE_COLORS[type]} strokeWidth="2" strokeDasharray={EDGE_DASH[type]} /></svg>
                <span style={{ color: `${EDGE_COLORS[type]}bb` }}>{EDGE_LABELS[type]}</span>
              </span>
            ))}
          </div>
        )}
        <div className="constellation-legend-nodes">
          {nodes.map(n => (
            <span
              key={n.id}
              className={`constellation-legend-chip${hoveredNode === n.id ? ' constellation-legend-chip--active' : ''}`}
              onMouseEnter={() => setHoveredNode(n.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onSelectNode?.(n.id)}
              style={{ borderColor: `${n.data.elementColor}44` }}
            >
              <span style={{ color: n.data.elementColor }}>{n.data.symbol}</span>
              <span>{n.data.name}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
