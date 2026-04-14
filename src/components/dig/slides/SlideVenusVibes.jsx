const VENUS_ELEMENT_DESC = {
  Fire:  'love through action. Direct, passionate, and unafraid to go after what they want',
  Earth: 'love through presence. Steady, sensual, and built on loyalty and comfort',
  Air:   'love through connection. Mental spark, conversation, and shared ideas',
  Water: 'love through feeling. Intuitive, nurturing, and emotionally open',
}

export default function SlideVenusVibes({ data }) {
  const { nodes, topElement, topCount, topNames } = data

  return (
    <div className="dig-slide-content dig-sparkles">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Venus in the Group</p>
      <div className="dig-scale-pop dig-glow" style={{ '--i': 0, color: '#e879a8' }}>
        <span className="dig-stat" style={{ color: '#e879a8' }}>♀</span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {topCount >= 2 ? `${topCount} of you lead with ${topElement} in love` : 'A mix of love languages'}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2 }}>
        {topCount >= 2
          ? `${topNames?.join(' and ')} tend to express ${VENUS_ELEMENT_DESC[topElement] || 'affection in their own way'}.`
          : `${nodes?.length || 0} people, each with a different way of connecting. Your group covers a wide range of love languages.`
        }
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3, fontSize: '0.75rem', opacity: 0.6 }}>
        Venus reflects how each person tends to give and receive love. Not what they say, but what they value.
      </p>
    </div>
  )
}
