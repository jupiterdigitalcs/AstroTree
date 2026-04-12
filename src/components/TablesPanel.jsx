import { useState } from 'react'
import { PlanetSign } from './PlanetSign.jsx'
import { getElement, ELEMENT_COLORS } from '../utils/astrology/elements.js'

const ELEMENT_ORDER = ['Fire', 'Earth', 'Air', 'Water']
const ELEMENT_EMOJI = { Fire: '🔥', Earth: '🌿', Air: '💨', Water: '💧' }

// defaultOn controls initial visibility; all columns appear in the toggle strip
const COLUMNS = [
  { key: 'name',     label: 'Name',          defaultOn: true  },
  { key: 'birthday', label: 'Birthday',      defaultOn: true  },
  { key: 'sun',      label: '☀ Sun',         defaultOn: true  },
  { key: 'moon',     label: '☽ Moon',        defaultOn: true  },
  { key: 'mercury',  label: '☿ Mercury',     defaultOn: false },
  { key: 'venus',    label: '♀ Venus',       defaultOn: false },
  { key: 'mars',     label: '♂ Mars',        defaultOn: false },
]

const DEFAULT_VISIBLE = Object.fromEntries(COLUMNS.map(c => [c.key, c.defaultOn]))

function ElementTag({ sign }) {
  if (!sign) return null
  const { element, color } = getElement(sign)
  if (!element || element === 'Unknown') return null
  return (
    <span className="tables-element-tag" style={{ color }} title={element}>
      {ELEMENT_EMOJI[element]}
    </span>
  )
}

export function TablesPanel({ nodes, chartTitle }) {
  const [sortBy,  setSortBy]  = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [visible, setVisible] = useState(DEFAULT_VISIBLE)
  const [showElements, setShowElements] = useState(false)

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

  // Get element for any sign
  function elementOf(sign) {
    if (!sign || sign === 'Unknown') return 'ZZZ'
    return getElement(sign).element || 'ZZZ'
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
      case 'mercury':  cmp = (a.mercury?.sign || 'ZZZ').localeCompare(b.mercury?.sign || 'ZZZ'); break
      case 'venus':    cmp = (a.venus?.sign   || 'ZZZ').localeCompare(b.venus?.sign   || 'ZZZ'); break
      case 'mars':     cmp = (a.mars?.sign    || 'ZZZ').localeCompare(b.mars?.sign    || 'ZZZ'); break
      case 'sun_el':     cmp = ELEMENT_ORDER.indexOf(elementOf(a.sunSign)) - ELEMENT_ORDER.indexOf(elementOf(b.sunSign)); break
      case 'moon_el':    cmp = ELEMENT_ORDER.indexOf(elementOf(a.moonSign)) - ELEMENT_ORDER.indexOf(elementOf(b.moonSign)); break
      case 'mercury_el': cmp = ELEMENT_ORDER.indexOf(elementOf(a.mercury?.sign)) - ELEMENT_ORDER.indexOf(elementOf(b.mercury?.sign)); break
      case 'venus_el':   cmp = ELEMENT_ORDER.indexOf(elementOf(a.venus?.sign)) - ELEMENT_ORDER.indexOf(elementOf(b.venus?.sign)); break
      case 'mars_el':    cmp = ELEMENT_ORDER.indexOf(elementOf(a.mars?.sign)) - ELEMENT_ORDER.indexOf(elementOf(b.mars?.sign)); break
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

  // Element sort button shown in planet headers when elements toggle is on
  function ElementSort({ planet }) {
    if (!showElements) return null
    const elCol = `${planet}_el`
    const isActive = sortBy === elCol
    return (
      <button
        type="button"
        className={`tables-el-sort${isActive ? ' tables-el-sort--active' : ''}`}
        onClick={(e) => { e.stopPropagation(); handleSort(elCol) }}
        title={`Sort by ${planet} element`}
      >
        🔥{isActive && <span className="tables-sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </button>
    )
  }

  return (
    <div className="tables-panel">
      <h3 className="tables-title">{chartTitle || 'Astrology Data'}</h3>

      {/* Column visibility toggles */}
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
        <button
          className={`tables-col-btn tables-col-btn--optional${showElements ? ' tables-col-btn--on' : ''}`}
          onClick={() => setShowElements(v => !v)}
          title={showElements ? 'Hide element indicators' : 'Show element next to each sign'}
        >
          {showElements ? '🔥 Elements' : '+ 🔥 Elements'}
        </button>
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
                  ☀ Sun<SortArrow col="sun" /><ElementSort planet="sun" />
                </th>
              )}
              {visible.moon && (
                <th className={thClass('moon')} onClick={() => handleSort('moon')}>
                  ☽ Moon<SortArrow col="moon" /><ElementSort planet="moon" />
                </th>
              )}
              {visible.mercury && (
                <th className={thClass('mercury')} onClick={() => handleSort('mercury')}>
                  ☿ Mercury<SortArrow col="mercury" /><ElementSort planet="mercury" />
                </th>
              )}
              {visible.venus && (
                <th className={thClass('venus')} onClick={() => handleSort('venus')}>
                  ♀ Venus<SortArrow col="venus" /><ElementSort planet="venus" />
                </th>
              )}
              {visible.mars && (
                <th className={thClass('mars')} onClick={() => handleSort('mars')}>
                  ♂ Mars<SortArrow col="mars" /><ElementSort planet="mars" />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                {visible.name    && <td className="tables-name">{r.name}</td>}
                {visible.birthday && <td className="tables-date">{r.birthdate}</td>}
                {visible.sun     && (
                  <td className="tables-sign">
                    {r.sunSymbol} {r.sunSign}
                    {showElements && <ElementTag sign={r.sunSign} />}
                  </td>
                )}
                {visible.moon    && (
                  <td className="tables-sign">
                    {r.moonSign && r.moonSign !== 'Unknown'
                      ? <><PlanetSign planet="moon" symbol={r.moonSymbol} sign={r.moonSign} />{showElements && <ElementTag sign={r.moonSign} />}</>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                )}
                {visible.mercury && (
                  <td className="tables-sign">
                    {r.mercury?.sign
                      ? <><PlanetSign planet="mercury" symbol={r.mercury.symbol} sign={r.mercury.sign} />{showElements && <ElementTag sign={r.mercury.sign} />}</>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                )}
                {visible.venus && (
                  <td className="tables-sign">
                    {r.venus?.sign
                      ? <><PlanetSign planet="venus" symbol={r.venus.symbol} sign={r.venus.sign} />{showElements && <ElementTag sign={r.venus.sign} />}</>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                )}
                {visible.mars && (
                  <td className="tables-sign">
                    {r.mars?.sign
                      ? <><PlanetSign planet="mars" symbol={r.mars.symbol} sign={r.mars.sign} />{showElements && <ElementTag sign={r.mars.sign} />}</>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export-only transposed view: fields as rows, members as columns. Always
          rendered but hidden by default; CSS reveals it (and hides the standard
          table) inside .tables-canvas-wrap--exporting. */}
      <div className="tables-scroll tables-scroll--transposed" aria-hidden="true">
        <table className="tables-table tables-table--transposed">
          <thead>
            <tr>
              <th className="tables-th tables-th--field">Field</th>
              {rows.map(r => (
                <th key={r.id} className="tables-th tables-th--member">{r.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.birthday && (
              <tr>
                <td className="tables-name">Birthday</td>
                {rows.map(r => <td key={r.id} className="tables-date">{r.birthdate}</td>)}
              </tr>
            )}
            {visible.sun && (
              <tr>
                <td className="tables-name">☀ Sun</td>
                {rows.map(r => (
                  <td key={r.id} className="tables-sign">
                    {r.sunSymbol} {r.sunSign}
                    {showElements && <ElementTag sign={r.sunSign} />}
                  </td>
                ))}
              </tr>
            )}
            {visible.moon && (
              <tr>
                <td className="tables-name">☽ Moon</td>
                {rows.map(r => (
                  <td key={r.id} className="tables-sign">
                    {r.moonSign && r.moonSign !== 'Unknown'
                      ? <><PlanetSign planet="moon" symbol={r.moonSymbol} sign={r.moonSign} />{showElements && <ElementTag sign={r.moonSign} />}</>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                ))}
              </tr>
            )}
            {visible.mercury && (
              <tr>
                <td className="tables-name">☿ Mercury</td>
                {rows.map(r => (
                  <td key={r.id} className="tables-sign">
                    {r.mercury?.sign
                      ? <><PlanetSign planet="mercury" symbol={r.mercury.symbol} sign={r.mercury.sign} />{showElements && <ElementTag sign={r.mercury.sign} />}</>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                ))}
              </tr>
            )}
            {visible.venus && (
              <tr>
                <td className="tables-name">♀ Venus</td>
                {rows.map(r => (
                  <td key={r.id} className="tables-sign">
                    {r.venus?.sign
                      ? <><PlanetSign planet="venus" symbol={r.venus.symbol} sign={r.venus.sign} />{showElements && <ElementTag sign={r.venus.sign} />}</>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                ))}
              </tr>
            )}
            {visible.mars && (
              <tr>
                <td className="tables-name">♂ Mars</td>
                {rows.map(r => (
                  <td key={r.id} className="tables-sign">
                    {r.mars?.sign
                      ? <><PlanetSign planet="mars" symbol={r.mars.symbol} sign={r.mars.sign} />{showElements && <ElementTag sign={r.mars.sign} />}</>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
