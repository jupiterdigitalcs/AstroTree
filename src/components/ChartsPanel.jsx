import { useState } from 'react'
import { loadCharts, saveChart, deleteChart } from '../utils/storage.js'

export default function ChartsPanel({ nodes, edges, counter, onLoad, onNew }) {
  const [charts, setCharts] = useState(() => loadCharts())
  const [title,  setTitle]  = useState('')

  function handleSave(e) {
    e.preventDefault()
    if (!title.trim() || nodes.length === 0) return
    saveChart({
      id:      Date.now().toString(),
      title:   title.trim(),
      nodes,
      edges,
      counter,
      savedAt: new Date().toISOString(),
    })
    setCharts(loadCharts())
    setTitle('')
  }

  function handleDelete(id) {
    deleteChart(id)
    setCharts(loadCharts())
  }

  return (
    <div className="charts-panel">
      <h2 className="form-title">✦ My Charts</h2>

      <form className="chart-save-form" onSubmit={handleSave}>
        <input
          type="text"
          className="chart-title-input"
          placeholder="Chart title…"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <button
          type="submit"
          className="connection-add-btn"
          disabled={!title.trim() || nodes.length === 0}
        >Save</button>
      </form>

      {nodes.length === 0 && (
        <p className="bulk-hint">Add members to the tree first, then save.</p>
      )}

      <button type="button" className="add-row-btn" onClick={onNew}>+ New Chart</button>

      {charts.length > 0 ? (
        <div className="charts-list">
          {charts.map(c => (
            <div key={c.id} className="chart-item">
              <div className="chart-item-info">
                <span className="chart-item-title">{c.title}</span>
                <span className="chart-item-meta">
                  {c.nodes.length} member{c.nodes.length !== 1 ? 's' : ''} · {new Date(c.savedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="chart-item-actions">
                <button type="button" className="connection-add-btn" onClick={() => onLoad(c)}>Load</button>
                <button type="button" className="connection-remove-btn" onClick={() => handleDelete(c.id)} aria-label="Delete">×</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="bulk-hint">No saved charts yet.</p>
      )}
    </div>
  )
}
