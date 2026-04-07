import { useCountUp } from '../../../hooks/useCountUp.js'

export default function SlideCosmicDNA({ data, active }) {
  const { thread, totalThreads } = data
  const count = useCountUp(thread.chain.length, 1000, active)
  const planet = thread.planet === 'sun' ? '☀' : thread.planet === 'moon' ? '☽' : '✦'

  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Cosmic DNA</p>
      <div className="dig-scale-pop" style={{ '--i': 0 }}>
        <span className="dig-stat" style={{ color: '#b8a0d4' }}>{planet}</span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        The {thread.sign} Gene
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2 }}>
        <strong style={{ color: '#b8a0d4', fontSize: '1.3rem' }}>{count}</strong> members
        carry {thread.sign} through their {thread.planet}
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3, fontSize: '0.85rem' }}>
        {thread.chain.map((n, i) => (
          <span key={i}>
            {i > 0 && <span style={{ color: 'var(--gold)', margin: '0 0.3rem' }}>→</span>}
            <strong>{n.data?.name ?? n.name}</strong>
          </span>
        ))}
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.75rem', opacity: 0.4, marginTop: '0.5rem' }}>
        This energy doesn't skip. It's in the bloodline.
        {totalThreads > 1 && ` (${totalThreads} threads found)`}
      </p>
    </div>
  )
}
