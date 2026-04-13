import { useCountUp } from '../../../hooks/useCountUp.js'

const ELEMENT_QUALITIES = {
  Fire:  'action-oriented and expressive',
  Earth: 'grounded and steady',
  Air:   'idea-driven and communicative',
  Water: 'emotionally attuned and intuitive',
}

const MODALITY_QUALITIES = {
  Cardinal: 'a group that tends to initiate',
  Fixed:    'a group that tends to hold its ground',
  Mutable:  'a group that tends to adapt and shift',
}

export default function SlideVibeCheck({ data, active }) {
  const total = data.collectiveTotal || data.total || 0
  const dominant = data.dominant
  const animTotal = useCountUp(total, 1200, active)
  const qualities = ELEMENT_QUALITIES[dominant] || ''
  const modNote = MODALITY_QUALITIES[data.dominantModality] || ''

  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>The Collective Chart</p>
      <div className="dig-scale-pop" style={{ '--i': 0 }}>
        <span className="dig-stat" style={{ fontSize: '2rem' }}>{animTotal}</span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        planetary placements across your group
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2 }}>
        The strongest thread is <strong style={{ color: 'var(--gold)' }}>{dominant}</strong> — {qualities}.
        {modNote && <><br /><span style={{ opacity: 0.7 }}>{modNote}.</span></>}
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      {data.elementCounts && (
        <div className="dig-fade-in" style={{ '--i': 3, display: 'flex', gap: '1rem', justifyContent: 'center', fontSize: '0.8rem' }}>
          {['Fire', 'Earth', 'Air', 'Water'].map(el => (
            <span key={el} style={{ opacity: data.elementCounts[el] > 0 ? 1 : 0.3 }}>
              <strong>{data.elementCounts[el] || 0}</strong>
              <span style={{ fontSize: '0.65rem', display: 'block', opacity: 0.6 }}>{el}</span>
            </span>
          ))}
        </div>
      )}
      {data.missingElements?.length > 0 && (
        <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.75rem', opacity: 0.5, marginTop: '0.4rem' }}>
          No {data.missingElements.join(' or ')} placements — those qualities may be sought outside the group.
        </p>
      )}
    </div>
  )
}
