const SIGN_SYMBOLS = {
  Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍',
  Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓',
}

export default function SlideHotspot({ data }) {
  const { spot } = data
  if (!spot) return null

  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>The Hotspot</p>
      <div className="dig-scale-pop" style={{ '--i': 0 }}>
        <span className="dig-stat" style={{ fontSize: '2.5rem' }}>{SIGN_SYMBOLS[spot.sign] || '★'}</span>
      </div>
      <h2 className="dig-headline dig-headline--gold dig-fly-in" style={{ '--i': 1 }}>
        {spot.position} {spot.sign}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2 }}>
        {spot.peopleCount} of you have planets concentrated here — this is a zone your group keeps activating.
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <div className="dig-fade-in" style={{ '--i': 3 }}>
        {spot.planets.map((p, i) => (
          <p key={i} style={{ fontSize: '0.8rem', margin: '0.15rem 0', opacity: 0.8 }}>
            {p.glyph} {p.person}
          </p>
        ))}
      </div>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.7rem', opacity: 0.5, marginTop: '0.4rem' }}>
        When multiple people share a zodiac zone, its themes tend to echo through the whole group.
      </p>
    </div>
  )
}
