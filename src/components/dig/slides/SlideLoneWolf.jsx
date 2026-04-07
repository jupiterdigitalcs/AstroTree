const ELEMENT_COLOR = { Fire: '#e87070', Earth: '#7ec845', Air: '#5bc8f5', Water: '#5b8fd4' }

export default function SlideLoneWolf({ data }) {
  const { role } = data
  const d = role.node.data
  const color = ELEMENT_COLOR[d.element] ?? 'var(--gold)'

  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>The Outlier</p>
      <div className="dig-scale-pop" style={{ '--i': 0 }}>
        <span className="dig-stat">{d.symbol}</span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>{d.name}</h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2, color, fontWeight: 500 }}>
        The only {d.element} energy in your chart
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        {role.isBridge
          ? `${d.name} bridges a gap no one else can fill — they bring ${d.element.toLowerCase()} energy that balances the rest of the family.`
          : `Without ${d.name}, your chart would have no ${d.element.toLowerCase()} energy at all. They carry something unique.`
        }
      </p>
    </div>
  )
}
