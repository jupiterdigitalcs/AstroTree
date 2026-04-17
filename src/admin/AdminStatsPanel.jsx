import { useState, useEffect, useMemo } from 'react'
import { fetchAdminStatsManual, fetchTreesPerDay, fetchEngagementStats, fetchFunnel, fetchAllCharts } from './utils/adminStorage.js'

const DEVICE_ID_KEY = 'astrotree_device_id'

export default function AdminStatsPanel({ excludeOwner = false, ownerEmail = '' }) {
  const [rpcStats,   setRpcStats]   = useState(null)
  const [perDay,     setPerDay]     = useState([])
  const [engagement, setEngagement] = useState(null)
  const [funnel,     setFunnel]     = useState([])
  const [dateFrom,   setDateFrom]   = useState('')
  const [dateTo,     setDateTo]     = useState('')
  const [excludeMe,      setExcludeMe]      = useState(true)
  const [allCharts,  setAllCharts]  = useState(null) // loaded on demand for date filtering

  const myDeviceId = typeof localStorage !== 'undefined' ? localStorage.getItem(DEVICE_ID_KEY) ?? '' : ''

  useEffect(() => {
    fetchAdminStatsManual().then(s => { if (s) setRpcStats(s) })
    fetchTreesPerDay().then(setPerDay)
    fetchEngagementStats().then(e => { if (e) setEngagement(e) })
  }, [])

  // Reload funnel + charts when filters change
  useEffect(() => {
    const excludeDevices = excludeMe && myDeviceId ? myDeviceId : ''
    const excludeEmails = excludeOwner && ownerEmail ? ownerEmail : ''
    fetchFunnel({ dateFrom, dateTo, excludeDevices, excludeEmails }).then(setFunnel)
    if (!dateFrom) { setAllCharts(null); return }
    fetchAllCharts({ dateFrom, dateTo }).then(charts => {
      if (Array.isArray(charts)) setAllCharts(charts)
    })
  }, [dateFrom, dateTo, excludeMe, excludeOwner]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter per-day chart data by date
  const filteredPerDay = useMemo(() => {
    let filtered = perDay
    if (dateFrom) filtered = filtered.filter(d => d.day >= dateFrom)
    if (dateTo)   filtered = filtered.filter(d => d.day <= dateTo)
    return filtered
  }, [perDay, dateFrom, dateTo])

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
          From:
          <input
            type="date"
            className="admin-input admin-input--date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            style={{ marginLeft: '0.35rem' }}
          />
        </label>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          To:
          <input
            type="date"
            className="admin-input admin-input--date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            style={{ marginLeft: '0.35rem' }}
          />
        </label>
        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={excludeMe} onChange={e => setExcludeMe(e.target.checked)} />
          Exclude my device
        </label>
        {(dateFrom || dateTo) && (
          <button
            type="button"
            className="admin-btn admin-btn--small"
            onClick={() => { setDateFrom(''); setDateTo('') }}
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
          >Clear dates</button>
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

      {funnel.length > 0 && (
        <div className="admin-chart" style={{ marginTop: '0.75rem' }}>
          <p className="admin-chart-label">User funnel{dateFrom || dateTo ? ` — ${dateFrom || '...'}${dateTo ? ` to ${dateTo}` : ''}` : ' — last 30 days'} (unique devices{excludeMe ? ', excl. you' : ''})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.4rem' }}>
            {funnel.map(({ event, uniqueDevices, totalCount }) => {
              const maxDevices = funnel[0]?.uniqueDevices || 1
              return (
                <div key={event} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem' }}>
                  <span style={{ width: '10rem', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>{event}</span>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '3px', height: '1.1rem', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round((uniqueDevices / maxDevices) * 100)}%`, height: '100%', background: 'rgba(201,168,76,0.4)', borderRadius: '3px', minWidth: '2px' }} />
                  </div>
                  <span style={{ color: 'var(--gold)', minWidth: '3rem', flexShrink: 0 }}>{uniqueDevices} <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>({totalCount}×)</span></span>
                </div>
              )
            })}
          </div>
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
