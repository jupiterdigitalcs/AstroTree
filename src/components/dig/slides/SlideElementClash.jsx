const ELEMENT_COLOR = { Fire: '#e87070', Earth: '#7ec845', Air: '#5bc8f5', Water: '#5b8fd4' }

const CLASH_FLAVOR = {
  'Fire-Water': { tension: 'passion meets depth', desc: 'One charges forward, the other pulls inward. Together they create steam.' },
  'Earth-Air':  { tension: 'grounded meets restless', desc: 'One builds the foundation, the other questions everything about it.' },
}

export default function SlideElementClash({ data }) {
  const { nodeA, nodeB, elementA, elementB, clashScore } = data
  const key = [elementA, elementB].sort().join('-')
  const flavor = CLASH_FLAVOR[key] || { tension: 'elemental friction', desc: 'Different elements, different wavelengths, but that\'s what makes it interesting.' }

  return (
    <div className="dig-slide-content dig-sparkles">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Element Clash</p>
      <div className="dig-scale-pop" style={{ '--i': 0 }}>
        <span className="dig-stat" style={{ fontSize: '2rem' }}>
          <span style={{ color: ELEMENT_COLOR[elementA] }}>{nodeA.data.symbol}</span>
          {' ⚡ '}
          <span style={{ color: ELEMENT_COLOR[elementB] }}>{nodeB.data.symbol}</span>
        </span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {nodeA.data.name} vs {nodeB.data.name}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2, fontWeight: 500, fontSize: '0.95rem' }}>
        <span style={{ color: ELEMENT_COLOR[elementA] }}>{elementA}</span>
        {' meets '}
        <span style={{ color: ELEMENT_COLOR[elementB] }}>{elementB}</span>
        {' — '}{flavor.tension}
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        {flavor.desc}
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.75rem', opacity: 0.5, marginTop: '0.6rem' }}>
        {clashScore} opposing planet placements between them
      </p>
    </div>
  )
}
