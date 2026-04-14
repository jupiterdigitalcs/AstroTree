const ELEMENT_COLOR = { Fire: '#e87070', Earth: '#7ec845', Air: '#5bc8f5', Water: '#5b8fd4' }

export default function SlideWildcard({ data }) {
  const { node, familyElement } = data
  const d = node.data

  return (
    <div className="dig-slide-content dig-sparkles">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>The Wildcard</p>
      <div className="dig-scale-pop dig-glow" style={{ '--i': 0, color: ELEMENT_COLOR[d.element] }}>
        <span className="dig-stat" style={{ color: ELEMENT_COLOR[d.element] }}>{d.symbol}</span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {d.name}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2, color: ELEMENT_COLOR[d.element], fontWeight: 500 }}>
        Zero {familyElement} energy
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        While everyone else runs on {familyElement.toLowerCase()}, {d.name.split(' ')[0]} marches
        to a completely different cosmic beat.
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.82rem', marginTop: '0.5rem' }}>
        Pure <strong style={{ color: ELEMENT_COLOR[d.element] }}>{d.element}</strong>. The one
        who keeps this {familyElement.toLowerCase()}-heavy chart honest.
      </p>
    </div>
  )
}
