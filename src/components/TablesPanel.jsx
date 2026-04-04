import { useState } from 'react'
import { getMoonSign, getInnerPlanetSigns } from '../utils/astrology.js'
import { PlanetSign } from './PlanetSign.jsx'

const ELEMENT_ORDER = ['Fire', 'Earth', 'Air', 'Water']

// Columns on by default vs optional (off by default)
const COLUMNS = [
  { key: 'birthday', label: 'Birthday',  optional: false },
  { key: 'sun',      label: '☀ Sun',     optional: false },
  { key: 'moon',     label: '☽ Moon',    optional: false },
  { key: 'element',  label: '☀ Element', optional: false },
  { key: 'mercury',  label: '☿ Mercury', optional: true  },
  { key: 'venus',    label: '♀ Venus',   optional: true  },
  { key: 'mars',     label: '♂ Mars',    optional: true  },
]

const DEFAULT_VISIBLE = Object.fromEntries(COLUMNS.map(c => [c.key, !c.optional]))

export function TablesPanel({ nodes }) {
  const [sortBy,  setSortBy]  = useState('birthdate')
  const [visible, setVisible] = useState(DEFAULT_VISIBLE)

  if (!nodes?.length) {
    return (
      <div className="tables-panel">
        <p className="tables-empty">Add family members to see their astrology data here.</p>
      </div>
    )
  }

  const needsInner = visible.mercury || visible.venus || visible.mars

  const rawRows = nodes.map(n => {
    const d = n.data
    const { moonSign, moonSymbol } = d.moonSign ? d : getMoonSign(d.birthdate)
    const inner = needsInner ? getInnerPlanetSigns(d.birthdate, d.birthTime ?? null) : null
    return {
      id: n.id,
      name: d.name,
      birthdate: d.birthdate,
      sunSign: d.sign,
      sunSymbol: d.symbol,
      element: d.element,
      moonSign,
      moonSymbol,
      mercury: inner?.mercury ?? null,
      venus:   inner?.venus   ?? null,
      mars:    inner?.mars    ?? null,
    }
  })

  function handleSort(col) {
    setSortBy(prev => (prev === col && col !== 'birthdate') ? 'birthdate' : col)
  }

  function toggleCol(key) {
    setVisible(v => ({ ...v, [key]: !v[key] }))
  }

  const rows = [...rawRows].sort((a, b) => {
    switch (sortBy) {
      case 'sun':     return (a.sunSign || '').localeCompare(b.sunSign || '')
      case 'moon':    return (a.moonSign || 'ZZZ').localeCompare(b.moonSign || 'ZZZ')
      case 'element': return ELEMENT_ORDER.indexOf(a.element) - ELEMENT_ORDER.indexOf(b.element)
      case 'mercury': return (a.mercury?.sign || 'ZZZ').localeCompare(b.mercury?.sign || 'ZZZ')
      case 'venus':   return (a.venus?.sign   || 'ZZZ').localeCompare(b.venus?.sign   || 'ZZZ')
      case 'mars':    return (a.mars?.sign    || 'ZZZ').localeCompare(b.mars?.sign    || 'ZZZ')
      default:        return (a.birthdate || '').localeCompare(b.birthdate || '')
    }
  })

  function thClass(col) {
    if (sortBy === col) return 'tables-th tables-th--active'
    return col === 'name' ? 'tables-th' : 'tables-th tables-th--sortable'
  }

  const coreToggles    = COLUMNS.filter(c => !c.optional)
  const optionalToggles = COLUMNS.filter(c => c.optional)

  return (
    <div className="tables-panel">
      <h3 className="tables-title">Astrology Data</h3>

      {/* Column visibility toggles */}
      <div className="tables-col-toggles">
        {coreToggles.map(c => (
          <button
            key={c.key}
            className={`tables-col-btn${visible[c.key] ? ' tables-col-btn--on' : ''}`}
            onClick={() => toggleCol(c.key)}
          >
            {c.label}
          </button>
        ))}
        <span className="tables-col-divider" />
        {optionalToggles.map(c => (
          <button
            key={c.key}
            className={`tables-col-btn tables-col-btn--optional${visible[c.key] ? ' tables-col-btn--on' : ''}`}
            onClick={() => toggleCol(c.key)}
            title={visible[c.key] ? `Hide ${c.label}` : `Add ${c.label} column`}
          >
            {visible[c.key] ? c.label : `+ ${c.label}`}
          </button>
        ))}
      </div>

      <div className="tables-scroll">
        <table className="tables-table">
          <thead>
            <tr>
              <th className="tables-th">Name</th>
              {visible.birthday && (
                <th className={thClass('birthdate')} onClick={() => handleSort('birthdate')}>
                  Birthday {sortBy === 'birthdate' && <span className="tables-sort-arrow">↑</span>}
                </th>
              )}
              {visible.sun && (
                <th className={thClass('sun')} onClick={() => handleSort('sun')}>
                  ☀ Sun {sortBy === 'sun' && <span className="tables-sort-arrow">↑</span>}
                </th>
              )}
              {visible.moon && (
                <th className={thClass('moon')} onClick={() => handleSort('moon')}>
                  ☽ Moon {sortBy === 'moon' && <span className="tables-sort-arrow">↑</span>}
                </th>
              )}
              {visible.mercury && (
                <th className={thClass('mercury')} onClick={() => handleSort('mercury')}>
                  ☿ Mercury {sortBy === 'mercury' && <span className="tables-sort-arrow">↑</span>}
                </th>
              )}
              {visible.venus && (
                <th className={thClass('venus')} onClick={() => handleSort('venus')}>
                  ♀ Venus {sortBy === 'venus' && <span className="tables-sort-arrow">↑</span>}
                </th>
              )}
              {visible.mars && (
                <th className={thClass('mars')} onClick={() => handleSort('mars')}>
                  ♂ Mars {sortBy === 'mars' && <span className="tables-sort-arrow">↑</span>}
                </th>
              )}
              {visible.element && (
                <th className={thClass('element')} onClick={() => handleSort('element')}>
                  ☀ Element {sortBy === 'element' && <span className="tables-sort-arrow">↑</span>}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td className="tables-name">{r.name}</td>
                {visible.birthday && <td className="tables-date">{r.birthdate}</td>}
                {visible.sun && <td className="tables-sign">{r.sunSymbol} {r.sunSign}</td>}
                {visible.moon && (
                  <td className="tables-sign">
                    {r.moonSign && r.moonSign !== 'Unknown'
                      ? <PlanetSign planet="moon" symbol={r.moonSymbol} sign={r.moonSign} />
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                )}
                {visible.mercury && (
                  <td className="tables-sign">
                    {r.mercury?.sign
                      ? <PlanetSign planet="mercury" symbol={r.mercury.symbol} sign={r.mercury.sign} />
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                )}
                {visible.venus && (
                  <td className="tables-sign">
                    {r.venus?.sign
                      ? <PlanetSign planet="venus" symbol={r.venus.symbol} sign={r.venus.sign} />
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                )}
                {visible.mars && (
                  <td className="tables-sign">
                    {r.mars?.sign
                      ? <PlanetSign planet="mars" symbol={r.mars.symbol} sign={r.mars.sign} />
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                )}
                {visible.element && <td className="tables-element">{r.element}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tables-note">
        Inner planet signs (☽ Moon, ☿ Mercury, ♀ Venus, ♂ Mars) use noon EST when no birth time is on file.
        Add birth time in Edit Member for a more accurate reading.
        ☀ Element reflects Sun sign.
      </p>
    </div>
  )
}
