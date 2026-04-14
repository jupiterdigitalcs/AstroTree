const ELEMENT_EMOJI = { Fire: '🔥', Earth: '🌿', Air: '💨', Water: '🌊' }

const ELEMENT_QUALITIES = {
  Fire:  'action-oriented and expressive',
  Earth: 'grounded and steady',
  Air:   'idea-driven and communicative',
  Water: 'emotionally attuned and intuitive',
}

const MODALITY_QUALITIES = {
  Cardinal: 'This is a group that initiates.',
  Fixed:    'This is a group that holds its ground.',
  Mutable:  'This is a group that adapts and shifts.',
}

export default function SlideVibeCheck({ data }) {
  const dominant = data.dominant
  const qualities = ELEMENT_QUALITIES[dominant] || ''
  const modNote = MODALITY_QUALITIES[data.dominantModality] || ''
  const emoji = ELEMENT_EMOJI[dominant] || '✦'

  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Your Group's Element</p>
      <div className="dig-scale-pop" style={{ '--i': 0 }}>
        <span className="dig-stat" style={{ fontSize: '2.2rem' }}>{emoji}</span>
      </div>
      <h2 className="dig-headline dig-headline--gold dig-fly-in" style={{ '--i': 1 }}>
        {dominant}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2 }}>
        The dominant energy across your group is <strong style={{ color: 'var(--gold)' }}>{dominant}</strong> — {qualities}.
        {modNote && <><br /><span style={{ opacity: 0.7 }}>{modNote}</span></>}
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      {data.elementCounts && (
        <div className="dig-fade-in" style={{ '--i': 3, display: 'flex', gap: '1.2rem', justifyContent: 'center', fontSize: '0.85rem' }}>
          {['Fire', 'Earth', 'Air', 'Water'].map(el => (
            <span key={el} style={{ opacity: data.elementCounts[el] > 0 ? 1 : 0.3, textAlign: 'center' }}>
              <span style={{ fontSize: '1.1rem', display: 'block' }}>{ELEMENT_EMOJI[el]}</span>
              <strong>{data.elementCounts[el] || 0}</strong>
              <span style={{ fontSize: '0.6rem', display: 'block', opacity: 0.5 }}>{el}</span>
            </span>
          ))}
        </div>
      )}
      {data.missingElements?.length > 0 && (
        <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.75rem', opacity: 0.5, marginTop: '0.4rem' }}>
          No {data.missingElements.join(' or ')} — those qualities may be sought outside the group.
        </p>
      )}
    </div>
  )
}
