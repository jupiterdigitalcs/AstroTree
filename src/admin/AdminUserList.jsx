import { useState, useEffect } from 'react'
import { fetchDevicesGrouped } from './utils/adminStorage.js'

export default function AdminUserList({ onSelectDevice }) {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    fetchDevicesGrouped().then(d => { setDevices(d); setLoading(false) })
  }, [])

  if (loading) return <p className="admin-loading">Loading…</p>
  if (!devices.length) return <p className="admin-empty">No users found.</p>

  return (
    <div className="admin-user-list">
      {devices.map(d => {
        const label = d.email ?? `Anonymous · ${d.deviceId.slice(0, 8)}…`
        const location = [d.city, d.country].filter(Boolean).join(', ') || d.timezone || '—'
        const isOpen = expanded === d.deviceId

        return (
          <div key={d.deviceId} className={`admin-user-row${isOpen ? ' admin-user-row--open' : ''}`}>
            <button
              type="button"
              className="admin-user-header"
              onClick={() => setExpanded(isOpen ? null : d.deviceId)}
            >
              <span className="admin-user-chevron">{isOpen ? '▾' : '▸'}</span>
              <span className="admin-user-label">{label}</span>
              <span className="admin-user-location">{location}</span>
              <span className="admin-user-count">
                {d.treeCount} tree{d.treeCount !== 1 ? 's' : ''}
              </span>
              {d.lastSeen && (
                <span className="admin-dim" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  {new Date(d.lastSeen).toLocaleDateString()}
                </span>
              )}
            </button>

            {isOpen && (
              <div className="admin-user-trees">
                {d.treeTitles.filter(Boolean).map((title, i) => (
                  <div key={i} className="admin-user-tree-row">
                    <span className="admin-user-tree-title">✦ {title}</span>
                    <button
                      type="button"
                      className="admin-btn admin-btn--sm"
                      onClick={() => onSelectDevice(d.deviceId, title)}
                    >
                      Preview
                    </button>
                  </div>
                ))}
                <div className="admin-user-meta">
                  <span>Referrer: {d.referrer || '—'}</span>
                  {d.timezone && <span>TZ: {d.timezone}</span>}
                  <span className="admin-dim" style={{ fontSize: '0.7rem' }}>
                    ID: {d.deviceId}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
