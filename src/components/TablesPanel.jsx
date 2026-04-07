import { useState } from 'react'
import { PlanetSign } from './PlanetSign.jsx'

const ELEMENT_ORDER = ['Fire', 'Earth', 'Air', 'Water']

// defaultOn controls initial visibility; all columns appear in the toggle strip
const COLUMNS = [
  { key: 'name',     label: 'Name',      defaultOn: true  },
  { key: 'birthday', label: 'Birthday',  defaultOn: true  },
  { key: 'sun',      label: '☀ Sun',     defaultOn: true  },
  { key: 'moon',     label: '☽ Moon',    defaultOn: true  },
  { key: 'element',  label: 'Element',   defaultOn: false },
  { key: 'mercury',  label: '☿ Mercury', defaultOn: false },
  { key: 'venus',    label: '♀ Venus',   defaultOn: false },
  { key: 'mars',     label: '♂ Mars',    defaultOn: false },
]

const DEFAULT_VISIBLE = Object.fromEntries(COLUMNS.map(c => [c.key, c.defaultOn]))

export function TablesPanel({ nodes }) {
  const [sortBy,  setSortBy]  = useState('name')
  const [sortDir, setSortDir] = useState('asc')
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
    const moonSign = d.moonSign ?? 'Unknown'
    const moonSymbol = d.moonSymbol ?? '☽'
    const inner = needsInner ? (d.innerPlanets ?? null) : null
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
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  function toggleCol(key) {
    setVisible(v => ({ ...v, [key]: !v[key] }))
  }

  const rows = [...rawRows].sort((a, b) => {
    let cmp = 0
    switch (sortBy) {
      case 'name':     cmp = (a.name || '').localeCompare(b.name || ''); break
      case 'birthday': cmp = (a.birthdate || '').localeCompare(b.birthdate || ''); break
      case 'sun':      cmp = (a.sunSign || '').localeCompare(b.sunSign || ''); break
      case 'moon':     cmp = (a.moonSign || 'ZZZ').localeCompare(b.moonSign || 'ZZZ'); break
      case 'element':  cmp = ELEMENT_ORDER.indexOf(a.element) - ELEMENT_ORDER.indexOf(b.element); break
      case 'mercury':  cmp = (a.mercury?.sign || 'ZZZ').localeCompare(b.mercury?.sign || 'ZZZ'); break
      case 'venus':    cmp = (a.venus?.sign   || 'ZZZ').localeCompare(b.venus?.sign   || 'ZZZ'); break
      case 'mars':     cmp = (a.mars?.sign    || 'ZZZ').localeCompare(b.mars?.sign    || 'ZZZ'); break
      default:         cmp = (a.name || '').localeCompare(b.name || ''); break
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  function thClass(col) {
    if (sortBy === col) return 'tables-th tables-th--sortable tables-th--active'
    return 'tables-th tables-th--sortable'
  }

  function SortArrow({ col }) {
    if (sortBy === col) {
      return <span className="tables-sort-arrow">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
    }
    return <span className="tables-sort-arrow tables-sort-arrow--dim"> ↕</span>
  }

  return (
    <div className="tables-panel">
      <h3 className="tables-title">Astrology Data</h3>

      {/* Column visibility toggles — all columns */}
      <div className="tables-col-toggles">
        {COLUMNS.map(c => (
          <button
            key={c.key}
            className={`tables-col-btn${visible[c.key] ? ' tables-col-btn--on' : ''}${!c.defaultOn ? ' tables-col-btn--optional' : ''}`}
            onClick={() => toggleCol(c.key)}
            title={visible[c.key] ? `Hide ${c.label}` : `Show ${c.label}`}
          >
            {visible[c.key] ? c.label : `+ ${c.label}`}
          </button>
        ))}
      </div>

      <div className="tables-scroll">
        <table className="tables-table">
          <thead>
            <tr>
              {visible.name && (
                <th className={thClass('name')} onClick={() => handleSort('name')}>
                  Name<SortArrow col="name" />
                </th>
              )}
              {visible.birthday && (
                <th className={thClass('birthday')} onClick={() => handleSort('birthday')}>
                  Birthday<SortArrow col="birthday" />
                </th>
              )}
              {visible.sun && (
                <th className={thClass('sun')} onClick={() => handleSort('sun')}>
                  ☀ Sun<SortArrow col="sun" />
                </th>
              )}
              {visible.moon && (
                <th className={thClass('moon')} onClick={() => handleSort('moon')}>
                  ☽ Moon<SortArrow col="moon" />
                </th>
              )}
              {visible.mercury && (
                <th className={thClass('mercury')} onClick={() => handleSort('mercury')}>
                  ☿ Mercury<SortArrow col="mercury" />
                </th>
              )}
              {visible.venus && (
                <th className={thClass('venus')} onClick={() => handleSort('venus')}>
                  ♀ Venus<SortArrow col="venus" />
                </th>
              )}
              {visible.mars && (
                <th className={thClass('mars')} onClick={() => handleSort('mars')}>
                  ♂ Mars<SortArrow col="mars" />
                </th>
              )}
              {visible.element && (
                <th className={thClass('element')} onClick={() => handleSort('element')}>
                  Element<SortArrow col="element" />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                {visible.name    && <td className="tables-name">{r.name}</td>}
                {visible.birthday && <td className="tables-date">{r.birthdate}</td>}
                {visible.sun     && <td className="tables-sign">{r.sunSymbol} {r.sunSign}</td>}
                {visible.moon    && (
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

    </div>
  )
}
