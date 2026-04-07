export default function SlideOutro({ data, onShare }) {
  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Your DIG</p>
      <h2 className="dig-headline dig-headline--gold dig-fly-in" style={{ '--i': 1 }}>
        That's Your Cosmic Story
      </h2>
      <div className="dig-divider dig-fly-in" style={{ '--i': 2 }} />
      <div className="dig-fade-in" style={{ '--i': 2, display: 'flex', justifyContent: 'center', gap: '2rem', margin: '1rem 0' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="dig-stat" style={{ fontSize: '2rem', color: 'var(--gold)' }}>{data.memberCount}</span>
          <p className="dig-body" style={{ fontSize: '0.7rem' }}>members</p>
        </div>
        {data.bondCount > 0 && (
          <div style={{ textAlign: 'center' }}>
            <span className="dig-stat" style={{ fontSize: '2rem', color: '#b8a0d4' }}>{data.bondCount}</span>
            <p className="dig-body" style={{ fontSize: '0.7rem' }}>bonds</p>
          </div>
        )}
        {data.threadCount > 0 && (
          <div style={{ textAlign: 'center' }}>
            <span className="dig-stat" style={{ fontSize: '2rem', color: '#5bc8f5' }}>{data.threadCount}</span>
            <p className="dig-body" style={{ fontSize: '0.7rem' }}>threads</p>
          </div>
        )}
      </div>
      <p className="dig-body dig-fade-in" style={{ '--i': 3, fontSize: '0.8rem' }}>
        Every family carries a unique cosmic fingerprint.
        <br />This is yours.
      </p>
      {onShare && (
        <button type="button" className="dig-share-btn dig-fade-in" style={{ '--i': 4 }} onClick={onShare}>
          Share Your DIG
        </button>
      )}
      <p className="dig-fade-in" style={{ '--i': 5, marginTop: '1.2rem', fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'Raleway, sans-serif' }}>
        ✦ AstroDig · Jupiter Digital
      </p>
    </div>
  )
}
