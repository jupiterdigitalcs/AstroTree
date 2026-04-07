export default function SlideCouple({ data }) {
  const { couple } = data
  const { src, tgt } = couple

  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Partner Spotlight</p>
      <h2 className="dig-headline dig-headline--rose dig-fly-in" style={{ '--i': 1 }}>
        {src.data.name} &amp; {tgt.data.name}
      </h2>
      <p className="dig-names dig-fly-in" style={{ '--i': 2, opacity: 0.6, fontSize: '0.85rem' }}>
        {src.data.symbol} {src.data.sign} + {tgt.data.symbol} {tgt.data.sign}
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        {couple.compatible
          ? `Their elements are naturally in harmony — ${src.data.element} and ${tgt.data.element} fuel each other.`
          : `${src.data.element} and ${tgt.data.element} — different energies that challenge and complete each other.`
        }
      </p>
    </div>
  )
}
