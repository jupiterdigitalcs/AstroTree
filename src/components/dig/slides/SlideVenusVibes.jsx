const VENUS_FLAVOR = {
  Aries:       { style: 'Bold & Direct', desc: 'loves hard, moves fast, no patience for games' },
  Taurus:      { style: 'Sensual & Devoted', desc: 'all about comfort, loyalty, and the finer things' },
  Gemini:      { style: 'Charming & Curious', desc: 'needs mental spark and variety to stay interested' },
  Cancer:      { style: 'Nurturing & Protective', desc: 'love is home — built on emotional safety' },
  Leo:         { style: 'Romantic & Generous', desc: 'grand gestures, warm heart, loves to be adored' },
  Virgo:       { style: 'Quietly Devoted', desc: 'shows love through acts of service and attention to detail' },
  Libra:       { style: 'Harmony Seeker', desc: 'drawn to beauty, partnership, and keeping the peace' },
  Scorpio:     { style: 'Intense & All-In', desc: 'trusts slowly, loves fiercely, forgets nothing' },
  Sagittarius: { style: 'Free-Spirited', desc: 'love needs room to breathe and an open road' },
  Capricorn:   { style: 'Steady & Reliable', desc: 'shows love through commitment and practical devotion' },
  Aquarius:    { style: 'Unconventional', desc: 'redefines love on their own terms — no rulebook needed' },
  Pisces:      { style: 'Dreamy & Boundless', desc: 'loves without limits, feels everything at full volume' },
}

export default function SlideVenusVibes({ data }) {
  const { node } = data
  const d = node.data
  const venusSign = d.innerPlanets?.venus?.sign
  const flavor = VENUS_FLAVOR[venusSign] || { style: 'Unique', desc: 'a love language all their own' }

  return (
    <div className="dig-slide-content dig-sparkles">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Venus Vibes</p>
      <div className="dig-scale-pop dig-glow" style={{ '--i': 0, color: '#e879a8' }}>
        <span className="dig-stat" style={{ color: '#e879a8' }}>♀</span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {d.name}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2, color: '#e879a8', fontWeight: 500, fontSize: '1rem' }}>
        {flavor.style}
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        Venus in {venusSign} — {flavor.desc}.
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.75rem', opacity: 0.5, marginTop: '0.6rem' }}>
        The family's love language ambassador
      </p>
    </div>
  )
}
