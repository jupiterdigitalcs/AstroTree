const PLANET_LABELS = { sun: 'sun sign', moon: 'moon sign' }
const SIGN_FLAVOR = {
  Aries: 'bold, impulsive fire',
  Taurus: 'steady, grounded energy',
  Gemini: 'restless curiosity',
  Cancer: 'deep emotional intuition',
  Leo: 'warm, expressive heart',
  Virgo: 'sharp, devoted care',
  Libra: 'a need for harmony',
  Scorpio: 'intense, all-or-nothing depth',
  Sagittarius: 'restless, truth-seeking spirit',
  Capricorn: 'quiet, determined ambition',
  Aquarius: 'independent, unconventional mind',
  Pisces: 'dreamy, intuitive soul',
}

export default function SlideCosmicDNA({ data, active }) {
  const { thread, totalThreads } = data
  const planet = thread.planet === 'sun' ? '☀' : thread.planet === 'moon' ? '☽' : '✦'
  const planetLabel = PLANET_LABELS[thread.planet] || thread.planet
  const flavor = SIGN_FLAVOR[thread.sign] || 'a shared cosmic signature'
  const names = thread.chain.map(n => n.data?.name ?? n.name)
  const generationWord = names.length === 2 ? '2 generations' : `${names.length} generations`

  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Cosmic DNA</p>
      <div className="dig-scale-pop" style={{ '--i': 0 }}>
        <span className="dig-stat" style={{ color: '#b8a0d4' }}>{planet}</span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        The {thread.sign} Line
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2 }}>
        {names[0]} passed down {flavor} — and it stuck.
        The same {planetLabel} runs through {generationWord}.
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3, fontSize: '0.9rem' }}>
        {names.map((name, i) => (
          <span key={i}>
            {i > 0 && <span style={{ color: 'var(--gold)', margin: '0 0.3rem' }}>→</span>}
            <strong>{name}</strong>
          </span>
        ))}
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.75rem', opacity: 0.4, marginTop: '0.5rem' }}>
        Some signs run in the family.
        {totalThreads > 1 && ` (${totalThreads} zodiac threads found)`}
      </p>
    </div>
  )
}
