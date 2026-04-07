import { useCountUp } from '../../../hooks/useCountUp.js'

const VIBE_LABELS = {
  Fire:  { emoji: '🔥', vibe: 'Chaotic Good', desc: 'Loud, passionate, and always starting something' },
  Earth: { emoji: '🌿', vibe: 'Cozy & Grounded', desc: 'Practical, loyal, and surprisingly stubborn' },
  Air:   { emoji: '💨', vibe: 'Nonstop Talkers', desc: 'Social, curious, and impossible to pin down' },
  Water: { emoji: '🌊', vibe: 'Deep Feelers Club', desc: 'Intuitive, emotional, and never forget anything' },
}

const MODALITY_FLAVOR = {
  Cardinal: 'always starting things',
  Fixed: 'never letting go of anything',
  Mutable: 'reinventing themselves constantly',
}

export default function SlideVibeCheck({ data, active }) {
  const info = VIBE_LABELS[data.dominant] ?? VIBE_LABELS.Fire
  const pct = data.total > 0 ? Math.round(((data.dominant === 'Fire' || data.dominant === 'Air' ? data.masculine : data.feminine) / data.total) * 100) : 0
  const animPct = useCountUp(pct, 1200, active)

  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Family Vibe Check</p>
      <div className="dig-scale-pop" style={{ '--i': 0 }}>
        <span className="dig-stat">{info.emoji}</span>
      </div>
      <h2 className="dig-headline dig-headline--gold dig-fly-in" style={{ '--i': 1 }}>
        {info.vibe}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2 }}>
        {info.desc}
        {data.dominantModality && <><br /><em>...and {MODALITY_FLAVOR[data.dominantModality] ?? 'keeping it interesting'}</em></>}
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3, fontSize: '0.8rem' }}>
        <strong style={{ color: 'var(--gold)', fontSize: '1.2rem' }}>{animPct}%</strong>{' '}
        of your chart's energy is <strong>{data.dominant}</strong>
        {data.missingElements?.length > 0 && (
          <span style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.75rem', opacity: 0.5 }}>
            zero {data.missingElements.join(' or ')} energy detected 👀
          </span>
        )}
      </p>
    </div>
  )
}
