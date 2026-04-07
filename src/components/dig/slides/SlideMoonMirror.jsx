export default function SlideMoonMirror({ data }) {
  const { nodeA, nodeB, moonSign } = data

  return (
    <div className="dig-slide-content dig-sparkles">
      <div className="dig-orbit-ring" />
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Moon Mirror</p>
      <div className="dig-scale-pop dig-glow" style={{ '--i': 0, color: '#9dbbd4' }}>
        <span className="dig-stat" style={{ color: '#9dbbd4' }}>☽</span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {nodeA.data.name} &amp; {nodeB.data.name}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2, color: '#9dbbd4', fontWeight: 500, fontSize: '1rem' }}>
        {moonSign} Moon — Emotional Twins
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        They process feelings the exact same way.
        When one is up, the other feels it. When one is down, the other knows.
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.75rem', opacity: 0.5, marginTop: '0.6rem' }}>
        Same moon sign — the deepest kind of mirror
      </p>
    </div>
  )
}
