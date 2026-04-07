const BOND_LABELS = {
  'cosmic-echo':         { label: 'Cosmic Echo', sub: 'Extremely Rare', color: 'var(--gold)' },
  'rare-alignment':      { label: 'Rare Alignment', sub: 'Very Rare', color: 'var(--gold)' },
  'soul-twins':          { label: 'Soul Twins', sub: 'Same Sun & Moon', color: 'var(--gold)' },
  'cosmic-twins':        { label: 'Cosmic Twins', sub: 'Same Sun Sign', color: 'var(--gold)' },
  'lunar-bond':          { label: 'Lunar Bond', sub: 'Same Moon Sign', color: '#9dbbd4' },
  'mirror':              { label: 'Mirror Signs', sub: 'Opposite Suns', color: '#d4a0bc' },
  'sun-moon-reflection': { label: 'Sun-Moon Reflection', sub: 'Deep Connection', color: '#c4a8d4' },
}

export default function SlideRarestBond({ data }) {
  const { bond, totalBonds, rareCount } = data
  const info = BOND_LABELS[bond.noteType] ?? { label: 'Notable Bond', sub: 'Special Connection', color: '#7ec845' }

  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Rarest Bond</p>
      <div className="dig-badge dig-scale-pop" style={{ '--i': 0, color: info.color, borderColor: info.color }}>
        {info.sub}
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {bond.a.data.name} &amp; {bond.b.data.name}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2, color: info.color, fontWeight: 500 }}>
        {info.label}
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        {bond.note}
      </p>
      {totalBonds > 1 && (
        <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.78rem', marginTop: '0.8rem', opacity: 0.5 }}>
          + {totalBonds - 1} more bond{totalBonds > 2 ? 's' : ''} discovered
          {rareCount > 1 && ` (${rareCount} rare)`}
        </p>
      )}
    </div>
  )
}
