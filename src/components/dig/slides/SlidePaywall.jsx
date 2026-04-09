export default function SlidePaywall({ data, onUpgrade }) {
  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Keep Going</p>
      <h2 className="dig-headline dig-headline--gold dig-fly-in" style={{ '--i': 1 }}>
        {data.remainingCount} More Slides Waiting
      </h2>
      <div className="dig-divider dig-fly-in" style={{ '--i': 2 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 2, fontSize: '0.85rem' }}>
        Unlock your full cosmic story — compatibility, cosmic duos, family roles, and more.
      </p>
      <div className="dig-fade-in" style={{ '--i': 3, textAlign: 'center', margin: '1.2rem 0' }}>
        <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1.6rem', color: 'var(--gold)' }}>$9.99</span>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>one-time — yours forever</p>
      </div>
      {onUpgrade && (
        <button
          type="button"
          className="dig-share-btn dig-fade-in"
          style={{ '--i': 4, background: 'rgba(201,168,76,0.2)', borderColor: 'var(--gold)' }}
          onClick={(e) => { e.stopPropagation(); onUpgrade() }}
        >
          ✦ Unlock Celestial
        </button>
      )}
    </div>
  )
}
