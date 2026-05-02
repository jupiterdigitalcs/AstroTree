const SLIDE_LABELS = {
  vibeCheck: '✦ Family Vibe Check',
  superlative: '✦ Sign Superlative',
  emotionalForecast: '✦ Emotional Landscape',
  cosmicDuo: '✦ Cosmic Duo',
  wildcard: '✦ The Wildcard',
  cosmicDNA: '✦ Cosmic DNA',
  connector: '✦ The Connector',
  elementClash: '✦ Element Clash',
  clone: '✦ The Clone',
  venusVibes: '✦ Venus Vibes',
  marsEnergy: '✦ Mars Energy',
  moonMirror: '✦ Moon Mirror',
  oldSoul: '✦ The Anchor',
  rebel: '✦ The Free Thinker',
  genBridge: '✦ Generational Bridge',
  rareOne: '✦ The Rare One',
  outro: '✦ Your Cosmic Summary',
}

export default function SlidePaywall({ data, onUpgrade }) {
  const teasers = (data.lockedSlides || [])
    .map(type => SLIDE_LABELS[type])
    .filter(Boolean)

  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>You've seen 3 free slides</p>
      <h2 className="dig-headline dig-headline--gold dig-fly-in" style={{ '--i': 1 }}>
        {data.remainingCount} More Slides Waiting
      </h2>
      <div className="dig-divider dig-fly-in" style={{ '--i': 2 }} />

      {teasers.length > 0 && (
        <div className="dig-fade-in dig-paywall-teasers" style={{ '--i': 2 }}>
          {teasers.map((label, i) => (
            <div key={i} className="dig-paywall-teaser-item">{label}</div>
          ))}
        </div>
      )}

      <div className="dig-fade-in" style={{ '--i': 3, textAlign: 'center', margin: '1rem 0 0.6rem' }}>
        <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1.6rem', color: 'var(--gold)' }}>$9.99</span>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>one-time, yours forever</p>
      </div>
      {onUpgrade && (
        <button
          type="button"
          className="dig-share-btn dig-fade-in"
          style={{ '--i': 4, background: 'linear-gradient(135deg, var(--gold) 0%, #e0c060 100%)', color: '#09071a', border: 'none' }}
          onClick={(e) => { e.stopPropagation(); onUpgrade() }}
        >
          ✦ Unlock Celestial
        </button>
      )}
    </div>
  )
}
