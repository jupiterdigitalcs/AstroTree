export default function SlideRareOne({ data }) {
  const { node, totalMembers } = data
  const d = node.data

  return (
    <div className="dig-slide-content dig-sparkles">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>The Rare One</p>
      <div className="dig-scale-pop dig-glow" style={{ '--i': 0, color: d.elementColor }}>
        <span className="dig-stat" style={{ color: d.elementColor }}>{d.symbol}</span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {d.name}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2, color: d.elementColor, fontWeight: 500, fontSize: '1rem' }}>
        One of a Kind
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        The only {d.sign} in a chart of {totalMembers}.
        Nobody else carries this energy — {d.name.split(' ')[0]} brings something
        no one else can.
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.75rem', opacity: 0.5, marginTop: '0.6rem' }}>
        Sole {d.sign} — irreplaceable cosmic fingerprint
      </p>
    </div>
  )
}
