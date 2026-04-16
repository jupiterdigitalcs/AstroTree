import { useState, useRef, useEffect, useMemo } from 'react'

const EL_COLORS = { Fire: '#e8634a', Earth: '#7ab648', Air: '#5bc8f5', Water: '#6b8dd6' }

export function TreeLegend({ onGoToTables, nodes }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Collect all sibling group symbol+color combos present in the tree
  const siblingGlyphs = useMemo(() => {
    if (!nodes) return []
    const combos = []
    const seen = new Set()
    nodes.forEach(n => {
      const sym = n.data?.siblingGroupSymbol
      const col = n.data?.siblingGroupColor
      if (!sym || !col) return
      const key = `${sym}|${col}`
      if (seen.has(key)) return
      seen.add(key)
      combos.push({ symbol: sym, color: col })
    })
    return combos
  }, [nodes])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handleClick)
    return () => document.removeEventListener('pointerdown', handleClick)
  }, [open])

  return (
    <div className="tree-legend" ref={ref}>
      <button
        type="button"
        className="relayout-btn tree-legend-toggle"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        title="What do the dots mean?"
      >
        <span className="tree-legend-dots-preview">
          {['Fire', 'Earth', 'Air', 'Water'].map(el => (
            <span key={el} className="tree-legend-dot-sm" style={{ background: EL_COLORS[el] }} />
          ))}
        </span>
        {open ? '✕' : '?'}
      </button>
      {open && (
        <div className="tree-legend-panel">
          <p className="tree-legend-title">Reading the Nodes</p>
          <p className="tree-legend-desc">
            <strong>Element badge</strong> — sun sign element. <strong>Colored dots</strong> — element breakdown across Sun, Moon, Mercury, Venus, Mars. Brighter = more placements.
          </p>
          <div className="tree-legend-elements">
            {Object.entries(EL_COLORS).map(([el, color]) => (
              <div key={el} className="tree-legend-row">
                <span className="tree-legend-dot" style={{ background: color }} />
                <span className="tree-legend-label">{el}</span>
              </div>
            ))}
          </div>
          <button type="button" className="tree-legend-tables-link" onClick={() => { setOpen(false); onGoToTables() }}>
            See full planet breakdown in Tables ✦
          </button>
          {siblingGlyphs.length > 0 && (
            <p className="tree-legend-sibling-note">
              {siblingGlyphs.map(({ symbol, color }) => (
                <span key={`${symbol}-${color}`} className="tree-legend-sibling-sym" style={{ color }}>{symbol}</span>
              ))}
              <span className="tree-legend-label"> = siblings (shared parents)</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
