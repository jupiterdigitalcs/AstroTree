import { useState } from 'react'
import AdminStatsPanel from './AdminStatsPanel.jsx'
import AdminTreeList from './AdminTreeList.jsx'
import AdminUserList from './AdminUserList.jsx'
import AdminTreePreview from './AdminTreePreview.jsx'
import { fetchAllCharts } from './utils/adminStorage.js'

export default function AdminDashboard() {
  const [view,         setView]         = useState('trees') // 'trees' | 'users'
  const [selectedTree, setSelectedTree] = useState(null)

  async function handleSelectDevice(deviceId, title) {
    // Load all trees for device then find the matching one by title
    const all = await fetchAllCharts({ search: title })
    const match = all.find(c => c.deviceId === deviceId && c.title === title) ?? all[0]
    if (match) setSelectedTree(match)
  }

  return (
    <div className="admin-dashboard">
      <AdminStatsPanel />

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
      </div>

      {view === 'trees'
        ? <AdminTreeList onSelectTree={setSelectedTree} />
        : <AdminUserList onSelectDevice={handleSelectDevice} />
      }

      {selectedTree && (
        <AdminTreePreview tree={selectedTree} onClose={() => setSelectedTree(null)} />
      )}
    </div>
  )
}
