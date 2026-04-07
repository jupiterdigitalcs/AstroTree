export default function SlideClone({ data }) {
  const { nodeA, nodeB, matchCount, matches } = data

  return (
    <div className="dig-slide-content dig-sparkles">
      <div className="dig-orbit-ring" />
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>The Clone</p>
      <div className="dig-scale-pop" style={{ '--i': 0 }}>
        <span className="dig-stat" style={{ fontSize: '2rem' }}>
          {nodeA.data.symbol} {'≈'} {nodeB.data.symbol}
        </span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {nodeA.data.name} &amp; {nodeB.data.name}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2, color: '#b8a0d4', fontWeight: 500, fontSize: '1rem' }}>
        Cosmically Copy-Pasted
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        {matchCount} matching placement{matchCount > 1 ? 's' : ''} — these two are wired the same way.
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.8rem', opacity: 0.6 }}>
        {matches.join(' · ')}
      </p>
    </div>
  )
}
