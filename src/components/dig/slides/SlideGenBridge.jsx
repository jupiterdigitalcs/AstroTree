const PLANET_GLYPH = { sun: '☀', moon: '☽', mercury: '☿', venus: '♀', mars: '♂' }

export default function SlideGenBridge({ data }) {
  const { parent, child, sign, parentPlanet, childPlanet } = data

  return (
    <div className="dig-slide-content dig-sparkles">
      <div className="dig-orbit-ring" />
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Generational Bridge</p>
      <div className="dig-scale-pop" style={{ '--i': 0 }}>
        <span className="dig-stat" style={{ fontSize: '2rem' }}>
          {parent.data.symbol} → {child.data.symbol}
        </span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {parent.data.name} &amp; {child.data.name}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2, color: 'var(--gold)', fontWeight: 500, fontSize: '0.95rem' }}>
        The Cosmic Baton Was Passed
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        {parent.data.name.split(' ')[0]}'s {PLANET_GLYPH[parentPlanet]} {parentPlanet} in {sign} reappears as{' '}
        {child.data.name.split(' ')[0]}'s {PLANET_GLYPH[childPlanet]} {childPlanet} in {sign}.
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.78rem', opacity: 0.6, marginTop: '0.5rem' }}>
        Same sign energy, different expression — echoed across generations.
      </p>
    </div>
  )
}
