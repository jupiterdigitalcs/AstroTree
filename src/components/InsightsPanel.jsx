import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react'
import {
  getElement, areCompatible,
  ELEMENT_COLORS, SIGN_MODALITY, POLARITY_GROUP,
  FAMILY_SIGNATURE_DESCRIPTIONS, ELEMENT_ROLE_BLURB, MODALITY_MODIFIER,
} from '../utils/astrology.js'
import { PlanetSign } from './PlanetSign.jsx'
import { canAccess } from '../utils/entitlements.js'
import {
  collectiveElementMap, findHotspots, findGaps,
  saturnLines, jupiterGifts, allPlanetsBySign,
  findBridgePerson, deriveRoles, PLANET_GLYPHS,
} from '../utils/groupChartCalc.js'
import { findHereditaryAspects, findSharedContacts, calcCrossAspects, PLANET_GLYPHS as ASPECT_PLANET_GLYPHS } from '../lib/astrology-core/aspects.js'
import {
  ELEMENT_ENERGY, SUN_ELEMENT_DESC, MOON_ELEMENT_DESC,
  SIGN_SYMBOLS,
  VENUS_SIGN_BLURB, MARS_SIGN_BLURB,
  ELEMENT_THREAD_BLURB, SIBLING_ADAPTABILITY,
  PLUTO_GENS, PLUTO_ORDER, OPPOSITE_SIGNS,
  ELEMENT_QUALITY, MOON_STYLE, ZODIAC_THREAD_BLURB, ZODIAC_THREAD_BLURB_GROUP, SIGN_SHORT,
  SQUAD_ELEMENT_VIBE, SQUAD_MODALITY_VIBE, SQUAD_POLARITY_NOTE,
  ASPECT_PAIR_BLURB, getSynastryBlurb,
} from './insights/insightsData.js'
import { extractPlanetPositions } from '../utils/treeHelpers.js'
import { GroupAnalysisCards } from './insights/GroupAnalysisCards.jsx'
import { ErasView, extractEraMembers } from './ErasView.jsx'

const TheDig = lazy(() => import('./dig/TheDig.jsx'))
const TheCurrent = lazy(() => import('./current/TheCurrent.jsx'))

const ELEMENTS = ['Fire', 'Earth', 'Air', 'Water']

function describeElementMix({ counts, total, kind, groupLabel }) {
  const present = ELEMENTS.filter(e => counts[e] > 0)
    .sort((a, b) => counts[b] - counts[a])
  const missing = ELEMENTS.filter(e => counts[e] === 0)
  const desc = kind === 'moon' ? MOON_ELEMENT_DESC : SUN_ELEMENT_DESC

  const perElement = present.map(el => ({
    element: el,
    count: counts[el],
    blurb: desc[el],
  }))

  let summary
  if (present.length === 1) {
    summary = `Everyone shares the same element. That consistency amplifies, but the ${groupLabel} may feel the absence of the other three.`
  } else if (present.length === 4) {
    summary = `All four elements are represented. A rare full spread, and a naturally balanced ${groupLabel}.`
  } else {
    const top = present[0]
    const topPct = counts[top] / total
    if (topPct >= 0.6) {
      summary = `${top} clearly leads the ${groupLabel}, with ${present.slice(1).join(' and ')} offering counterweight.`
    } else {
      summary = `A mix of ${present.join(', ')}. No single element dominates.`
    }
  }

  const missingNote = missing.length > 0 && missing.length < 4
    ? `Missing ${missing.join(' and ')}. Those qualities may be sought outside the ${groupLabel}.`
    : null

  return { perElement, summary, missingNote }
}

function fmtBirthdate(d) {
  if (!d) return '—'
  const [y, mo, day] = d.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[+mo - 1]} ${+day}, ${y}`
}


function getPlutoSign(birthdate) {
  if (!birthdate) return null
  const year = +birthdate.split('-')[0]
  if (year < 1914) return null
  if (year <= 1939) return 'Cancer'
  if (year <= 1957) return 'Leo'
  if (year <= 1971) return 'Virgo'
  if (year <= 1983) return 'Libra'
  if (year <= 1995) return 'Scorpio'
  if (year <= 2008) return 'Sagittarius'
  if (year <= 2023) return 'Capricorn'
  return 'Aquarius'
}


function pairKey(a, b) {
  return [a.id, b.id].sort().join('|')
}

function buildRoleBlurb({ modalityMod, elementBlurb, node }) {
  return `${node.data.name} is ${modalityMod} ${elementBlurb}.`
}

function byAge(a, b) {
  return (a.data.birthdate || '9999').localeCompare(b.data.birthdate || '9999')
}
function byAgeNode(a, b) {
  return (a.node.data.birthdate || '9999').localeCompare(b.node.data.birthdate || '9999')
}


function getArrivalStory(child, parents, elderSiblings) {
  const el = child.data.element
  const sign = child.data.sign
  const pool = [...parents, ...elderSiblings]
  const elCountBefore = pool.filter(n => n.data.element === el).length
  const qual = ELEMENT_QUALITY[el] || el

  let main
  if (elCountBefore === 0) {
    const elsBefore = new Set(pool.map(n => n.data.element))
    if (elsBefore.size + 1 === 4) main = `rounded out the family. Brought a quality none of the others had.`
    else if (elderSiblings.length === 0) main = `brought ${qual} energy to a family that didn't have it yet`
    else main = `introduced something new. ${qual}, a quality no one else here carries.`
  } else {
    const matchingParent = parents.find(p => p.data.element === el)
    const matchingSibling = elderSiblings.find(s => s.data.element === el)
    const totalAfter = pool.length + 1
    const countAfter = elCountBefore + 1
    if (parents.length >= 2 && parents.every(p => p.data.element === el)) {
      main = `born into it on both sides. ${qual} runs through this whole family.`
    } else if (matchingParent && !matchingSibling) {
      main = `took after ${matchingParent.data.name}. ${qual}, cut from the same cloth.`
    } else if (matchingSibling && !matchingParent) {
      main = `shares ${qual} energy with ${matchingSibling.data.name}. The two carry the same thread.`
    } else {
      main = `${qual}. Now ${countAfter} of ${totalAfter} in this family share this.`
    }
  }

  return { main, detail: SIGN_SHORT[sign] || null }
}

// ── Inner components ──────────────────────────────────────────────────────────

function FamilySignatureCard({ dominant, dominantModality, masculine, feminine, total, missingElements, isGroupOnly, children }) {
  const g = isGroupOnly ? 'group' : 'family'
  const G = isGroupOnly ? 'Group' : 'Family'
  const rawDesc = FAMILY_SIGNATURE_DESCRIPTIONS[dominant]?.[dominantModality]
  // Descriptions are written for families ("A family of champions") —
  // soften for friend/coworker charts
  const desc = isGroupOnly && rawDesc ? rawDesc.replace(/\ba family of\b/i, 'a group of') : rawDesc
  const mascPct = total > 0 ? Math.round(masculine / total * 100) : 50
  const femPct  = total > 0 ? Math.round(feminine  / total * 100) : 50
  return (
    <div className="insight-card insight-signature-card">
      <h3 className="insight-heading">{G} Signature</h3>
      <div className="signature-hero">
        <span className="signature-element" style={{ color: ELEMENT_COLORS[dominant] }}>{dominant}</span>
        {' / '}
        <span className="signature-modality">{dominantModality}</span>
      </div>
      {desc && (
        <p className="insight-note signature-desc">Your {g} {desc}</p>
      )}
      <div className="signature-polarity-row">
        <span className="signature-polarity-label">Active</span>
        <div className="signature-polarity-track">
          <div className="signature-polarity-fill signature-polarity-fill--masc" style={{ width: `${mascPct}%` }} />
          <div className="signature-polarity-fill signature-polarity-fill--fem"  style={{ width: `${femPct}%` }} />
          <div className="signature-polarity-marker" style={{ left: `${mascPct}%` }}>
            <span className="signature-polarity-marker-pct">{mascPct}%</span>
          </div>
        </div>
        <span className="signature-polarity-label signature-polarity-label--right">Receptive</span>
      </div>
      <p className="signature-polarity-note">
        {masculine} planet placements in active signs (Fire + Air) · {feminine} in receptive signs (Earth + Water)
      </p>
      {missingElements.length > 0 && (
        <p className="insight-note signature-missing">
          No {missingElements.join(' or ')} energy. The {g} may seek this outside.
        </p>
      )}
      {children}
    </div>
  )
}

// ── Squad Energy — friend-group card using all personal planets ────────────

function SquadEnergyCard({ nodes, allPlanetCounts, dominant, dominantModality, innerPlanetMap, warningsPerNode }) {
  const mascPct = (allPlanetCounts.masc + allPlanetCounts.fem) > 0
    ? Math.round(allPlanetCounts.masc / (allPlanetCounts.masc + allPlanetCounts.fem) * 100)
    : 50
  const polKey = mascPct >= 60 ? 'active' : mascPct <= 40 ? 'receptive' : 'balanced'
  const vibe = SQUAD_ELEMENT_VIBE[dominant]
  const modVibe = SQUAD_MODALITY_VIBE[dominantModality]

  // Per-person planet element breakdown
  const memberBreakdowns = nodes.map(n => {
    const warned = warningsPerNode.get(n.id) ?? new Set()
    const inner = innerPlanetMap.get(n.id)
    const placements = [
      !warned.has('sun') && n.data.sign ? getElement(n.data.sign).element : null,
      !warned.has('moon') && n.data.moonSign && n.data.moonSign !== 'Unknown' ? getElement(n.data.moonSign).element : null,
      !warned.has('mercury') && inner?.mercury?.sign ? getElement(inner.mercury.sign).element : null,
      !warned.has('venus') && inner?.venus?.sign ? getElement(inner.venus.sign).element : null,
      !warned.has('mars') && inner?.mars?.sign ? getElement(inner.mars.sign).element : null,
    ].filter(Boolean)
    const elCount = {}
    placements.forEach(el => { elCount[el] = (elCount[el] || 0) + 1 })
    const topEl = Object.entries(elCount).sort((a, b) => b[1] - a[1])[0]
    return { name: n.data.name, topElement: topEl?.[0], topCount: topEl?.[1], total: placements.length }
  })

  return (
    <div className="insight-card">
      <h3 className="insight-heading">⚡ Squad Energy</h3>
      <div className="signature-hero" style={{ marginBottom: '0.3rem' }}>
        <span className="signature-element" style={{ color: ELEMENT_COLORS[dominant] }}>{vibe?.label}</span>
      </div>
      <p className="insight-note">{vibe?.vibe}</p>
      <p className="insight-note" style={{ marginTop: '0.35rem' }}>
        <strong>{dominantModality}</strong>: {modVibe}.
      </p>
      <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '0.3rem' }}>
        {SQUAD_POLARITY_NOTE[polKey]}
      </p>
      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <p className="insight-note" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
          What each person brings to the group:
        </p>
        {memberBreakdowns.map(m => {
          const desc = { Fire: 'energy and initiative', Earth: 'stability and follow-through', Air: 'ideas and conversation', Water: 'empathy and intuition' }
          return (
            <p key={m.name} className="insight-note" style={{ fontSize: '0.78rem' }}>
              <strong>{m.name}</strong>
              <span style={{ color: ELEMENT_COLORS[m.topElement] }}>: {desc[m.topElement] || m.topElement}</span>
            </p>
          )
        })}
      </div>
      <p className="insight-whisper" style={{ marginTop: '0.4rem' }}>
        Based on Sun, Moon, Mercury, Venus, and Mars, not just sun signs.
      </p>
    </div>
  )
}

// ── Social Chemistry — Venus/Mars dynamics across friend group ─────────────
const VENUS_ELEMENT_STYLE = {
  Fire:  'bold and direct. Shows affection openly, loves through enthusiasm and big gestures',
  Earth: 'steady and physical. Shows love through presence, touch, and reliability',
  Air:   'social and cerebral. Connects through conversation, humor, and ideas',
  Water: 'deep and intuitive. Bonds emotionally, picks up on what\'s unspoken',
}
const MARS_ELEMENT_STYLE = {
  Fire:  'charges in head-first, brings energy and momentum to the group',
  Earth: 'steady and persistent, the one who actually follows through',
  Air:   'channels drive through strategy and conversation, thinks before acting',
  Water: 'motivated by emotion and instinct, fights for what they feel',
}

function SocialChemistryCard({ nodes, innerPlanetMap, edges }) {
  // Gather Venus + Mars data for each member
  const members = nodes.map(n => {
    const inner = innerPlanetMap.get(n.id)
    const venusSign = inner?.venus?.sign ?? null
    const marsSign = inner?.mars?.sign ?? null
    return {
      node: n,
      name: n.data.name,
      venusSign,
      marsSign,
      venusElement: venusSign ? getElement(venusSign).element : null,
      marsElement: marsSign ? getElement(marsSign).element : null,
    }
  })

  const withVenus = members.filter(m => m.venusSign)
  const withMars = members.filter(m => m.marsSign)
  if (withVenus.length < 2 && withMars.length < 2) return null

  // Find "the glue" — Venus in a social/connecting element (Air/Water), most connections
  const glue = withVenus.length >= 2 ? (() => {
    const scored = withVenus.map(m => {
      // Count how many other members' sun signs are compatible with this person's Venus element
      const compatCount = nodes.filter(n => n.id !== m.node.id && areCompatible(m.venusElement, n.data.element)).length
      return { ...m, compatCount }
    }).sort((a, b) => b.compatCount - a.compatCount)
    return scored[0]?.compatCount > 0 ? scored[0] : null
  })() : null

  // Find "the spark" — Mars in Fire/Air, the energizer
  const spark = withMars.length >= 2 ? (() => {
    const fireAir = withMars.filter(m => m.marsElement === 'Fire' || m.marsElement === 'Air')
    if (fireAir.length > 0) return fireAir.sort((a, b) => (b.marsElement === 'Fire' ? 1 : 0) - (a.marsElement === 'Fire' ? 1 : 0))[0]
    return withMars.sort((a, b) => {
      const aScore = { Fire: 4, Air: 3, Earth: 2, Water: 1 }
      return (aScore[b.marsElement] || 0) - (aScore[a.marsElement] || 0)
    })[0]
  })() : null

  // Venus-Mars cross-connections between friends
  const crossPulls = []
  const friendEdges = edges.filter(e => e.data?.relationType === 'friend')
  friendEdges.forEach(e => {
    const a = members.find(m => m.node.id === e.source)
    const b = members.find(m => m.node.id === e.target)
    if (!a || !b) return
    if (a.marsElement && b.venusElement && areCompatible(a.marsElement, b.venusElement))
      crossPulls.push({ driver: a, drawn: b, type: 'mars-venus' })
    if (b.marsElement && a.venusElement && areCompatible(b.marsElement, a.venusElement))
      crossPulls.push({ driver: b, drawn: a, type: 'mars-venus' })
  })

  // Venus element distribution
  const venusElements = {}
  withVenus.forEach(m => { venusElements[m.venusElement] = (venusElements[m.venusElement] || 0) + 1 })
  const topVenusEl = Object.entries(venusElements).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="insight-card">
      <h3 className="insight-heading">♀♂ Social Chemistry</h3>
      <p className="insight-whisper">Inner-planet positions are based on birth dates. Exact birth times sharpen this.</p>
      <p className="insight-whisper" style={{ marginBottom: '0.3rem' }}>
        Venus is how you connect. Mars is how you show up. Together they shape the social energy of the group.
      </p>

      {topVenusEl && withVenus.length >= 2 && (
        <div style={{ marginBottom: '0.5rem' }}>
          <p className="insight-note">
            <strong style={{ color: ELEMENT_COLORS[topVenusEl[0]] }}>
              {topVenusEl[0]} Venus dominates
            </strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}> ({topVenusEl[1]} of {withVenus.length})</span>
          </p>
          <p className="insight-note" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {VENUS_ELEMENT_STYLE[topVenusEl[0]]}.
          </p>
        </div>
      )}

      {glue && (
        <div style={{ marginBottom: '0.4rem' }}>
          <p className="insight-note">
            <strong>The Glue:</strong> {glue.name}
          </p>
          <p className="insight-note" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Venus in {glue.venusSign}: {VENUS_ELEMENT_STYLE[glue.venusElement]}. Naturally compatible with the most people in this group.
          </p>
        </div>
      )}

      {spark && (
        <div style={{ marginBottom: '0.4rem' }}>
          <p className="insight-note">
            <strong>The Spark:</strong> {spark.name}
          </p>
          <p className="insight-note" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Mars in {spark.marsSign}: {MARS_ELEMENT_STYLE[spark.marsElement]}.
          </p>
        </div>
      )}

      {crossPulls.length > 0 && (
        <div style={{ marginTop: '0.3rem' }}>
          <p className="insight-note" style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Natural draws (pairs where one person's drive energy clicks with what the other values):
          </p>
          {crossPulls.slice(0, 4).map((cp, i) => (
            <p key={i} className="insight-note" style={{ fontSize: '0.76rem' }}>
              <strong>{cp.driver.name}</strong> → <strong>{cp.drawn.name}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                {' · '}{cp.driver.name} brings the energy {cp.drawn.name} is drawn to
              </span>
            </p>
          ))}
        </div>
      )}

      {withVenus.length >= 2 && (
        <div style={{ marginTop: '0.45rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <p className="insight-note" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>
            How each person connects (♀) and shows up (♂):
          </p>
          {withVenus.map(m => (
            <p key={m.node.id} className="insight-note" style={{ fontSize: '0.76rem' }}>
              <strong>{m.name}</strong>
              <span style={{ color: 'var(--rose)' }}> connects through {m.venusElement || '—'}</span>
              {m.marsElement && <span style={{ color: '#e07a5f' }}> · drives with {m.marsElement}</span>}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// Tier definitions: label, explanation, and grouping order
const COMPAT_TIERS = {
  'Cosmic Echo':           { order: 1, explain: 'All four personal planets (Sun, Moon, Venus, Mars) land in the same signs. This is unusually close. These two share the same outward identity, emotional instincts, love language, and drive.' },
  'Rare Triple Alignment': { order: 2, explain: 'Three of their four personal planets match signs. Most people share one placement at most, so three is a remarkably deep resonance.' },
  'Soul Twins':            { order: 3, explain: 'Same Sun and Moon signs. Sun is how you show up in the world; Moon is your emotional core. Sharing both means they tend to express and feel in very similar ways.' },
  'Cosmic Twins':          { order: 4, explain: 'Same Sun sign. The Sun represents outward identity and ego. They may recognize their own qualities reflected in each other.' },
  'Mirror Signs':          { order: 5, explain: 'Their Sun signs sit directly opposite each other on the zodiac wheel. Opposite signs carry complementary qualities: what one lacks, the other tends to embody.' },
  'Lunar Bond':            { order: 6, explain: 'Same Moon sign. The Moon governs emotional needs, instincts, and how someone processes feelings. These two may understand each other without much explanation.' },
  'Sun-Moon Reflection':   { order: 7, explain: 'One person\'s Sun sign matches the other\'s Moon sign. The Sun person outwardly embodies what the Moon person feels inwardly, which can create a natural sense of comfort.' },
}

const BOND_EXPLAIN = {
  'cosmic-echo': 'Multiple personal planets in the same signs is uncommon and suggests a deep resonance between these two.',
  'rare-alignment': 'Three shared sign placements is uncommon and tends to create a feeling of being fundamentally understood by the other person.',
  'soul-twins': 'Sharing both Sun and Moon signs means their outward identity and inner emotional world are built from the same material. They may instinctively understand each other.',
  'cosmic-twins': 'Same Sun sign means they tend to express themselves in similar ways. They may see parts of themselves reflected in each other.',
  'lunar-bond': 'Shared Moon sign suggests similar emotional needs and instincts. They may process feelings in the same way without having to explain.',
  'mirror': 'Opposite signs sit across the zodiac from each other. They often represent complementary qualities that can create a strong pull.',
  'sun-moon-reflection': 'When one person\'s Sun lands on the other\'s Moon, it can create a natural sense of comfort. One embodies outwardly what the other feels inwardly.',
  'natural-flow': 'Compatible elements (Fire-Air or Earth-Water) tend to support and amplify each other. These two may find it easy to get along.',
}

const BOND_COLOR = {
  'cosmic-echo': 'var(--gold)',
  'rare-alignment': 'var(--gold)',
  'soul-twins': 'var(--gold)',
  'cosmic-twins': 'var(--gold)',
  'lunar-bond': '#9dbbd4',
  'mirror': 'var(--rose)',
  'sun-moon-reflection': '#c4a8d4',
  'natural-flow': '#7ec845',
}

function FullCompatPairs({ pairs, title, isExporting, generationLevel, notableBonds = [] }) {
  const [showAll, setShowAll] = useState(false)
  // Export: trim to oldest 2 generations for large families
  const exportPairs = isExporting && pairs.length > 12
    ? pairs.filter(p => (generationLevel?.[p.a.id] ?? 0) <= 1 && (generationLevel?.[p.b.id] ?? 0) <= 1)
    : pairs
  const trimmedCount = pairs.length - exportPairs.length

  // Build a set of notable bond pair keys so we can exclude them from the tier list
  const bondKeys = new Set(notableBonds.map(b => pairKey(b.a, b.b)))

  // Group remaining pairs by compatibility tier (excluding notable bonds)
  const tierGroups = {}
  exportPairs.filter(p => !bondKeys.has(pairKey(p.a, p.b))).forEach(pair => {
    const label = pair.compatLabel
    if (!tierGroups[label]) tierGroups[label] = []
    tierGroups[label].push(pair)
  })
  const sortedTiers = Object.entries(tierGroups)
    .sort(([a], [b]) => (COMPAT_TIERS[a]?.order ?? 99) - (COMPAT_TIERS[b]?.order ?? 99))

  // Summary counts (include notable bonds in the count)
  const allTierCounts = {}
  notableBonds.forEach(b => {
    // Map noteType to a display label for the summary
    const label = b.noteType === 'cosmic-echo' ? 'Cosmic Echo'
      : b.noteType === 'rare-alignment' ? 'Rare Triple Alignment'
      : b.noteType === 'soul-twins' ? 'Soul Twins'
      : b.noteType === 'cosmic-twins' ? 'Cosmic Twins'
      : b.noteType === 'lunar-bond' ? 'Lunar Bond'
      : b.noteType === 'mirror' ? 'Mirror Signs'
      : b.noteType === 'sun-moon-reflection' ? 'Sun-Moon Reflection'
      : b.noteType === 'natural-flow' ? 'Kindred Spirits'
      : null
    if (label) allTierCounts[label] = (allTierCounts[label] || 0) + 1
  })
  exportPairs.filter(p => !bondKeys.has(pairKey(p.a, p.b))).forEach(p => {
    allTierCounts[p.compatLabel] = (allTierCounts[p.compatLabel] || 0) + 1
  })
  const tierOrder = ['Cosmic Echo', 'Rare Triple Alignment', 'Soul Twins', 'Cosmic Twins', 'Mirror Signs', 'Lunar Bond', 'Sun-Moon Reflection']
  const summaryParts = tierOrder
    .filter(label => allTierCounts[label])
    .map(label => `${allTierCounts[label]} ${label}${allTierCounts[label] > 1 ? 's' : ''}`)

  const totalPairs = notableBonds.length + exportPairs.filter(p => !bondKeys.has(pairKey(p.a, p.b))).length

  // For show-more on the tier section: limit to 8 if collapsed
  const allGrouped = sortedTiers.flatMap(([, items]) => items)
  const isLong = allGrouped.length > 5
  const visibleLimit = showAll ? allGrouped.length : 5
  let visibleCount = 0

  return (
    <div className="insight-card insight-full-compat" data-count={totalPairs} data-label={totalPairs === 1 ? 'pair' : 'pairs'}>
      <h3 className="insight-heading">{title}<span className="insight-pro-tag">✦</span></h3>
      <p className="insight-note compat-pair-count">{totalPairs} notable pair{totalPairs !== 1 ? 's' : ''}</p>
      {summaryParts.length > 1 && (
        <p className="insight-whisper" style={{ marginBottom: '0.4rem' }}>
          {summaryParts.join(' · ')}
        </p>
      )}

      {/* ── Notable Bonds ────────────────────────────────────────────── */}
      {notableBonds.map(({ a, b, note, noteType, rel, needsTimeCheck }) => {
        const isRare = noteType === 'cosmic-echo' || noteType === 'rare-alignment'
        const color = BOND_COLOR[noteType] || '#7ec845'
        return (
          <div key={pairKey(a, b)} className={`insight-couple${isRare ? ' insight-couple--rare' : ''}`}>
            {isRare && (
              <p className="insight-rare-badge">
                {noteType === 'cosmic-echo' ? '✦✦✦ Extremely Rare' : '✦✦ Rare'}
              </p>
            )}
            <p className="insight-note">
              <strong>{a.data.name}</strong> & <strong>{b.data.name}</strong>
              {rel && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}> · {rel}</span>}
            </p>
            <p className="insight-compat" style={{ color }}>{note}</p>
            {needsTimeCheck && (
              <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.1rem' }}>
                ⚠ Confirm with exact birth time
              </p>
            )}
          </div>
        )
      })}

      {/* ── Remaining pairs, grouped by tier ──────────────────────────── */}
      {sortedTiers.length > 0 && (
        <div className="compat-pair-list">
          {sortedTiers.map(([tierLabel, items]) => {
            const pairsToShow = items.filter(() => {
              if (visibleCount >= visibleLimit) return false
              visibleCount++
              return true
            })
            if (pairsToShow.length === 0) return null
            return (
              <div key={tierLabel} className="compat-tier-group">
                <p className="compat-tier-label" style={{ color: items[0].color }}>{tierLabel}</p>
                {pairsToShow.map(pair => (
                  <div key={pairKey(pair.a, pair.b)} className="compat-pair-row">
                    <div className="compat-pair-names">
                      <span>{pair.a.data.symbol} <strong>{pair.a.data.name}</strong></span>
                      <span className="compat-pair-amp">&</span>
                      <span>{pair.b.data.symbol} <strong>{pair.b.data.name}</strong></span>
                      <span className="compat-pair-rel">{pair.relationLabel}</span>
                    </div>
                    {pair.sharedPlacements?.length > 0 && (
                      <p className="insight-note" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.05rem' }}>
                        {pair.sharedPlacements.join(' · ')}
                      </p>
                    )}
                    {pair.moonNote && (
                      <p className="insight-note" style={{ color: '#9dbbd4', fontSize: '0.72rem', marginTop: '0.1rem' }}>
                        ☽ {pair.moonNote}
                      </p>
                    )}
                    {pair.needsTimeCheck && (
                      <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontStyle: 'italic', marginTop: '0.1rem' }}>
                        ⚠ Confirm with exact birth time
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
      {isLong && (
        <button type="button" className="compat-show-more-btn" onClick={() => setShowAll(v => !v)}>
          {showAll ? 'Show less' : `Show all ${allGrouped.length} pairs`}
        </button>
      )}
      {trimmedCount > 0 && (
        <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
          + {trimmedCount} more pair{trimmedCount !== 1 ? 's' : ''} from younger generations (see full panel)
        </p>
      )}
    </div>
  )
}


function FamilyRoles({ memberRoles, isExporting, generationLevel, isGroupOnly }) {
  const g = isGroupOnly ? 'group' : 'family'
  const G = isGroupOnly ? 'Group' : 'Family'
  const [expanded, setExpanded] = useState(null)
  // For large families in export, trim to oldest 2 generations to keep the card compact
  const displayRoles = isExporting && memberRoles.length >= 8
    ? memberRoles.filter(r => (generationLevel?.[r.node.id] ?? 0) <= 1)
    : memberRoles
  const trimmedCount = memberRoles.length - displayRoles.length
  return (
    <div className="insight-card insight-family-roles" data-count={displayRoles.length} data-label={displayRoles.length === 1 ? 'member' : 'members'}>
      <h3 className="insight-heading">{G} Roles<span className="insight-pro-tag">✦</span></h3>
      <p className="insight-note" style={{ marginBottom: '0.4rem' }}>Each member's cosmic role in the {g} dynamic</p>
      {displayRoles.map(role => {
        const isOpen = isExporting || expanded === role.node.id
        return (
          <div
            key={role.node.id}
            className={`family-role-item${isOpen ? ' family-role-item--open' : ''}`}
            onClick={isExporting ? undefined : () => setExpanded(v => v === role.node.id ? null : role.node.id)}
          >
            <div className="family-role-header">
              <span className="family-role-symbol" style={{ color: role.node.data.elementColor }}>{role.node.data.symbol}</span>
              <span className="family-role-name"><strong>{role.node.data.name}</strong></span>
              <span className="family-role-sign">☀ {role.node.data.sign}{role.node.data.moonSign && role.node.data.moonSign !== 'Unknown' ? ` · ☽ ${role.node.data.moonSign}` : ''}</span>
              <span className="family-role-chevron">{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
              <div className="family-role-body">
                {role.derivedRole ? (
                  <p className="insight-note" style={{ fontWeight: 500 }}>
                    {role.node.data.name}: {role.derivedRole}.
                  </p>
                ) : (
                  <p className="insight-note">{buildRoleBlurb(role)}</p>
                )}
                {role.contributions.length > 1 && role.contributions.slice(1).map((c, i) => (
                  <p key={i} className="insight-note" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {c.description}
                  </p>
                ))}
                {role.node.data.moonSign && role.node.data.moonSign !== 'Unknown' && (() => {
                  const moonStyle = MOON_STYLE[role.node.data.moonSign]
                  return moonStyle ? (
                    <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      ☽ {role.node.data.moonSign} moon: {moonStyle}.
                    </p>
                  ) : null
                })()}
                {role.isOnlyElement && !role.derivedRole && (
                  <p className="insight-note family-role-special">✦ Sole {role.node.data.element} energy in the {g}</p>
                )}
                {!role.isOnlyElement && !role.derivedRole && role.sameElementPeers.length > 0 && (
                  <p className="insight-note family-role-special">
                    Fellow {role.node.data.element} spirit alongside {role.sameElementPeers.join(', ')}
                  </p>
                )}
                {role.isBridge && !role.derivedRole && (
                  <p className="insight-note family-role-special">✦ The Bridge: brings {role.node.data.element} energy no one else carries</p>
                )}
              </div>
            )}
          </div>
        )
      })}
      {trimmedCount > 0 && (
        <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
          + {trimmedCount} younger {trimmedCount === 1 ? 'member' : 'members'} (see full panel for all roles)
        </p>
      )}
    </div>
  )
}

// ── Sibling Dynamics ──────────────────────────────────────────────────────────

const SIBLING_ELEMENT_DYNAMIC = {
  'Fire-Fire':   'double fire. Passionate, competitive, and rarely boring together.',
  'Fire-Earth':  'fire meets earth. One ignites, the other grounds. Friction that builds something real.',
  'Fire-Air':    'fire and air fuel each other. Big ideas, fast energy, and natural creative spark.',
  'Fire-Water':  'fire and water make steam. Intense emotional dynamics but deep mutual growth.',
  'Earth-Earth': 'double earth. Shared practicality, stubbornness, and quiet strength.',
  'Earth-Air':   'earth and air speak different languages. One thinks, one does. Complementary when patient.',
  'Earth-Water': 'earth and water, nurturing ground. Emotional depth meets steady support.',
  'Air-Air':     'double air. Endless conversation, shared curiosity, and a world of ideas.',
  'Air-Water':   'air and water, mind meets heart. Can feel mismatched but balance each other beautifully.',
  'Water-Water': 'double water. Deep emotional bond, intuitive understanding, shared sensitivity.',
}

function getSiblingElementKey(el1, el2) {
  const order = ['Fire', 'Earth', 'Air', 'Water']
  const sorted = [el1, el2].sort((a, b) => order.indexOf(a) - order.indexOf(b))
  return sorted.join('-')
}

function SiblingDynamics({ siblingGroups, isExporting }) {
  const [expanded, setExpanded] = useState(null)
  if (siblingGroups.length === 0) return null
  return (
    <div className="insight-card" data-count={siblingGroups.length} data-label={siblingGroups.length === 1 ? 'group' : 'groups'}>
      <h3 className="insight-heading">Sibling Dynamics<span className="insight-pro-tag">✦</span></h3>
      <p className="insight-note" style={{ marginBottom: '0.5rem' }}>How siblings' cosmic wiring shapes the way they relate</p>
      {siblingGroups.map((group, gi) => {
        const isOpen = isExporting || expanded === gi
        const elements = group.children.map(n => n.data.element)
        const elCounts = {}
        elements.forEach(e => { elCounts[e] = (elCounts[e] || 0) + 1 })
        const modalities = group.children.map(n => SIGN_MODALITY[n.data.sign]).filter(Boolean)
        const modCounts = {}
        modalities.forEach(m => { modCounts[m] = (modCounts[m] || 0) + 1 })

        return (
          <div
            key={gi}
            className={`family-role-item${isOpen ? ' family-role-item--open' : ''}`}
            onClick={isExporting ? undefined : () => setExpanded(v => v === gi ? null : gi)}
          >
            <div className="family-role-header">
              <span className="family-role-symbol">{group.children.map(c => c.data.symbol).join(' ')}</span>
              <span className="family-role-name"><strong>{group.children.map(c => c.data.name).join(', ')}</strong></span>
              <span className="family-role-chevron">{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
              <div className="sibling-dynamics-body">
                {/* Element balance */}
                <div className="sibling-section">
                  <span className="sibling-section-label">Elements</span>
                  <p className="sibling-section-content">
                    {Object.entries(elCounts).map(([el, count], i) => (
                      <span key={el}>
                        {i > 0 && ' · '}
                        <span style={{ color: ELEMENT_COLORS[el] }}>{count > 1 ? `${count}× ` : ''}{el}</span>
                      </span>
                    ))}
                  </p>
                </div>

                {/* Pairwise element dynamics for small groups */}
                {group.children.length <= 4 && (() => {
                  const pairs = []
                  group.children.forEach((child, ci) =>
                    group.children.slice(ci + 1).forEach(other => {
                      const key = getSiblingElementKey(child.data.element, other.data.element)
                      const blurb = SIBLING_ELEMENT_DYNAMIC[key]
                      if (blurb) pairs.push({ child, other, blurb })
                    })
                  )
                  if (pairs.length === 0) return null
                  return (
                    <div className="sibling-section">
                      <span className="sibling-section-label">Dynamics</span>
                      {pairs.map(({ child, other, blurb }) => (
                        <p key={`${child.id}-${other.id}`} className="sibling-section-content">
                          <strong>{child.data.name} & {other.data.name}</strong>: {blurb}
                        </p>
                      ))}
                    </div>
                  )
                })()}

                {/* Group vibe — element balance + polarity + rhythm */}
                {group.children.length >= 2 && (() => {
                  const n = group.children.length
                  const parts = []

                  // Element balance
                  const elEntries = Object.entries(elCounts).sort((a, b) => b[1] - a[1])
                  const topEl = elEntries[0]
                  if (topEl[1] >= Math.ceil(n * 0.6) && n >= 2) {
                    parts.push(`Heavy on ${topEl[0]}: ${topEl[0] === 'Fire' ? 'high energy and competition' : topEl[0] === 'Earth' ? 'grounded and dependable together' : topEl[0] === 'Air' ? 'idea-driven and talkative' : 'emotionally attuned and intuitive'}.`)
                  } else if (elEntries.length >= 3 && elEntries[2][1] > 0) {
                    parts.push('An eclectic elemental mix. They stretch each other in different directions.')
                  } else if (elEntries.length === 2 && elEntries[1][1] > 0) {
                    const [a, b] = elEntries.map(e => e[0])
                    const PAIR_VIBE = {
                      'Fire+Earth': 'Ambition meets follow-through.',
                      'Fire+Air':   'Big ideas and the energy to chase them.',
                      'Fire+Water': 'Passion and sensitivity in tension.',
                      'Earth+Air':  'Practicality and imagination side by side.',
                      'Earth+Water':'Nurturing and reliable, a solid emotional core.',
                      'Air+Water':  'Head and heart in constant dialogue.',
                    }
                    const key = [a, b].sort().join('+')
                    if (PAIR_VIBE[key]) parts.push(PAIR_VIBE[key])
                  }

                  // Polarity — outward (fire/air) vs inward (earth/water)
                  const outward = (elCounts.Fire || 0) + (elCounts.Air || 0)
                  const inward = (elCounts.Earth || 0) + (elCounts.Water || 0)
                  if (outward > 0 && inward > 0 && Math.abs(outward - inward) <= 1) {
                    parts.push('Balanced between outward and inward energy.')
                  } else if (outward >= inward + 2) {
                    parts.push('Mostly outward energy: expressive, social, and action-oriented.')
                  } else if (inward >= outward + 2) {
                    parts.push('Mostly inward energy: reflective, steady, and emotionally deep.')
                  }

                  // Rhythm — how they approach change
                  const topMod = Object.entries(modCounts).sort((a, b) => b[1] - a[1])
                  if (topMod.length === 1 || (topMod[0] && topMod[0][1] > n / 2)) {
                    const m = topMod[0][0]
                    parts.push(m === 'Cardinal' ? 'Natural initiators who push each other to start things.' : m === 'Fixed' ? 'Steady and loyal, but watch for stubbornness standoffs.' : 'Highly adaptable together, flowing with change easily.')
                  } else if (topMod.length >= 3 && topMod[2][1] > 0) {
                    parts.push('A mix of starters, holders, and adapters, so all bases are covered.')
                  }

                  if (parts.length === 0) return null
                  return (
                    <div className="sibling-section">
                      <span className="sibling-section-label">Group Vibe</span>
                      <p className="sibling-section-content">{parts.slice(0, 2).join(' ')}</p>
                    </div>
                  )
                })()}

                {/* Moon sign emotional bond */}
                {group.children.filter(c => c.data.moonSign && c.data.moonSign !== 'Unknown').length >= 2 && (() => {
                  const moonEls = group.children
                    .filter(c => c.data.moonSign && c.data.moonSign !== 'Unknown')
                    .map(c => ({ name: c.data.name, moonSign: c.data.moonSign, moonEl: getElement(c.data.moonSign).element }))
                  const sameMoonEl = moonEls.filter((m, _, arr) => arr.filter(a => a.moonEl === m.moonEl).length > 1)
                  if (sameMoonEl.length < 2) return null
                  const el = sameMoonEl[0].moonEl
                  const names = [...new Set(sameMoonEl.map(m => m.name))].join(' & ')
                  return (
                    <div className="sibling-section">
                      <span className="sibling-section-label">Moon Bond</span>
                      <p className="sibling-section-content">
                        ☽ {names} share {el} moons, a similar emotional wavelength beneath the surface.
                      </p>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Cosmic Inheritance ──────────────────────────────────────────────────────────

function getPairBlurb(planet1, planet2, aspectName) {
  const key = [planet1, planet2].sort().join(':')
  const entry = ASPECT_PAIR_BLURB[key]
  if (!entry) return null
  const hard = new Set(['square', 'opposition'])
  const soft = new Set(['trine', 'sextile'])
  const tier = hard.has(aspectName) ? 'hard' : soft.has(aspectName) ? 'soft' : 'conj'
  return entry[tier] ?? entry.soft ?? entry.hard ?? null
}

function representativeAspect(members) {
  const hard = new Set(['square', 'opposition'])
  if (members.every(m => m.aspect === 'conjunction')) return 'conjunction'
  const hardCount = members.filter(m => hard.has(m.aspect)).length
  return hardCount >= members.length / 2 ? 'square' : 'trine'
}

/**
 * Given member IDs who share a pattern, find and order the parent-child chain.
 * Returns ordered chain [{id, name, node}] oldest → youngest, or null if no chain.
 */
function buildGenerationalChain(memberIds, nodes, edges) {
  const memberSet = new Set(memberIds)
  const relevant  = edges.filter(e =>
    e.data?.relationType === 'parent-child' &&
    memberSet.has(e.source) && memberSet.has(e.target)
  )
  if (relevant.length === 0) return null

  const members = nodes
    .filter(n => memberSet.has(n.id))
    .sort((a, b) => (a.data.birthdate || '9999').localeCompare(b.data.birthdate || '9999'))

  // Build undirected adjacency within the set
  const adj = new Set(relevant.flatMap(e => [`${e.source}|${e.target}`, `${e.target}|${e.source}`]))

  // Greedy walk from oldest to youngest
  const chain   = []
  const visited = new Set()
  let current   = members[0]
  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    chain.push(current)
    current = members.find(m => !visited.has(m.id) && adj.has(`${current.id}|${m.id}`))
  }

  return chain.length >= 2 ? chain : null
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InsightsPanel({ nodes, edges, onExport, exporting, onAddMore, onGoToTree, onEditFirst, onUpgrade, entitlements, chartTitle, insightsTab = 'insights', onInsightsTabChange, showDig, onShowDig, onCloseDig, authUser, onSignIn }) {
  const hasAdvanced = canAccess('advanced_insights', entitlements?.tier, entitlements?.config)
  const hasFullDig = canAccess('full_dig', entitlements?.tier, entitlements?.config)
  const hasFullCompat = canAccess('full_compatibility', entitlements?.tier, entitlements?.config)
  // Eras needs 2+ members with usable birth years to be worth showing
  const erasEligible = useMemo(() => extractEraMembers(nodes).length >= 2, [nodes])
  const [digExporting, setDigExporting] = useState(false)
  const [currentVisited, setCurrentVisited] = useState(false)
  if (insightsTab === 'current' && !currentVisited) setCurrentVisited(true)
  const panelRef = useRef(null)

  // Subnav scroll fade — remove the right-edge mask once user has scrolled to end
  useEffect(() => {
    const nav = panelRef.current?.querySelector('.insights-subnav')
    if (!nav) return
    const update = () => {
      const atEnd = nav.scrollWidth - nav.scrollLeft <= nav.clientWidth + 4
      nav.classList.toggle('subnav--at-end', atEnd)
    }
    update() // initial check: if all tabs fit, mask off immediately
    nav.addEventListener('scroll', update, { passive: true })
    return () => nav.removeEventListener('scroll', update)
  }, [erasEligible]) // re-run if the Eras tab appears/disappears

  // Inject toggle buttons into insight headings
  useEffect(() => {
    if (!panelRef.current) return
    const headings = panelRef.current.querySelectorAll('.insight-heading')
    headings.forEach(h => {
      if (h.querySelector('.insight-toggle')) return
      const toggle = document.createElement('span')
      toggle.className = 'insight-toggle'
      toggle.innerHTML = '<span class="insight-toggle-count"></span><span class="insight-toggle-arrow">▾</span>'
      h.appendChild(toggle)
    })
  })

  const isGroupOnly = edges.length > 0 && edges.every(e => {
    const t = e.data?.relationType
    return t === 'friend' || t === 'coworker'
  }) // step-parent, parent-child, sibling, spouse are all family types
  const hasFriendEdges = !isGroupOnly && edges.some(e => {
    const t = e.data?.relationType
    return t === 'friend' || t === 'coworker'
  })
  const panelTitle = isGroupOnly ? 'Group Insights' : 'Family Insights'
  const tooFewNodes = nodes.length < 2
  const noEdges = !tooFewNodes && edges.length === 0

  // ── Sun element breakdown (display only) ─────────────────────────────────────
  const elementCounts = Object.fromEntries(ELEMENTS.map(e => [e, 0]))
  nodes.forEach(n => {
    if (elementCounts[n.data.element] !== undefined) elementCounts[n.data.element]++
  })
  const sunDominant = ELEMENTS.reduce((a, b) => elementCounts[a] >= elementCounts[b] ? a : b)

  // ── Moon element breakdown (display only) ────────────────────────────────────
  const moonNodes = nodes.filter(n => n.data.moonSign && n.data.moonSign !== 'Unknown')
  const moonElementCounts = Object.fromEntries(ELEMENTS.map(e => [e, 0]))
  moonNodes.forEach(n => {
    const el = getElement(n.data.moonSign).element
    if (el && moonElementCounts[el] !== undefined) moonElementCounts[el]++
  })
  const moonDominant = moonNodes.length >= 2
    ? ELEMENTS.reduce((a, b) => moonElementCounts[a] >= moonElementCounts[b] ? a : b)
    : null

  // ── Group chart calculations (all planets, degree-based) ──────────────────────
  const PERSONAL_PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars']
  const groupElementMap = useMemo(() => collectiveElementMap(nodes, PERSONAL_PLANETS), [nodes])
  const groupHotspots = useMemo(() => findHotspots(nodes), [nodes])
  const groupGaps = useMemo(() => nodes.length >= 4 ? findGaps(nodes) : null, [nodes])
  const groupSaturnLines = useMemo(() => saturnLines(nodes), [nodes])
  const groupJupiterGifts = useMemo(() => jupiterGifts(nodes), [nodes])
  const groupSignMap = useMemo(() => allPlanetsBySign(nodes), [nodes])
  const groupRoles = useMemo(() => deriveRoles(nodes), [nodes])

  // ── Aspect thread patterns (shared natal aspects across family) ───────────────
  const aspectThreadData = useMemo(() => {
    const totalWithBirthdata = nodes.filter(n => n.data.birthdate).length
    if (totalWithBirthdata < 2) return { rareBonds: [], heredThreads: [], famSigs: [], totalCount: 0, totalWithBirthdata }

    const membersWithAspects = nodes
      .filter(n => Array.isArray(n.data.natalAspects) && n.data.natalAspects.length && n.data.birthdate)
      .map(n => {
        // Without birth time, Mercury position is uncertain (~±0.75°/day).
        // Moon is already excluded at compute time (calcNatalAspects). Apply the same logic here for Mercury.
        const aspects = n.data.birthTime
          ? n.data.natalAspects
          : n.data.natalAspects.filter(a => a.planet1.name !== 'Mercury' && a.planet2.name !== 'Mercury')
        return { id: n.id, name: n.data.name, aspects }
      })
      .filter(m => m.aspects.length > 0)

    if (membersWithAspects.length < 2) return { rareBonds: [], heredThreads: [], famSigs: [], totalCount: 0, totalWithBirthdata }

    const minPeople = totalWithBirthdata <= 4 ? 2 : 3
    const GLOBAL_BASELINE = {
      'Jupiter:Saturn': 0.56, 'Pluto:Sun': 0.50, 'Saturn:Sun': 0.44,
      'Neptune:Sun': 0.38, 'Moon:Pluto': 0.31, 'Jupiter:Neptune': 0.31,
      'Moon:Neptune': 0.25, 'Neptune:Saturn': 0.19,
    }
    function bKey(p1, p2) { return [p1, p2].sort().join(':') }
    function isWorthy(memberIds, p1, p2) {
      const count = memberIds.length
      const prop  = count / totalWithBirthdata
      if (count < minPeople || prop < 0.30) return false
      const baseline = GLOBAL_BASELINE[bKey(p1, p2)] ?? 0
      if (baseline > 0.50 && prop <= baseline) return false
      return true
    }

    const sharedContacts    = findSharedContacts(membersWithAspects)
    const hereditaryAspects = findHereditaryAspects(membersWithAspects)

    const rareBonds = hereditaryAspects
      .filter(p => p.members.filter(m => m.orb <= 0.5).length >= 2)
      .map(p => ({ ...p, blurb: getPairBlurb(p.planet1, p.planet2, p.members[0]?.aspect ?? 'conjunction'), chainNames: p.members.map(m => m.name).join(' and ') }))
      .slice(0, 3)

    const shownPairs = new Set(rareBonds.map(p => [p.planet1, p.planet2].sort().join(':')))

    const heredThreads = sharedContacts
      .filter(c => {
        const key = [c.planet1, c.planet2].sort().join(':')
        if (shownPairs.has(key)) return false
        return buildGenerationalChain(c.members.map(m => m.id), nodes, edges) !== null
      })
      .filter(c => c.members.length >= 2)
      .map(c => {
        const chain = buildGenerationalChain(c.members.map(m => m.id), nodes, edges)
        return {
          ...c,
          blurb:      getPairBlurb(c.planet1, c.planet2, representativeAspect(c.members)),
          chainNames: chain ? chain.map(n => n.data.name).join(' → ') : c.members.map(m => m.name).join(', '),
        }
      })
      .slice(0, 3)
    heredThreads.forEach(c => shownPairs.add([c.planet1, c.planet2].sort().join(':')))

    const famSigs = sharedContacts
      .filter(c => {
        if (shownPairs.has([c.planet1, c.planet2].sort().join(':'))) return false
        return isWorthy(c.members.map(m => m.id), c.planet1, c.planet2)
      })
      .map(c => ({ ...c, blurb: getPairBlurb(c.planet1, c.planet2, representativeAspect(c.members)), chainNames: c.members.map(m => m.name).join(', ') }))
      .slice(0, 5 - rareBonds.length - heredThreads.length)

    const totalCount = rareBonds.length + heredThreads.length + famSigs.length
    return { rareBonds, heredThreads, famSigs, totalCount, totalWithBirthdata }
  }, [nodes, edges]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Inner planet data (Mercury/Venus/Mars) ────────────────────────────────────
  const innerPlanetData = useMemo(() => {
    return nodes.map(n => ({
      node: n,
      ...(n.data?.innerPlanets ?? { mercury: { sign: null, symbol: '☿' }, venus: { sign: null, symbol: '♀' }, mars: { sign: null, symbol: '♂' } }),
    }))
  }, [nodes])

  const innerPlanetMap = useMemo(
    () => new Map(innerPlanetData.map(d => [d.node.id, d])),
    [innerPlanetData]
  )

  function getNodeElements(node) {
    const elements = new Set()
    if (node.data.element) elements.add(node.data.element)
    if (node.data.moonSign && node.data.moonSign !== 'Unknown') {
      const el = getElement(node.data.moonSign).element
      if (el) elements.add(el)
    }
    const inner = innerPlanetMap.get(node.id)
    if (inner?.mercury?.sign) { const el = getElement(inner.mercury.sign).element; if (el) elements.add(el) }
    if (inner?.venus?.sign)   { const el = getElement(inner.venus.sign).element;   if (el) elements.add(el) }
    if (inner?.mars?.sign)    { const el = getElement(inner.mars.sign).element;    if (el) elements.add(el) }
    return elements
  }

  function getNodePlanetsForElement(node, element) {
    const glyphs = []
    if (node.data.element === element) glyphs.push('☀')
    if (node.data.moonSign && node.data.moonSign !== 'Unknown' && getElement(node.data.moonSign).element === element) glyphs.push('☽')
    const inner = innerPlanetMap.get(node.id)
    if (inner?.mercury?.sign && getElement(inner.mercury.sign).element === element) glyphs.push('☿')
    if (inner?.venus?.sign   && getElement(inner.venus.sign).element   === element) glyphs.push('♀')
    if (inner?.mars?.sign    && getElement(inner.mars.sign).element    === element) glyphs.push('♂')
    return glyphs.join(' ')
  }

  // ── Synastry helpers ──────────────────────────────────────────────────────────
  // (extractPlanetPositions lives in treeHelpers.js; blurbs in insightsData.js)
  const PERSONAL_SET = new Set(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'])

  function buildCoupleAnalysis(src, tgt) {
    const srcMoon   = src.data.moonSign && src.data.moonSign !== 'Unknown' ? src.data.moonSign : null
    const tgtMoon   = tgt.data.moonSign && tgt.data.moonSign !== 'Unknown' ? tgt.data.moonSign : null
    const srcInn    = innerPlanetMap.get(src.id)
    const tgtInn    = innerPlanetMap.get(tgt.id)
    const srcVenus  = srcInn?.venus?.sign ?? null
    const tgtVenus  = tgtInn?.venus?.sign ?? null
    const srcMars   = srcInn?.mars?.sign  ?? null
    const tgtMars   = tgtInn?.mars?.sign  ?? null

    const insights = []

    // Sun-Moon reflection — highest priority
    const aSunBMoon = tgtMoon === src.data.sign
    const bSunAMoon = srcMoon === tgt.data.sign
    if (aSunBMoon && bSunAMoon) {
      insights.push({ score: 10, tagline: 'Rare Mirror Bond', color: 'var(--gold)',
        text: `${src.data.name}'s ${src.data.sign} sun falls on ${tgt.data.name}'s moon, and ${tgt.data.name}'s ${tgt.data.sign} sun falls on ${src.data.name}'s. They each embody what the other feels most deeply. Extraordinarily rare.` })
    } else if (aSunBMoon) {
      insights.push({ score: 8, tagline: 'Sun-Moon Connection', color: '#c4a8d4',
        text: `${src.data.name}'s ${src.data.sign} sun falls on ${tgt.data.name}'s moon. ${src.data.name} naturally embodies what ${tgt.data.name} feels most deeply.` })
    } else if (bSunAMoon) {
      insights.push({ score: 8, tagline: 'Sun-Moon Connection', color: '#c4a8d4',
        text: `${tgt.data.name}'s ${tgt.data.sign} sun falls on ${src.data.name}'s moon. ${tgt.data.name} naturally embodies what ${src.data.name} feels most deeply.` })
    }

    // Venus in partner's sun sign — deep admiration
    if (srcVenus && srcVenus === tgt.data.sign)
      insights.push({ score: 7, tagline: 'Venus Connection', color: 'var(--rose)',
        text: `${src.data.name}'s Venus is in ${tgt.data.sign}. ${src.data.name} is drawn to exactly who ${tgt.data.name} is.` })
    if (tgtVenus && tgtVenus === src.data.sign)
      insights.push({ score: 7, tagline: 'Venus Connection', color: 'var(--rose)',
        text: `${tgt.data.name}'s Venus is in ${src.data.sign}. ${tgt.data.name} is drawn to exactly who ${src.data.name} is.` })

    // Same moon sign — emotional twins
    if (srcMoon && tgtMoon && srcMoon === tgtMoon)
      insights.push({ score: 7, tagline: 'Emotional Twins', color: '#9dbbd4',
        text: `Both ${srcMoon} moons. They tend to feel and process in similar ways, a shared emotional rhythm.` })

    // Same Venus sign — identical love language
    if (srcVenus && tgtVenus && srcVenus === tgtVenus)
      insights.push({ score: 6, tagline: 'Same Love Language', color: 'var(--rose)',
        text: `Both Venus in ${srcVenus}. They show love the same way and want the same things from each other.` })

    // Compatible moons (different signs)
    if (srcMoon && tgtMoon && srcMoon !== tgtMoon) {
      const compat = areCompatible(getElement(srcMoon).element, getElement(tgtMoon).element)
      if (compat)
        insights.push({ score: 5, tagline: 'Emotionally Attuned', color: '#9dbbd4',
          text: `${srcMoon} and ${tgtMoon} moons, compatible emotional styles. ${src.data.name} ${MOON_STYLE[srcMoon] ?? ''}; ${tgt.data.name} ${MOON_STYLE[tgtMoon] ?? ''}.` })
      else
        insights.push({ score: 2, tagline: 'Different Emotional Rhythms', color: '#c9a84c',
          text: `${srcMoon} and ${tgtMoon} moons, they process feelings differently. ${src.data.name} ${MOON_STYLE[srcMoon] ?? ''}; ${tgt.data.name} ${MOON_STYLE[tgtMoon] ?? ''}.` })
    }

    // Mars ↔ Venus elemental pull
    if (srcMars && tgtVenus && areCompatible(getElement(srcMars).element, getElement(tgtVenus).element))
      insights.push({ score: 4, tagline: 'Natural Pull', color: 'var(--rose)',
        text: `${src.data.name}'s ${srcMars} Mars aligns with ${tgt.data.name}'s ${tgtVenus} Venus. A natural attraction dynamic.` })
    else if (tgtMars && srcVenus && areCompatible(getElement(tgtMars).element, getElement(srcVenus).element))
      insights.push({ score: 4, tagline: 'Natural Pull', color: 'var(--rose)',
        text: `${tgt.data.name}'s ${tgtMars} Mars aligns with ${src.data.name}'s ${srcVenus} Venus. A natural attraction dynamic.` })

    // Growth edge — where this pair may need to stretch
    let growthEdge = null
    if (srcMoon && tgtMoon && srcMoon !== tgtMoon) {
      const srcMoonEl = getElement(srcMoon).element
      const tgtMoonEl = getElement(tgtMoon).element
      if (!areCompatible(srcMoonEl, tgtMoonEl)) {
        const GROWTH_EDGES = {
          'Fire-Water': 'One tends to act on feelings quickly, the other needs time to sit with them. Meeting in the middle may take patience from both sides.',
          'Fire-Earth': 'One moves on instinct, the other needs a plan. They may need to take turns setting the pace.',
          'Air-Water': 'One processes through talking, the other through feeling. They may need to learn each other\'s emotional language.',
          'Air-Earth': 'One lives in ideas, the other in what\'s tangible. Finding common ground may mean translating between the two.',
        }
        const key = [srcMoonEl, tgtMoonEl].sort().join('-')
        growthEdge = GROWTH_EDGES[key] || null
      }
    }
    // Fallback: sun element clash with no moon data
    if (!growthEdge && !areCompatible(src.data.element, tgt.data.element)) {
      const SUNEDGE = {
        'Fire-Water': 'Fire\'s directness and Water\'s sensitivity may sometimes clash. Patience with each other\'s pace tends to help.',
        'Fire-Earth': 'Fire\'s spontaneity and Earth\'s caution can create friction. They may do best when they take turns leading.',
        'Air-Water': 'Air\'s detachment and Water\'s depth can feel like different languages. Checking in rather than assuming tends to help.',
        'Air-Earth': 'Air\'s restlessness and Earth\'s need for stability can create tension. Both may benefit from honoring what the other needs.',
      }
      const key = [src.data.element, tgt.data.element].sort().join('-')
      growthEdge = SUNEDGE[key] || null
    }

    // ── Cross-chart (synastry) aspects — tight orb, personal planet required ──
    const synastryAspects = []
    const srcPlanets = extractPlanetPositions(src)
    const tgtPlanets = extractPlanetPositions(tgt)
    if (srcPlanets.length >= 3 && tgtPlanets.length >= 3) {
      const hasBtA = !!src.data.birthTime
      const hasBtB = !!tgt.data.birthTime
      const crossAspects = calcCrossAspects(srcPlanets, tgtPlanets, hasBtA, hasBtB)
      // Filter: ≤3° orb, at least one personal planet, skip same-planet generational
      const qualifying = crossAspects.filter(a => {
        if (a.orb > 3) return false
        const hasPersonal = PERSONAL_SET.has(a.personA.name) || PERSONAL_SET.has(a.personB.name)
        if (!hasPersonal) return false
        // Skip if both are the same outer planet (generational)
        if (a.personA.name === a.personB.name && !PERSONAL_SET.has(a.personA.name)) return false
        // Skip uncertain aspects
        if (a.confidence === 'uncertain') return false
        return true
      })
      // Prioritize: Venus/Mars > Sun/Moon > others
      const priority = (a) => {
        const names = [a.personA.name, a.personB.name]
        if (names.includes('Venus') && names.includes('Mars')) return 0
        if (names.includes('Venus') || names.includes('Mars')) return 1
        if (names.includes('Sun') || names.includes('Moon')) return 2
        return 3
      }
      qualifying.sort((a, b) => priority(a) - priority(b) || a.orb - b.orb)
      for (const a of qualifying.slice(0, 2)) {
        const blurb = getSynastryBlurb(a.personA.name, a.personB.name, a.aspect)
        if (blurb) {
          const symbol = { conjunction: '☌', opposition: '☍', trine: '△', square: '□', sextile: '⚹' }[a.aspect] || ''
          synastryAspects.push(`${ASPECT_PLANET_GLYPHS[a.personA.name] || ''} ${a.personA.name} ${symbol} ${ASPECT_PLANET_GLYPHS[a.personB.name] || ''} ${a.personB.name} (${a.orb}°) — ${blurb}`)
        }
      }
    }

    if (insights.length === 0) {
      const compat = areCompatible(src.data.element, tgt.data.element)
      return { tagline: compat ? 'Harmonious' : 'Complementary', taglineColor: compat ? '#7ec845' : '#c9a84c', narrativeItems: [], growthEdge, synastryAspects }
    }

    insights.sort((a, b) => b.score - a.score)
    const top = insights.slice(0, 2)
    return { tagline: top[0].tagline, taglineColor: top[0].color, narrativeItems: top.map(i => i.text), growthEdge, synastryAspects }
  }

  // ── Per-node warned planets — a planet is excluded if ingress + no birth time ─
  const warningsPerNode = useMemo(() => {
    const map = new Map()
    nodes.forEach(n => {
      const ws = n.data?.ingressWarnings ?? []
      map.set(n.id, new Set(ws.map(w => w.planet)))
    })
    return map
  }, [nodes])

  // ── All-planet element/modality/polarity — for Family Signature ───────────────
  // Counts each definite planet contribution (skips planet if ingress+no birth time)
  const allPlanetCounts = useMemo(() => {
    const elC  = Object.fromEntries(ELEMENTS.map(e => [e, 0]))
    const modC = { Cardinal: 0, Fixed: 0, Mutable: 0 }
    let masc = 0, fem = 0
    nodes.forEach(n => {
      const warned = warningsPerNode.get(n.id) ?? new Set()
      const inner  = innerPlanetData.find(d => d.node.id === n.id)
      const candidates = [
        { planet: 'sun',     sign: n.data.sign },
        { planet: 'moon',    sign: (n.data.moonSign && n.data.moonSign !== 'Unknown') ? n.data.moonSign : null },
        { planet: 'mercury', sign: inner?.mercury?.sign ?? null },
        { planet: 'venus',   sign: inner?.venus?.sign   ?? null },
        { planet: 'mars',    sign: inner?.mars?.sign    ?? null },
      ]
      candidates.forEach(({ planet, sign }) => {
        if (!sign || warned.has(planet)) return
        const el  = getElement(sign).element
        const mod = SIGN_MODALITY[sign]
        const pol = POLARITY_GROUP[el]
        if (el && elC[el] !== undefined) elC[el]++
        if (mod) modC[mod]++
        if (pol === 'Masculine') masc++
        else if (pol === 'Feminine') fem++
      })
    })
    return { elC, modC, masc, fem }
  }, [nodes, warningsPerNode, innerPlanetData])

  // ── Dominant sign by total planet count ──────────────────────────────────────
  const signPlanetTotals = useMemo(() => {
    const counts = {}
    nodes.forEach(n => {
      const warned = warningsPerNode.get(n.id) ?? new Set()
      const inner  = innerPlanetMap.get(n.id)
      const candidates = [
        { planet: 'sun',     sign: n.data.sign },
        { planet: 'moon',    sign: (n.data.moonSign && n.data.moonSign !== 'Unknown') ? n.data.moonSign : null },
        { planet: 'mercury', sign: inner?.mercury?.sign ?? null },
        { planet: 'venus',   sign: inner?.venus?.sign   ?? null },
        { planet: 'mars',    sign: inner?.mars?.sign    ?? null },
      ]
      candidates.forEach(({ planet, sign }) => {
        if (!sign || warned.has(planet)) return
        if (!counts[sign]) counts[sign] = { total: 0, planets: {} }
        counts[sign].total++
        counts[sign].planets[planet] = (counts[sign].planets[planet] || 0) + 1
      })
    })
    return counts
  }, [nodes, warningsPerNode, innerPlanetMap])

  const topSigns = useMemo(() => {
    const sorted = Object.entries(signPlanetTotals)
      .filter(([, v]) => v.total >= 2)
      .sort((a, b) => b[1].total - a[1].total)
    if (!sorted.length) return []
    const top = [sorted[0]]
    if (sorted[1] && sorted[0][1].total - sorted[1][1].total <= 1) top.push(sorted[1])
    return top
  }, [signPlanetTotals])

  const dominant        = ELEMENTS.reduce((a, b) => allPlanetCounts.elC[a] >= allPlanetCounts.elC[b] ? a : b)
  const dominantModality = Object.entries(allPlanetCounts.modC).reduce((a, b) => b[1] > a[1] ? b : a)[0]
  const masculine       = allPlanetCounts.masc
  const feminine        = allPlanetCounts.fem
  const total           = masculine + feminine
  const missingElements = ELEMENTS.filter(el => allPlanetCounts.elC[el] === 0)

  // ── Shared sun signs ─────────────────────────────────────────────────────────
  const signCounts = {}
  nodes.forEach(n => { signCounts[n.data.sign] = (signCounts[n.data.sign] || 0) + 1 })
  const sharedSigns = Object.entries(signCounts)
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])

  // ── Shared moon signs ─────────────────────────────────────────────────────────
  const moonSignCounts = {}
  moonNodes.forEach(n => { moonSignCounts[n.data.moonSign] = (moonSignCounts[n.data.moonSign] || 0) + 1 })
  // 2 of 5 people sharing a moon sign happens by chance well over half the
  // time — only 3+ is a pattern worth naming
  const sharedMoonSigns = Object.entries(moonSignCounts)
    .filter(([, c]) => c > 2)
    .sort((a, b) => b[1] - a[1])

  function sharedInnerSign(planet) {
    const counts = {}
    innerPlanetData.forEach(d => {
      const sign = d[planet]?.sign
      if (sign) counts[sign] = (counts[sign] || 0) + 1
    })
    return Object.entries(counts)
      .filter(([, c]) => c > 2) // 3+ people, same reasoning as shared moons
      .sort((a, b) => b[1] - a[1])
      .map(([sign]) => ({
        sign,
        symbol: innerPlanetData.find(d => d[planet]?.sign === sign)?.[planet]?.symbol,
        members: innerPlanetData
          .filter(d => d[planet]?.sign === sign)
          .map(d => d.node)
          .sort(byAge),
      }))
  }

  const sharedVenusSigns = sharedInnerSign('venus')
  const sharedMarsSigns  = sharedInnerSign('mars')

  // ── Couple / partner compatibility ──────────────────────────────────────────
  const spouseEdges = edges.filter(e => e.data?.relationType === 'spouse')
  const couples = spouseEdges
    .map(e => {
      const src = nodes.find(n => n.id === e.source)
      const tgt = nodes.find(n => n.id === e.target)
      if (!src || !tgt) return null
      return { src, tgt, compatible: areCompatible(src.data.element, tgt.data.element) }
    })
    .filter(Boolean)

  // ── Build child→parents map ──────────────────────────────────────────────────
  const parentChildEdges = edges.filter(e => e.data?.relationType === 'parent-child' || e.data?.relationType === 'step-parent')
  const parentMap = {}
  parentChildEdges.forEach(e => {
    if (!parentMap[e.target]) parentMap[e.target] = []
    parentMap[e.target].push(e.source)
  })

  // ── Generation depth (0 = root/oldest, 1 = children, 2 = grandchildren…) ────
  const generationLevel = {}
  ;(function computeGenLevels() {
    function level(nodeId, visited = new Set()) {
      if (visited.has(nodeId)) return 0
      if (generationLevel[nodeId] !== undefined) return generationLevel[nodeId]
      visited.add(nodeId)
      const parents = parentMap[nodeId] || []
      generationLevel[nodeId] = parents.length === 0
        ? 0
        : Math.max(...parents.map(pid => level(pid, new Set(visited)))) + 1
      return generationLevel[nodeId]
    }
    nodes.forEach(n => level(n.id))
  })()

  function getLongestChain(nodeId, keyFn, keyValue, visited = new Set()) {
    if (visited.has(nodeId)) return []
    visited.add(nodeId)
    const node = nodes.find(n => n.id === nodeId)
    if (!node || keyFn(node) !== keyValue) return []
    let bestParent = []
    for (const pid of (parentMap[nodeId] || [])) {
      const chain = getLongestChain(pid, keyFn, keyValue, new Set(visited))
      if (chain.length > bestParent.length) bestParent = chain
    }
    return bestParent.length > 0 ? [...bestParent, node] : [node]
  }
  function getLongestChainWhere(nodeId, predicate, visited = new Set()) {
    if (visited.has(nodeId)) return []
    visited.add(nodeId)
    const node = nodes.find(n => n.id === nodeId)
    if (!node || !predicate(node)) return []
    let bestParent = []
    for (const pid of (parentMap[nodeId] || [])) {
      const chain = getLongestChainWhere(pid, predicate, new Set(visited))
      if (chain.length > bestParent.length) bestParent = chain
    }
    return bestParent.length > 0 ? [...bestParent, node] : [node]
  }
  function getNodeSigns(node) {
    const signs = new Set()
    if (node.data.sign) signs.add(node.data.sign)
    if (node.data.moonSign && node.data.moonSign !== 'Unknown') signs.add(node.data.moonSign)
    const inner = innerPlanetData.find(d => d.node.id === node.id)
    if (inner?.mercury?.sign) signs.add(inner.mercury.sign)
    if (inner?.venus?.sign)   signs.add(inner.venus.sign)
    if (inner?.mars?.sign)    signs.add(inner.mars.sign)
    return signs
  }

  // ── Sign threads: sun + moon only (inner planets too noisy) ─────────────────
  function longestThreadFor(nodePredicate, pool = nodes) {
    const threads = {}
    const signs = new Set(pool.map(nodePredicate).filter(Boolean))
    signs.forEach(sign => {
      let longest = []
      pool.forEach(n => {
        const chain = getLongestChainWhere(n.id, x => nodePredicate(x) === sign, new Set())
        if (chain.length >= 2 && chain.length > longest.length) longest = chain
      })
      if (longest.length >= 2) threads[sign] = longest
    })
    return threads
  }
  const sunSignThreads  = longestThreadFor(n => n.data.sign)
  const moonSignThreads = longestThreadFor(
    n => (n.data.moonSign && n.data.moonSign !== 'Unknown') ? n.data.moonSign : null,
    moonNodes
  )
  // Merge, sort by chain length descending, cap at 6 to avoid clutter
  const signThreadList = [
    ...Object.entries(sunSignThreads).map(([sign, chain]) => ({ sign, chain, planet: 'sun' })),
    ...Object.entries(moonSignThreads).map(([sign, chain]) => ({ sign, chain, planet: 'moon' })),
  ].sort((a, b) => b.chain.length - a.chain.length).slice(0, 6)

  // ── Zodiac threads — same sign across generations via any planet ─────────────
  // Notable = spans 3+ generations OR 4+ connected carriers.
  // Capped at top 3 by depth then count.
  const ALL_SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
  function getSignPlanetGlyphs(node, sign) {
    const g = []
    if (node.data.sign === sign) g.push('☀')
    if (node.data.moonSign && node.data.moonSign !== 'Unknown' && node.data.moonSign === sign) g.push('☽')
    const inner = innerPlanetMap.get(node.id)
    if (inner?.mercury?.sign === sign) g.push('☿')
    if (inner?.venus?.sign   === sign) g.push('♀')
    if (inner?.mars?.sign    === sign) g.push('♂')
    return g.join('')
  }
  const topZodiacThreads = (() => {
    const threads = []
    ALL_SIGNS.forEach(sign => {
      const carriers = nodes.filter(n => getNodeSigns(n).has(sign))
      if (carriers.length < 2) return
      const hasLink = carriers.some(n =>
        (parentMap[n.id] || []).some(pid => carriers.find(c => c.id === pid))
      )
      if (!hasLink) return
      const byGen = {}
      carriers.forEach(n => {
        const gen = generationLevel[n.id] ?? 0
        if (!byGen[gen]) byGen[gen] = []
        byGen[gen].push(n)
      })
      const gens = Object.keys(byGen).map(Number).sort()
      if (gens.length < 2) return
      const total = carriers.length
      if (gens.length >= 3 || total >= 4) threads.push({ sign, byGen, gens, total })
    })
    return threads.sort((a, b) => b.gens.length - a.gens.length || b.total - a.total).slice(0, 3)
  })()

  // ── Sibling / cousin sets ────────────────────────────────────────────────────
  const childrenByParent = {}
  parentChildEdges.forEach(e => {
    if (!childrenByParent[e.source]) childrenByParent[e.source] = []
    childrenByParent[e.source].push(e.target)
  })
  const siblingKeys = new Set()
  Object.values(childrenByParent).forEach(children => {
    for (let i = 0; i < children.length; i++)
      for (let j = i + 1; j < children.length; j++)
        siblingKeys.add([children[i], children[j]].sort().join('|'))
  })
  // Also include explicit sibling edges (siblings added without parents)
  edges.filter(e => e.data?.relationType === 'sibling').forEach(e => {
    siblingKeys.add([e.source, e.target].sort().join('|'))
  })
  const cousinKeys = new Set()
  ;[...siblingKeys].forEach(sibKey => {
    const [pA, pB] = sibKey.split('|')
    ;(childrenByParent[pA] || []).forEach(ca =>
      (childrenByParent[pB] || []).forEach(cb => {
        const k = [ca, cb].sort().join('|')
        if (!siblingKeys.has(k)) cousinKeys.add(k)
      })
    )
  })
  // Grandparent-grandchild: parent's parent → grandchild
  const grandparentKeys = new Set()
  const grandparentDirected = [] // preserve direction for great-grand calculation
  parentChildEdges.forEach(e => {
    ;(childrenByParent[e.target] || []).forEach(gc => {
      grandparentKeys.add([e.source, gc].sort().join('|'))
      grandparentDirected.push({ gp: e.source, gc })
    })
  })
  // Great-grandparent: use directed pairs so gc is always the true grandchild
  const greatGrandKeys = new Set()
  grandparentDirected.forEach(({ gp, gc }) => {
    ;(childrenByParent[gc] || []).forEach(ggc => {
      greatGrandKeys.add([gp, ggc].sort().join('|'))
    })
  })

  // ── Notable bonds ────────────────────────────────────────────────────────────
  const shownKeys = new Set()
  parentChildEdges.forEach(e => shownKeys.add([e.source, e.target].sort().join('|')))
  spouseEdges.forEach(e => shownKeys.add([e.source, e.target].sort().join('|')))
  edges.filter(e => e.data?.relationType === 'sibling').forEach(e => shownKeys.add([e.source, e.target].sort().join('|')))

  const notableBonds = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]
      const key = pairKey(a, b)
      if (shownKeys.has(key)) continue

      const aMoon   = a.data.moonSign && a.data.moonSign !== 'Unknown' ? a.data.moonSign : null
      const bMoon   = b.data.moonSign && b.data.moonSign !== 'Unknown' ? b.data.moonSign : null
      const aInner  = innerPlanetMap.get(a.id)
      const bInner  = innerPlanetMap.get(b.id)
      const aVenus  = aInner?.venus?.sign  ?? null
      const bVenus  = bInner?.venus?.sign  ?? null
      const aMars   = aInner?.mars?.sign   ?? null
      const bMars   = bInner?.mars?.sign   ?? null

      const sameSun    = a.data.sign === b.data.sign
      const sameMoon   = !!(aMoon && bMoon && aMoon === bMoon)
      const sameVenus  = !!(aVenus && bVenus && aVenus === bVenus)
      const sameMars   = !!(aMars && bMars && aMars === bMars)
      const isOpposite = OPPOSITE_SIGNS[a.data.sign] === b.data.sign
      const compatElem = areCompatible(a.data.element, b.data.element)
      const isSibling  = siblingKeys.has(key)
      const isCousin   = cousinKeys.has(key)
      const aSunBMoon  = !!(bMoon && bMoon === a.data.sign)
      const bSunAMoon  = !!(aMoon && aMoon === b.data.sign)

      // Count planet matches across all four personal planets
      const matchedPlanets = []
      if (sameSun)   matchedPlanets.push(`${a.data.symbol} ${a.data.sign} ☀`)
      if (sameMoon)  matchedPlanets.push(`☽ ${aMoon}`)
      if (sameVenus) matchedPlanets.push(`♀ ${aVenus}`)
      if (sameMars)  matchedPlanets.push(`♂ ${aMars}`)

      let score = 0, note = '', noteType = ''

      if (matchedPlanets.length >= 3) {
        // Rare multi-planet alignment — highest tier
        const is4 = matchedPlanets.length === 4
        score    = is4 ? 25 : 20
        noteType = is4 ? 'cosmic-echo' : 'rare-alignment'
        const label = is4
          ? 'all four personal planets in the same signs, an unusually close match'
          : 'three planets aligned, a notably uncommon bond'
        note = `${matchedPlanets.join(' · ')}: ${label}`
      } else if (sameSun && sameMoon) {
        score = 12; noteType = 'soul-twins'
        note = `Both ${a.data.symbol} ${a.data.sign} ☀ & ☽ ${aMoon} moon: soul twins`
      } else if (sameSun) {
        score = 10; noteType = 'cosmic-twins'
        note = `Both ${a.data.symbol} ${a.data.sign} ☀: cosmic twins`
      } else if (sameMoon) {
        score = 9; noteType = 'lunar-bond'
        note = `Both ☽ ${aMoon} moon: lunar bond`
      } else if (isOpposite) {
        score = 8; noteType = 'mirror'
        note = `${a.data.symbol} ${a.data.sign} & ${b.data.symbol} ${b.data.sign}: mirror signs`
      } else if (aSunBMoon) {
        score = 7; noteType = 'sun-moon-reflection'
        note = `${a.data.symbol} ${a.data.sign} ☀ meets ${b.data.name}'s ☽ ${bMoon} moon`
      } else if (bSunAMoon) {
        score = 7; noteType = 'sun-moon-reflection'
        note = `${b.data.symbol} ${b.data.sign} ☀ meets ${a.data.name}'s ☽ ${aMoon} moon`
      } else if (compatElem && (isSibling || isCousin)) {
        score = 5; noteType = 'natural-flow'
        note = `${a.data.element} & ${b.data.element}: natural flow`
      }
      if (score === 0) continue
      const rel = isSibling ? 'siblings' : isCousin ? 'cousins' : ''
      const moonWarnA  = warningsPerNode.get(a.id)?.has('moon')  ?? false
      const moonWarnB  = warningsPerNode.get(b.id)?.has('moon')  ?? false
      const venusWarnA = warningsPerNode.get(a.id)?.has('venus') ?? false
      const venusWarnB = warningsPerNode.get(b.id)?.has('venus') ?? false
      const marsWarnA  = warningsPerNode.get(a.id)?.has('mars')  ?? false
      const marsWarnB  = warningsPerNode.get(b.id)?.has('mars')  ?? false
      const needsTimeCheck =
        (sameMoon  && (moonWarnA || moonWarnB)) ||
        ((aSunBMoon || bSunAMoon) && (moonWarnA || moonWarnB)) ||
        (sameVenus && (venusWarnA || venusWarnB)) ||
        (sameMars  && (marsWarnA  || marsWarnB))
      notableBonds.push({ a, b, score, note, noteType, rel, needsTimeCheck })
    }
  }
  notableBonds.sort((x, y) => y.score - x.score)
  const topBonds = notableBonds.slice(0, 5)

  // ── All compat pairs (Feature 2) ─────────────────────────────────────────────
  const spouseEdgeSet      = new Set(spouseEdges.map(e => [e.source, e.target].sort().join('|')))
  const parentChildEdgeSet = new Set(parentChildEdges.map(e => [e.source, e.target].sort().join('|')))
  const friendEdgeSet      = new Set(edges.filter(e => e.data?.relationType === 'friend').map(e => [e.source, e.target].sort().join('|')))
  const coworkerEdgeSet    = new Set(edges.filter(e => e.data?.relationType === 'coworker').map(e => [e.source, e.target].sort().join('|')))

  const allCompatPairs = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]
      const key = pairKey(a, b)
      let relationLabel = 'extended family'
      if (spouseEdgeSet.has(key))            relationLabel = 'partners'
      else if (parentChildEdgeSet.has(key))  relationLabel = 'parent & child'
      else if (siblingKeys.has(key))         relationLabel = 'siblings'
      else if (cousinKeys.has(key))          relationLabel = 'cousins'
      else if (greatGrandKeys.has(key))      relationLabel = 'great-grandparent & great-grandchild'
      else if (grandparentKeys.has(key))     relationLabel = 'grandparent & grandchild'
      else if (friendEdgeSet.has(key))       relationLabel = 'friends'
      else if (coworkerEdgeSet.has(key))     relationLabel = 'coworkers'

      const aMoon  = a.data.moonSign && a.data.moonSign !== 'Unknown' ? a.data.moonSign : null
      const bMoon  = b.data.moonSign && b.data.moonSign !== 'Unknown' ? b.data.moonSign : null
      const aInn   = innerPlanetMap.get(a.id)
      const bInn   = innerPlanetMap.get(b.id)
      const aVenus = aInn?.venus?.sign ?? null
      const bVenus = bInn?.venus?.sign ?? null
      const aMars  = aInn?.mars?.sign  ?? null
      const bMars  = bInn?.mars?.sign  ?? null

      const sameSun    = a.data.sign === b.data.sign
      const sameMoon   = !!(aMoon && bMoon && aMoon === bMoon)
      const sameVenus  = !!(aVenus && bVenus && aVenus === bVenus)
      const sameMars   = !!(aMars && bMars && aMars === bMars)
      const oppSun     = OPPOSITE_SIGNS[a.data.sign] === b.data.sign
      const sameEl     = a.data.element === b.data.element
      const compatEl   = areCompatible(a.data.element, b.data.element)
      const sunMoonMirror = !!(aMoon && aMoon === b.data.sign) || !!(bMoon && bMoon === a.data.sign)

      const matchCount = [sameSun, sameMoon, sameVenus, sameMars].filter(Boolean).length

      let score, compatLabel, color, moonNote = null
      if (matchCount >= 4) {
        score = 11; compatLabel = 'Cosmic Echo'; color = 'var(--gold)'
      } else if (matchCount === 3) {
        score = 10; compatLabel = 'Rare Triple Alignment'; color = 'var(--gold)'
      } else if (sameSun && sameMoon) {
        score = 8; compatLabel = 'Soul Twins'; color = 'var(--gold)'
      } else if (sameSun) {
        score = 6; compatLabel = 'Cosmic Twins'; color = 'var(--gold)'
        if (aMoon && bMoon) moonNote = `Different moons: ☽ ${aMoon} & ☽ ${bMoon}`
      } else if (oppSun) {
        score = 5; compatLabel = 'Mirror Signs'; color = 'var(--rose)'
        if (sameMoon) moonNote = `Same ☽ ${aMoon} moon, an emotional mirror too`
      } else if (sameMoon) {
        score = 4; compatLabel = 'Lunar Bond'; color = '#9dbbd4'
      } else if (sunMoonMirror) {
        score = 3; compatLabel = 'Sun-Moon Reflection'; color = '#c4a8d4'
      } else if (sameEl) {
        score = 2; compatLabel = 'Kindred Spirits'; color = ELEMENT_COLORS[a.data.element]
      } else {
        score = 0; compatLabel = 'Unique Dynamic'; color = 'var(--text-muted)'
      }
      if (score >= 3) {
        // Flag pairs where a contributing planet may be uncertain due to missing birth time
        const warnA = warningsPerNode.get(a.id) ?? new Set()
        const warnB = warningsPerNode.get(b.id) ?? new Set()
        const needsTimeCheck = (
          (sameMoon        && (warnA.has('moon')  || warnB.has('moon')))  ||
          (sameVenus       && (warnA.has('venus') || warnB.has('venus'))) ||
          (sameMars        && (warnA.has('mars')  || warnB.has('mars')))  ||
          (sunMoonMirror   && (warnA.has('moon')  || warnB.has('moon')))
        )
        // Build readable list of what they share
        const sharedPlacements = []
        if (sameSun)        sharedPlacements.push(`☀ ${a.data.sign} Sun`)
        if (sameMoon)       sharedPlacements.push(`☽ ${aMoon} Moon`)
        if (sameVenus)      sharedPlacements.push(`♀ ${aVenus} Venus`)
        if (sameMars)       sharedPlacements.push(`♂ ${aMars} Mars`)
        if (oppSun)         sharedPlacements.push(`☀ ${a.data.sign} ↔ ${b.data.sign}`)
        if (sunMoonMirror && !sameSun && !sameMoon) {
          const who = aMoon === b.data.sign
            ? `${a.data.name}'s ☽ Moon = ${b.data.name}'s ☀ Sun`
            : `${b.data.name}'s ☽ Moon = ${a.data.name}'s ☀ Sun`
          sharedPlacements.push(who)
        }
        allCompatPairs.push({ a, b, relationLabel, score, compatLabel, color, moonNote, needsTimeCheck, sharedPlacements })
      }
    }
  }
  allCompatPairs.sort((x, y) => y.score - x.score || (x.a.data.birthdate || '9999').localeCompare(y.a.data.birthdate || '9999'))

  // Select mode for large families: only show the most meaningful pairs.
  // Common tiers (Lunar Bond, Mirror Signs) only show for pairs with an
  // actual relationship line — base rates are high enough that unrelated
  // member pairs match constantly.
  const relatedPairKeys = new Set(edges.map(e => [e.source, e.target].sort().join('|')))
  const isRelatedPair = p => relatedPairKeys.has([p.a.id, p.b.id].sort().join('|'))
  const isSelectMode = allCompatPairs.length > 12
  const compatDisplayPairs = isSelectMode
    ? allCompatPairs.filter(p => p.score >= 6)
    : allCompatPairs.filter(p => p.score >= 6 || (p.score >= 4 && isRelatedPair(p)))
  const compatTitle = isSelectMode ? 'Strongest Connections' : 'Compatibility Map'

  // ── Hidden Connections — pairs with low sign-based scores but tight cross-chart aspects ─
  const hiddenConnections = useMemo(() => {
    if (nodes.length < 4) return []
    // Only consider pairs that scored LOW in sign-based matching (≤5 = no notable bond)
    const lowScorePairs = allCompatPairs.filter(p => p.score <= 5)
    // Exclude spouse pairs (they already get synastry in Partner Compatibility)
    const nonSpouseLow = lowScorePairs.filter(p => {
      const key = [p.a.id, p.b.id].sort().join('|')
      return !spouseEdgeSet.has(key)
    })

    const results = []
    for (const pair of nonSpouseLow) {
      const planetsA = extractPlanetPositions(pair.a)
      const planetsB = extractPlanetPositions(pair.b)
      if (planetsA.length < 3 || planetsB.length < 3) continue
      const hasBtA = !!pair.a.data.birthTime
      const hasBtB = !!pair.b.data.birthTime
      const crossAspects = calcCrossAspects(planetsA, planetsB, hasBtA, hasBtB)
      // Filter: ≤4° orb, personal planet required, skip uncertain
      const qualifying = crossAspects.filter(a => {
        if (a.orb > 4) return false
        if (a.confidence === 'uncertain') return false
        const hasPersonal = PERSONAL_SET.has(a.personA.name) || PERSONAL_SET.has(a.personB.name)
        if (!hasPersonal) return false
        if (a.personA.name === a.personB.name && !PERSONAL_SET.has(a.personA.name)) return false
        return true
      })
      if (qualifying.length >= 3) {
        // Summarize the connection in plain language (no glyphs/degrees)
        const softCount = qualifying.filter(a => a.aspect === 'trine' || a.aspect === 'sextile' || a.aspect === 'conjunction').length
        const hardCount = qualifying.filter(a => a.aspect === 'square' || a.aspect === 'opposition').length
        // Build a plain-language flavor based on what planets are involved
        const involvedPlanets = new Set()
        for (const a of qualifying) {
          involvedPlanets.add(a.personA.name)
          involvedPlanets.add(a.personB.name)
        }

        // Plain-English "why" — what parts of their charts connect
        const PLANET_MEANING = {
          Sun: 'identity', Moon: 'emotions', Venus: 'love and values',
          Mars: 'drive and energy', Mercury: 'communication',
          Jupiter: 'growth', Saturn: 'responsibility',
        }
        const personalInvolved = [...involvedPlanets].filter(p => PERSONAL_SET.has(p) || p === 'Saturn' || p === 'Jupiter')
        const meaningParts = personalInvolved.slice(0, 3).map(p => PLANET_MEANING[p] || p.toLowerCase())
        const why = meaningParts.length > 0
          ? `Connected through ${meaningParts.join(', ')}.`
          : ''

        let flavor = ''
        if (involvedPlanets.has('Venus') && involvedPlanets.has('Moon')) {
          flavor = softCount >= hardCount
            ? 'There tends to be a natural warmth when they\'re together, an easy emotional rapport.'
            : 'There\'s a pull between them that can feel intense. They tend to bring out strong reactions in each other.'
        } else if (involvedPlanets.has('Sun') && involvedPlanets.has('Moon')) {
          flavor = softCount >= hardCount
            ? 'Something clicks when they\'re in the same room: a sense of recognition, even if they don\'t see each other often.'
            : 'When they\'re together, they tend to push each other in subtle ways. Not always comfortable, but often catalytic.'
        } else if (involvedPlanets.has('Mars')) {
          flavor = softCount >= hardCount
            ? 'They tend to energize each other. The dynamic picks up when they\'re both around.'
            : 'There\'s a spark between them that can read as friction or motivation, depending on the day.'
        } else if (involvedPlanets.has('Saturn')) {
          flavor = softCount >= hardCount
            ? 'A quietly stabilizing connection. They may not realize how much they anchor each other.'
            : 'There\'s a weight to this connection. They tend to feel more "seen" by each other, for better or worse.'
        } else {
          flavor = softCount >= hardCount
            ? 'Their charts are unexpectedly in sync, a quiet resonance that may not be obvious on the surface.'
            : 'There\'s a dynamic tension here. They tend to notice each other, even from across the room.'
        }
        // Strength rating based on count + tightness
        const avgOrb = qualifying.reduce((sum, a) => sum + a.orb, 0) / qualifying.length
        let strength = ''
        if (qualifying.length >= 5 || (qualifying.length >= 4 && avgOrb < 2)) strength = 'Very strong'
        else if (qualifying.length >= 4 || (qualifying.length >= 3 && avgOrb < 1.5)) strength = 'Strong'
        else strength = 'Notable'

        results.push({
          a: pair.a,
          b: pair.b,
          aspectCount: qualifying.length,
          relation: pair.relation,
          why,
          flavor,
          strength,
        })
      }
    }
    return results.sort((a, b) => b.aspectCount - a.aspectCount).slice(0, 3)
  }, [nodes, allCompatPairs, spouseEdgeSet])

  // ── Member roles (Feature 3) ─────────────────────────────────────────────────
  const distinctEls = new Set(nodes.map(n => n.data.element)).size
  const memberRoles = nodes.map(node => {
    const modality = SIGN_MODALITY[node.data.sign] ?? 'Unknown'
    const sameEl   = nodes.filter(n => n.id !== node.id && n.data.element === node.data.element)
    const sameSgn  = nodes.filter(n => n.id !== node.id && n.data.sign    === node.data.sign)
    // Pull group-derived role if available
    const derived = groupRoles.find(r => r.node.id === node.id)
    return {
      node, modality,
      elementBlurb:     ELEMENT_ROLE_BLURB[node.data.element] ?? 'brings a unique presence',
      modalityMod:      MODALITY_MODIFIER[modality]            ?? 'a unique spirit who',
      isOnlyElement:    sameEl.length === 0,
      isOnlySign:       sameSgn.length === 0,
      sameElementPeers: sameEl.map(n => n.data.name),
      sameSignPeers:    sameSgn.map(n => n.data.name),
      isBridge:         sameEl.length === 0 && distinctEls >= 3,
      derivedRole:      derived?.summary || null,
      contributions:    derived?.contributions || [],
    }
  }).sort(byAgeNode)

  // ── Sibling groups — children sharing at least one parent OR explicit sibling edges
  const siblingGroups = (() => {
    const parentToChildren = {}
    parentChildEdges.forEach(e => {
      if (!parentToChildren[e.source]) parentToChildren[e.source] = []
      if (!parentToChildren[e.source].includes(e.target)) parentToChildren[e.source].push(e.target)
    })
    // Group by sorted parent set (so siblings from same couple are one group)
    const groupsByKey = {}
    Object.entries(parentToChildren).forEach(([parentId, childIds]) => {
      if (childIds.length < 2) return
      childIds.forEach(cid => {
        const parents = (parentMap[cid] || []).sort()
        const key = parents.join('|')
        if (!groupsByKey[key]) groupsByKey[key] = new Set()
        groupsByKey[key].add(cid)
      })
    })

    // Merge explicit sibling edges into groups via union-find
    const explicitSibEdges = edges.filter(e => e.data?.relationType === 'sibling')
    if (explicitSibEdges.length > 0) {
      // Build adjacency from explicit sibling edges
      const sibAdj = {}
      explicitSibEdges.forEach(e => {
        if (!sibAdj[e.source]) sibAdj[e.source] = new Set()
        if (!sibAdj[e.target]) sibAdj[e.target] = new Set()
        sibAdj[e.source].add(e.target)
        sibAdj[e.target].add(e.source)
      })
      // BFS to find connected components of explicit siblings
      const visited = new Set()
      Object.keys(sibAdj).forEach(startId => {
        if (visited.has(startId)) return
        const component = new Set()
        const q = [startId]
        while (q.length > 0) {
          const id = q.pop()
          if (visited.has(id)) continue
          visited.add(id)
          component.add(id)
          ;(sibAdj[id] || []).forEach(nid => { if (!visited.has(nid)) q.push(nid) })
        }
        if (component.size >= 2) {
          // Check if any member is already in a parent-based group; if so, merge into it
          let merged = false
          for (const [key, group] of Object.entries(groupsByKey)) {
            if ([...component].some(id => group.has(id))) {
              component.forEach(id => group.add(id))
              merged = true
              break
            }
          }
          if (!merged) {
            const key = `sibling-explicit-${startId}`
            groupsByKey[key] = component
          }
        }
      })
    }

    return Object.values(groupsByKey)
      .filter(set => set.size >= 2)
      .map(set => ({
        children: [...set]
          .map(id => nodes.find(n => n.id === id))
          .filter(Boolean)
          .sort((a, b) => (a.data.birthdate || '9999').localeCompare(b.data.birthdate || '9999')),
      }))
      .sort((a, b) => {
        const genA = Math.min(...a.children.map(c => generationLevel[c.id] ?? 0))
        const genB = Math.min(...b.children.map(c => generationLevel[c.id] ?? 0))
        return genA - genB
      })
  })()

  // ── Arrival groups — driven by spouse edges so all children of a couple appear
  // even if some kids are only connected to one parent in the tree
  const arrivalGroups = (() => {
    const groups = []
    const seen = new Set()
    spouseEdges.forEach(e => {
      const p1 = nodes.find(n => n.id === e.source)
      const p2 = nodes.find(n => n.id === e.target)
      if (!p1 || !p2) return
      const key = [p1.id, p2.id].sort().join('|')
      if (seen.has(key)) return
      seen.add(key)
      const children = nodes.filter(n => {
        const pids = parentMap[n.id] || []
        return pids.includes(p1.id) || pids.includes(p2.id)
      })
      if (children.length < 2) return
      const parents = [p1, p2].sort((a, b) => (a.data.birthdate || '9999').localeCompare(b.data.birthdate || '9999'))
      groups.push({ parents, children })
    })
    return groups
      .map(g => ({
        ...g,
        children: [
          ...g.children.filter(c => c.data.birthdate).sort((a, b) => a.data.birthdate.localeCompare(b.data.birthdate)),
          ...g.children.filter(c => !c.data.birthdate),
        ],
      }))
      .sort((a, b) => {
        const genA = Math.min(...a.parents.map(p => generationLevel[p.id] ?? 0))
        const genB = Math.min(...b.parents.map(p => generationLevel[p.id] ?? 0))
        return genA - genB
      })
  })()

  // ── Assemble DIG data from already-computed values ────────────────────────
  const digData = useMemo(() => {
    // Compute pluto groups for the DIG
    const genMap = {}
    nodes.forEach(n => {
      const ps = getPlutoSign(n.data?.birthdate)
      if (ps) { if (!genMap[ps]) genMap[ps] = []; genMap[ps].push(n) }
    })
    const plutoGroups = PLUTO_ORDER
      .filter(s => genMap[s])
      .map(sign => ({ sign, members: genMap[sign], flavor: PLUTO_GENS[sign]?.flavor }))

    return {
      nodes,
      edges,
      memberCount: nodes.length,
      familyName: isGroupOnly ? 'group' : 'family',
      dominant, dominantModality, masculine, feminine, total, missingElements,
      signatureDesc: (FAMILY_SIGNATURE_DESCRIPTIONS[dominant]?.[dominantModality] ?? '')
        .replace(/\ba family of\b/i, isGroupOnly ? 'a group of' : 'a family of'),
      topBonds,
      signThreadList,
      memberRoles,
      couples,
      plutoGroups,
      aspectThreads: aspectThreadData,
    }
  }, [nodes, edges, dominant, dominantModality, masculine, feminine, total, missingElements, topBonds, signThreadList, memberRoles, couples, isGroupOnly, aspectThreadData])

  if (tooFewNodes) {
    return (
      <div className="insights-panel">
        <h2 className="form-title">✦ {panelTitle}</h2>
        <p className="bulk-hint">Add at least two members to reveal your celestial patterns.</p>
        <div className="insight-card insight-coming-soon">
          <h3 className="insight-heading">What you'll unlock</h3>
          <p className="insight-note">🔥 <strong>Elemental makeup</strong>: which elements dominate your group</p>
          <p className="insight-note">♊ <strong>Shared signs</strong>: who carries the same cosmic energy</p>
          <p className="insight-note">💞 <strong>Partner harmony</strong>: elemental flow for couples</p>
          <p className="insight-note">🔁 <strong>Sign &amp; element threads</strong>: cosmic patterns across generations</p>
        </div>
      </div>
    )
  }

  if (noEdges) {
    return (
      <div className="insights-panel">
        <h2 className="form-title">✦ {panelTitle}</h2>
        <div className="insight-card insight-connect-prompt">
          <h3 className="insight-heading">One step away</h3>
          <p className="insight-note">
            Your members are in. Now <strong>connect them</strong> to unlock partner harmony, sign threads, and more.
          </p>
          {(onEditFirst || onAddMore) && (
            <button type="button" className="insights-connect-cta" onClick={onEditFirst ?? onAddMore}>
              <span>★</span>
              <span>Edit {nodes[0]?.data?.name ?? 'First Member'} to Add Connections</span>
              <span>→</span>
            </button>
          )}
          <div className="insights-unlock-list">
            <span>💞 Partner harmony</span>
            <span>🔁 Zodiac sign threads</span>
            <span>✨ Notable bonds</span>
            <span>🌿 Generational patterns</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="insights-panel" ref={panelRef} onClick={e => {
      const heading = e.target.closest('.insight-heading')
      if (!heading) return
      const card = heading.closest('.insight-card')
      if (!card) return
      const toggle = heading.querySelector('.insight-toggle-count')
      const isCollapsing = !card.classList.contains('insight-card--collapsed')
      if (toggle && isCollapsing) {
        const n = card.dataset.count
        const label = card.dataset.label
        toggle.textContent = n && label ? `${n} ${label}` : ''
      }
      card.classList.toggle('insight-card--collapsed')
    }}>
      {/* ── The DIG overlay ────────────────────────────────────────────── */}
      {showDig && (
        <Suspense fallback={null}>
          <TheDig digData={digData} onClose={onCloseDig} chartTitle={chartTitle} isPremium={hasFullDig} onUpgrade={onUpgrade} />
        </Suspense>
      )}

      <div className="insights-header">
        <h2 className="form-title">✦ {panelTitle}</h2>
        {onExport && (
          <button
            type="button"
            className="relayout-btn relayout-btn--share insights-export-btn"
            onClick={onExport}
            disabled={exporting}
          >
            {exporting ? '…' : (<>
              <span className="export-label-desktop">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px'}}><path d="M6 1v7M3 6l3 3 3-3M1 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Download
              </span>
              <span className="export-label-mobile">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px'}}><path d="M6 7V1M3 4l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 8v2.5h10V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Share
              </span>
            </>)}
          </button>
        )}
      </div>

      {/* ── Insights sub-nav (sidebar fallback — top-nav version lives in App.jsx) ── */}
      {edges.length > 0 && (
        <div className="insights-subnav-row">
          <nav className="insights-subnav">
            <button
              type="button"
              className={`insights-subnav-btn${insightsTab === 'insights' ? ' active' : ''}`}
              onClick={() => onInsightsTabChange?.('insights')}
            >✦ Insights</button>
            <button
              type="button"
              className={`insights-subnav-btn${insightsTab === 'dig' ? ' active' : ''}`}
              onClick={() => onInsightsTabChange?.('dig')}
            >✦ <span className="subnav-long">The </span>DIG{hasAdvanced && <span className="pro-tag pro-tag--subtle">✦</span>}</button>
            <button
              type="button"
              className={`insights-subnav-btn${insightsTab === 'current' ? ' active' : ''}${!hasAdvanced ? ' insights-subnav-btn--locked' : ''}`}
              onClick={() => onInsightsTabChange?.('current')}
            >✦ <span className="subnav-long">The </span>Current <span className="current-beta-tag">Beta</span>{hasAdvanced && <span className="pro-tag pro-tag--subtle">✦</span>}</button>
            {erasEligible && (
              <button
                type="button"
                className={`insights-subnav-btn${insightsTab === 'eras' ? ' active' : ''}${!authUser ? ' insights-subnav-btn--locked' : ''}`}
                onClick={() => onInsightsTabChange?.('eras')}
              >✦ Eras <span className="current-beta-tag">Beta</span></button>
            )}
          </nav>
          {onExport && (
            <button
              type="button"
              className="insights-export-btn--mobile-top"
              onClick={onExport}
              disabled={exporting}
              style={insightsTab !== 'insights' ? { visibility: 'hidden' } : undefined}
            >{exporting ? '…' : '↓'}</button>
          )}
        </div>
      )}

      {/* ── Tab content (stable container to prevent layout jump) ──── */}
      <div className="insights-tab-content">

      {/* ── The DIG section ────────────────────────────────────────────── */}
      {edges.length > 0 && (
        <div className="dig-section" style={insightsTab !== 'dig' ? { display: 'none' } : undefined}>
          <div className="dig-section-header">
            <h3 className="dig-section-title">✦ The DIG</h3>
            <p className="dig-section-desc">Your {isGroupOnly ? 'group' : 'family'}'s cosmic story. A Wrapped-style experience of your {isGroupOnly ? 'group' : 'family'}'s astrological DNA.</p>
          </div>
          {nodes.length < 3 ? (
            <div className="dig-section-gate">
              <p className="dig-section-gate-text">Add at least <strong>3 members</strong> with connections to unlock The DIG. More members = more slides and better insights.</p>
              {onAddMore && (
                <button type="button" className="dig-launch-btn" onClick={onAddMore}>
                  ＋ Add More Members
                </button>
              )}
            </div>
          ) : (<>
          <div className="dig-section-actions">
            <button
              type="button"
              className="dig-launch-btn"
              onClick={onShowDig}
            >
              ▶ View Your DIG
            </button>
            <button
              type="button"
              className="dig-launch-btn dig-launch-btn--download"
              disabled={digExporting}
              onClick={async () => {
                if (digExporting) return
                setDigExporting(true)
                try {
                  const { buildSlides, buildDigSummaryHtml } = await import('../utils/digSlides.js')
                  const slides = buildSlides(digData)
                  const { getToPng } = await import('../hooks/useExport.js')
                  const toPng = await getToPng()

                  // Render summary card — briefly visible for capture
                  const wrap = document.createElement('div')
                  wrap.className = 'dig-summary-card'
                  wrap.style.cssText = 'position:fixed;left:0;top:0;width:420px;background:#05031a;z-index:9999;'
                  wrap.innerHTML = buildDigSummaryHtml(digData, slides, chartTitle)
                  document.body.appendChild(wrap)
                  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

                  const slug = chartTitle ? chartTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'family'
                  const filename = `the-dig-${slug}-summary.png`

                  const dataUrl = await toPng(wrap, { backgroundColor: '#05031a', pixelRatio: 2, skipFonts: true })
                  document.body.removeChild(wrap)

                  // Convert data URL to blob
                  const parts = dataUrl.split(',')
                  const mime = parts[0].match(/:(.*?);/)[1]
                  const bin = atob(parts[1])
                  const arr = new Uint8Array(bin.length)
                  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
                  const blob = new Blob([arr], { type: mime })
                  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
                  if (isMobile && navigator.share) {
                    const file = new File([blob], filename, { type: 'image/png' })
                    if (navigator.canShare?.({ files: [file] })) {
                      await navigator.share({ files: [file], title: 'The DIG, AstroDig', text: `My ${isGroupOnly ? 'group' : 'family'}'s cosmic story ✦` })
                      setDigExporting(false)
                      return
                    }
                  }
                  const blobUrl = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.download = filename
                  link.href = blobUrl
                  link.style.display = 'none'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  URL.revokeObjectURL(blobUrl)
                } catch (e) {
                  console.error('[dig] summary export error:', e)
                } finally {
                  setDigExporting(false)
                }
              }}
            >
              {digExporting ? '…' : (<>
                <span className="export-label-desktop">↓ Download Summary</span>
                <span className="export-label-mobile">↑ Share Summary</span>
              </>)}
            </button>
          </div>
          <p className="dig-section-mobile-note">
            📱 For individual shareable slides, view The DIG on mobile and tap Share.
          </p>

          {/* Full-width download summary */}
          <button
            type="button"
            className="dig-download-full"
            disabled={digExporting}
            onClick={async () => {
              if (digExporting) return
              setDigExporting(true)
              try {
                const { buildSlides, buildDigSummaryHtml } = await import('../utils/digSlides.js')
                const slides = buildSlides(digData)
                const { getToPng } = await import('../hooks/useExport.js')
                const toPng = await getToPng()
                const wrap = document.createElement('div')
                wrap.className = 'dig-summary-card'
                wrap.style.cssText = 'position:fixed;left:0;top:0;width:420px;background:#05031a;z-index:9999;'
                wrap.innerHTML = buildDigSummaryHtml(digData, slides, chartTitle)
                document.body.appendChild(wrap)
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
                const slug = chartTitle ? chartTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'family'
                const dataUrl = await toPng(wrap, { backgroundColor: '#05031a', pixelRatio: 2, skipFonts: true })
                document.body.removeChild(wrap)
                const parts = dataUrl.split(',')
                const mime = parts[0].match(/:(.*?);/)[1]
                const bin = atob(parts[1])
                const arr = new Uint8Array(bin.length)
                for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
                const blob = new Blob([arr], { type: mime })
                const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
                if (isMobile && navigator.share) {
                  const file = new File([blob], `the-dig-${slug}-summary.png`, { type: 'image/png' })
                  if (navigator.canShare?.({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'The DIG, AstroDig', text: `My ${isGroupOnly ? 'group' : 'family'}'s cosmic story ✦` })
                    setDigExporting(false)
                    return
                  }
                }
                const blobUrl = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.download = `the-dig-${slug}-summary.png`
                link.href = blobUrl
                link.style.display = 'none'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(blobUrl)
              } catch (e) { console.error('[dig] summary export error:', e) }
              finally { setDigExporting(false) }
            }}
          >
            <span className="export-label-desktop">{digExporting ? '…' : '↓ Download DIG Summary'}</span>
            <span className="export-label-mobile">{digExporting ? '…' : '↑ Share DIG Summary'}</span>
          </button>
          </>)}
        </div>
      )}

      {/* Export-only: compact member list */}
      <div className="insights-member-list">
        {nodes.slice().sort(byAge).map(n => (
          <span key={n.id} className="insights-member-chip">
            {n.data.symbol} <strong>{n.data.name}</strong> · {fmtBirthdate(n.data.birthdate)}
          </span>
        ))}
      </div>

      {/* ── The Current section ──────────────────────────────────────── */}
      {currentVisited && (
        <div style={insightsTab !== 'current' ? { display: 'none' } : undefined}>
          <Suspense fallback={<div className="insights-tab-placeholder" />}>
            <TheCurrent nodes={nodes} edges={edges} entitlements={entitlements} />
          </Suspense>
        </div>
      )}

      {/* ── Eras section (Beta) — free with an account ───────────────── */}
      {insightsTab === 'eras' && erasEligible && (
        authUser ? (
          <ErasView nodes={nodes} isGroupOnly={isGroupOnly} />
        ) : (
          <div className="eras-gate">
            <span className="eras-gate-icon">✦</span>
            <h4 className="eras-gate-title">Eras</h4>
            <p className="eras-gate-desc">
              Your {isGroupOnly ? 'group' : 'family'} on a timeline: everyone in the
              order they arrived, set against the Pluto generations they came
              through. Free with an account.
            </p>
            <button type="button" className="dig-launch-btn" onClick={onSignIn}>
              Sign in to unlock
            </button>
          </div>
        )
      )}

      {/* ── Insight cards (hidden when DIG/Current tab active) ──────── */}
      <div className="insights-cards-wrapper" style={insightsTab !== 'insights' ? { display: 'none' } : undefined}>
      {<>

      <p className="insight-whisper insight-whisper--standalone" style={{ textAlign: 'center', padding: '0.2rem 1rem 0.4rem' }}>
        These insights describe tendencies and patterns, not certainties. A birth chart is one layer of a much bigger picture, and how you live it evolves over time.
      </p>

      {/* 1. Family Signature */}
      <FamilySignatureCard
        dominant={dominant}
        dominantModality={dominantModality}
        masculine={masculine}
        feminine={feminine}
        total={total}
        missingElements={missingElements}
        isGroupOnly={isGroupOnly}
      >
        {/* Full element breakdown — folded in from the old Collective Element Map card */}
        {groupElementMap.total >= 4 && (
          <details className="signature-breakdown">
            <summary>Full element breakdown · all planets</summary>
            <p className="insight-whisper">Counting personal planets (Sun, Moon, Mercury, Venus, and Mars) across every member.</p>
            {ELEMENTS.map(el => {
              const count = groupElementMap[el]
              const pct = Math.round(count / groupElementMap.total * 100)
              const color = ELEMENT_COLORS[el]
              const bd = groupElementMap.breakdown[el]
              const parts = Object.entries(bd).filter(([, c]) => c > 0)
                .map(([planet, c]) => `${c} ${planet}`)
              return (
                <div key={el} style={{ marginBottom: '0.25rem' }}>
                  <div className="element-bar-row">
                    <span className="element-bar-label" style={{ color }}>{el}</span>
                    <div className="element-bar-track">
                      <div className="element-bar-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="element-bar-count" style={{ color }}>{count}</span>
                  </div>
                  {parts.length > 0 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', paddingLeft: '3.2rem', marginTop: '0.05rem' }}>
                      {parts.join(' · ')}
                    </div>
                  )}
                </div>
              )
            })}
            <p className="insight-whisper" style={{ marginTop: '0.4rem' }}>
              {groupElementMap.total} total placements across {nodes.length} people. When one element dominates, its qualities tend to shape the group dynamic. Missing elements may show up as blind spots or things the group seeks elsewhere.
            </p>
          </details>
        )}
      </FamilySignatureCard>

      {/* Squad Energy — friend/coworker groups (including friend subgroups in mixed trees) */}
      {(isGroupOnly || hasFriendEdges) && (() => {
        // In mixed trees, narrow to friend subgraph
        const friendEdgesOnly = hasFriendEdges
          ? edges.filter(e => e.data?.relationType === 'friend' || e.data?.relationType === 'coworker')
          : edges
        const friendIds = hasFriendEdges
          ? new Set(friendEdgesOnly.flatMap(e => [e.source, e.target]))
          : null
        const friendNodes = friendIds ? nodes.filter(n => friendIds.has(n.id)) : nodes
        if (friendNodes.length < 2) return null

        // Recompute element aggregates for this subgroup
        const subElC = Object.fromEntries(ELEMENTS.map(e => [e, 0]))
        const subModC = { Cardinal: 0, Fixed: 0, Mutable: 0 }
        let subMasc = 0, subFem = 0
        friendNodes.forEach(n => {
          const el = n.data.element
          if (subElC[el] !== undefined) subElC[el]++
          const mod = SIGN_MODALITY[n.data.sign]
          if (mod) subModC[mod]++
          if (POLARITY_GROUP[n.data.sign] === 'masculine') subMasc++
          else subFem++
        })
        const subDominant = ELEMENTS.reduce((a, b) => subElC[a] >= subElC[b] ? a : b)
        const subDominantModality = Object.entries(subModC).reduce((a, b) => b[1] > a[1] ? b : a)[0]
        const subAllPlanetCounts = { ...allPlanetCounts, elC: subElC, modC: subModC, masc: subMasc, fem: subFem }

        return (
          <>
            <SquadEnergyCard
              nodes={friendNodes}
              allPlanetCounts={subAllPlanetCounts}
              dominant={subDominant}
              dominantModality={subDominantModality}
              innerPlanetMap={innerPlanetMap}
              warningsPerNode={warningsPerNode}
            />
            <SocialChemistryCard
              nodes={friendNodes}
              innerPlanetMap={innerPlanetMap}
              edges={friendEdgesOnly}
            />
          </>
        )
      })()}

      {/* 2. Sun Element Makeup */}
      <div className="insight-card">
        <h3 className="insight-heading">☀ Sun Element Makeup</h3>

        {ELEMENTS.map(el => {
          const count = elementCounts[el]
          const pct   = Math.round(count / nodes.length * 100)
          const color = ELEMENT_COLORS[el]
          return (
            <div key={el} className="element-bar-row">
              <span className="element-bar-label" style={{ color }}>{el}</span>
              <div className="element-bar-track">
                <div className="element-bar-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
              <span className="element-bar-count" style={{ color }}>{count}</span>
            </div>
          )
        })}

        {(() => {
          const mix = describeElementMix({
            counts: elementCounts,
            total: nodes.length,
            kind: 'sun',
            groupLabel: isGroupOnly ? 'group' : 'family',
          })
          return (
            <div style={{ marginTop: '0.55rem' }}>
              {mix.perElement.map(({ element, count, blurb }) => (
                <p key={element} className="insight-note" style={{ margin: '0.15rem 0' }}>
                  <strong style={{ color: ELEMENT_COLORS[element] }}>{count} {element}</strong>: {blurb}.
                </p>
              ))}
              <p className="insight-note" style={{ marginTop: '0.4rem' }}>{mix.summary}</p>
              {mix.missingNote && (
                <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                  {mix.missingNote}
                </p>
              )}
            </div>
          )
        })()}
        <p className="insight-whisper" style={{ marginTop: '0.4rem' }}>
          Sun sign reflects how you tend to show up in the world. Your outward identity and the energy others notice first.
        </p>
      </div>

      {/* 3. Moon Element Makeup — only when enough moon data */}
      {moonNodes.length >= 2 && moonDominant && (
        <div className="insight-card">
          <h3 className="insight-heading">☽ Moon Element Makeup</h3>
          {ELEMENTS.map(el => {
            const count = moonElementCounts[el]
            if (count === 0) return null
            const pct   = Math.round(count / moonNodes.length * 100)
            const color = ELEMENT_COLORS[el]
            return (
              <div key={el} className="element-bar-row">
                <span className="element-bar-label" style={{ color }}>{el}</span>
                <div className="element-bar-track">
                  <div className="element-bar-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="element-bar-count" style={{ color }}>{count}</span>
              </div>
            )
          })}
          {(() => {
            const mix = describeElementMix({
              counts: moonElementCounts,
              total: moonNodes.length,
              kind: 'moon',
              groupLabel: isGroupOnly ? 'group' : 'family',
            })
            return (
              <div style={{ marginTop: '0.55rem' }}>
                {mix.perElement.map(({ element, count, blurb }) => (
                  <p key={element} className="insight-note" style={{ margin: '0.15rem 0' }}>
                    <strong style={{ color: ELEMENT_COLORS[element] }}>{count} {element}</strong>: {blurb}.
                  </p>
                ))}
                <p className="insight-note" style={{ marginTop: '0.4rem' }}>{mix.summary}</p>
                {mix.missingNote && (
                  <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                    {mix.missingNote}
                  </p>
                )}
                {moonNodes.length < nodes.length && (
                  <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.2rem' }}>
                    ({nodes.length - moonNodes.length} member{nodes.length - moonNodes.length > 1 ? 's' : ''} without moon data)
                  </p>
                )}
              </div>
            )
          })()}
          <p className="insight-whisper" style={{ marginTop: '0.4rem' }}>
            Moon sign speaks to emotional needs and inner rhythms. It often tells a different story than the Sun sign, and that tension is part of what makes a chart interesting.
          </p>
        </div>
      )}

      {/* Hint: moon data missing */}
      {!(moonNodes.length >= 2 && moonDominant) && nodes.length >= 2 && (
        <p className="insight-hint">☽ Add birth times to unlock moon element insights</p>
      )}

      {/* 5. Sign Threads — personal planets only (Sun, Moon, Mercury, Venus, Mars) */}
      {(() => {
        const personalPlanets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars']
        const concentrated = Object.entries(groupSignMap)
          .map(([sign, data]) => {
            const filtered = Object.entries(data.planets).filter(([p]) => personalPlanets.includes(p))
            const total = filtered.reduce((s, [, c]) => s + c, 0)
            return [sign, { total, planets: Object.fromEntries(filtered) }]
          })
          .filter(([, data]) => data.total >= 3) // 2 placements is base-rate noise
          .sort((a, b) => b[1].total - a[1].total)
        if (concentrated.length === 0) return null
        return (
          <div className="insight-card" data-count={Math.min(concentrated.length, 6)} data-label={concentrated.length === 1 ? 'sign' : 'signs'}>
            <h3 className="insight-heading">Sign Threads</h3>
            <p className="insight-whisper">Signs that appear more than once across personal planets in the group.</p>
            {concentrated.slice(0, 6).map(([sign, data]) => {
              const parts = Object.entries(data.planets)
                .map(([planet, count]) => `${count} ${planet}`)
              return (
                <p key={sign} className="insight-note">
                  {SIGN_SYMBOLS[sign]} <strong>{sign}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {': '}{data.total} placement{data.total > 1 ? 's' : ''} ({parts.join(', ')})
                  </span>
                </p>
              )
            })}
          </div>
        )
      })()}

      {/* 5. Shared Moon Signs */}
      {sharedMoonSigns.length > 0 && (
        <div className="insight-card" data-count={sharedMoonSigns.length} data-label={sharedMoonSigns.length === 1 ? 'sign' : 'signs'}>
          <h3 className="insight-heading">☽ Shared Moon Signs</h3>
          {sharedMoonSigns.map(([sign]) => {
            const members = moonNodes.filter(n => n.data.moonSign === sign).sort(byAge)
            return (
              <p key={sign} className="insight-note">
                <PlanetSign planet="moon" symbol={members[0].data.moonSymbol} sign={sign} />
                {': '}
                {members.map((m, i) => (
                  <span key={m.id}>
                    {i > 0 && ', '}
                    {m.data.name}
                    {warningsPerNode.get(m.id)?.has('moon') && <span style={{ color: 'var(--gold)', fontSize: '0.75em' }}> ⚠</span>}
                  </span>
                ))}
              </p>
            )
          })}
          <p className="insight-note" style={{ marginTop: '0.3rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            Shared moon signs suggest similar emotional needs and instincts.
          </p>
          {sharedMoonSigns.some(([sign]) =>
            moonNodes.filter(n => n.data.moonSign === sign).some(m => warningsPerNode.get(m.id)?.has('moon'))
          ) && (
            <p className="insight-note" style={{ marginTop: '0.15rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              ⚠ Moon near sign boundary, add birth time for certainty
            </p>
          )}
        </div>
      )}

      {/* ── Nudge when free cards are thin ─────────────────────────────── */}
      {(() => {
        const hints = []
        if (moonNodes.length < 2) hints.push('add birth times to reveal moon signs and deeper element patterns')
        if (nodes.length < 4 && moonNodes.length >= 2) hints.push('add more members to uncover shared signs and element threads')
        if (hints.length === 0) return null
        const msg = hints.join(', or ')
        return (
          <p className="insight-whisper" style={{ textAlign: 'center', margin: '0.3rem 0 0.5rem' }}>
            {msg.charAt(0).toUpperCase() + msg.slice(1)}.
          </p>
        )
      })()}

      {/* ── Premium insights gate ───────────────────────────────────────── */}
      {!hasAdvanced && (() => {
        const items = [
          (sharedVenusSigns.length + sharedMarsSigns.length) > 0 && { icon: '♀♂', label: 'Venus & Mars Shared Signs', detail: `${sharedVenusSigns.length + sharedMarsSigns.length} match${sharedVenusSigns.length + sharedMarsSigns.length > 1 ? 'es' : ''} found` },
          couples.length > 0 && { icon: '💕', label: 'Partner Harmony', detail: `${couples.length} pair${couples.length > 1 ? 's' : ''}: ${couples[0]?.src.data.name} & ${couples[0]?.tgt.data.name}${couples.length > 1 ? ' + more' : ''}` },
          (signThreadList.length > 0 || topZodiacThreads.length > 0) && { icon: '🧬', label: 'Zodiac Threads', detail: 'signs echoing through generations' },
          { icon: '★', label: 'Planetary Patterns', detail: 'sign concentrations across the group' },
          { icon: '🎭', label: `${isGroupOnly ? 'Group' : 'Family'} Roles & Archetypes`, detail: `${nodes.length} members analyzed` },
          { icon: '🌸', label: `${isGroupOnly ? 'Group' : 'Family'} Arrivals`, detail: 'seasonal birth patterns' },
          { icon: '📊', label: 'Compatibility Map', detail: topBonds.length > 0 ? `${topBonds.length} notable bond${topBonds.length > 1 ? 's' : ''} + all pairs` : 'every notable pair at a glance' },
          { icon: '🪐', label: 'Pluto Generations', detail: 'generational themes & shifts' },
          groupHotspots.length > 0 && { icon: '★', label: 'Group Hotspots', detail: `${groupHotspots.length} concentration zone${groupHotspots.length > 1 ? 's' : ''} found` },
          groupGaps && { icon: '◌', label: 'The Gaps', detail: 'what the group may be missing' },
          groupSaturnLines.length > 0 && { icon: '♄', label: 'Saturn Lines', detail: 'shared growth & responsibility' },
          groupJupiterGifts.length > 0 && { icon: '♃', label: 'Jupiter Gifts', detail: 'where the group expands' },
          !isGroupOnly && aspectThreadData.totalCount > 0 && { icon: '✦', label: 'Cosmic Inheritance', detail: `${aspectThreadData.totalCount} pattern${aspectThreadData.totalCount !== 1 ? 's' : ''} found` },
        ].filter(Boolean)
        return (
        <div className="insight-card" style={{ padding: '1.2rem 1rem' }}>
          <div className="insight-locked-banner" onClick={onUpgrade}>
            🔒 Unlock Celestial Insights
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: '0.5rem 0 0.7rem', textAlign: 'center' }}>
            We found <strong style={{ color: 'var(--gold)' }}>{items.length} insights</strong> for your {nodes.length}-member chart:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', fontSize: '0.78rem' }}>
                <span style={{ flexShrink: 0, width: '1.4rem', textAlign: 'center' }}>{item.icon}</span>
                <span style={{ color: 'var(--text)' }}>{item.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>· {item.detail}</span>
              </div>
            ))}
          </div>
        </div>
        )
      })()}

      {hasAdvanced && (<>

      {/* ═══ SECTION: Individual Identity ═══════════════════════════════════ */}

      {/* Family Roles */}
      {memberRoles.length >= 2 && (
        <FamilyRoles memberRoles={memberRoles} isExporting={exporting} generationLevel={generationLevel} isGroupOnly={isGroupOnly} />
      )}

      {/* Cosmic Inheritance — shared / hereditary natal aspects (families only) */}
      {(() => {
        if (isGroupOnly) return null
        const { rareBonds, heredThreads, famSigs, totalWithBirthdata } = aspectThreadData
        if (aspectThreadData.totalCount === 0) return null

        function aspectLabel(members) {
          const types = [...new Set(members.map(m => m.aspect))]
          return types.length === 1 ? types[0] : 'connection'
        }

        return (
          <div className="insight-card" data-count={aspectThreadData.totalCount} data-label={aspectThreadData.totalCount === 1 ? 'pattern' : 'patterns'}>
            <h3 className="insight-heading">✦ Cosmic Inheritance<span className="insight-pro-tag">✦</span></h3>
            <p className="insight-whisper">Patterns appearing independently in each person's own birth chart: not connections between charts, but the same energy recurring across them.</p>

            {rareBonds.length > 0 && rareBonds.map((p, i) => {
              const exact = p.members.filter(m => m.orb <= 0.5)
              const blurb = p.blurb
              return (
                <div key={i} style={{ marginBottom: '0.75rem' }}>
                  <p className="insight-note" style={{ marginBottom: '0.18rem' }}>
                    <span style={{ color: 'var(--gold)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: '0.4rem' }}>Rare Bond</span>
                    {blurb
                      ? <strong>{blurb}</strong>
                      : <strong>{p.planet1} {p.aspect} {p.planet2}</strong>}
                  </p>
                  <p className="insight-note" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {exact.map(m => m.name).join(' and ')}, within {exact.map(m => `${m.orb}°`).join(' and ')}
                  </p>
                  <p className="insight-note" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                    {p.planet1} {p.aspect} {p.planet2}
                  </p>
                </div>
              )
            })}

            {heredThreads.length > 0 && heredThreads.map((c, i) => {
              const blurb = c.blurb
              return (
                <div key={i} style={{ marginBottom: '0.75rem' }}>
                  <p className="insight-note" style={{ marginBottom: '0.18rem' }}>
                    <span style={{ color: 'var(--rose)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: '0.4rem' }}>Passed Down</span>
                    {blurb
                      ? <strong>{blurb}</strong>
                      : <strong>{c.planet1}–{c.planet2}</strong>}
                  </p>

                  <p className="insight-note" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {c.chainNames}
                  </p>
                  <p className="insight-note" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                    {c.planet1}–{c.planet2} · {aspectLabel(c.members)}
                  </p>
                </div>
              )
            })}

            {famSigs.length > 0 && famSigs.map((c, i) => {
              const blurb = c.blurb
              return (
                <div key={i} style={{ marginBottom: '0.75rem' }}>
                  <p className="insight-note" style={{ marginBottom: '0.18rem' }}>
                    <span style={{ color: 'var(--text-soft)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: '0.4rem' }}>Family Pattern</span>
                    {blurb
                      ? <strong>{blurb}</strong>
                      : <strong>{c.planet1}–{c.planet2}</strong>}
                  </p>

                  <p className="insight-note" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {c.chainNames}
                  </p>
                  <p className="insight-note" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                    {c.planet1}–{c.planet2} · {aspectLabel(c.members)}
                  </p>
                </div>
              )
            })}

            <p className="insight-whisper" style={{ marginTop: '0.3rem' }}>
              Based on birth chart alignments. Moon excluded for members without a birth time.
            </p>
          </div>
        )
      })()}



      {/* ═══ SECTION: Relationships ═════════════════════════════════════════ */}


      {/* Partner Compatibility */}
      {couples.length > 0 && (
        <div className="insight-card" data-count={couples.length} data-label={couples.length === 1 ? 'couple' : 'couples'}>
          <h3 className="insight-heading">Partner Compatibility<span className="insight-pro-tag">✦</span></h3>
          {couples.map(({ src, tgt }, i) => {
            const { tagline, taglineColor, narrativeItems, growthEdge, synastryAspects } = buildCoupleAnalysis(src, tgt)
            return (
              <div key={i} className="insight-couple">
                <p className="insight-note">
                  {src.data.symbol} <strong>{src.data.name}</strong> &amp;{' '}
                  {tgt.data.symbol} <strong>{tgt.data.name}</strong>
                </p>
                <p className="insight-compat" style={{ color: taglineColor }}>
                  {tagline}
                </p>
                {narrativeItems.length > 0 && (
                  <div style={{ marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {narrativeItems.map((text, ni) => (
                      <p key={ni} className="insight-note" style={{ fontSize: '0.78rem', color: 'var(--text-soft)', lineHeight: 1.55, paddingLeft: '0.75rem', borderLeft: '2px solid rgba(255,255,255,0.08)' }}>
                        {text}
                      </p>
                    ))}
                  </div>
                )}
                {synastryAspects.length > 0 && (
                  <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {synastryAspects.map((text, si) => (
                      <p key={si} className="insight-note" style={{ fontSize: '0.72rem', color: 'var(--text-soft)', lineHeight: 1.5, paddingLeft: '0.75rem', borderLeft: '2px solid rgba(184,160,212,0.3)' }}>
                        {text}
                      </p>
                    ))}
                  </div>
                )}
                {growthEdge && (
                  <p className="insight-note" style={{ fontSize: '0.75rem', color: 'var(--gold)', lineHeight: 1.55, paddingLeft: '0.75rem', borderLeft: '2px solid rgba(201,168,76,0.25)', marginTop: '0.35rem', fontStyle: 'italic' }}>
                    Growth edge: {growthEdge}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Hint: no partner edges */}
      {couples.length === 0 && edges.length > 0 && !isGroupOnly && (
        <p className="insight-hint">💞 Connect partners to see relationship harmony</p>
      )}

      {/* 7b. Sibling Dynamics */}
      {siblingGroups.length > 0 && (
        <SiblingDynamics siblingGroups={siblingGroups} isExporting={exporting} />
      )}

      {/* Hint: no parent-child edges for generational insights */}
      {!isGroupOnly && !edges.some(e => e.data?.relationType === 'parent-child') && edges.length > 0 && (
        <p className="insight-hint">🔁 Add parent-child connections to see generational threads</p>
      )}

      {/* 10. Compatibility Map (includes Notable Bonds as highlights) */}
      {(compatDisplayPairs.length > 0 || topBonds.length > 0) && hasFullCompat && (
        <FullCompatPairs pairs={compatDisplayPairs} title={compatTitle} isExporting={exporting} generationLevel={generationLevel} notableBonds={topBonds} />
      )}

      {/* 10b. Hidden Connections — pairs sign-matching missed but aspects caught */}
      {hiddenConnections.length > 0 && hasFullCompat && (
        <div className="insight-card" data-count={hiddenConnections.length} data-label={hiddenConnections.length === 1 ? 'connection' : 'connections'}>
          <h3 className="insight-heading">Hidden Connections<span className="insight-pro-tag">✦</span></h3>
          <p className="insight-whisper">These pairs don't share obvious sign placements, but their charts form tight angles to each other, a subtler kind of connection that may show up when they spend time together.</p>
          {hiddenConnections.map((hc, i) => (
            <div key={i} style={{ marginBottom: '0.6rem' }}>
              <p className="insight-note">
                {hc.a.data.symbol} <strong>{hc.a.data.name}</strong> &amp;{' '}
                {hc.b.data.symbol} <strong>{hc.b.data.name}</strong>
                {hc.relation && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>({hc.relation})</span>}
                <span style={{ fontSize: '0.68rem', color: hc.strength === 'Very strong' ? 'var(--gold)' : hc.strength === 'Strong' ? '#b8a0d4' : 'var(--text-muted)', marginLeft: '0.4rem', fontWeight: 500 }}>
                  {hc.strength}
                </span>
              </p>
              {hc.why && (
                <p className="insight-note" style={{ fontSize: '0.72rem', color: '#b8a0d4', marginTop: '0.15rem' }}>
                  {hc.why}
                </p>
              )}
              <p className="insight-note" style={{ fontSize: '0.75rem', color: 'var(--text-soft)', lineHeight: 1.55, paddingLeft: '0.75rem', borderLeft: '2px solid rgba(184,160,212,0.25)', marginTop: '0.2rem' }}>
                {hc.flavor}
              </p>
            </div>
          ))}
          <p className="insight-whisper" style={{ marginTop: '0.3rem' }}>In astrology, an "aspect" is a meaningful angle between two planets. When one person's planets form tight angles to another person's, it can create a sense of connection or friction, even without shared signs.</p>
        </div>
      )}



      {/* ═══ SECTION: Family Narrative ══════════════════════════════════════ */}


      {/* Family Arrivals */}
      {arrivalGroups.length > 0 && (() => {
        const arrivalCount = arrivalGroups.reduce((s, g) => s + g.children.length, 0)
        return (
        <div className="insight-card" data-count={arrivalCount} data-label={arrivalCount === 1 ? 'arrival' : 'arrivals'}>
          <h3 className="insight-heading">✦ Family Arrivals<span className="insight-pro-tag">✦</span></h3>
          <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
            What each child brought to the mix, in energy, personality, and the family dynamic.
          </p>
          {arrivalGroups.map((group, gi) => {
            const coupleLabel = `${group.parents[0].data.name} & ${group.parents[1].data.name}`
            return (
              <div key={gi} style={{ marginBottom: gi < arrivalGroups.length - 1 ? '1rem' : 0 }}>
                <p style={{ fontSize: '0.8rem', fontFamily: "'Cinzel', serif", letterSpacing: '0.05em', color: 'var(--gold-light)', marginBottom: '0.3rem' }}>
                  {coupleLabel}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: "'Raleway', sans-serif", letterSpacing: 0 }}>
                    {' '}(
                    {group.parents.map((p, pi) => (
                      <span key={p.id}>
                        {pi > 0 && ' · '}
                        <span style={{ color: ELEMENT_COLORS[p.data.element] }}>{p.data.element}</span>
                      </span>
                    ))}
                    )
                  </span>
                </p>
                {group.children.map((child, ci) => {
                  const elderSiblings = group.children.slice(0, ci)
                  const { main, detail } = getArrivalStory(child, group.parents, elderSiblings)
                  return (
                    <div key={child.id} style={{ paddingLeft: '0.6rem', marginBottom: ci < group.children.length - 1 ? '0.4rem' : 0 }}>
                      <p className="insight-note">
                        <span style={{ color: ELEMENT_COLORS[child.data.element] }}>
                          {SIGN_SYMBOLS[child.data.sign]} <strong>{child.data.name}</strong>
                        </span>
                        {': '}{main}
                      </p>
                      {detail && (
                        <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', paddingLeft: '1rem', marginTop: '0.05rem' }}>
                          {child.data.sign}: {detail}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
        )
      })()}

      {/* Zodiac Threads */}
      {(topZodiacThreads.length > 0 || signThreadList.length > 0) && (() => {
        const threadCount = signThreadList.length + topZodiacThreads.length
        return (
        <div className="insight-card" data-count={threadCount} data-label={threadCount === 1 ? 'thread' : 'threads'}>
          <h3 className="insight-heading">Zodiac Threads<span className="insight-pro-tag">✦</span></h3>
          <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.1rem' }}>
            Like a gene that runs in families. These signs keep showing up across generations, carried through different planets in different people.
          </p>
          {signThreadList.length > 0 && (
            <div style={{ marginBottom: topZodiacThreads.length > 0 ? '0.5rem' : 0 }}>
              <p className="insight-note" style={{ fontWeight: 500, marginBottom: '0.15rem' }}>Generational Echoes</p>
              <p className="insight-whisper" style={{ marginBottom: '0.2rem' }}>
                The same Sun or Moon sign passed directly from parent to child.
              </p>
              {signThreadList.map(({ sign, chain, planet }) => (
                <p key={`${planet}-${sign}`} className="insight-note">
                  {planet === 'sun' ? '☀' : '☽'}{' '}
                  <strong>{SIGN_SYMBOLS[sign]} {sign}</strong>{' '}
                  {chain.length === 2 ? 'across 2 generations' : `through ${chain.length} generations`}:{' '}
                  {chain.map(n => n.data.name).join(' → ')}
                </p>
              ))}
            </div>
          )}
          {topZodiacThreads.length > 0 && (
            <div>
              {signThreadList.length > 0 && (
                <p className="insight-note" style={{ fontWeight: 500, marginBottom: '0.15rem' }}>Wider Patterns</p>
              )}
              {signThreadList.length > 0 && (
                <p className="insight-whisper" style={{ marginBottom: '0.2rem' }}>
                  Signs that echo across generations through any personal planet, not just Sun or Moon.
                </p>
              )}
              {topZodiacThreads.map(({ sign, byGen, gens }) => (
                <div key={sign} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <p className="insight-note">
                    <strong>{SIGN_SYMBOLS[sign]} {sign}</strong>
                    {': '}
                    {gens.map((gen, gi) => (
                      <span key={gen}>
                        {gi > 0 && <span style={{ color: 'var(--text-muted)' }}> → </span>}
                        {byGen[gen].map((n, ni) => {
                          const glyphs = getSignPlanetGlyphs(n, sign)
                          return (
                            <span key={n.id}>
                              {ni > 0 && ', '}
                              <strong>{n.data.name}</strong>
                              {glyphs && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}> ({glyphs})</span>}
                            </span>
                          )
                        })}
                      </span>
                    ))}
                  </p>
                  {ZODIAC_THREAD_BLURB[sign] && (
                    <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', paddingLeft: '1rem' }}>
                      {isGroupOnly ? (ZODIAC_THREAD_BLURB_GROUP[sign] ?? ZODIAC_THREAD_BLURB[sign]) : ZODIAC_THREAD_BLURB[sign]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        )
      })()}

      {/* Venus & Mars Shared Signs */}
      {(sharedVenusSigns.length > 0 || sharedMarsSigns.length > 0) && (() => {
        const vmCount = sharedVenusSigns.length + sharedMarsSigns.length
        return (
        <div className="insight-card" data-count={vmCount} data-label={vmCount === 1 ? 'match' : 'matches'}>
          <h3 className="insight-heading">♀ Venus · ♂ Mars Shared Signs<span className="insight-pro-tag">✦</span></h3>
          {sharedVenusSigns.map(({ sign, symbol, members }) => (
            <div key={`v-${sign}`} style={{ marginBottom: '0.35rem' }}>
              <p className="insight-note">
                <PlanetSign planet="venus" symbol={symbol} sign={sign} />
                {': '}{members.map(m => m.data.name).join(', ')}
              </p>
              {VENUS_SIGN_BLURB[sign] && (
                <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', paddingLeft: '1rem', marginTop: '0.1rem' }}>
                  {VENUS_SIGN_BLURB[sign]}
                </p>
              )}
            </div>
          ))}
          {sharedMarsSigns.map(({ sign, symbol, members }) => (
            <div key={`m-${sign}`} style={{ marginBottom: '0.35rem' }}>
              <p className="insight-note">
                <PlanetSign planet="mars" symbol={symbol} sign={sign} />
                {': '}{members.map(m => m.data.name).join(', ')}
              </p>
              {MARS_SIGN_BLURB[sign] && (
                <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', paddingLeft: '1rem', marginTop: '0.1rem' }}>
                  {MARS_SIGN_BLURB[sign]}
                </p>
              )}
            </div>
          ))}
          <p className="insight-note" style={{ marginTop: '0.3rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            ♀ Venus reflects how someone loves and what they value. ♂ Mars reflects drive and how they act.
          </p>
        </div>
        )
      })()}



      {/* ═══ SECTION: Group Patterns ═══════════════════════════════════════ */}


      {/* Planetary Patterns, Group Hotspots, The Gaps, Saturn Lines, Jupiter Gifts */}
      <GroupAnalysisCards
        topSigns={topSigns}
        groupHotspots={groupHotspots}
        groupGaps={groupGaps}
        groupSaturnLines={groupSaturnLines}
        groupJupiterGifts={groupJupiterGifts}
      />

      {/* 11. Pluto Generations */}
      {(() => {
        const genMap = {}
        nodes.forEach(n => {
          const ps = getPlutoSign(n.data.birthdate)
          if (ps) { if (!genMap[ps]) genMap[ps] = []; genMap[ps].push(n) }
        })
        const present = PLUTO_ORDER.filter(s => genMap[s])
        if (present.length < 2) return null
        // Friends born a couple of years apart can straddle an era boundary —
        // that's a birth-year fact, not a generational pattern. Require a
        // real age spread before calling it one.
        const years = nodes.map(n => Number(n.data?.birthdate?.slice(0, 4))).filter(Number.isFinite)
        if (years.length && Math.max(...years) - Math.min(...years) < 15) return null
        return (
          <div className="insight-card" id="pluto-generations-card" data-count={present.length} data-label={present.length === 1 ? 'generation' : 'generations'}>
            <h3 className="insight-heading">✦ Pluto Generations<span className="insight-pro-tag">✦</span></h3>
            <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
              Pluto's slow orbit imprints each generation with a shared undercurrent.
            </p>
            {present.map(sign => {
              const gen = PLUTO_GENS[sign]
              const members = genMap[sign]
              return (
                <div key={sign} style={{ display: 'flex', flexDirection: 'column', gap: '0.08rem' }}>
                  <p className="insight-note">
                    {SIGN_SYMBOLS[sign]}{' '}
                    <strong>Pluto in {sign}</strong>{' '}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({gen.years})</span>
                    {' · '}{members.length} {members.length === 1 ? 'member' : 'members'}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      {' · '}{members.map(m => m.data.name).join(', ')}
                    </span>
                  </p>
                  <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', paddingLeft: '1.1rem', marginTop: '-0.05rem' }}>
                    {gen.flavor}
                  </p>
                </div>
              )
            })}
          </div>
        )
      })()}



      </>)}
      {/* 13. Add more prompt */}
      {sharedSigns.length === 0 && couples.length === 0 &&
       topZodiacThreads.length === 0 && topBonds.length === 0 && onAddMore && (
        <div className="insight-add-more">
          <p className="insight-add-more-text">Add more group members &amp; connect them to unlock shared signs, compatibility, and generational patterns.</p>
          <button type="button" className="insight-add-more-btn" onClick={onAddMore}>
            ＋ Add {isGroupOnly ? 'Group' : 'Family'} Members
          </button>
        </div>
      )}

      {/* DIG teaser inside insights */}
      {hasAdvanced && edges.length > 0 && nodes.length >= 3 && (
        <button
          type="button"
          className="dig-teaser-card"
          onClick={() => onInsightsTabChange?.('dig')}
        >
          <span className="dig-teaser-label">✦ The DIG</span>
          <span className="dig-teaser-text">See your {isGroupOnly ? 'group' : 'family'}'s cosmic story. Wrapped-style slides, shareable highlights, and more.</span>
          <span className="dig-teaser-arrow">View The DIG →</span>
        </button>
      )}

      </>}
      {/* ── end insight cards ─────────────────────────────────────────── */}

      {/* Download button — placed above consult CTA so it's visible */}
      {onExport && (
        <button
          type="button"
          className="relayout-btn relayout-btn--share insights-export-btn insights-export-btn--bottom"
          onClick={onExport}
          disabled={exporting}
          style={{ width: '100%' }}
        >
          {exporting ? '…' : '↓ Download Insights'}
        </button>
      )}

      {/* Consult CTA */}
      <div className="insight-consult-cta">
        <p className="insight-consult-cta-text">
          <strong>Want a deeper reading?</strong> Book a personal astrology consultation with Christina. Explore your chart, your {isGroupOnly ? 'group' : 'family'}'s patterns, and what the stars reveal about your connections.
        </p>
        {exporting ? (
          <p className="insight-consult-contact">
            ✦ Jupiter Digital · jupreturns@gmail.com · IG: @jupreturn
          </p>
        ) : (
          <a
            href="https://jupiterdigital.etsy.com/listing/1381418600/personalized-astrology-reading-in-depth"
            target="_blank"
            rel="noopener noreferrer"
            className="insight-consult-link"
          >
            ✦ Book with Jupiter Digital →
          </a>
        )}
      </div>
      </div>{/* end insights display:none wrapper */}

      </div>{/* end .insights-tab-content */}

      {/* Brand footer — hidden normally, shown during export */}
      <div className="insights-brand-footer">
        <span className="insights-brand-name">✦ AstroDig by Jupiter Digital</span>
        <span className="insights-brand-contact">
          jupreturns@gmail.com · <svg style={{display:'inline',verticalAlign:'middle',marginRight:'2px'}} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>@jupreturn
        </span>
      </div>
    </div>
  )
}
