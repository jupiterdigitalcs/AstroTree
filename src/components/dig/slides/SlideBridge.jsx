const SIGN_SYMBOLS = {
  Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍',
  Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓',
}

export default function SlideBridge({ data }) {
  const { node, connectedTo, aspectCount } = data
  if (!node) return null

  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>The Bridge</p>
      <div className="dig-scale-pop" style={{ '--i': 0 }}>
        <span className="dig-stat" style={{ fontSize: '2rem' }}>
          {SIGN_SYMBOLS[node.data?.sign] || '★'}
        </span>
      </div>
      <h2 className="dig-headline dig-headline--gold dig-fly-in" style={{ '--i': 1 }}>
        {node.data?.name}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2 }}>
        Their chart makes connections to {connectedTo?.length || 0} other people — the person whose planets tend to touch everyone else's.
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3, fontSize: '0.8rem' }}>
        Connected to: {connectedTo?.join(', ')}
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.7rem', opacity: 0.5, marginTop: '0.3rem' }}>
        The bridge is the person who may naturally mediate, connect, or hold the group together.
      </p>
    </div>
  )
}
