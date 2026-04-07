import { useCountUp } from '../../../hooks/useCountUp.js'

export default function SlideGlue({ data, active }) {
  const { node, connectionCount } = data
  const d = node.data
  const animCount = useCountUp(connectionCount, 800, active)

  return (
    <div className="dig-slide-content dig-sparkles">
      <div className="dig-orbit-ring" />
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>The Glue</p>
      <div className="dig-scale-pop dig-glow" style={{ '--i': 0, color: d.elementColor }}>
        <span className="dig-stat" style={{ color: d.elementColor }}>{d.symbol}</span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {d.name}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2, color: 'var(--gold)', fontWeight: 500, fontSize: '1rem' }}>
        The One Who Holds It Together
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        Connected to {animCount} people in this chart — {d.name.split(' ')[0]} is the
        cosmic thread running through everyone.
      </p>
    </div>
  )
}
