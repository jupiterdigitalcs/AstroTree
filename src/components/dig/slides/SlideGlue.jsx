import { useCountUp } from '../../../hooks/useCountUp.js'

export default function SlideGlue({ data, active }) {
  const { node, connectionCount, typeCount } = data
  const d = node.data
  const animCount = useCountUp(connectionCount, 800, active)

  const subtitle = typeCount >= 2
    ? 'Bridges across different parts of the group'
    : 'The most connected person in the chart'

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
      <p className="dig-body dig-fly-in" style={{ '--i': 2, color: 'var(--gold)', fontWeight: 500, fontSize: '0.95rem' }}>
        {subtitle}
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        Connected to {animCount} people{typeCount >= 2 ? ` across ${typeCount} types of relationship` : ''}.
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.75rem', opacity: 0.5, marginTop: '0.4rem' }}>
        The glue is the person who tends to link different parts of the group, not just by proximity, but by bridging across circles.
      </p>
    </div>
  )
}
