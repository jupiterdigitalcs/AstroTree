const TIER_LABEL = {
  heredThread: 'Passed Down',
  rareBond:    'Rare Bond',
  famSig:      'Family Pattern',
}

const TIER_COLOR = {
  heredThread: 'var(--rose)',
  rareBond:    'var(--gold)',
  famSig:      'var(--text-soft)',
}

export default function SlideAspectThreads({ data }) {
  const { blurb, chainNames, planetLabel, topType, totalCount } = data
  const tierLabel = TIER_LABEL[topType] ?? 'Family Pattern'
  const tierColor = TIER_COLOR[topType] ?? 'var(--text-soft)'

  return (
    <div className="dig-slide-content dig-sparkles">
      <div className="dig-orbit-ring" />
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Cosmic Inheritance</p>
      <div className="dig-scale-pop" style={{ '--i': 0 }}>
        <span className="dig-stat" style={{ fontSize: '1rem', color: tierColor, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {tierLabel}
        </span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {blurb}
      </h2>
      <div className="dig-divider dig-fly-in" style={{ '--i': 2 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 2 }}>
        {chainNames}
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 3, fontSize: '0.78rem', opacity: 0.6, marginTop: '0.5rem' }}>
        {planetLabel}{totalCount > 1 ? ` · ${totalCount} patterns in this family` : ''}
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.68rem', opacity: 0.4, marginTop: '0.5rem' }}>
        An aspect is the angle between two planets in a chart. When the same angle repeats across a family, it can show up as a shared theme or inherited dynamic.
      </p>
    </div>
  )
}
