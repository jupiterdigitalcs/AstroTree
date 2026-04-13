const MARS_ELEMENT_DESC = {
  Fire:  'drive through action — direct, competitive, and quick to move',
  Earth: 'drive through persistence — steady, determined, and quietly unstoppable',
  Air:   'drive through ideas — strategic, communicative, and mentally agile',
  Water: 'drive through feeling — emotionally motivated and fiercely protective',
}

export default function SlideMarsEnergy({ data }) {
  const { nodes, topElement, topCount, topNames } = data

  return (
    <div className="dig-slide-content dig-sparkles">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Mars in the Group</p>
      <div className="dig-scale-pop dig-glow" style={{ '--i': 0, color: '#e87070' }}>
        <span className="dig-stat" style={{ color: '#e87070' }}>♂</span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {topCount >= 2 ? `${topCount} of you channel ${topElement} drive` : 'A range of motivations'}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2 }}>
        {topCount >= 2
          ? `${topNames?.join(' and ')} tend to express ${MARS_ELEMENT_DESC[topElement] || 'energy in their own way'}.`
          : `${nodes?.length || 0} people, each with a different source of drive — this group covers many approaches to getting things done.`
        }
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3, fontSize: '0.75rem', opacity: 0.6 }}>
        Mars reflects how each person tends to take action, handle conflict, and pursue what they want.
      </p>
    </div>
  )
}
