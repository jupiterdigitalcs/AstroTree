const DUO_LABELS = {
  'cosmic-echo':         { title: 'Cosmically Linked', sub: 'their charts are basically copy-paste', badge: '✦✦✦ INSANELY RARE' },
  'rare-alignment':      { title: 'Written in the Stars', sub: 'this alignment almost never happens', badge: '✦✦ VERY RARE' },
  'soul-twins':          { title: 'Soul Twins', sub: 'same sun AND same moon — they just get each other', badge: 'TWIN FLAME ENERGY' },
  'cosmic-twins':        { title: 'Cosmic Twins', sub: 'same sun sign — they speak the same language', badge: 'MATCHING ENERGY' },
  'lunar-bond':          { title: 'Emotional Twins', sub: 'same moon sign — they feel things the same way', badge: 'DEEP CONNECTION' },
  'mirror':              { title: 'Mirror Match', sub: 'opposite signs that complete each other', badge: 'YIN & YANG' },
  'sun-moon-reflection': { title: 'Sun-Moon Reflection', sub: 'one shines where the other feels — perfect balance', badge: 'COSMIC BALANCE' },
}

export default function SlideCosmicDuo({ data }) {
  const { bond, totalBonds } = data
  const info = DUO_LABELS[bond.noteType] ?? { title: 'Cosmic Connection', sub: 'something special here', badge: 'NOTABLE' }

  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Cosmic Duo</p>
      <div className="dig-badge dig-scale-pop" style={{ '--i': 0, color: 'var(--gold)', borderColor: 'var(--gold)' }}>
        {info.badge}
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {bond.a.data.name} &amp; {bond.b.data.name}
      </h2>
      <p className="dig-names dig-fly-in" style={{ '--i': 2, opacity: 0.6, fontSize: '0.85rem' }}>
        {bond.a.data.symbol} {bond.a.data.sign} + {bond.b.data.symbol} {bond.b.data.sign}
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3, fontWeight: 500 }}>
        {info.title}
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4 }}>
        {info.sub}
      </p>
      {totalBonds > 1 && (
        <p className="dig-body dig-fade-in" style={{ '--i': 5, fontSize: '0.72rem', opacity: 0.4, marginTop: '0.8rem' }}>
          + {totalBonds - 1} more cosmic connection{totalBonds > 2 ? 's' : ''} in this chart
        </p>
      )}
    </div>
  )
}
