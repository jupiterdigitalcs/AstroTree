import { useState } from 'react'
import { loadCharts, deleteChart } from '../utils/storage.js'

export default function ChartsPanel({ savedChartId, onLoad, onNew }) {
  const [charts, setCharts] = useState(() => loadCharts())

  function handleDelete(id) {
    deleteChart(id)
    setCharts(loadCharts())
  }

  // Active tree on top, then most recent first
  const sorted = [...charts].sort((a, b) => {
    if (a.id === savedChartId) return -1
    if (b.id === savedChartId) return 1
    return new Date(b.savedAt) - new Date(a.savedAt)
  })

  return (
    <div className="charts-panel">
      {sorted.length > 0 ? (
        <div className="charts-list">
          {sorted.map(c => (
            <div key={c.id} className={`chart-item${c.id === savedChartId ? ' chart-item--active' : ''}`}>
              <div className="chart-item-info">
                <span className="chart-item-title">
                  {c.title}
                  {c.id === savedChartId && <span className="chart-item-badge">active</span>}
                </span>
                <span className="chart-item-meta">
                  {c.nodes.length} member{c.nodes.length !== 1 ? 's' : ''} · {new Date(c.savedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="chart-item-actions">
                {c.id !== savedChartId && (
                  <button type="button" className="connection-add-btn" onClick={() => onLoad(c)}>Load</button>
                )}
                <button type="button" className="connection-remove-btn" onClick={() => handleDelete(c.id)} aria-label="Delete">×</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="bulk-hint">No saved trees yet. Use 💾 Save on the tree screen.</p>
      )}

      <div className="charts-panel-footer">
        <h2 className="charts-panel-title">🗂️ My Trees</h2>
        <button type="button" className="add-row-btn" onClick={onNew}>+ New Tree</button>
      </div>
    </div>
  )
}
