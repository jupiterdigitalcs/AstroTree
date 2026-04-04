import { getSunSign, getElement, getMoonSign } from '../utils/astrology.js'

export function TablesPanel({ nodes }) {
  if (!nodes?.length) {
    return (
      <div className="tables-panel">
        <p className="tables-empty">Add family members to see their astrology data here.</p>
      </div>
    )
  }

  const rows = nodes.map(n => {
    const d = n.data
    const { moonSign, moonSymbol } = d.moonSign ? d : getMoonSign(d.birthdate)
    return {
      id: n.id,
      name: d.name,
      birthdate: d.birthdate,
      sunSign: d.sign,
      sunSymbol: d.symbol,
      element: d.element,
      moonSign,
      moonSymbol,
    }
  })

  return (
    <div className="tables-panel">
      <h3 className="tables-title">Astrology Data</h3>
      <div className="tables-scroll">
        <table className="tables-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Birthday</th>
              <th>Sun</th>
              <th>Moon</th>
              <th>Element</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td className="tables-name">{r.name}</td>
                <td className="tables-date">{r.birthdate}</td>
                <td className="tables-sign">{r.sunSymbol} {r.sunSign}</td>
                <td className="tables-sign">☽ {r.moonSymbol} {r.moonSign}</td>
                <td className="tables-element">{r.element}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tables-note">Moon signs assume noon EST — accuracy improves with birth time (coming soon).</p>
    </div>
  )
}
