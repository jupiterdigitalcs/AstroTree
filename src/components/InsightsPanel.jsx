import { useState, useMemo, lazy, Suspense } from 'react'
import {
  getElement,
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

const TheDig = lazy(() => import('./dig/TheDig.jsx'))

const ELEMENTS = ['Fire', 'Earth', 'Air', 'Water']

const ELEMENT_ENERGY = {
  Fire:  'passionate and driven',
  Earth: 'grounded and practical',
  Air:   'communicative and curious',
  Water: 'intuitive and emotional',
}

// Richer per-element language for the Sun / Moon Element Makeup cards.
// Sun = identity, outward self. Moon = inner world, emotional needs.
const SUN_ELEMENT_DESC = {
  Fire:  'bold, driven identities that lead with action and spark',
  Earth: 'steady, practical identities that build through patience and effort',
  Air:   'curious, social identities that lead with ideas and conversation',
  Water: 'sensitive, intuitive identities that lead with feeling and empathy',
}
const MOON_ELEMENT_DESC = {
  Fire:  'big, expressive emotions that ignite fast and need room to burn',
  Earth: 'steady emotional needs rooted in routine, safety, and physical comfort',
  Air:   'inner worlds that process feeling through words — needing space to talk it out',
  Water: 'deep emotional lives shaped by intuition, empathy, and what they sense in others',
}

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
    summary = `Everyone shares the same element — that consistency amplifies, but the ${groupLabel} may feel the absence of the other three.`
  } else if (present.length === 4) {
    summary = `All four elements are represented — a rare full spread, and a naturally balanced ${groupLabel}.`
  } else {
    const top = present[0]
    const topPct = counts[top] / total
    if (topPct >= 0.6) {
      summary = `${top} clearly leads the ${groupLabel}, with ${present.slice(1).join(' and ')} offering counterweight.`
    } else {
      summary = `A mix of ${present.join(', ')} — no single element dominates.`
    }
  }

  const missingNote = missing.length > 0 && missing.length < 4
    ? `Missing ${missing.join(' and ')} — those qualities may be sought outside the ${groupLabel}.`
    : null

  return { perElement, summary, missingNote }
}

function fmtBirthdate(d) {
  if (!d) return '—'
  const [y, mo, day] = d.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[+mo - 1]} ${+day}, ${y}`
}

const SIGN_SYMBOLS = {
  Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍',
  Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓',
}

const SIGN_FLAVOR = {
  Aries:       'when this energy shows up in a group, it tends to push everyone toward action — the spark that gets things started',
  Taurus:      'this energy brings a grounding quality to the group — patience, steadiness, and a reminder to slow down and enjoy the process',
  Gemini:      'this energy keeps the group curious and connected — new ideas, lively conversation, and a restless need to keep learning',
  Cancer:      'this energy anchors the group emotionally — a deep attunement to feelings, memory, and what makes a place feel like home',
  Leo:         'this energy brings warmth and creative confidence to the group — a natural ability to make others feel seen and celebrated',
  Virgo:       'this energy shows up as quiet competence — the group member who notices what needs doing and handles it without fanfare',
  Libra:       'this energy smooths the group dynamic — a pull toward fairness, beauty, and keeping things in balance',
  Scorpio:     'this energy brings depth and perception — the willingness to go beneath the surface and sit with difficult truths',
  Sagittarius: 'this energy expands the group\'s vision — a philosophical streak and a pull toward meaning, travel, and big questions',
  Capricorn:   'this energy brings structure and long-term thinking — the part of the group that plans, commits, and follows through',
  Aquarius:    'this energy challenges the group to think differently — independence, innovation, and a vision that may run ahead of its time',
  Pisces:      'this energy brings empathy and imagination — a sensitivity to what others feel and a rich, intuitive inner world',
}

const PLANET_GLYPH = { sun: '☀', moon: '☽', mercury: '☿', venus: '♀', mars: '♂', jupiter: '♃', saturn: '♄' }

const VENUS_SIGN_BLURB = {
  Aries:       'Tends to be direct and impulsive in love — may act on attraction quickly and value honesty over subtlety.',
  Taurus:      'Often drawn to comfort, sensuality, and lasting loyalty — may show love through physical presence and steadiness.',
  Gemini:      'Tends to connect through conversation and mental spark — may need variety and intellectual stimulation in love.',
  Cancer:      'Often nurturing and emotionally invested — may build love around a sense of home and emotional safety.',
  Leo:         'Tends to be warm and generous in love — may need to feel appreciated and often expresses affection openly.',
  Virgo:       'Often shows love through thoughtful gestures and attention to detail — may express care more through doing than saying.',
  Libra:       'Tends to seek harmony and beauty in relationships — may prioritize partnership and go out of their way to avoid conflict.',
  Scorpio:     'Often loves with depth and intensity — may take time to trust but tends to be deeply loyal once committed.',
  Sagittarius: 'Tends to need space and adventure in love — may connect through shared experiences and philosophical conversation.',
  Capricorn:   'Often reserved in expressing affection — may show love through commitment, reliability, and quiet devotion.',
  Aquarius:    'Tends to approach love unconventionally — may value friendship, independence, and intellectual connection as the basis of intimacy.',
  Pisces:      'Often deeply empathetic and emotionally open — may love without boundaries and absorb a partner\'s feelings easily.',
}

const MARS_SIGN_BLURB = {
  Aries:       'Tends to act quickly and directly — may be the first to take initiative and can bring high energy to any situation.',
  Taurus:      'Often slow to start but persistent once moving — may surprise others with quiet determination and staying power.',
  Gemini:      'Tends to channel energy through ideas and conversation — may approach challenges mentally before physically.',
  Cancer:      'Often driven by emotion and a protective instinct — may fight hardest when someone they care about is affected.',
  Leo:         'Tends to bring warmth and confidence to action — may need recognition for their efforts and often leads naturally.',
  Virgo:       'Often precise and methodical in how they apply effort — may channel energy into getting things right rather than getting them fast.',
  Libra:       'Tends to approach conflict through dialogue and diplomacy — may be uncomfortable with direct confrontation but firm on fairness.',
  Scorpio:     'Often focused and deeply committed once engaged — may approach goals with quiet intensity and persistence.',
  Sagittarius: 'Tends to bring enthusiasm and optimism to challenges — may need a meaningful goal to sustain effort over time.',
  Capricorn:   'Often strategic and disciplined — may take a long-term approach and work steadily without needing external motivation.',
  Aquarius:    'Tends to be driven by ideas and principles — may channel energy into innovation or challenging established systems.',
  Pisces:      'Often motivated by compassion and creative vision — may direct energy toward helping, imagining, or connecting on a deeper level.',
}

const ELEMENT_THREAD_BLURB = {
  Fire:  'A family line of passion, courage, and creative drive',
  Earth: 'A legacy of groundedness, patience, and practical wisdom',
  Air:   'Generations of quick minds, curiosity, and a gift for connection',
  Water: 'Deep emotional intelligence and intuition flowing through the generations',
}

const SIBLING_ADAPTABILITY = {
  'Cardinal-Cardinal': 'both initiators — may compete for direction, but together spark real momentum',
  'Cardinal-Fixed':    'initiation meets endurance — one starts it, one sees it through',
  'Cardinal-Mutable':  'spark meets flow — one launches, one shapes the path',
  'Fixed-Fixed':       'immovable force — deep loyalty, shared stubbornness, and lasting bonds',
  'Fixed-Mutable':     'anchor meets adapter — one holds steady while the other evolves',
  'Mutable-Mutable':   'highly adaptable together — fluid, curious, and ever-shifting',
}

const PLUTO_GENS = {
  Cancer:      { years: '~1914–1939', flavor: 'shaped by home, survival, and deep loyalty to family' },
  Leo:         { years: '~1939–1957', flavor: 'driven by identity, pride, and a need to leave their mark' },
  Virgo:       { years: '~1957–1972', flavor: 'defined by craft, critical thinking, and a drive to improve' },
  Libra:       { years: '~1972–1984', flavor: 'formed by ideals of fairness, partnership, and social harmony' },
  Scorpio:     { years: '~1984–1995', flavor: 'marked by transformation, intensity, and truth-seeking' },
  Sagittarius: { years: '~1995–2008', flavor: 'colored by idealism, global thinking, and the search for meaning' },
  Capricorn:   { years: '~2008–2024', flavor: 'shaped by ambition, structure, and rethinking the rules' },
  Aquarius:    { years: '2024+',      flavor: 'awakening into collective vision, technology, and radical change' },
}
const PLUTO_ORDER = ['Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius']

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

const OPPOSITE_SIGNS = {
  Aries: 'Libra',        Libra:       'Aries',
  Taurus: 'Scorpio',     Scorpio:     'Taurus',
  Gemini: 'Sagittarius', Sagittarius: 'Gemini',
  Cancer: 'Capricorn',   Capricorn:   'Cancer',
  Leo:    'Aquarius',    Aquarius:    'Leo',
  Virgo:  'Pisces',      Pisces:      'Virgo',
}

function areCompatible(a, b) {
  if (a === b) return true
  return (
    (a === 'Fire'  && b === 'Air'  ) || (a === 'Air'   && b === 'Fire' ) ||
    (a === 'Earth' && b === 'Water') || (a === 'Water'  && b === 'Earth')
  )
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

const ELEMENT_QUALITY = {
  Fire:  'bold and passionate',
  Earth: 'steady and grounded',
  Air:   'curious and communicative',
  Water: 'sensitive and emotionally deep',
}

const MOON_STYLE = {
  Aries:       'processes emotions quickly and moves on fast',
  Taurus:      'takes time to open up and craves security above all',
  Gemini:      'talks through feelings and needs mental space to process',
  Cancer:      'feels deeply and holds onto emotional memory',
  Leo:         'needs to feel appreciated and expresses feelings openly',
  Virgo:       'processes by analyzing and shows love through acts of service',
  Libra:       'avoids conflict and needs harmony to feel emotionally safe',
  Scorpio:     'feels everything intensely and holds it for a long time',
  Sagittarius: 'needs freedom and tends to stay upbeat on the surface',
  Capricorn:   'keeps emotions private and handles things practically',
  Aquarius:    'steps back to process and needs intellectual independence',
  Pisces:      'absorbs the emotions of others and needs quiet to recharge',
}

const ZODIAC_THREAD_BLURB = {
  Aries:       'A streak of boldness runs in this family — independent thinkers who act on instinct and resist being told what to do',
  Taurus:      'A deep rootedness passes through the generations — this family prizes stability, comfort, and building things that last',
  Gemini:      'Curiosity is the family inheritance — quick minds, a gift for conversation, and a need to keep learning',
  Cancer:      'The home and its memory bind this family — emotional attunement, loyalty, and a fierce protectiveness of those they love',
  Leo:         'A warmth and need for self-expression flows through — this family carries a natural light and doesn\'t shrink from being seen',
  Virgo:       'A thread of precision and quiet devotion — these are the ones who notice the details, show up consistently, and fix things without being asked',
  Libra:       'A need for harmony and fairness is woven through — this family values beauty, balance, and keeping the peace, sometimes to a fault',
  Scorpio:     'Emotional depth and perception run strong — this family feels things fully, sees beneath the surface, and is shaped by transformation',
  Sagittarius: 'An expansive, searching spirit recurs — this family is restless with meaning, drawn to big ideas, travel, and the question of why',
  Capricorn:   'An ambition to build something lasting runs in the blood — this family respects discipline, earns trust slowly, and plays the long game',
  Aquarius:    'An independent streak and a vision that runs ahead of its time — this family thinks differently and doesn\'t follow trends',
  Pisces:      'A deep empathy and sensitivity recurs across the line — this family feels the world more than most and carries a strong imaginative inner life',
}

const SIGN_SHORT = {
  Aries:       'acts first, thinks later — instinctive and driven by impulse',
  Taurus:      'patient and deeply rooted — values stability and comfort above all',
  Gemini:      'wired for connection and ideas — mentally restless, rarely still',
  Cancer:      'nurturing and emotionally attuned — home and family come first',
  Leo:         'warm and expressive — needs to be seen and loves to make others shine',
  Virgo:       'precise and quietly devoted — notices what everyone else misses',
  Libra:       'harmony-seeking and fair-minded — hates conflict, needs balance',
  Scorpio:     'perceptive and emotionally intense — feels everything deeply',
  Sagittarius: 'expansive and freedom-seeking — always chasing meaning and the horizon',
  Capricorn:   'disciplined and driven — plays the long game, built to endure',
  Aquarius:    'independent and ahead of their time — marches to their own beat',
  Pisces:      'empathic and dreamy — moved by the unseen, feels others\' emotions',
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
    if (elsBefore.size + 1 === 4) main = `rounded out the family — brought a quality none of the others had`
    else if (elderSiblings.length === 0) main = `brought ${qual} energy to a family that didn't have it yet`
    else main = `introduced something new — ${qual}, a quality no one else here carries`
  } else {
    const matchingParent = parents.find(p => p.data.element === el)
    const matchingSibling = elderSiblings.find(s => s.data.element === el)
    const totalAfter = pool.length + 1
    const countAfter = elCountBefore + 1
    if (parents.length >= 2 && parents.every(p => p.data.element === el)) {
      main = `born into it on both sides — ${qual} runs through this whole family`
    } else if (matchingParent && !matchingSibling) {
      main = `took after ${matchingParent.data.name} — ${qual}, cut from the same cloth`
    } else if (matchingSibling && !matchingParent) {
      main = `shares ${qual} energy with ${matchingSibling.data.name} — the two carry the same thread`
    } else {
      main = `${qual} — now ${countAfter} of ${totalAfter} in this family share this`
    }
  }

  return { main, detail: SIGN_SHORT[sign] || null }
}

// ── Inner components ──────────────────────────────────────────────────────────

function FamilySignatureCard({ dominant, dominantModality, masculine, feminine, total, missingElements, isGroupOnly }) {
  const g = isGroupOnly ? 'group' : 'family'
  const G = isGroupOnly ? 'Group' : 'Family'
  const desc = FAMILY_SIGNATURE_DESCRIPTIONS[dominant]?.[dominantModality]
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
        <p className="insight-note signature-desc">Your {g} {desc}.</p>
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
          No {missingElements.join(' or ')} energy — the {g} may seek this outside
        </p>
      )}
    </div>
  )
}

const COMPAT_EXPLAIN = {
  'Cosmic Echo':           'All four personal planets aligned — an extraordinarily rare resonance.',
  'Rare Triple Alignment': 'Three shared placements — an uncommon and deep connection.',
  'Soul Twins':            'Same Sun and Moon — they tend to express and feel in the same way.',
  'Cosmic Twins':          'Same Sun sign — they may see their own qualities reflected in each other.',
  'Mirror Signs':          'Opposite signs — complementary qualities that can feel magnetic or challenging.',
  'Lunar Bond':            'Same Moon sign — similar emotional instincts and inner needs.',
  'Sun-Moon Reflection':   'One person\'s Sun falls on the other\'s Moon — a natural sense of comfort.',
}

function FullCompatPairs({ pairs, title, isExporting, generationLevel }) {
  const [showAll, setShowAll] = useState(false)
  // Export: trim to oldest 2 generations for large families
  const exportPairs = isExporting && pairs.length > 12
    ? pairs.filter(p => (generationLevel?.[p.a.id] ?? 0) <= 1 && (generationLevel?.[p.b.id] ?? 0) <= 1)
    : pairs
  const trimmedCount = pairs.length - exportPairs.length
  const displayed = showAll ? exportPairs : exportPairs.slice(0, 8)
  return (
    <div className="insight-card insight-full-compat">
      <h3 className="insight-heading">{title}<span className="insight-pro-tag">✦</span></h3>
      <p className="insight-note compat-pair-count">{exportPairs.length} notable pair{exportPairs.length !== 1 ? 's' : ''}</p>
      <p className="insight-whisper" style={{ marginBottom: '0.3rem' }}>
        Cosmic Echo = 4 shared placements · Soul Twins = same Sun + Moon · Cosmic Twins = same Sun · Mirror Signs = opposite signs · Lunar Bond = same Moon · Kindred Spirits = compatible elements
      </p>
      <div className="compat-pair-list">
        {displayed.map(pair => (
          <div key={pairKey(pair.a, pair.b)} className="compat-pair-row">
            <div className="compat-pair-names">
              <span>{pair.a.data.symbol} <strong>{pair.a.data.name}</strong></span>
              <span className="compat-pair-amp">&amp;</span>
              <span>{pair.b.data.symbol} <strong>{pair.b.data.name}</strong></span>
              <span className="compat-pair-rel">{pair.relationLabel}</span>
            </div>
            <p className="insight-compat" style={{ color: pair.color }}>{pair.compatLabel}</p>
            {COMPAT_EXPLAIN[pair.compatLabel] && (
              <p className="insight-whisper" style={{ marginTop: '0.05rem' }}>{COMPAT_EXPLAIN[pair.compatLabel]}</p>
            )}
            {pair.moonNote && (
              <p className="insight-compat" style={{ color: '#9dbbd4', fontSize: '0.72rem', marginTop: '0.1rem' }}>
                ☽ {pair.moonNote}
              </p>
            )}
            {pair.needsTimeCheck && (
              <p className="insight-compat" style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontStyle: 'italic', marginTop: '0.1rem' }}>
                ⚠ Confirm with exact birth time
              </p>
            )}
          </div>
        ))}
      </div>
      {exportPairs.length > 8 && (
        <button type="button" className="compat-show-more-btn" onClick={() => setShowAll(v => !v)}>
          {showAll ? 'Show less' : `Show all ${exportPairs.length} pairs`}
        </button>
      )}
      {trimmedCount > 0 && (
        <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
          + {trimmedCount} more pair{trimmedCount !== 1 ? 's' : ''} from younger generations — see full panel
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
    <div className="insight-card insight-family-roles">
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
                    {role.node.data.name} — {role.derivedRole}.
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
                      ☽ {role.node.data.moonSign} moon — {moonStyle}.
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
                  <p className="insight-note family-role-special">✦ The Bridge — brings {role.node.data.element} energy no one else carries</p>
                )}
              </div>
            )}
          </div>
        )
      })}
      {trimmedCount > 0 && (
        <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
          + {trimmedCount} younger {trimmedCount === 1 ? 'member' : 'members'} — see full panel for all roles
        </p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InsightsPanel({ nodes, edges, onExport, exporting, onAddMore, onGoToTree, onEditFirst, onUpgrade, entitlements, chartTitle, insightsTab = 'insights', onInsightsTabChange, showDig, onShowDig, onCloseDig }) {
  const hasAdvanced = canAccess('advanced_insights', entitlements?.tier, entitlements?.config)
  const hasFullDig = canAccess('full_dig', entitlements?.tier, entitlements?.config)
  const hasFullCompat = canAccess('full_compatibility', entitlements?.tier, entitlements?.config)
  const [digExporting, setDigExporting] = useState(false)
  const isGroupOnly = edges.length > 0 && edges.every(e => {
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
  const groupGaps = useMemo(() => findGaps(nodes), [nodes])
  const groupSaturnLines = useMemo(() => saturnLines(nodes), [nodes])
  const groupJupiterGifts = useMemo(() => jupiterGifts(nodes), [nodes])
  const groupSignMap = useMemo(() => allPlanetsBySign(nodes), [nodes])
  const groupRoles = useMemo(() => deriveRoles(nodes), [nodes])

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
        text: `${src.data.name}'s ${src.data.sign} sun falls on ${tgt.data.name}'s moon, and ${tgt.data.name}'s ${tgt.data.sign} sun falls on ${src.data.name}'s — they each embody what the other feels most deeply. Extraordinarily rare.` })
    } else if (aSunBMoon) {
      insights.push({ score: 8, tagline: 'Sun-Moon Connection', color: '#c4a8d4',
        text: `${src.data.name}'s ${src.data.sign} sun falls on ${tgt.data.name}'s moon — ${src.data.name} naturally embodies what ${tgt.data.name} feels most deeply.` })
    } else if (bSunAMoon) {
      insights.push({ score: 8, tagline: 'Sun-Moon Connection', color: '#c4a8d4',
        text: `${tgt.data.name}'s ${tgt.data.sign} sun falls on ${src.data.name}'s moon — ${tgt.data.name} naturally embodies what ${src.data.name} feels most deeply.` })
    }

    // Venus in partner's sun sign — deep admiration
    if (srcVenus && srcVenus === tgt.data.sign)
      insights.push({ score: 7, tagline: 'Venus Connection', color: 'var(--rose)',
        text: `${src.data.name}'s Venus is in ${tgt.data.sign} — ${src.data.name} is drawn to exactly who ${tgt.data.name} is.` })
    if (tgtVenus && tgtVenus === src.data.sign)
      insights.push({ score: 7, tagline: 'Venus Connection', color: 'var(--rose)',
        text: `${tgt.data.name}'s Venus is in ${src.data.sign} — ${tgt.data.name} is drawn to exactly who ${src.data.name} is.` })

    // Same moon sign — emotional twins
    if (srcMoon && tgtMoon && srcMoon === tgtMoon)
      insights.push({ score: 7, tagline: 'Emotional Twins', color: '#9dbbd4',
        text: `Both ${srcMoon} moons — they feel and process the same way, an almost wordless emotional understanding.` })

    // Same Venus sign — identical love language
    if (srcVenus && tgtVenus && srcVenus === tgtVenus)
      insights.push({ score: 6, tagline: 'Same Love Language', color: 'var(--rose)',
        text: `Both Venus in ${srcVenus} — they show love the same way and want the same things from each other.` })

    // Compatible moons (different signs)
    if (srcMoon && tgtMoon && srcMoon !== tgtMoon) {
      const compat = areCompatible(getElement(srcMoon).element, getElement(tgtMoon).element)
      if (compat)
        insights.push({ score: 5, tagline: 'Emotionally Attuned', color: '#9dbbd4',
          text: `${srcMoon} and ${tgtMoon} moons — compatible emotional styles. ${src.data.name} ${MOON_STYLE[srcMoon] ?? ''}; ${tgt.data.name} ${MOON_STYLE[tgtMoon] ?? ''}.` })
      else
        insights.push({ score: 2, tagline: 'Different Emotional Rhythms', color: '#c9a84c',
          text: `${srcMoon} and ${tgtMoon} moons — they process feelings differently. ${src.data.name} ${MOON_STYLE[srcMoon] ?? ''}; ${tgt.data.name} ${MOON_STYLE[tgtMoon] ?? ''}.` })
    }

    // Mars ↔ Venus elemental pull
    if (srcMars && tgtVenus && areCompatible(getElement(srcMars).element, getElement(tgtVenus).element))
      insights.push({ score: 4, tagline: 'Natural Pull', color: 'var(--rose)',
        text: `${src.data.name}'s ${srcMars} Mars aligns with ${tgt.data.name}'s ${tgtVenus} Venus — natural attraction dynamic.` })
    else if (tgtMars && srcVenus && areCompatible(getElement(tgtMars).element, getElement(srcVenus).element))
      insights.push({ score: 4, tagline: 'Natural Pull', color: 'var(--rose)',
        text: `${tgt.data.name}'s ${tgtMars} Mars aligns with ${src.data.name}'s ${srcVenus} Venus — natural attraction dynamic.` })

    if (insights.length === 0) {
      const compat = areCompatible(src.data.element, tgt.data.element)
      return { tagline: compat ? 'Harmonious' : 'Complementary', taglineColor: compat ? '#7ec845' : '#c9a84c', narrativeItems: [] }
    }

    insights.sort((a, b) => b.score - a.score)
    const top = insights.slice(0, 2)
    return { tagline: top[0].tagline, taglineColor: top[0].color, narrativeItems: top.map(i => i.text) }
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
  const sharedMoonSigns = Object.entries(moonSignCounts)
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])

  function sharedInnerSign(planet) {
    const counts = {}
    innerPlanetData.forEach(d => {
      const sign = d[planet]?.sign
      if (sign) counts[sign] = (counts[sign] || 0) + 1
    })
    return Object.entries(counts)
      .filter(([, c]) => c > 1)
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
  const parentChildEdges = edges.filter(e => e.data?.relationType === 'parent-child')
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
          ? 'Once-in-a-generation cosmic echo — all four personal planets aligned'
          : 'Rare triple alignment — an extraordinarily uncommon bond'
        note = `${matchedPlanets.join(' · ')} — ${label}`
      } else if (sameSun && sameMoon) {
        score = 12; noteType = 'soul-twins'
        note = `Both ${a.data.symbol} ${a.data.sign} ☀ & ☽ ${aMoon} moon — soul twins`
      } else if (sameSun) {
        score = 10; noteType = 'cosmic-twins'
        note = `Both ${a.data.symbol} ${a.data.sign} ☀ — cosmic twins`
      } else if (sameMoon) {
        score = 9; noteType = 'lunar-bond'
        note = `Both ☽ ${aMoon} moon — lunar bond`
      } else if (isOpposite) {
        score = 8; noteType = 'mirror'
        note = `${a.data.symbol} ${a.data.sign} & ${b.data.symbol} ${b.data.sign} — mirror signs`
      } else if (aSunBMoon) {
        score = 7; noteType = 'sun-moon-reflection'
        note = `${a.data.symbol} ${a.data.sign} ☀ meets ${b.data.name}'s ☽ ${bMoon} moon`
      } else if (bSunAMoon) {
        score = 7; noteType = 'sun-moon-reflection'
        note = `${b.data.symbol} ${b.data.sign} ☀ meets ${a.data.name}'s ☽ ${aMoon} moon`
      } else if (compatElem && (isSibling || isCousin)) {
        score = 5; noteType = 'natural-flow'
        note = `${a.data.element} & ${b.data.element} — natural flow`
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
        if (sameMoon) moonNote = `Same ☽ ${aMoon} moon — emotional mirror too`
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
        allCompatPairs.push({ a, b, relationLabel, score, compatLabel, color, moonNote, needsTimeCheck })
      }
    }
  }
  allCompatPairs.sort((x, y) => y.score - x.score || (x.a.data.birthdate || '9999').localeCompare(y.a.data.birthdate || '9999'))

  // Select mode for large families: only show highest-scoring pairs
  const isSelectMode = allCompatPairs.length > 12
  const compatDisplayPairs = isSelectMode ? allCompatPairs.filter(p => p.score >= 3) : allCompatPairs
  const compatTitle = isSelectMode ? 'Select Compatibility' : 'Full Compatibility Report'

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
      signatureDesc: FAMILY_SIGNATURE_DESCRIPTIONS[dominant]?.[dominantModality] ?? '',
      topBonds,
      signThreadList,
      memberRoles,
      couples,
      plutoGroups,
    }
  }, [nodes, edges, dominant, dominantModality, masculine, feminine, total, missingElements, topBonds, signThreadList, memberRoles, couples, isGroupOnly])

  if (tooFewNodes) {
    return (
      <div className="insights-panel">
        <h2 className="form-title">✦ {panelTitle}</h2>
        <p className="bulk-hint">Add at least two members to reveal your celestial patterns.</p>
        <div className="insight-card insight-coming-soon">
          <h3 className="insight-heading">What you'll unlock</h3>
          <p className="insight-note">🔥 <strong>Elemental makeup</strong> — which elements dominate your group</p>
          <p className="insight-note">♊ <strong>Shared signs</strong> — who carries the same cosmic energy</p>
          <p className="insight-note">💞 <strong>Partner harmony</strong> — elemental compatibility for couples</p>
          <p className="insight-note">🔁 <strong>Sign &amp; element threads</strong> — cosmic patterns across generations</p>
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
            Your members are in — now <strong>connect them</strong> to unlock partner harmony, sign threads, compatibility scores, and more.
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
    <div className="insights-panel">
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
            >✦ The DIG{hasAdvanced && <span className="pro-tag pro-tag--subtle">✦</span>}</button>
          </nav>
          {onExport && insightsTab === 'insights' && (
            <button
              type="button"
              className="insights-export-btn--mobile-top"
              onClick={onExport}
              disabled={exporting}
            >{exporting ? '…' : '↓'}</button>
          )}
        </div>
      )}

      {/* ── The DIG section ────────────────────────────────────────────── */}
      {insightsTab === 'dig' && edges.length > 0 && (
        <div className="dig-section">
          <div className="dig-section-header">
            <h3 className="dig-section-title">✦ The DIG</h3>
            <p className="dig-section-desc">Your family's cosmic story — a Spotify Wrapped-style experience of your family's astrological DNA.</p>
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
                      await navigator.share({ files: [file], title: 'The DIG — AstroDig', text: 'My family\'s cosmic story ✦' })
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
                    await navigator.share({ files: [file], title: 'The DIG — AstroDig', text: 'My family\'s cosmic story ✦' })
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

      {/* ── Insight cards (hidden when DIG tab active) ─────────────── */}
      {insightsTab === 'insights' && (<>

      <p className="insight-whisper insight-whisper--standalone" style={{ textAlign: 'center', padding: '0.2rem 1rem 0.4rem' }}>
        These insights describe tendencies and patterns, not certainties. A birth chart is one layer of a much bigger picture — how you live it evolves over time.
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
      />

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
                  <strong style={{ color: ELEMENT_COLORS[element] }}>{count} {element}</strong> — {blurb}.
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
          Sun sign reflects how you tend to show up in the world — your outward identity and the energy others notice first.
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
                    <strong style={{ color: ELEMENT_COLORS[element] }}>{count} {element}</strong> — {blurb}.
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
            Moon sign speaks to emotional needs and inner rhythms — it often tells a different story than the Sun sign, and that tension is part of what makes a chart interesting.
          </p>
        </div>
      )}

      {/* Collective Element Map — FREE, all planets across all members */}
      {groupElementMap.total >= 4 && (
        <div className="insight-card">
          <h3 className="insight-heading">Collective Element Map</h3>
          <p className="insight-whisper">Counting personal planets — Sun, Moon, Mercury, Venus, and Mars — across every member.</p>
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
          {groupElementMap.missing.length > 0 && (
            <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.3rem' }}>
              Missing {groupElementMap.missing.join(' and ')} — those qualities may be sought outside the {isGroupOnly ? 'group' : 'family'}.
            </p>
          )}
          <p className="insight-whisper" style={{ marginTop: '0.4rem' }}>
            {groupElementMap.total} total placements across {nodes.length} people. When one element dominates, its qualities tend to shape the group dynamic. Missing elements may show up as blind spots or things the group seeks elsewhere.
          </p>
        </div>
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
          .filter(([, data]) => data.total >= 2)
          .sort((a, b) => b[1].total - a[1].total)
        if (concentrated.length === 0) return null
        return (
          <div className="insight-card">
            <h3 className="insight-heading">Sign Threads</h3>
            <p className="insight-whisper">Signs that appear more than once across personal planets in the group.</p>
            {concentrated.slice(0, 6).map(([sign, data]) => {
              const parts = Object.entries(data.planets)
                .map(([planet, count]) => `${count} ${planet}`)
              return (
                <p key={sign} className="insight-note">
                  {SIGN_SYMBOLS[sign]} <strong>{sign}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {' '}— {data.total} placement{data.total > 1 ? 's' : ''} ({parts.join(', ')})
                  </span>
                </p>
              )
            })}
          </div>
        )
      })()}

      {/* 5. Shared Moon Signs */}
      {sharedMoonSigns.length > 0 && (
        <div className="insight-card">
          <h3 className="insight-heading">☽ Shared Moon Signs</h3>
          {sharedMoonSigns.map(([sign]) => {
            const members = moonNodes.filter(n => n.data.moonSign === sign).sort(byAge)
            return (
              <p key={sign} className="insight-note">
                <PlanetSign planet="moon" symbol={members[0].data.moonSymbol} sign={sign} />
                {' '}—{' '}
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
              ⚠ Moon near sign boundary — add birth time for certainty
            </p>
          )}
        </div>
      )}

      {/* ── Premium insights gate ───────────────────────────────────────── */}
      {!hasAdvanced && (() => {
        const rareCount = topBonds.filter(b => b.noteType === 'cosmic-echo' || b.noteType === 'rare-alignment').length
        const items = [
          topBonds.length > 0 && { icon: '✦', label: `${topBonds.length} Notable Bond${topBonds.length > 1 ? 's' : ''}`, detail: rareCount > 0 ? `including ${rareCount} rare` : `between ${topBonds[0]?.a.data.name} & others` },
          (sharedVenusSigns.length + sharedMarsSigns.length) > 0 && { icon: '♀♂', label: 'Venus & Mars Shared Signs', detail: `${sharedVenusSigns.length + sharedMarsSigns.length} match${sharedVenusSigns.length + sharedMarsSigns.length > 1 ? 'es' : ''} found` },
          couples.length > 0 && { icon: '💕', label: 'Partner Compatibility', detail: `${couples.length} pair${couples.length > 1 ? 's' : ''} — ${couples[0]?.src.data.name} & ${couples[0]?.tgt.data.name}${couples.length > 1 ? ' + more' : ''}` },
          signThreadList.length > 0 && { icon: '🧬', label: 'Zodiac Threads', detail: `${signThreadList.length} sign${signThreadList.length > 1 ? 's' : ''} running through generations` },
          { icon: '★', label: 'Planetary Patterns', detail: 'sign concentrations across the group' },
          { icon: '🎭', label: `${isGroupOnly ? 'Group' : 'Family'} Roles & Archetypes`, detail: `${nodes.length} members analyzed` },
          { icon: '🌸', label: `${isGroupOnly ? 'Group' : 'Family'} Arrivals`, detail: 'seasonal birth patterns' },
          { icon: '📊', label: 'Full Compatibility Report', detail: 'deep dive for every connection' },
          { icon: '🪐', label: 'Pluto Generations', detail: 'generational themes & shifts' },
          groupHotspots.length > 0 && { icon: '★', label: 'Group Hotspots', detail: `${groupHotspots.length} concentration zone${groupHotspots.length > 1 ? 's' : ''} found` },
          groupGaps && { icon: '◌', label: 'The Gaps', detail: 'what the group may be missing' },
          groupSaturnLines.length > 0 && { icon: '♄', label: 'Saturn Lines', detail: 'shared growth & responsibility' },
          groupJupiterGifts.length > 0 && { icon: '♃', label: 'Jupiter Gifts', detail: 'where the group expands' },
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
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>— {item.detail}</span>
              </div>
            ))}
          </div>
        </div>
        )
      })()}

      {hasAdvanced && (<>
      {/* 4. Notable Bonds (premium) */}
      {topBonds.length > 0 && (() => {
        const BOND_EXPLAIN = {
          'cosmic-echo': 'Multiple personal planets in the same sign is extraordinarily rare — it suggests a deep, almost fated resonance between these two.',
          'rare-alignment': 'Three shared sign placements is uncommon and tends to create a feeling of being fundamentally understood by the other person.',
          'soul-twins': 'Sharing both Sun and Moon signs means their outward identity and inner emotional world are built from the same material — they may instinctively understand each other.',
          'cosmic-twins': 'Same Sun sign means they tend to express themselves in similar ways — they may see parts of themselves reflected in each other.',
          'lunar-bond': 'Shared Moon sign suggests similar emotional needs and instincts — they may process feelings in the same way without having to explain.',
          'mirror': 'Opposite signs sit across the zodiac from each other — they often represent complementary qualities that can feel magnetic or challenging.',
          'sun-moon-reflection': 'When one person\'s Sun lands on the other\'s Moon, it can create a natural sense of comfort — one embodies outwardly what the other feels inwardly.',
          'natural-flow': 'Compatible elements (Fire-Air or Earth-Water) tend to support and amplify each other — these two may find it easy to get along.',
        }
        return (
        <div className="insight-card">
          <h3 className="insight-heading">Notable Bonds<span className="insight-pro-tag">✦</span></h3>
          {topBonds.map(({ a, b, note, noteType, rel, needsTimeCheck }) => {
            const isRare = noteType === 'cosmic-echo' || noteType === 'rare-alignment'
            const color  = isRare                             ? 'var(--gold)'
                         : noteType === 'soul-twins'          ? 'var(--gold)'
                         : noteType === 'cosmic-twins'        ? 'var(--gold)'
                         : noteType === 'lunar-bond'          ? '#9dbbd4'
                         : noteType === 'mirror'              ? 'var(--rose)'
                         : noteType === 'sun-moon-reflection' ? '#c4a8d4'
                         : '#7ec845'
            return (
              <div key={pairKey(a, b)} className={`insight-couple${isRare ? ' insight-couple--rare' : ''}`}>
                {isRare && (
                  <p className="insight-rare-badge">
                    {noteType === 'cosmic-echo' ? '✦✦✦ Extremely Rare' : '✦✦ Rare'}
                  </p>
                )}
                <p className="insight-note">
                  <strong>{a.data.name}</strong> &amp; <strong>{b.data.name}</strong>
                  {rel && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}> — {rel}</span>}
                </p>
                <p className="insight-compat" style={{ color }}>{note}</p>
                {BOND_EXPLAIN[noteType] && (
                  <p className="insight-whisper" style={{ marginTop: '0.1rem' }}>
                    {BOND_EXPLAIN[noteType]}
                  </p>
                )}
                {needsTimeCheck && (
                  <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.1rem' }}>
                    ⚠ Confirm with exact birth time
                  </p>
                )}
              </div>
            )
          })}
        </div>
        )
      })()}

      {/* 6. Shared Venus & Mars Signs (premium) */}
      {(sharedVenusSigns.length > 0 || sharedMarsSigns.length > 0) && (
        <div className="insight-card">
          <h3 className="insight-heading">♀ Venus · ♂ Mars — Shared Signs<span className="insight-pro-tag">✦</span></h3>
          {sharedVenusSigns.map(({ sign, symbol, members }) => (
            <div key={`v-${sign}`} style={{ marginBottom: '0.35rem' }}>
              <p className="insight-note">
                <PlanetSign planet="venus" symbol={symbol} sign={sign} />
                {' '}— {members.map(m => m.data.name).join(', ')}
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
                {' '}— {members.map(m => m.data.name).join(', ')}
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
      )}

      {/* 7. Partner Compatibility */}
      {couples.length > 0 && (
        <div className="insight-card">
          <h3 className="insight-heading">Partner Compatibility<span className="insight-pro-tag">✦</span></h3>
          {couples.map(({ src, tgt }, i) => {
            const { tagline, taglineColor, narrativeItems } = buildCoupleAnalysis(src, tgt)
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
              </div>
            )
          })}
        </div>
      )}

      {/* 9. Sign Threads */}
      {signThreadList.length > 0 && (
        <div className="insight-card">
          <h3 className="insight-heading">Sign Threads<span className="insight-pro-tag">✦</span></h3>
          <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.3rem' }}>
            The same sun or moon sign running through a parent-child line.
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

      {/* 9. Zodiac Threads */}
      {topZodiacThreads.length > 0 && (
        <div className="insight-card">
          <h3 className="insight-heading">Zodiac Threads<span className="insight-pro-tag">✦</span></h3>
          <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.1rem' }}>
            Like a gene that runs in families — this sign keeps showing up across generations, carried through different planets in different people.
          </p>
          {topZodiacThreads.map(({ sign, byGen, gens }) => (
            <div key={sign} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <p className="insight-note">
                <strong>{SIGN_SYMBOLS[sign]} {sign}</strong>
                {' '}—{' '}
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
                  {isGroupOnly ? ZODIAC_THREAD_BLURB[sign].replace(/\bthis family\b/gi, 'this group').replace(/\bthe family\b/gi, 'the group') : ZODIAC_THREAD_BLURB[sign]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 10. Full Compatibility Report */}
      {compatDisplayPairs.length > 0 && hasFullCompat && (
        <FullCompatPairs pairs={compatDisplayPairs} title={compatTitle} isExporting={exporting} generationLevel={generationLevel} />
      )}

      {/* 11. Family Roles */}
      {memberRoles.length >= 2 && (
        <FamilyRoles memberRoles={memberRoles} isExporting={exporting} generationLevel={generationLevel} isGroupOnly={isGroupOnly} />
      )}

      {/* 12. Family Arrivals */}
      {arrivalGroups.length > 0 && (
        <div className="insight-card">
          <h3 className="insight-heading">✦ Family Arrivals<span className="insight-pro-tag">✦</span></h3>
          <p className="insight-note" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
            What each child brought to the mix — in energy, personality, and the family dynamic.
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
                        {' '}— {main}
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
      )}

      {/* 11. Dominant Sign */}
      {topSigns.length > 0 && (
        <div className="insight-card">
          <h3 className="insight-heading">★ Planetary Patterns<span className="insight-pro-tag">✦</span></h3>
          <p className="insight-whisper" style={{ marginBottom: '0.2rem' }}>
            The sign(s) holding the most personal planets across the whole group.
          </p>
          {topSigns.map(([sign, { total, planets }]) => {
            const planetLine = Object.entries(planets)
              .sort((a, b) => ['sun','moon','mercury','venus','mars'].indexOf(a[0]) - ['sun','moon','mercury','venus','mars'].indexOf(b[0]))
              .map(([p, c]) => `${PLANET_GLYPH[p]}${c > 1 ? ` ×${c}` : ''}`)
              .join('  ')
            return (
              <p key={sign} className="insight-note">
                <strong>{SIGN_SYMBOLS[sign]} {sign}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}> — {total} planet{total > 1 ? 's' : ''} &nbsp; {planetLine}</span>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.1rem' }}>
                  {SIGN_FLAVOR[sign]}
                </span>
              </p>
            )
          })}
        </div>
      )}

      {/* Group Hotspots — degree clusters across members */}
      {groupHotspots.length > 0 && (() => {
        function describeHotspot(spot) {
          const SIGN_THEMES = {
            Aries:       { core: 'initiative and action', daily: 'Conversations may move fast. New ideas tend to spark quickly — follow-through may be the challenge.' },
            Taurus:      { core: 'comfort and stability', daily: 'Shared meals, familiar routines, and creating physical warmth together may be a recurring theme.' },
            Gemini:      { core: 'communication and ideas', daily: 'Gatherings probably run long. The group may process everything by talking it through — sometimes at the same time.' },
            Cancer:      { core: 'emotional safety and home', daily: 'Loyalty runs deep here. Family traditions, shared memories, and a strong protective instinct may define the group dynamic.' },
            Leo:         { core: 'self-expression and warmth', daily: 'Celebrating each other may come naturally. The group might be drawn to big moments and making sure no one feels overlooked.' },
            Virgo:       { core: 'precision and service', daily: 'Helping each other is a love language here. Standards may run high — both for the group and for themselves.' },
            Libra:       { core: 'harmony and fairness', daily: 'Conflict avoidance may be a pattern. Real effort goes into keeping things balanced — sometimes at the cost of directness.' },
            Scorpio:     { core: 'depth and honesty', daily: 'Surface-level interactions may not satisfy this group. There\'s likely a preference for truth, even when it\'s uncomfortable.' },
            Sagittarius: { core: 'meaning and expansion', daily: 'Big questions, new experiences, and a restless need to keep growing may bring the group together — and pull it in new directions.' },
            Capricorn:   { core: 'responsibility and structure', daily: 'The group may naturally organize around goals and timelines. Long-term planning might be a shared strength — and a shared pressure.' },
            Aquarius:    { core: 'independence and innovation', daily: 'Doing things differently may be a point of pride. The group might resist convention and gravitate toward unconventional approaches.' },
            Pisces:      { core: 'empathy and sensitivity', daily: 'Unspoken feelings may carry a lot of weight. Creative or spiritual pursuits might be where the group feels most connected.' },
          }
          const theme = SIGN_THEMES[spot.sign]
          if (!theme) return null
          const hasMoon = spot.planets.some(p => p.planet === 'moon')
          const hasVenus = spot.planets.some(p => p.planet === 'venus')
          const hasMars = spot.planets.some(p => p.planet === 'mars')
          let extra = ''
          if (hasMoon && hasVenus) extra = ' With both Moon and Venus here, emotional needs and how love is expressed may be closely intertwined.'
          else if (hasMoon) extra = ' With Moon placements here, this zone touches the group\'s emotional core.'
          else if (hasVenus) extra = ' With Venus here, this zone shapes how the group connects and shows affection.'
          else if (hasMars) extra = ' With Mars here, this is where the group\'s drive and motivation tend to concentrate.'
          return `A shared pull toward ${theme.core}. ${theme.daily}${extra}`
        }
        return (
        <div className="insight-card">
          <h3 className="insight-heading">Group Hotspots<span className="insight-pro-tag">✦</span></h3>
          <p className="insight-whisper">Zones of the zodiac where multiple people's planets concentrate — these themes tend to echo through the group's daily life.</p>
          {groupHotspots.slice(0, 3).map((spot, i) => (
            <div key={i} style={{ marginBottom: '0.6rem' }}>
              <p className="insight-note">
                <strong style={{ color: ELEMENT_COLORS[getElement(spot.sign).element] }}>
                  {SIGN_SYMBOLS[spot.sign]} {spot.sign}
                </strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  {' '}— {spot.planets.length} planets from {spot.peopleCount} people
                </span>
              </p>
              <p className="insight-note" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '1rem' }}>
                {spot.planets.map(p => `${p.glyph} ${p.person}`).join(', ')}
              </p>
              {describeHotspot(spot) && (
                <p className="insight-note" style={{ fontSize: '0.72rem', paddingLeft: '1rem', marginTop: '0.15rem' }}>
                  {describeHotspot(spot)}
                </p>
              )}
            </div>
          ))}
          {/* What's missing — integrated from Gaps analysis */}
          {groupGaps && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <p className="insight-note" style={{ fontWeight: 500 }}>What's missing</p>
              <p className="insight-note" style={{ fontSize: '0.75rem' }}>{groupGaps.description}</p>
              {groupGaps.gapSigns.length > 0 && (
                <p className="insight-note" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  {groupGaps.gapSigns.map(s => `${SIGN_SYMBOLS[s]} ${s}`).join(', ')}
                </p>
              )}
              <p className="insight-whisper" style={{ marginTop: '0.2rem' }}>
                Gaps aren't weaknesses — they're areas where the group may seek those qualities in others or develop them over time.
              </p>
            </div>
          )}
        </div>
        )
      })()}

      {/* The Gaps — standalone card when no hotspots exist */}
      {groupHotspots.length === 0 && groupGaps && (
        <div className="insight-card">
          <h3 className="insight-heading">The Gaps<span className="insight-pro-tag">✦</span></h3>
          <p className="insight-note">{groupGaps.description}</p>
          {groupGaps.gapSigns.length > 0 && (
            <p className="insight-note" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {groupGaps.gapSigns.map(s => `${SIGN_SYMBOLS[s]} ${s}`).join(', ')}
            </p>
          )}
          <p className="insight-whisper" style={{ marginTop: '0.3rem' }}>
            Gaps aren't weaknesses — they're areas where the group may seek those qualities in others or develop them over time.
          </p>
        </div>
      )}

      {/* Saturn Lines — shared structural themes */}
      {groupSaturnLines.length > 0 && groupSaturnLines.some(g => g.members.length >= 2) && (
        <div className="insight-card">
          <h3 className="insight-heading">♄ Saturn Lines<span className="insight-pro-tag">✦</span></h3>
          <p className="insight-whisper">Saturn's sign reflects where each person tends to carry responsibility and face their deepest growth.</p>
          {groupSaturnLines.filter(g => g.members.length >= 1).map(g => (
            <div key={g.sign} style={{ marginBottom: '0.4rem' }}>
              <p className="insight-note">
                <strong>{SIGN_SYMBOLS[g.sign]} Saturn in {g.sign}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  {' '}— {g.names.join(', ')}
                </span>
              </p>
              <p className="insight-note" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '1rem' }}>
                {g.theme}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Jupiter Gifts — shared growth areas */}
      {groupJupiterGifts.length > 0 && groupJupiterGifts.some(g => g.members.length >= 2) && (
        <div className="insight-card">
          <h3 className="insight-heading">♃ Jupiter Gifts<span className="insight-pro-tag">✦</span></h3>
          <p className="insight-whisper">Jupiter's sign points to where each person tends to find expansion, luck, and natural ease.</p>
          {groupJupiterGifts.filter(g => g.members.length >= 1).map(g => (
            <div key={g.sign} style={{ marginBottom: '0.4rem' }}>
              <p className="insight-note">
                <strong>{SIGN_SYMBOLS[g.sign]} Jupiter in {g.sign}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  {' '}— {g.names.join(', ')}
                </span>
              </p>
              <p className="insight-note" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '1rem' }}>
                {g.theme}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 11. Pluto Generations */}
      {(() => {
        const genMap = {}
        nodes.forEach(n => {
          const ps = getPlutoSign(n.data.birthdate)
          if (ps) { if (!genMap[ps]) genMap[ps] = []; genMap[ps].push(n) }
        })
        const present = PLUTO_ORDER.filter(s => genMap[s])
        if (present.length < 2) return null
        return (
          <div className="insight-card">
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
                    {' — '}{members.length} {members.length === 1 ? 'member' : 'members'}
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
          <span className="dig-teaser-text">See your family's cosmic story — Wrapped-style slides, shareable highlights, and more.</span>
          <span className="dig-teaser-arrow">View The DIG →</span>
        </button>
      )}

      </>)}
      {/* ── end insight cards ─────────────────────────────────────────── */}

      {/* 14. Consult CTA — only on insights tab */}
      {insightsTab === 'insights' && <div className="insight-consult-cta">
        <p className="insight-consult-cta-text">
          <strong>Want a deeper reading?</strong> Book a personal astrology consultation with Christina — explore your chart, your family's patterns, and what the stars reveal about your connections.
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
      </div>}

      {/* Bottom download button */}
      {onExport && insightsTab === 'insights' && (
        <button
          type="button"
          className="relayout-btn relayout-btn--share insights-export-btn insights-export-btn--bottom"
          onClick={onExport}
          disabled={exporting}
          style={{ width: '100%', marginTop: '0.5rem' }}
        >
          {exporting ? '…' : '↓ Download Insights'}
        </button>
      )}

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
