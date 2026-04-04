import { calculateChart } from 'celestine'
import { getMoonSign } from '../utils/astrology.js'

function getPlanets(birthdate) {
  try {
    const date = new Date(birthdate + 'T12:00:00')
    const chart = calculateChart({
      year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(),
      hour: 12, minute: 0, second: 0, timezone: -5,
      latitude: 40.7128, longitude: -74.0060,
    })
    const names = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
    return names.map((name, i) => ({
      name,
      sign: chart.planets[i]?.signName ?? '—',
    }))
  } catch {
    return null
  }
}

export default function AdminMemberList({ nodes, expanded = false }) {
  if (!nodes?.length) return <p className="admin-empty">No members</p>

  return (
    <div className="admin-member-list">
      {nodes.map(n => {
        const d = n.data
        const { moonSign, moonSymbol } = d?.moonSign ? d : getMoonSign(d?.birthdate)
        const planets = expanded && d?.birthdate ? getPlanets(d.birthdate) : null

        return (
          <div key={n.id} className="admin-member-card">
            <div className="admin-member-row">
              <span className="admin-member-symbol">{d?.symbol ?? '✦'}</span>
              <span className="admin-member-name">{d?.name || '—'}</span>
              <span className="admin-member-sign">{d?.sign || ''}</span>
              <span className="admin-member-moon">☽ {moonSymbol} {moonSign}</span>
              <span className="admin-member-birth">{d?.birthdate || ''}</span>
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
