import { useState } from 'react'
import AdminStatsPanel from './AdminStatsPanel.jsx'
import AdminTreeList from './AdminTreeList.jsx'
import AdminUserList from './AdminUserList.jsx'
import AdminTreePreview from './AdminTreePreview.jsx'
import AdminPaywallPanel from './AdminPaywallPanel.jsx'
import { fetchAllCharts } from './utils/adminStorage.js'

const OWNER_EMAIL = 'chrissysoll@gmail.com'

export default function AdminDashboard() {
  const [view,         setView]         = useState('trees') // 'trees' | 'users' | 'paywall'
  const [selectedTree, setSelectedTree] = useState(null)
  const [excludeOwner, setExcludeOwner] = useState(true)

  async function handleSelectDevice(deviceId, title) {
    // Load all trees for device then find the matching one by title
    const all = await fetchAllCharts({ search: title })
    const match = all.find(c => c.deviceId === deviceId && c.title === title) ?? all[0]
    if (match) setSelectedTree(match)
  }

  return (
    <div className="admin-dashboard">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={excludeOwner} onChange={e => setExcludeOwner(e.target.checked)} />
          Exclude chrissysoll from everything
        </label>
      </div>

      <a
        href="/carousel.html"
        target="_blank"
        rel="noopener"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.9rem',
          marginBottom: '0.6rem',
          borderRadius: '8px',
          background: 'rgba(201,168,76,0.1)',
          border: '1px solid rgba(201,168,76,0.25)',
          color: '#c9a84c',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textDecoration: 'none',
        }}
      >
        IG Carousel Builder
      </a>

      <AdminStatsPanel excludeOwner={excludeOwner} ownerEmail={OWNER_EMAIL} />

      <div className="admin-view-toggle">
        <button
          type="button"
          className={`admin-toggle-btn${view === 'trees' ? ' admin-toggle-btn--active' : ''}`}
          onClick={() => setView('trees')}
        >
          All Trees
        </button>
        <button
          type="button"
          className={`admin-toggle-btn${view === 'users' ? ' admin-toggle-btn--active' : ''}`}
          onClick={() => setView('users')}
        >
          By User
        </button>
        <button
          type="button"
          className={`admin-toggle-btn${view === 'paywall' ? ' admin-toggle-btn--active' : ''}`}
          onClick={() => setView('paywall')}
        >
          Paywall
        </button>
      </div>

      {view === 'trees' && <AdminTreeList onSelectTree={setSelectedTree} excludeEmail={excludeOwner ? OWNER_EMAIL : null} />}
      {view === 'users' && <AdminUserList onSelectDevice={handleSelectDevice} excludeEmail={excludeOwner ? OWNER_EMAIL : null} />}
      {view === 'paywall' && <AdminPaywallPanel />}

      {selectedTree && (
        <AdminTreePreview tree={selectedTree} onClose={() => setSelectedTree(null)} />
      )}
    </div>
  )
}
