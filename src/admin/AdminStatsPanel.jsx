import { useState, useEffect } from 'react'
import { fetchAdminStatsManual, fetchTreesPerDay } from './utils/adminStorage.js'

export default function AdminStatsPanel() {
  const [stats,  setStats]  = useState(null)
  const [perDay, setPerDay] = useState([])

  useEffect(() => {
    fetchAdminStatsManual().then(s => { if (s) setStats(s) })
    fetchTreesPerDay().then(setPerDay)
  }, [])

  const maxCount = perDay.length ? Math.max(...perDay.map(d => d.count)) : 1

  return (
    <div className="admin-stats">
      <div className="admin-stat-cards">
        <StatCard label="Total Trees"   value={stats?.totalTrees   ?? '—'} />
        <StatCard label="Total Members" value={stats?.totalMembers ?? '—'} />
        <StatCard label="Devices"       value={stats?.totalDevices ?? '—'} />
        <StatCard label="Trees Today"   value={stats?.treesToday   ?? '—'} />
      </div>

      {perDay.length > 0 && (
        <div className="admin-chart">
          <p className="admin-chart-label">Trees saved — last 30 days</p>
          <div className="admin-bar-chart">
            {perDay.map(({ day, count }) => (
              <div key={day} className="admin-bar-col" title={`${day}: ${count}`}>
                <div
                  className="admin-bar"
                  style={{ height: `${Math.round((count / maxCount) * 100)}%` }}
                />
                <span className="admin-bar-day">{day.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="admin-stat-card">
      <span className="admin-stat-value">{value}</span>
      <span className="admin-stat-label">{label}</span>
    </div>
  )
}
