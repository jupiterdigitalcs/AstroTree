import { useState, useRef, useEffect } from 'react'
import { EDGE_COLORS, EDGE_LABELS, EDGE_DASH } from '../utils/treeHelpers.js'

export function ConstellationLegend({ nodes, edges, onSelectNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handleClick)
    return () => document.removeEventListener('pointerdown', handleClick)
  }, [open])

  const activeEdgeTypes = [...new Set(
    edges.map(e => e.data?.relationType || 'parent-child')
  )]

  return (
    <div className="constellation-legend-explainer" ref={ref}>
      <button
        type="button"
        className="relayout-btn tree-legend-toggle"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        title="What do the lines and colors mean?"
      >
        <span className="constellation-legend-preview">✦</span>
        {open ? '✕' : '?'}
      </button>
      {open && (
        <div className="tree-legend-panel constellation-legend-panel">
          <p className="tree-legend-title">Reading the Star Map</p>
          <p className="tree-legend-desc">
            Each <strong>star node</strong> is colored by Sun sign element. Lines show relationships — style and color indicate the type of connection.
          </p>
          <p className="constellation-sun-note" style={{ margin: '0.3rem 0' }}>☀ Nodes colored by Sun sign</p>
          {activeEdgeTypes.length > 0 && (
            <div className="constellation-legend-edges" style={{ marginBottom: '0.4rem' }}>
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
                className="constellation-legend-chip"
                onClick={() => { setOpen(false); onSelectNode?.(n.id) }}
                style={{ borderColor: `${n.data.elementColor || n.data?.elementColor}44` }}
              >
                <span style={{ color: n.data.elementColor }}>{n.data.symbol}</span>
                <span>{n.data.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
