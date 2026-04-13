export default function SlideMoonMirror({ data }) {
  const { nodeA, nodeB, moonSign, noSharedMoons, moonCount } = data

  if (noSharedMoons) {
    return (
      <div className="dig-slide-content dig-sparkles">
        <div className="dig-orbit-ring" />
        <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Moon Mirror</p>
        <div className="dig-scale-pop dig-glow" style={{ '--i': 0, color: '#9dbbd4' }}>
          <span className="dig-stat" style={{ color: '#9dbbd4' }}>☽</span>
        </div>
        <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
          No Shared Moons
        </h2>
        <p className="dig-body dig-fly-in" style={{ '--i': 2 }}>
          {moonCount} people, and every single one processes emotions differently.
        </p>
        <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
        <p className="dig-body dig-fade-in" style={{ '--i': 3, fontSize: '0.8rem', opacity: 0.7 }}>
          This means the group covers a wide range of emotional styles — and may need to work a little harder to understand each other's inner worlds.
        </p>
      </div>
    )
  }

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
        {moonSign} Moon
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        They tend to process emotions in similar ways — a shared inner rhythm that often runs deeper than surface compatibility.
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.75rem', opacity: 0.5, marginTop: '0.6rem' }}>
        Moon sign reflects emotional needs — sharing one can create a quiet, unspoken understanding.
      </p>
    </div>
  )
}
