import { useCountUp } from '../../../hooks/useCountUp.js'

const PLANET_LABEL = { sun: '☀ Sun', moon: '☽ Moon' }

export default function SlideZodiacThread({ data, active }) {
  const { thread, totalThreads } = data
  const memberCount = useCountUp(thread.chain.length, 1000, active)

  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Zodiac Thread</p>
      <div className="dig-scale-pop" style={{ '--i': 0 }}>
        <span className="dig-stat" style={{ color: '#b8a0d4' }}>{memberCount}</span>
      </div>
      <p className="dig-body dig-fly-in" style={{ '--i': 1, fontWeight: 500, color: 'white' }}>
        members carry <strong style={{ color: '#b8a0d4' }}>{thread.sign}</strong> energy
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 2 }} />
      <p className="dig-body dig-fly-in" style={{ '--i': 3 }}>
        Through their {PLANET_LABEL[thread.planet] ?? thread.planet}, {thread.sign} runs across generations in your family — a cosmic signature passed down.
      </p>
      <p className="dig-names dig-fade-in" style={{ '--i': 4, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
        {thread.chain.map(n => n.data?.name ?? n.name).join(' → ')}
      </p>
      {totalThreads > 1 && (
        <p className="dig-body dig-fade-in" style={{ '--i': 5, fontSize: '0.75rem', opacity: 0.4, marginTop: '0.5rem' }}>
          + {totalThreads - 1} more thread{totalThreads > 2 ? 's' : ''} found
        </p>
      )}
    </div>
  )
}
