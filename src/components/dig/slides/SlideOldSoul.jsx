import { useCountUp } from '../../../hooks/useCountUp.js'

export default function SlideOldSoul({ data, active }) {
  const { node, earthCount } = data
  const d = node.data
  const animCount = useCountUp(earthCount, 800, active)

  return (
    <div className="dig-slide-content dig-sparkles">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>The Old Soul</p>
      <div className="dig-scale-pop dig-glow" style={{ '--i': 0, color: '#7ec845' }}>
        <span className="dig-stat" style={{ color: '#7ec845' }}>{d.symbol}</span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {d.name}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2, color: '#7ec845', fontWeight: 500, fontSize: '1rem' }}>
        The Most Grounded One Here
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        With {animCount} Earth placements, {d.name.split(' ')[0]} is the most grounded person
        in this chart. Practical, patient, and built to last.
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.75rem', opacity: 0.5, marginTop: '0.6rem' }}>
        The one everyone goes to when things get real
      </p>
    </div>
  )
}
