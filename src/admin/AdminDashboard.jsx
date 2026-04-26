import { useState } from 'react'
import AdminStatsPanel from './AdminStatsPanel.jsx'
import AdminTreeList from './AdminTreeList.jsx'
import AdminUserList from './AdminUserList.jsx'
import AdminTreePreview from './AdminTreePreview.jsx'
import AdminPaywallPanel from './AdminPaywallPanel.jsx'
import AdminResearchPanel from './AdminResearchPanel.jsx'
import { fetchAllCharts } from './utils/adminStorage.js'

const OWNER_EMAIL = 'chrissysoll@gmail.com'

export default function AdminDashboard() {
  const [view,         setView]         = useState('trees') // 'trees' | 'users' | 'paywall' | 'research'
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
      <div className="admin-top-bar">
        <div className="admin-view-toggle">
          <button type="button" className={`admin-toggle-btn${view === 'trees' ? ' admin-toggle-btn--active' : ''}`} onClick={() => setView('trees')}>All Trees</button>
          <button type="button" className={`admin-toggle-btn${view === 'users' ? ' admin-toggle-btn--active' : ''}`} onClick={() => setView('users')}>By User</button>
          <button type="button" className={`admin-toggle-btn${view === 'paywall' ? ' admin-toggle-btn--active' : ''}`} onClick={() => setView('paywall')}>Paywall</button>
          <button type="button" className={`admin-toggle-btn${view === 'research' ? ' admin-toggle-btn--active' : ''}`} onClick={() => setView('research')}>Research</button>
        </div>
        <div className="admin-top-controls">
          <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={excludeOwner} onChange={e => setExcludeOwner(e.target.checked)} />
            Exclude me
          </label>
          <a href="/carousel.html" target="_blank" rel="noopener" className="admin-top-link">IG Carousel</a>
        </div>
      </div>

      {(view === 'trees' || view === 'users') && (
        <AdminStatsPanel excludeOwner={excludeOwner} ownerEmail={OWNER_EMAIL} />
      )}

      {view === 'trees' && <AdminTreeList onSelectTree={setSelectedTree} excludeEmail={excludeOwner ? OWNER_EMAIL : null} />}
      {view === 'users' && <AdminUserList onSelectDevice={handleSelectDevice} excludeEmail={excludeOwner ? OWNER_EMAIL : null} />}
      {view === 'paywall' && <AdminPaywallPanel />}
      {view === 'research' && <AdminResearchPanel />}

      {selectedTree && (
        <AdminTreePreview tree={selectedTree} onClose={() => setSelectedTree(null)} />
      )}
    </div>
  )
}
