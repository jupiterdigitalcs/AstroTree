import { useState, useEffect } from 'react'
import { fetchCampaignReport } from './utils/adminStorage.js'
import { kv } from '../utils/kvStore.js'

const DEVICE_ID_KEY = 'astrotree_device_id'

const CAMPAIGN_OPTIONS = [
  { key: 'uac2026',     label: 'UAC program ad', defaultFrom: '2026-09-01' },
  { key: 'chatgpt2026', label: 'ChatGPT ad',     defaultFrom: '2026-09-01' },
]

// Friendly labels for the funnel, in journey order. Anything not listed
// still shows below these, sorted by count.
const FUNNEL_STEPS = [
  ['uac_landing',             'Landed from the ad'],
  ['chatgpt_landing',         'Landed from the ad'],
  ['onboarding_seen',         'Saw the welcome card'],
  ['onboarding_sign_revealed','Typed a birthday'],
  ['first_member_added',      'Added their first person'],
  ['chart_activated',         'Built a chart'],
  ['insights_seen',           'Viewed insights'],
  ['view_dig',                'Opened The DIG'],
]

export default function AdminCampaignPanel() {
  const [campaign, setCampaign] = useState('uac2026')
  const [dateFrom, setDateFrom] = useState(CAMPAIGN_OPTIONS[0].defaultFrom)
  const [dateTo,   setDateTo]   = useState('')
  const [spend,    setSpend]    = useState(kv.get('astrotree_admin_spend_uac2026') ?? '')
  const [report,   setReport]   = useState(null)
  const [loading,  setLoading]  = useState(true)

  const myDeviceId = typeof localStorage !== 'undefined' ? kv.get(DEVICE_ID_KEY) ?? '' : ''

  useEffect(() => {
    setLoading(true)
    fetchCampaignReport({ campaign, dateFrom, dateTo, excludeDevices: myDeviceId })
      .then(r => { setReport(r?.scans ? r : null); setLoading(false) })
  }, [campaign, dateFrom, dateTo]) // eslint-disable-line react-hooks/exhaustive-deps

  function selectCampaign(key) {
    setCampaign(key)
    setDateFrom(CAMPAIGN_OPTIONS.find(c => c.key === key)?.defaultFrom ?? '')
    setSpend(kv.get(`astrotree_admin_spend_${key}`) ?? '')
  }

  function updateSpend(value) {
    setSpend(value)
    kv.set(`astrotree_admin_spend_${campaign}`, value)
  }

  const revenue = (report?.outcomes?.revenueCents ?? 0) / 100
  const spendNum = parseFloat(spend) || 0
  const net = revenue - spendNum
  const maxDay = Math.max(1, ...(report?.scans?.perDay ?? []).map(d => d.scans))

  const funnelLabels = new Map(FUNNEL_STEPS)
  const funnelByEvent = new Map((report?.funnel ?? []).map(f => [f.event, f.uniqueDevices]))
  const knownSteps = FUNNEL_STEPS
    .filter(([event]) => funnelByEvent.has(event))
    .map(([event, label]) => ({ event, label, n: funnelByEvent.get(event) }))
  const otherSteps = (report?.funnel ?? [])
    .filter(f => !funnelLabels.has(f.event))
    .map(f => ({ event: f.event, label: f.event, n: f.uniqueDevices }))
  const maxFunnel = Math.max(1, ...knownSteps.map(s => s.n), ...otherSteps.map(s => s.n))

  return (
    <div className="admin-stats admin-campaign-panel">
      <div className="admin-campaign-controls">
        <div className="admin-view-toggle">
          {CAMPAIGN_OPTIONS.map(c => (
            <button
              key={c.key}
              type="button"
              className={`admin-toggle-btn${campaign === c.key ? ' admin-toggle-btn--active' : ''}`}
              onClick={() => selectCampaign(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <label className="admin-campaign-field">
          From <input type="date" className="admin-input admin-input--date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </label>
        <label className="admin-campaign-field">
          To <input type="date" className="admin-input admin-input--date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </label>
        <label className="admin-campaign-field">
          Ad cost $ <input type="number" min="0" step="1" className="admin-input" value={spend} placeholder="0"
            onChange={e => updateSpend(e.target.value)} style={{ width: '5rem' }} />
        </label>
      </div>

      {loading && <p className="admin-campaign-note">Loading…</p>}
      {!loading && !report && <p className="admin-campaign-note">No report available. Try again in a moment.</p>}

      {!loading && report && (
        <>
          <div className="admin-stat-cards">
            <StatCard label="Ad scans" value={report.scans.total} />
            <StatCard label="People (unique)" value={report.scans.uniqueDevices} />
            <StatCard label="Saved a chart" value={report.outcomes.savedChart} />
            <StatCard label="Signed in / email" value={report.outcomes.signedInOrEmail} />
            <StatCard label="Purchases" value={report.outcomes.purchases} />
            <StatCard label="Revenue" value={`$${revenue.toFixed(2)}`} />
          </div>

          {spendNum > 0 && (
            <p className="admin-campaign-note">
              Revenue ${revenue.toFixed(2)} against ${spendNum.toFixed(2)} spent:{' '}
              <strong style={{ color: net >= 0 ? 'var(--gold)' : 'var(--text-muted)' }}>
                {net >= 0 ? `+$${net.toFixed(2)}` : `-$${Math.abs(net).toFixed(2)}`}
              </strong>
              {' '}so far. Scans from exactly the right audience can pay off well past the conference week.
            </p>
          )}

          {report.scans.perDay.length > 0 && (
            <div className="admin-chart" style={{ marginTop: '0.75rem' }}>
              <p className="admin-chart-label">Scans per day</p>
              {report.scans.perDay.map(d => (
                <div key={d.day} className="admin-campaign-row">
                  <span className="admin-campaign-row-label">{d.day.slice(5)}</span>
                  <div className="admin-campaign-bar-track">
                    <div className="admin-campaign-bar" style={{ width: `${Math.round((d.scans / maxDay) * 100)}%` }} />
                  </div>
                  <span className="admin-campaign-row-count">{d.scans} ({d.devices} people)</span>
                </div>
              ))}
            </div>
          )}

          <div className="admin-chart" style={{ marginTop: '0.75rem' }}>
            <p className="admin-chart-label">What campaign visitors did ({report.cohortSize} devices)</p>
            {knownSteps.length === 0 && <p className="admin-campaign-note">Nothing yet. Once someone scans, their steps show up here.</p>}
            {[...knownSteps, ...otherSteps].map(s => (
              <div key={s.event} className="admin-campaign-row">
                <span className="admin-campaign-row-label admin-campaign-row-label--wide">{s.label}</span>
                <div className="admin-campaign-bar-track">
                  <div className="admin-campaign-bar" style={{ width: `${Math.round((s.n / maxFunnel) * 100)}%` }} />
                </div>
                <span className="admin-campaign-row-count">{s.n}</span>
              </div>
            ))}
          </div>

          {report.places.length > 0 && (
            <div className="admin-chart" style={{ marginTop: '0.75rem' }}>
              <p className="admin-chart-label">Where they were</p>
              {report.places.map(p => (
                <div key={p.place} className="admin-campaign-row">
                  <span className="admin-campaign-row-label admin-campaign-row-label--wide">{p.place}</span>
                  <span className="admin-campaign-row-count">{p.n}</span>
                </div>
              ))}
            </div>
          )}
        </>
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
