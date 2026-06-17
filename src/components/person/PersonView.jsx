import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { areCompatible } from '../../utils/astrology.js'
import { extractPlanetPositions, EDGE_LABELS } from '../../utils/treeHelpers.js'
import { calcCrossAspects, PLANET_GLYPHS } from '../../lib/astrology-core/aspects.js'
import { canAccess } from '../../utils/entitlements.js'
import { PLANET_META } from '../PlanetSign.jsx'
import {
  SIGN_SYMBOLS, ELEMENT_QUALITY, MOON_STYLE,
  MERCURY_SIGN_BLURB, VENUS_SIGN_BLURB, MARS_SIGN_BLURB, getSynastryBlurb,
} from '../insights/insightsData.js'

const PERSONAL_SET = new Set(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'])

function fmtDate(iso) {
  if (!iso) return null
  return `${parseInt(iso.slice(5, 7))}/${parseInt(iso.slice(8, 10))}/${iso.slice(0, 4)}`
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

// Returns the single strongest qualifying synastry aspect, or null if planet
// data is missing, or undefined if computed but nothing qualifies.
function topSynastryAspect(nodeA, nodeB) {
  const planetsA = extractPlanetPositions(nodeA)
  const planetsB = extractPlanetPositions(nodeB)
  if (planetsA.length < 3 || planetsB.length < 3) return null
  const cross = calcCrossAspects(planetsA, planetsB, !!nodeA.data.birthTime, !!nodeB.data.birthTime)
  const qualifying = cross.filter(a => {
    if (a.orb > 3) return false
    if (!PERSONAL_SET.has(a.personA.name) && !PERSONAL_SET.has(a.personB.name)) return false
    if (a.personA.name === a.personB.name && !PERSONAL_SET.has(a.personA.name)) return false
    if (a.confidence === 'uncertain') return false
    return getSynastryBlurb(a.personA.name, a.personB.name, a.aspect) != null
  })
  const priority = (a) => {
    const names = [a.personA.name, a.personB.name]
    if (names.includes('Venus') && names.includes('Mars')) return 0
    if (names.includes('Venus') || names.includes('Mars')) return 1
    if (names.includes('Sun') || names.includes('Moon')) return 2
    return 3
  }
  qualifying.sort((a, b) => priority(a) - priority(b) || a.orb - b.orb)
  return qualifying[0] ?? undefined
}

function PlacementRow({ planetKey, sign, degree, blurb, warned }) {
  const meta = PLANET_META[planetKey]
  return (
    <li className="person-placement">
      <div className="person-placement-line">
        <span className="person-placement-glyph" style={{ color: meta.color }}>{meta.glyph}</span>
        <span className="person-placement-label">
          <span style={{ color: meta.color }}>{meta.label}</span>
          {' in '}{SIGN_SYMBOLS[sign]} {sign}
          {degree != null && <span className="person-placement-degree"> · {Math.round(degree)}°</span>}
          {warned && <span className="person-placement-warn" title="Sign may depend on birth time"> ⚠</span>}
        </span>
      </div>
      {blurb && <p className="person-placement-blurb">{blurb}</p>}
    </li>
  )
}

export function PersonView({ node, nodes, edges, entitlements, onClose, onEdit, onUpgrade }) {
  const d = node.data
  const hasFullCompat = canAccess('full_compatibility', entitlements?.tier, entitlements?.config)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const warnedPlanets = useMemo(() => {
    if (d.birthTime) return new Set()
    return new Set((d.ingressWarnings ?? []).map(w => w.planet))
  }, [d.birthTime, d.ingressWarnings])

  const placements = useMemo(() => {
    const inner = d.innerPlanets ?? {}
    const outer = d.outerPlanets ?? {}
    const rows = []
    if (d.sign) {
      const quality = ELEMENT_QUALITY[d.element]
      rows.push({ planetKey: 'sun', sign: d.sign, degree: d.sunDegree, blurb: quality ? `A ${d.element} sun, often ${quality}.` : null })
    }
    if (d.moonSign && d.moonSign !== 'Unknown') {
      const style = MOON_STYLE[d.moonSign]
      rows.push({ planetKey: 'moon', sign: d.moonSign, degree: d.moonDegree, blurb: style ? `${capitalize(style)}.` : null })
    }
    if (inner.mercury?.sign) rows.push({ planetKey: 'mercury', sign: inner.mercury.sign, degree: inner.mercury.degree, blurb: MERCURY_SIGN_BLURB[inner.mercury.sign] ?? null })
    if (inner.venus?.sign) rows.push({ planetKey: 'venus', sign: inner.venus.sign, degree: inner.venus.degree, blurb: VENUS_SIGN_BLURB[inner.venus.sign] ?? null })
    if (inner.mars?.sign) rows.push({ planetKey: 'mars', sign: inner.mars.sign, degree: inner.mars.degree, blurb: MARS_SIGN_BLURB[inner.mars.sign] ?? null })
    if (outer.jupiter?.sign) rows.push({ planetKey: 'jupiter', sign: outer.jupiter.sign, degree: outer.jupiter.degree, blurb: null })
    if (outer.saturn?.sign) rows.push({ planetKey: 'saturn', sign: outer.saturn.sign, degree: outer.saturn.degree, blurb: null })
    return rows
  }, [d])

  const connections = useMemo(() => {
    const direct = edges
      .filter(e => e.source === node.id || e.target === node.id)
      .map(e => {
        const otherId = e.source === node.id ? e.target : e.source
        const other = nodes.find(n => n.id === otherId)
        if (!other) return null
        return {
          other,
          relation: EDGE_LABELS[e.data?.relationType] ?? 'connection',
          aspect: hasFullCompat ? topSynastryAspect(node, other) : null,
        }
      })
      .filter(Boolean)

    const directIds = new Set(direct.map(c => c.other.id))
    const parentIds = edges
      .filter(e => e.data?.relationType === 'parent-child' && e.target === node.id)
      .map(e => e.source)
    const siblings = nodes.filter(n =>
      n.id !== node.id && !directIds.has(n.id) &&
      edges.some(e => e.data?.relationType === 'parent-child' && e.target === n.id && parentIds.includes(e.source))
    ).map(other => ({
      other,
      relation: 'sibling',
      aspect: hasFullCompat ? topSynastryAspect(node, other) : null,
    }))

    return [...direct, ...siblings]
  }, [edges, nodes, node, hasFullCompat])

  const hasWarnings = placements.some(p => warnedPlanets.has(p.planetKey))

  return createPortal(
    <div className="person-overlay" role="dialog" aria-modal="true" aria-label={`${d.name} profile`}>
      <button type="button" className="person-close" onClick={onClose} aria-label="Close profile">✕</button>
      <div className="person-scroll">
        <div className="person-sheet">

          <header className="person-header">
            <div className="person-symbol" style={{ color: d.elementColor }}>{d.symbol}</div>
            <h2 className="person-name">{d.name}</h2>
            <p className="person-meta">
              {d.sign} Sun
              {d.element && d.element !== 'Unknown' && <> · <span style={{ color: d.elementColor }}>{d.element}</span></>}
              {d.birthdate && <> · {fmtDate(d.birthdate)}</>}
              {' '}<span className="person-beta">Beta</span>
            </p>
            {onEdit && (
              <button type="button" className="person-edit-btn" onClick={onEdit}>Edit details</button>
            )}
          </header>

          <section className="person-section">
            <h3 className="person-section-title">Placements</h3>
            <ul className="person-placements">
              {placements.map(p => (
                <PlacementRow key={p.planetKey} {...p} warned={warnedPlanets.has(p.planetKey)} />
              ))}
            </ul>
            {hasWarnings && (
              <p className="person-note">⚠ Some signs may depend on birth time. Add it under Edit details.</p>
            )}
          </section>

          <section className="person-section">
            <h3 className="person-section-title">Connections</h3>
            {connections.length === 0 ? (
              <p className="person-empty">No connections yet. Link {d.name} to someone in the chart to see how their charts relate.</p>
            ) : (
              <>
                <ul className="person-connections">
                  {connections.map(({ other, relation, aspect }, connIdx) => {
                    const bothElements = d.element && d.element !== 'Unknown' && other.data.element && other.data.element !== 'Unknown'
                    const harmonious = bothElements && areCompatible(d.element, other.data.element)
                    return (
                      <li key={`${other.id}-${connIdx}`} className="person-conn">
                        <div className="person-conn-head">
                          <span className="person-conn-symbol" style={{ color: other.data.elementColor }}>{other.data.symbol}</span>
                          <span className="person-conn-name">{other.data.name}</span>
                          <span className="person-conn-relation">{relation}</span>
                          {harmonious && (
                            <span className="person-conn-tag person-conn-tag--harmonious">Harmonious</span>
                          )}
                        </div>
                        <p className="person-conn-suns">{other.data.sign} Sun</p>
                        {hasFullCompat && aspect && (
                          <div className="person-conn-aspect">
                            <span className="person-conn-aspect-line">
                              {PLANET_GLYPHS[aspect.personA.name]} {aspect.personA.name} {aspect.symbol} {PLANET_GLYPHS[aspect.personB.name]} {aspect.personB.name} · {aspect.orb}°
                            </span>
                            <p className="person-conn-aspect-blurb">{getSynastryBlurb(aspect.personA.name, aspect.personB.name, aspect.aspect)}</p>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
                {!hasFullCompat && (
                  <button type="button" className="person-conn-upgrade" onClick={onUpgrade}>
                    ✦ Celestial unlocks how their charts connect
                  </button>
                )}
              </>
            )}
          </section>

        </div>
      </div>
    </div>,
    document.body
  )
}
