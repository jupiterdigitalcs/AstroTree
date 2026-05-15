import { useState, useEffect, useRef } from 'react'
import HeadlineCard    from './HeadlineCard'
import SharedStormCard from './SharedStormCard'
import NatalTargetCard from './NatalTargetCard'
import MoodGauge       from './MoodGauge'
import RareTransitCard from './RareTransitCard'
import QuickHitsCard   from './QuickHitsCard'
import BabyMoodsCard   from './BabyMoodsCard'
import CarryingCard    from './CarryingCard'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`
}

function formatUpdated(fetchedAt) {
  if (!fetchedAt) return null
  const mins = Math.floor((Date.now() - fetchedAt) / 60_000)
  if (mins < 1) return 'Updated just now'
  if (mins < 60) return `Updated ${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `Updated ${hrs}h ago`
}

/**
 * TheCurrent — group transit dashboard tab for the Insights Panel.
 *
 * Self-contained: owns its own fetch, caching, loading, and error states.
 * Receives nodes/edges from the parent InsightsPanel.
 */
export default function TheCurrent({ nodes, edges, entitlements }) {
  const [analysis, setAnalysis]   = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [retryTick, setRetryTick] = useState(0)
  const cacheRef = useRef({ key: null, data: null, fetchedAt: null })

  // Extract member data from tree nodes
  const members = (nodes ?? [])
    .filter(n => n.data?.birthdate)
    .map(n => ({
      id:            n.id,
      name:          n.data.name ?? 'Unknown',
      birthdate:     n.data.birthdate,
      birthTime:     n.data.birthTime ?? null,
      birthTimezone: n.data.birthTimezone ?? null,
    }))

  useEffect(() => {
    if (members.length === 0) {
      setAnalysis(null)
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const memberKey = members
      .map(m => m.birthdate)
      .sort()
      .join(',')
    const cacheKey = `${today}:${memberKey}`

    // Skip fetch if we already have data for today + same members
    if (cacheRef.current.key === cacheKey) {
      if (!analysis) setAnalysis(cacheRef.current.data)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch('/api/current', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members }),
    })
      .then(res => {
        if (!res.ok) throw new Error(`Server error (${res.status})`)
        return res.json()
      })
      .then(data => {
        if (cancelled) return
        cacheRef.current = { key: cacheKey, data, fetchedAt: Date.now() }
        setAnalysis(data)
      })
      .catch(err => {
        if (cancelled) return
        console.error('[TheCurrent] fetch error:', err)
        setError('Could not load group transits. Try again in a moment.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.map(m => m.birthdate).sort().join(','), retryTick])

  // ── Empty state ──────────────────────────────────────────────────────────

  if (members.length === 0) {
    return (
      <div className="current-empty">
        <p className="current-empty-text">
          Add members with birthdates to see what the sky is doing for your group right now.
        </p>
      </div>
    )
  }

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading && !analysis) {
    return (
      <div className="current-container current-skeleton" aria-label="Loading transit data">
        <div className="current-skeleton-bar current-skeleton-date" />
        <div className="current-skeleton-card current-skeleton-headline" />
        <div className="current-skeleton-card current-skeleton-short" />
        <div className="current-skeleton-card current-skeleton-medium" />
        <p className="current-loading-text">Reading the sky&hellip;</p>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────

  if (error && !analysis) {
    return (
      <div className="current-error">
        <p className="current-error-text">{error}</p>
        <button
          className="current-retry-btn"
          onClick={() => {
            cacheRef.current = { key: null, data: null, fetchedAt: null }
            setError(null)
            setRetryTick(t => t + 1)
          }}
        >
          Try again
        </button>
      </div>
    )
  }

  if (!analysis?.groupAnalysis) return null

  const { groupAnalysis, date } = analysis
  const { dominantPlanet, sharedStorms, natalTargets, mood, rareTransits, exactTransits, mostActive, quietMembers, quickHits, babyMoods } = groupAnalysis

  const hasAdvanced = entitlements?.tier === 'premium'

  // ── Locked state (free tier) ────────────────────────────────────────────

  if (!hasAdvanced) {
    return (
      <div className="current-container">
        <div className="current-card current-locked">
          <p className="current-locked-title">✦ The Current</p>
          <p className="current-locked-text">
            See what the sky is doing for your group right now. Live transit analysis,
            shared storms, rare moments, and weekly Venus and Mars activations.
          </p>
          <p className="current-locked-text">
            Unlock with Celestial.
          </p>
        </div>
      </div>
    )
  }

  // ── Render (celestial only) ─────────────────────────────────────────────

  return (
    <div className="current-container">
      <p className="current-date">
        {formatDate(date)}
        {cacheRef.current.fetchedAt && (
          <span className="current-updated">{formatUpdated(cacheRef.current.fetchedAt)}</span>
        )}
      </p>

      <HeadlineCard natalTargets={natalTargets} mood={mood} />
      <MoodGauge mood={mood} />
      <QuickHitsCard quickHits={quickHits} />

      {sharedStorms?.length > 0 && (
        <div className="current-section">
          <h3 className="current-section-title">Shared Storms</h3>
          <p className="current-section-note">
            These members are moving through the same kind of energy at the same time.
          </p>
          {sharedStorms.map((storm, i) => (
            <SharedStormCard key={i} storm={storm} />
          ))}
        </div>
      )}

      <NatalTargetCard natalTargets={natalTargets} />

      <RareTransitCard rareTransits={rareTransits} exactTransits={exactTransits} />

      <CarryingCard
        members={members}
        memberTransits={analysis.memberTransits}
        rareTransits={rareTransits}
        quickHits={quickHits}
        memberAges={groupAnalysis.memberAges}
      />

      <BabyMoodsCard babyMoods={babyMoods} />

      <p className="current-whisper">
        Transits describe seasons, not fate. How you meet them is up to you.
      </p>
    </div>
  )
}
