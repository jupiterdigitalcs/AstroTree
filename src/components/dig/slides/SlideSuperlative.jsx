import { useCountUp } from '../../../hooks/useCountUp.js'

export default function SlideSuperlative({ data, active }) {
  const { node, title, sub, score, total } = data
  const d = node.data
  const animScore = useCountUp(score, 800, active)

  return (
    <div className="dig-slide-content dig-sparkles">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Group Role</p>
      <div className="dig-scale-pop dig-glow" style={{ '--i': 0, color: d.elementColor }}>
        <span className="dig-stat" style={{ color: d.elementColor }}>{d.symbol}</span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {d.name}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2, color: 'var(--gold)', fontWeight: 500, fontSize: '1rem' }}>
        {title}
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        {sub}
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.75rem', opacity: 0.5, marginTop: '0.6rem' }}>
        {animScore} of {total} placements in {d.element}
      </p>
    </div>
  )
}
