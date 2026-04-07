import { useCountUp } from '../../../hooks/useCountUp.js'

export default function SlidePlutoGens({ data, active }) {
  const genCount = useCountUp(data.groups.length, 800, active)

  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Pluto Generations</p>
      <div className="dig-scale-pop" style={{ '--i': 0 }}>
        <span className="dig-stat" style={{ color: '#b8a0d4' }}>{genCount}</span>
      </div>
      <p className="dig-body dig-fly-in" style={{ '--i': 1, fontWeight: 500, color: 'white' }}>
        generational eras in your family
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 2 }} />
      <div style={{ textAlign: 'left', maxWidth: '320px', margin: '0 auto' }}>
        {data.groups.map((g, i) => (
          <div key={g.sign} className="dig-fly-in" style={{ '--i': i + 3, marginBottom: '0.6rem' }}>
            <p style={{ margin: 0, color: '#b8a0d4', fontFamily: 'Cinzel, serif', fontSize: '0.85rem' }}>
              Pluto in {g.sign}
            </p>
            <p style={{ margin: '0.1rem 0 0', color: 'rgba(255,255,255,0.5)', fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem' }}>
              {g.members.map(m => m.data?.name ?? m.name).join(', ')} — {g.flavor}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
