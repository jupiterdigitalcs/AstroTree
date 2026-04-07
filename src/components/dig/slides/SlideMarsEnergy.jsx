const MARS_FLAVOR = {
  Aries:       { style: 'Pure Fire', desc: 'acts first, thinks later — unstoppable once they decide' },
  Taurus:      { style: 'Slow Burn', desc: 'patient, persistent, and absolutely immovable when set' },
  Gemini:      { style: 'Quick Strike', desc: 'fights with words and wins with wit' },
  Cancer:      { style: 'Protective Force', desc: 'quiet until someone they love is threatened' },
  Leo:         { style: 'Main Event', desc: 'brings the drama, the energy, and the spotlight' },
  Virgo:       { style: 'Precision Strike', desc: 'strategic, methodical, and devastatingly efficient' },
  Libra:       { style: 'The Diplomat', desc: 'fights fair, avoids conflict, but stands firm when it counts' },
  Scorpio:     { style: 'Quiet Intensity', desc: 'never forgets, never backs down — still waters run deep' },
  Sagittarius: { style: 'All Gas', desc: 'chases every goal at full speed with zero hesitation' },
  Capricorn:   { style: 'The Strategist', desc: 'plays the long game and always wins' },
  Aquarius:    { style: 'The Disruptor', desc: 'fights for the future and against the status quo' },
  Pisces:      { style: 'Quiet Strength', desc: 'channels energy through intuition and creative force' },
}

export default function SlideMarsEnergy({ data }) {
  const { node } = data
  const d = node.data
  const marsSign = d.innerPlanets?.mars?.sign
  const flavor = MARS_FLAVOR[marsSign] || { style: 'Unique Drive', desc: 'channels energy in their own way' }

  return (
    <div className="dig-slide-content dig-sparkles">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Mars Energy</p>
      <div className="dig-scale-pop dig-glow" style={{ '--i': 0, color: '#e87070' }}>
        <span className="dig-stat" style={{ color: '#e87070' }}>♂</span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {d.name}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2, color: '#e87070', fontWeight: 500, fontSize: '1rem' }}>
        {flavor.style}
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        Mars in {marsSign} — {flavor.desc}.
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.75rem', opacity: 0.5, marginTop: '0.6rem' }}>
        Most likely to win game night
      </p>
    </div>
  )
}
