import { hasChapter } from '../../utils/transitChapters'

/**
 * Summarize what each member is carrying right now.
 * Cross-references curated transits, quick hits, and rare flags
 * so nobody with a rare transit gets called "steady ground."
 */
export default function CarryingCard({ members, memberTransits, rareTransits, quickHits, memberAges }) {
  if (!memberTransits) return null

  // Build per-member summary
  const rareIds = new Set((rareTransits ?? []).map(r => r.memberId))

  const summaries = members.map(m => {
    const allTransits = memberTransits[m.id] ?? []
    // Count only curated transits (same filter as the rest of The Current)
    const curated = allTransits.filter(t => hasChapter(t.transitingPlanet, t.aspect, t.natalPlanet))
    const quick = (quickHits ?? []).filter(h => h.memberId === m.id)
    const age = memberAges?.[m.id] ?? null
    const isChild = age != null && age < 13
    const hasRare = rareIds.has(m.id)

    return {
      id: m.id,
      name: m.name,
      age: isChild ? age : null,
      curatedCount: curated.length,
      quickCount: quick.length,
      hasRare,
      total: curated.length + quick.length,
    }
  })

  // Sort: most transits first, then rare, then alphabetical
  summaries.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    if (b.hasRare !== a.hasRare) return b.hasRare ? 1 : -1
    return a.name.localeCompare(b.name)
  })

  const active = summaries.filter(s => s.total > 0 || s.hasRare)
  const quiet  = summaries.filter(s => s.total === 0 && !s.hasRare)

  return (
    <div className="current-card current-activity">
      <h4 className="current-card-heading">Who's Carrying What</h4>
      {active.map(s => (
        <p key={s.id} className="current-card-note">
          <strong>{s.name}</strong>
          {s.age != null && <span className="current-age-tag">age {s.age}</span>}
          {' '}&mdash;{' '}
          {s.curatedCount > 0 && <>{s.curatedCount} major transit{s.curatedCount !== 1 ? 's' : ''}</>}
          {s.curatedCount > 0 && s.quickCount > 0 && ', '}
          {s.quickCount > 0 && <>{s.quickCount} quick hit{s.quickCount !== 1 ? 's' : ''}</>}
          {s.hasRare && <span className="current-carrying-rare"> (rare)</span>}
        </p>
      ))}
      {quiet.length > 0 && (
        <p className="current-card-note current-card-note--quiet">
          Clear skies: <strong>{quiet.map(s => s.name).join(', ')}</strong>
          {' '}&mdash; steady ground right now
        </p>
      )}
    </div>
  )
}
