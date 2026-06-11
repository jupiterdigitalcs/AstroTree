/**
 * Eras (Beta) — members placed by birth year on a cosmic timeline, with
 * Pluto generation bands behind them and a thread connecting everyone in
 * the order they arrived.
 *
 * Display rules:
 * - Needs 2+ members with valid birth years (the parent also hides the tab)
 * - ≤5 members: bigger markers, two lanes; 6-12: four lanes; 13+: smaller
 *   markers so dense charts stay readable
 * - Under 640px the whole layout flips vertical (time flows downward)
 * - Axis zooms to the group's actual year spread, so same-age friend
 *   groups don't get one giant empty band
 */
import { useMemo, useState, useEffect } from 'react'

// Pluto generation eras (numeric mirror of PLUTO_GENS in insightsData.js)
const ERAS = [
  { sign: 'Cancer',      from: 1914, to: 1939, color: 'rgba(155,93,229,0.10)',  label: '♋ Pluto in Cancer' },
  { sign: 'Leo',         from: 1939, to: 1957, color: 'rgba(255,107,53,0.08)',  label: '♌ Pluto in Leo' },
  { sign: 'Virgo',       from: 1957, to: 1971, color: 'rgba(126,200,69,0.07)',  label: '♍ Pluto in Virgo' },
  { sign: 'Libra',       from: 1971, to: 1983, color: 'rgba(91,200,245,0.07)',  label: '♎ Pluto in Libra' },
  { sign: 'Scorpio',     from: 1983, to: 1995, color: 'rgba(155,93,229,0.10)',  label: '♏ Pluto in Scorpio' },
  { sign: 'Sagittarius', from: 1995, to: 2008, color: 'rgba(255,107,53,0.08)',  label: '♐ Pluto in Sagittarius' },
  { sign: 'Capricorn',   from: 2008, to: 2023, color: 'rgba(126,200,69,0.07)',  label: '♑ Pluto in Capricorn' },
  { sign: 'Aquarius',    from: 2023, to: 2044, color: 'rgba(91,200,245,0.07)',  label: '♒ Pluto in Aquarius' },
]

function useNarrow() {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const onChange = e => setNarrow(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return narrow
}

export function extractEraMembers(nodes) {
  return (nodes ?? [])
    .filter(n => n.data?.birthdate && n.data?.name)
    .map(n => ({
      id: n.id,
      name: n.data.name,
      year: Number(n.data.birthdate.slice(0, 4)),
      symbol: n.data.symbol ?? '✦',
      color: n.data.elementColor ?? '#c9a84c',
    }))
    .filter(m => Number.isFinite(m.year) && m.year > 1900)
    .sort((a, b) => a.year - b.year)
}

export function ErasView({ nodes, isGroupOnly }) {
  const vertical = useNarrow()

  const data = useMemo(() => {
    const members = extractEraMembers(nodes)
    if (members.length < 2) return null

    const n = members.length
    const markerR = n <= 5 ? 18 : n <= 12 ? 15 : 12
    const lanes = n <= 5 ? [-1, 1] : [-1, 1, -2, 2]
    const laneGap = n <= 5 ? 56 : 50

    // Zoom the axis to the group's spread (min one decade of padding)
    const span = Math.max(10, members[n - 1].year - members[0].year)
    const pad = Math.max(4, Math.round(span * 0.12))
    const minYear = Math.floor((members[0].year - pad) / 10) * 10
    const maxYear = Math.ceil((members[n - 1].year + pad) / 10) * 10

    // Layout space: t = along time, c = across lanes
    const T = vertical ? Math.max(560, n * 86) : 1100
    const C = vertical ? 420 : 450
    const PAD_T = vertical ? 56 : 60
    const MID_C = C / 2 + (vertical ? 10 : 0)
    const t = year => PAD_T + ((year - minYear) / (maxYear - minYear)) * (T - PAD_T * 2)

    const placed = members.map((m, i) => {
      const prev = members[i - 1]
      const crowded = prev && t(m.year) - t(prev.year) < markerR * 5
      const lane = crowded || i % 2 === 1 ? lanes[i % lanes.length] : lanes[0]
      return { ...m, t: t(m.year), c: MID_C + lane * laneGap, lane }
    })

    const decadeStep = span > 70 ? 20 : 10
    const decades = []
    for (let y = minYear; y <= maxYear; y += decadeStep) decades.push({ year: y, t: t(y) })

    const eras = ERAS
      .filter(e => e.to > minYear && e.from < maxYear)
      .map(e => ({ ...e, t1: t(Math.max(e.from, minYear)), t2: t(Math.min(e.to, maxYear)) }))
      .filter(e => e.t2 - e.t1 > 24)

    return { placed, decades, eras, markerR, T, C }
  }, [nodes, vertical])

  if (!data) return null
  const { placed, decades, eras, markerR, T, C } = data

  // Map (t, c) into svg space per orientation
  const X = p => vertical ? p.c : p.t
  const Y = p => vertical ? p.t : p.c
  const W = vertical ? C : T
  const H = vertical ? T : C
  const axisC = vertical ? 34 : H - 44 // decade label edge
  const thread = placed.map(m => `${X(m)},${Y(m)}`).join(' ')

  return (
    <div className="eras-view">
      <p className="eras-intro">
        Everyone, in the order they arrived. The bands are Pluto generations,
        the eras people came through. {isGroupOnly ? 'Groups' : 'Families'} that
        span bands often span worldviews too.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="eras-svg">
        {/* Era bands */}
        {eras.map(e => (
          <g key={e.sign}>
            {vertical ? (
              <rect x={50} y={e.t1} width={W - 60} height={e.t2 - e.t1} fill={e.color} rx={6} />
            ) : (
              <rect x={e.t1} y={28} width={e.t2 - e.t1} height={H - 86} fill={e.color} rx={6} />
            )}
            <text
              x={vertical ? 58 : (e.t1 + e.t2) / 2}
              y={vertical ? e.t1 + 14 : 44}
              textAnchor={vertical ? 'start' : 'middle'}
              className="eras-band-label"
            >{e.label}</text>
          </g>
        ))}

        {/* Decade ticks */}
        {decades.map(d => (
          <text
            key={d.year}
            x={vertical ? axisC : d.t}
            y={vertical ? d.t + 3 : axisC + 16}
            textAnchor={vertical ? 'end' : 'middle'}
            className="eras-decade"
          >{d.year}</text>
        ))}

        {/* The thread — everyone connected in birth order */}
        <polyline
          points={thread} fill="none" stroke="rgba(201,168,76,0.45)" strokeWidth={1.2}
          strokeDasharray="1" pathLength={1} className="eras-thread"
        />

        {/* Members */}
        {placed.map((m, i) => (
          <g key={m.id} className="eras-star" style={{ animationDelay: `${0.15 + i * 0.12}s` }}>
            <circle cx={X(m)} cy={Y(m)} r={markerR} fill="#0d0b1e" stroke={m.color} strokeWidth={1.5}
              style={{ filter: `drop-shadow(0 0 6px ${m.color}88)` }} />
            <text x={X(m)} y={Y(m)} textAnchor="middle" dominantBaseline="central"
              fontSize={markerR - 3} fill={m.color}>{m.symbol}</text>
            <text
              x={vertical ? X(m) + (m.lane > 0 ? markerR + 8 : -(markerR + 8)) : X(m)}
              y={vertical ? Y(m) - 4 : Y(m) - markerR - 9}
              textAnchor={vertical ? (m.lane > 0 ? 'start' : 'end') : 'middle'}
              className="eras-name"
            >{m.name}</text>
            <text
              x={vertical ? X(m) + (m.lane > 0 ? markerR + 8 : -(markerR + 8)) : X(m)}
              y={vertical ? Y(m) + 10 : Y(m) + markerR + 13}
              textAnchor={vertical ? (m.lane > 0 ? 'start' : 'end') : 'middle'}
              className="eras-year"
            >{m.year}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}
