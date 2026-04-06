import { useState, useEffect } from 'react'
import { fetchAdminStatsManual, fetchTreesPerDay, fetchEngagementStats } from './utils/adminStorage.js'

export default function AdminStatsPanel() {
  const [stats,      setStats]      = useState(null)
  const [perDay,     setPerDay]     = useState([])
  const [engagement, setEngagement] = useState(null)

  useEffect(() => {
    fetchAdminStatsManual().then(s => { if (s) setStats(s) })
    fetchTreesPerDay().then(setPerDay)
    fetchEngagementStats().then(e => { if (e) setEngagement(e) })
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

      {engagement && (
        <div className="admin-stat-cards" style={{ marginTop: '0.75rem' }}>
          <StatCard label="Return Visit Rate" value={engagement.returnVisitPct != null ? `${engagement.returnVisitPct}%` : '—'} />
          <StatCard label="Insights Reach"    value={engagement.insightsReachPct != null ? `${engagement.insightsReachPct}%` : '—'} />
          <StatCard label="Share Views"       value={engagement.shareViewCount ?? '—'} />
          <StatCard label="Avg Members/Chart" value={engagement.avgMembersPerChart ?? '—'} />
        </div>
      )}

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
