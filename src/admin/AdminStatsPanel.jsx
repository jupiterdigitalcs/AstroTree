import { useState, useEffect, useMemo } from 'react'
import { fetchAdminStatsManual, fetchTreesPerDay, fetchEngagementStats, fetchAllCharts } from './utils/adminStorage.js'

export default function AdminStatsPanel() {
  const [rpcStats,   setRpcStats]   = useState(null)
  const [perDay,     setPerDay]     = useState([])
  const [engagement, setEngagement] = useState(null)
  const [dateFrom,   setDateFrom]   = useState('')
  const [allCharts,  setAllCharts]  = useState(null) // loaded on demand for date filtering

  useEffect(() => {
    fetchAdminStatsManual().then(s => { if (s) setRpcStats(s) })
    fetchTreesPerDay().then(setPerDay)
    fetchEngagementStats().then(e => { if (e) setEngagement(e) })
  }, [])

  // Fetch charts when date filter changes (for client-side stats)
  useEffect(() => {
    if (!dateFrom) { setAllCharts(null); return }
    fetchAllCharts({ dateFrom }).then(charts => {
      if (Array.isArray(charts)) setAllCharts(charts)
    })
  }, [dateFrom])

  // Filter per-day chart data by date
  const filteredPerDay = useMemo(() => {
    if (!dateFrom) return perDay
    return perDay.filter(d => d.day >= dateFrom)
  }, [perDay, dateFrom])

  // Compute filtered stats from charts data when date filter is active
  const stats = useMemo(() => {
    if (!dateFrom || !allCharts) return rpcStats
    const filtered = allCharts.filter(c => {
      const saved = c.savedAt || c.createdAt
      return saved && saved >= dateFrom
    })
    const totalMembers = filtered.reduce((sum, c) => sum + (c.memberCount || c.nodes?.length || 0), 0)
    const devices = new Set(filtered.map(c => c.deviceId).filter(Boolean))
    const today = new Date().toISOString().split('T')[0]
    const treesToday = filtered.filter(c => (c.savedAt || c.createdAt || '').startsWith(today)).length
    return {
      totalTrees: filtered.length,
      totalMembers: totalMembers,
      totalDevices: devices.size,
      treesToday: treesToday,
    }
  }, [dateFrom, allCharts, rpcStats])

  const maxCount = filteredPerDay.length ? Math.max(...filteredPerDay.map(d => d.count)) : 1

  return (
    <div className="admin-stats">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Since:
          <input
            type="date"
            className="admin-input admin-input--date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            style={{ marginLeft: '0.35rem' }}
          />
        </label>
        {dateFrom && (
          <button
            type="button"
            className="admin-btn admin-btn--small"
            onClick={() => setDateFrom('')}
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
          >Clear</button>
        )}
        {dateFrom && (
          <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>
            Showing stats since {dateFrom}
          </span>
        )}
      </div>

      <div className="admin-stat-cards">
        <StatCard label={dateFrom ? 'Trees (filtered)' : 'Total Trees'} value={stats?.totalTrees ?? '—'} />
        <StatCard label={dateFrom ? 'Members (filtered)' : 'Total Members'} value={stats?.totalMembers ?? '—'} />
        <StatCard label={dateFrom ? 'Devices (filtered)' : 'Devices'} value={stats?.totalDevices ?? '—'} />
        <StatCard label="Trees Today" value={stats?.treesToday ?? '—'} />
      </div>

      {!dateFrom && engagement && (
        <div className="admin-stat-cards" style={{ marginTop: '0.75rem' }}>
          <StatCard label="Return Visit Rate" value={engagement.returnVisitPct != null ? `${engagement.returnVisitPct}%` : '—'} />
          <StatCard label="Insights Reach"    value={engagement.insightsReachPct != null ? `${engagement.insightsReachPct}%` : '—'} />
          <StatCard label="Share Views"       value={engagement.shareViewCount ?? '—'} />
          <StatCard label="Avg Members/Chart" value={engagement.avgMembersPerChart ?? '—'} />
        </div>
      )}

      {filteredPerDay.length > 0 && (
        <div className="admin-chart">
          <p className="admin-chart-label">Trees saved{dateFrom ? ` — since ${dateFrom}` : ' — last 30 days'}</p>
          <div className="admin-bar-chart">
            {filteredPerDay.map(({ day, count }) => (
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
