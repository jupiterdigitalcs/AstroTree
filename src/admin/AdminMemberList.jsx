function getPlanetsFromData(d) {
  if (!d) return null
  const planets = [{ name: 'Sun', sign: d.sign ?? '—' }, { name: 'Moon', sign: d.moonSign ?? '—' }]
  if (d.innerPlanets) {
    planets.push({ name: 'Mercury', sign: d.innerPlanets.mercury?.sign ?? '—' })
    planets.push({ name: 'Venus', sign: d.innerPlanets.venus?.sign ?? '—' })
    planets.push({ name: 'Mars', sign: d.innerPlanets.mars?.sign ?? '—' })
  }
  return planets
}

export default function AdminMemberList({ nodes, expanded = false }) {
  if (!nodes?.length) return <p className="admin-empty">No members</p>

  return (
    <div className="admin-member-list">
      {nodes.map(n => {
        const d = n.data
        const moonSign = d?.moonSign ?? 'Unknown'
        const moonSymbol = d?.moonSymbol ?? '☽'
        const planets = expanded ? getPlanetsFromData(d) : null

        return (
          <div key={n.id} className="admin-member-card">
            <div className="admin-member-row admin-member-row--compact">
              <span className="admin-member-symbol">{d?.symbol ?? '✦'}</span>
              <span className="admin-member-name">{d?.name || '—'}</span>
              <span className="admin-member-sign">{d?.sign || ''}</span>
            </div>
            <div className="admin-member-detail">
              ☽ {moonSymbol} {moonSign} · {d?.birthdate || ''}
            </div>
            {planets && (
              <div className="admin-planet-grid">
                {planets.map(p => (
                  <span key={p.name} className="admin-planet-item">
                    <span className="admin-planet-name">{p.name}</span>
                    <span className="admin-planet-sign">{p.sign}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
