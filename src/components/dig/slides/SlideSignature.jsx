import { useCountUp } from '../../../hooks/useCountUp.js'

const ELEMENT_EMOJI = { Fire: '🔥', Earth: '🌿', Air: '💨', Water: '🌊' }
const ELEMENT_COLOR = { Fire: '#e87070', Earth: '#7ec845', Air: '#5bc8f5', Water: '#5b8fd4' }

export default function SlideSignature({ data, active }) {
  const pct = data.total > 0
    ? Math.round((data.dominant === 'Fire' || data.dominant === 'Air' ? data.masculine : data.feminine) / data.total * 100)
    : 0
  const animPct = useCountUp(pct, 1200, active)
  const color = ELEMENT_COLOR[data.dominant] ?? 'var(--gold)'

  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Family Signature</p>
      <div className="dig-scale-pop" style={{ '--i': 0 }}>
        <span className="dig-stat" style={{ color }}>{ELEMENT_EMOJI[data.dominant]}</span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1, color }}>
        {data.dominant} {data.dominantModality}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2 }}>
        {data.signatureDesc}
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3, fontSize: '0.8rem' }}>
        {animPct}% of your chart's energy is <strong style={{ color }}>{data.dominant}</strong>
        {data.missingElements?.length > 0 && (
          <span> · no {data.missingElements.join(' or ')} energy at all</span>
        )}
      </p>
    </div>
  )
}
