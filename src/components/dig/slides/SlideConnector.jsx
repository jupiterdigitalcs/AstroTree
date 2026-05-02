const SIGN_SYMBOLS = {
  Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍',
  Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓',
}

export default function SlideConnector({ data }) {
  const { node, connectedTo, aspectCount } = data
  if (!node) return null

  return (
    <div className="dig-slide-content dig-sparkles">
      <div className="dig-orbit-ring" />
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>The Connector</p>
      <div className="dig-scale-pop dig-glow" style={{ '--i': 0, color: '#5bc8f5' }}>
        <span className="dig-stat" style={{ fontSize: '2rem', color: '#5bc8f5' }}>
          {SIGN_SYMBOLS[node.data?.sign] || '★'}
        </span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {node.data?.name}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2, color: '#5bc8f5', fontWeight: 500, fontSize: '0.95rem' }}>
        Chart-backed linking energy
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        {node.data?.name.split(' ')[0]}'s planets form aspects to {connectedTo?.length || 0} other
        people — and their chart carries the Air or Venus energy that supports a natural linking role.
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.7rem', opacity: 0.5, marginTop: '0.4rem' }}>
        An aspect is the angle between two planets. When one person's planets make many angles to others' charts, they tend to be felt by everyone in the group.
      </p>
    </div>
  )
}
