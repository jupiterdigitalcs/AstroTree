import { useState } from 'react'

const EXCLUDE_WITHOUT_TIME = new Set(['Moon', 'Mercury'])
const OUTER_PLANETS = new Set(['Uranus', 'Neptune', 'Pluto'])
// Jupiter paired with slow planets is generational — everyone born in a similar year shares it
const GENERATIONAL_PAIR = (a, b) =>
  (OUTER_PLANETS.has(a) && OUTER_PLANETS.has(b)) ||
  (a === 'Jupiter' && (b === 'Saturn' || OUTER_PLANETS.has(b))) ||
  (b === 'Jupiter' && (a === 'Saturn' || OUTER_PLANETS.has(a))) ||
  (a === 'Saturn' && OUTER_PLANETS.has(b)) ||
  (b === 'Saturn' && OUTER_PLANETS.has(a))

const PLANET_ORDER = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']

const ASPECT_ANGLE = { conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180 }
const ASPECT_LABEL = { conjunction: 'Conjunction', sextile: 'Sextile', trine: 'Trine', square: 'Square', opposition: 'Opposition' }
const ASPECT_SYMBOLS = { conjunction: '☌', opposition: '☍', trine: '△', square: '□', sextile: '⚹' }

const PLANET_FILTER_OPTIONS = [
  { key: 'Sun',     glyph: '☀' },
  { key: 'Moon',    glyph: '☽' },
  { key: 'Mercury', glyph: '☿' },
  { key: 'Venus',   glyph: '♀' },
  { key: 'Mars',    glyph: '♂' },
  { key: 'Jupiter', glyph: '♃' },
  { key: 'Saturn',  glyph: '♄' },
]

// ── Descriptions (voice matches InsightsPanel's ASPECT_PAIR_BLURB) ─────────────

// Descriptions follow Christina's voice: no em dashes, plain language, both strengths and challenges,
// mirror not cause framing. Short for table context.
const PAIR_BLURBS = {
  'Moon:Sun': {
    soft: 'Identity and emotional life flow well together. There is a natural ease in knowing who this person is.',
    hard: 'There can be tension between inner feeling and outward self. What is felt is not always what is shown.',
    conj: 'Identity and emotion are deeply fused. This person tends to live very much from the inside out.',
  },
  'Mercury:Sun': {
    soft: 'Mind and identity work well together. Clear, confident self-expression tends to come naturally.',
    hard: 'Ego and communication can work against each other. Self-image may get tested through how they express themselves.',
    conj: 'Thinking and identity are tightly linked. This person is often defined by how they communicate.',
  },
  'Sun:Venus': {
    soft: 'Identity and values are closely connected. Warmth and an ease with love tend to come through naturally.',
    hard: 'Self-worth and love can pull against each other. What feels deserved and what is received may not always match.',
    conj: 'Identity and values are deeply intertwined. This person tends to define themselves through their loves and loyalties.',
  },
  'Mars:Sun': {
    soft: 'Drive and identity reinforce each other. This person tends to know what they want and move toward it.',
    hard: 'Will and ego can work against each other. Asserting oneself without overriding connection takes ongoing awareness.',
    conj: 'Drive and identity are fused. This person tends to act from a place of strong personal will.',
  },
  'Moon:Mercury': {
    soft: 'Thinking and feeling tend to complement each other. Emotion is often expressed with real clarity.',
    hard: 'Head and heart can pull in different directions. Logic and emotion may not often land in the same place.',
    conj: 'Thinking and feeling are hard to separate. Emotion and logic tend to run together in this person.',
  },
  'Moon:Venus': {
    soft: 'Warmth and emotional openness tend to come naturally to this person.',
    hard: 'Emotional needs and love can feel misaligned. There may be a push-pull around love and belonging.',
    conj: 'Love and emotional life are deeply fused. This person tends to feel love intensely and personally.',
  },
  'Mars:Moon': {
    soft: 'Emotional energy tends to translate into action. Protective instinct and motivation often go hand in hand.',
    hard: 'Emotional reactions can escalate quickly. Defensiveness or volatility may show up under pressure.',
    conj: 'Emotions are felt fast and acted on quickly. There is a fierce protective instinct in this person.',
  },
  'Mercury:Venus': {
    soft: 'Warmth tends to come through in how this person communicates. Affection and words flow together naturally.',
    hard: 'Words and affection can work at cross-purposes. Tone and intention may get crossed in communication.',
    conj: 'Love tends to be expressed through language. This person often needs to talk through feelings to feel close.',
  },
  'Mars:Mercury': {
    soft: 'Thinking tends to be sharp and direct. This person often speaks without holding back.',
    hard: 'A quick temper and cutting words can be a pattern. There may be a tendency toward arguments.',
    conj: 'Mind and action are tightly linked. This person tends to think fast and act even faster.',
  },
  'Mars:Venus': {
    soft: 'Passion and desire tend to flow easily. This person is generally comfortable with wanting and being wanted.',
    hard: 'Desire and conflict can run close together. There may be a push-pull between attraction and friction.',
    conj: 'Passion and magnetism tend to define this person\'s approach to love.',
  },
  'Jupiter:Sun': {
    soft: 'Optimism and generosity tend to come through in self-expression. There is often a broad, hopeful vision.',
    hard: 'Ambition and overreach can pull against each other. Reaching beyond the grasp is a recurring pattern.',
    conj: 'Identity tends to be expansive and generous. This person thinks big and leads with faith in themselves.',
  },
  'Saturn:Sun': {
    soft: 'Discipline and high standards tend to be woven into identity. Building steadily through responsibility is a strength.',
    hard: 'Heavy expectations and self-doubt can be recurring patterns. Achievement may come, but often at a cost.',
    conj: 'Identity is shaped by responsibility and hard-won respect. This person carries the weight of high standards.',
  },
  'Jupiter:Moon': {
    soft: 'Emotional generosity and optimism tend to be strengths. Comfort is often found in abundance and meaning.',
    hard: 'Emotional excess can show up as a tendency to feel things to an overwhelming degree.',
    conj: 'This person tends to feel things on a grand scale. Emotion is experienced expansively and deeply.',
  },
  'Moon:Saturn': {
    soft: 'Emotional discipline tends to build real depth. Security is often earned slowly and held carefully.',
    hard: 'There can be a pattern of emotional withholding. Warmth may feel conditional or hard to access.',
    conj: 'Nurturing and limitation are bound together here. Love tends to be expressed through duty and responsibility.',
  },
  'Jupiter:Mercury': {
    soft: 'Broad thinking and expansive communication tend to be strengths. Big ideas and storytelling come naturally.',
    hard: 'Big talk and overconfidence can show up as a pattern. Ideas may not always match reality.',
    conj: 'This person tends to think big and argue well. Wide-ranging ideas and a love of debate are common.',
  },
  'Mercury:Saturn': {
    soft: 'Communication tends to be careful and deliberate. Words are generally chosen with real intention.',
    hard: 'Words can carry a lot of weight and criticism. Communication may wound or withhold.',
    conj: 'Thinking tends to be serious and precise. This person does not speak lightly.',
  },
  'Jupiter:Venus': {
    soft: 'Warmth, generosity, and a love of beauty tend to be recurring strengths.',
    hard: 'Excess in love can be a pattern. There may be a tendency to overdo affection or avoid hard truths.',
    conj: 'A love of beauty and abundance tends to define this person. They give generously and expect to be met in kind.',
  },
  'Saturn:Venus': {
    soft: 'Love tends to build slowly and last. Loyalty earned through time and commitment is a real strength.',
    hard: 'Love and restriction can run together. Emotional distance or withheld affection may be a recurring pattern.',
    conj: 'This person tends to approach love with caution. Loyalty is earned slowly, felt deeply, and sometimes carried as a burden.',
  },
  'Jupiter:Mars': {
    soft: 'Enthusiasm and momentum tend to be strengths. This person moves toward what is exciting with real confidence.',
    hard: 'Reckless action and overreach can show up. There may be a tendency to burn out in pursuit of more.',
    conj: 'There is a real appetite for action and adventure here. This person tends to move fast toward what excites them.',
  },
  'Mars:Saturn': {
    soft: 'Drive tends to be channeled through discipline. Acting with patience and purpose is a genuine strength.',
    hard: 'Action can keep running into walls. Effort may feel blocked by structure or turn inward as frustration.',
    conj: 'Drive tends to be tempered by discipline and strategy. This person acts carefully, even when it costs something.',
  },
  'Sun:Uranus': {
    soft: 'Originality and independence tend to be woven into identity. Doing things a different way comes naturally.',
    hard: 'Identity and belonging can pull against each other. Individuality may create disruption.',
    conj: 'Independence is woven into identity. This person tends not to follow the script.',
  },
  'Neptune:Sun': {
    soft: 'Sensitivity and spiritual openness tend to come through in self-expression. Beauty and meaning matter deeply.',
    hard: 'Idealization or confusion around identity can be a recurring pattern. Seeing what one wants to see is a risk.',
    conj: 'Identity and idealism tend to blur together. This person may struggle to separate who they are from who they wish to be.',
  },
  'Pluto:Sun': {
    soft: 'There is a real gift for transformation here. This person tends to reinvent and grow stronger through change.',
    hard: 'Recurring encounters with power, control, and loss are possible. This person may be shaped by forces not always chosen.',
    conj: 'Intensity and reinvention tend to be defining threads. This person is forged through depth and transformation.',
  },
  'Moon:Uranus': {
    soft: 'Emotional independence and a need for space tend to be present. Freedom matters even within close bonds.',
    hard: 'Emotional unpredictability can show up. Nurturing may feel erratic or suddenly absent.',
    conj: 'This person tends to have a restless emotional life. Space and individuality are valued, even in intimate bonds.',
  },
  'Moon:Neptune': {
    soft: 'Deep empathy and emotional sensitivity tend to be strengths. This person may feel others\' pain as their own.',
    hard: 'Emotional confusion and porous boundaries can show up. Absorbing others\' feelings or losing oneself in them is a risk.',
    conj: 'The line between inner feeling and the outside world can be thin here. Deep empathy may blur into dissolution.',
  },
  'Moon:Pluto': {
    soft: 'Emotional depth and resilience tend to be real strengths. Feeling things deeply is part of how this person grows.',
    hard: 'Emotional intensity can become consuming. Grief and power struggles may show up as recurring themes.',
    conj: 'This person tends to feel everything fully, including the most difficult parts.',
  },
  'Mercury:Uranus': {
    soft: 'Thinking tends to be quick and unconventional. Surprising insights that don\'t follow the usual logic are common.',
    hard: 'Communication can be erratic. There may be a pattern of disrupting conversations without always landing.',
    conj: 'The mind tends to be fast and unpredictable. This person often surprises others with what comes out.',
  },
  'Mercury:Neptune': {
    soft: 'Intuitive, imaginative communication tends to be a strength. Truth found in metaphor and story comes naturally.',
    hard: 'Vagueness or wishful thinking can show up. Clarity may be hard to pin down.',
    conj: 'Intuition and imagination tend to drive how this person thinks and communicates.',
  },
  'Mercury:Pluto': {
    soft: 'Deep, searching thinking tends to be a strength. This person probes beneath the surface and finds what others miss.',
    hard: 'There can be a tendency toward obsessive or controlling communication. Words may be used to uncover but also to dominate.',
    conj: 'There is a real need to know the truth here. This person tends to uncover what others gloss over.',
  },
  'Uranus:Venus': {
    soft: 'An unconventional approach to love tends to be present. Freshness and freedom in relationships are valued.',
    hard: 'Sudden disruptions in love and difficulty with commitment can show up. Being tied down tends to feel limiting.',
    conj: 'This person tends to approach love on their own terms. The relationship rulebook is not always followed.',
  },
  'Neptune:Venus': {
    soft: 'Romantic idealism and a capacity for compassionate, transcendent love tend to be strengths.',
    hard: 'Idealizing love and feeling let down by reality can be a recurring pattern. Illusion in relationships is a risk.',
    conj: 'There tends to be a deeply romantic thread here. Love may feel like a spiritual longing, sometimes at odds with what is real.',
  },
  'Pluto:Venus': {
    soft: 'Love tends to run deep and transformative. Bonds that change people in lasting ways are a recurring theme.',
    hard: 'Obsession and power dynamics in love can show up. All-or-nothing relationships may be a pattern.',
    conj: 'Love tends to be intense and consuming here. Bonds transform, though they don\'t always survive the transformation.',
  },
  'Mars:Uranus': {
    soft: 'Bursts of inspiration and original action tend to be strengths. Moving when others hesitate comes naturally.',
    hard: 'Impulsive and erratic action can show up. Sudden outbursts and unpredictable choices are possible.',
    conj: 'Energy tends to be unpredictable and sudden. This person often surprises others, and sometimes themselves.',
  },
  'Mars:Neptune': {
    soft: 'Drive tends to be in service of something meaningful. Energy channeled toward ideals is a real strength.',
    hard: 'Energy can get dissipated or misdirected. Acting on unclear impulses or giving too much away is a risk.',
    conj: 'Drive and idealism tend to be fused here. Energy goes toward things that can\'t always be seen or measured.',
  },
  'Mars:Pluto': {
    soft: 'Powerful, focused determination tends to be a strength. Full commitment and endurance are real assets.',
    hard: 'Intense will and a tendency toward compulsion or conflict can show up. Pushing hard without letting go is a pattern.',
    conj: 'There is an intense, unyielding drive here. Power and determination tend to be defining themes.',
  },
  'Jupiter:Saturn': {
    soft: 'Expansion and structure tend to work well together. Building big with patience is a real strength.',
    hard: 'Growth and restraint can pull against each other. There may be ongoing tension between wanting more and holding back.',
    conj: 'Vision and discipline tend to be fused here. This person is capable of enormous effort when they commit to a direction.',
  },
  'Jupiter:Uranus': {
    soft: 'There tends to be a pull toward breakthroughs and new possibilities. What\'s just over the horizon is appealing.',
    hard: 'Restless expansion and sudden reversals can show up. There may be a pattern of upending one\'s own progress.',
    conj: 'Breakthrough moments and a hunger for what\'s new tend to be defining themes. Staying still for long is difficult.',
  },
  'Jupiter:Neptune': {
    soft: 'Dreaming big and finding meaning beyond the ordinary tend to be strengths.',
    hard: 'Escapism or grandiose idealism can show up. Losing oneself in visions is a risk.',
    conj: 'There tends to be a pull toward something transcendent. Faith, dreams, and big unanswerable questions are appealing.',
  },
  'Jupiter:Pluto': {
    soft: 'A drive toward transformation on a large scale tends to be present. Thinking in decades comes naturally.',
    hard: 'A hunger for power dressed as ambition can show up. Overstepping in pursuit of transformation is a risk.',
    conj: 'Transformation at scale tends to be a theme. Not just changing oneself, but what is around them.',
  },
  'Saturn:Uranus': {
    soft: 'Structure and disruption tend to work in balance here. Innovating without losing footing is a strength.',
    hard: 'Holding on and breaking free can pull against each other. Tradition versus change is an ongoing friction.',
    conj: 'Structure and disruption tend to be in conversation. There is a need for both stability and something new.',
  },
  'Neptune:Saturn': {
    soft: 'Idealism grounded in reality tends to be a strength. Pursuing meaning without losing footing is possible.',
    hard: 'Reality and illusion can pull against each other. Bridging the practical and the transcendent may feel difficult.',
    conj: 'Reality and idealism tend to be in ongoing conversation. Both the practical and the transcendent are carried here.',
  },
  'Pluto:Saturn': {
    soft: 'Resilience and endurance tend to be real strengths. Challenge shapes this person without defining them.',
    hard: 'Recurring encounters with loss, control, and deep pressure can show up. Endurance may be earned the hard way.',
    conj: 'Endurance under pressure tends to be a defining theme. This person is shaped by difficulty and quiet resilience.',
  },
}

function getBlurb(p1, p2, aspect) {
  const key = [p1, p2].sort().join(':')
  const entry = PAIR_BLURBS[key]
  if (!entry) return null
  const tier = (aspect === 'square' || aspect === 'opposition') ? 'hard'
             : (aspect === 'trine'  || aspect === 'sextile')    ? 'soft'
             : 'conj'
  return entry[tier] ?? null
}

// ── Component ──────────────────────────────────────────────────────────────────

export function AspectsPanel({ nodes }) {
  const [sortBy,       setSortBy]       = useState('planets')
  const [sortDir,      setSortDir]      = useState('asc')
  const [activeFilters, setActiveFilters] = useState(new Set()) // empty = show all
  const [showDescs,    setShowDescs]    = useState(true)

  if (!nodes?.length) {
    return <p className="tables-empty">Add family members to see aspects here.</p>
  }

  // Build flat rows with normalized planet order (primary = smaller PLANET_ORDER index)
  const allRows = []
  for (const node of nodes) {
    const aspects = node.data?.natalAspects
    if (!Array.isArray(aspects) || aspects.length === 0) continue
    const hasBirthTime = !!node.data.birthTime

    for (const a of aspects) {
      const n1 = a.planet1.name, n2 = a.planet2.name
      if (!hasBirthTime && (EXCLUDE_WITHOUT_TIME.has(n1) || EXCLUDE_WITHOUT_TIME.has(n2))) continue
      if (GENERATIONAL_PAIR(n1, n2)) continue

      const swap = PLANET_ORDER.indexOf(n1) > PLANET_ORDER.indexOf(n2)
      const p1 = swap ? a.planet2 : a.planet1
      const p2 = swap ? a.planet1 : a.planet2

      allRows.push({
        personId:    node.id,
        personName:  node.data.name,
        hasBirthTime,
        planet1:     p1,
        planet2:     p2,
        aspect:      a.aspect,
        symbol:      a.symbol ?? ASPECT_SYMBOLS[a.aspect] ?? '',
        orb:         a.orb,
        exact:       a.exact,
        p1idx:       PLANET_ORDER.indexOf(p1.name),
        p2idx:       PLANET_ORDER.indexOf(p2.name),
      })
    }
  }

  const noTimeNames = [...new Set(allRows.filter(r => !r.hasBirthTime).map(r => r.personName))]

  // Multi-select planet filter: empty set = show all
  const filtered = activeFilters.size === 0
    ? allRows
    : allRows.filter(r => activeFilters.has(r.planet1.name) || activeFilters.has(r.planet2.name))

  function toggleFilter(planet) {
    if (planet === '__clear__') { setActiveFilters(new Set()); return }
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(planet)) next.delete(planet)
      else next.add(planet)
      return next
    })
  }

  function handleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  function thCls(col) {
    return `tables-th tables-th--sortable${sortBy === col ? ' tables-th--active' : ''}`
  }

  function Arrow({ col }) {
    if (sortBy !== col) return <span className="tables-sort-arrow tables-sort-arrow--dim"> ↕</span>
    return <span className="tables-sort-arrow">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
  }

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    switch (sortBy) {
      case 'planets': cmp = a.p1idx - b.p1idx || a.p2idx - b.p2idx; break
      case 'person':  cmp = a.personName.localeCompare(b.personName); break
      case 'aspect':  cmp = (ASPECT_ANGLE[a.aspect] ?? 0) - (ASPECT_ANGLE[b.aspect] ?? 0); break
      case 'signs':   cmp = a.planet1.sign.localeCompare(b.planet1.sign); break
      case 'orb':     cmp = a.orb - b.orb; break
      default:        cmp = a.p1idx - b.p1idx || a.p2idx - b.p2idx
    }
    if (cmp === 0) cmp = a.orb - b.orb
    return sortDir === 'asc' ? cmp : -cmp
  })

  if (filtered.length === 0) {
    return (
      <>
        <FilterBar activeFilters={activeFilters} toggleFilter={toggleFilter} showDescs={showDescs} setShowDescs={setShowDescs} />
        <p className="tables-empty">No aspects found{activeFilters.size > 0 ? ` involving ${[...activeFilters].join(', ')}` : ''}.</p>
      </>
    )
  }

  return (
    <>
      <FilterBar activeFilters={activeFilters} toggleFilter={toggleFilter} showDescs={showDescs} setShowDescs={setShowDescs} />

      <div className="tables-scroll">
        <table className="tables-table aspects-table">
          <thead>
            <tr>
              <th className={thCls('person')}  onClick={() => handleSort('person')}>Person<Arrow col="person" /></th>
              <th className={thCls('planets')} onClick={() => handleSort('planets')}>Planets<Arrow col="planets" /></th>
              <th className={thCls('aspect')}  onClick={() => handleSort('aspect')}>Aspect<Arrow col="aspect" /></th>
              <th className={thCls('signs')}   onClick={() => handleSort('signs')}>Signs<Arrow col="signs" /></th>
              <th className={thCls('orb')}     onClick={() => handleSort('orb')}>Orb<Arrow col="orb" /></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const blurb = getBlurb(row.planet1.name, row.planet2.name, row.aspect)
              return (
                <tr key={`${row.personId}-${row.p1idx}-${row.p2idx}-${row.aspect}`}>
                  <td className="tables-name aspects-person-cell">
                    {row.personName}{!row.hasBirthTime && <span className="aspects-no-time-marker" title="No birth time recorded"> *</span>}
                  </td>
                  <td className="aspects-planets-cell">
                    <div className="aspects-pair-line">
                      <span className="aspects-glyph">{row.planet1.glyph}</span>
                      <span className="aspects-pname">{row.planet1.name}</span>
                      <span className="aspects-pair-dash">—</span>
                      <span className="aspects-glyph">{row.planet2.glyph}</span>
                      <span className="aspects-pname">{row.planet2.name}</span>
                      {row.hasBirthTime && row.exact && <span className="aspects-badge aspects-badge--exact">exact</span>}
                    </div>
                    {showDescs && blurb && <div className="aspects-desc-line">{blurb}</div>}
                  </td>
                  <td className="aspects-aspect-cell">
                    <span className={`aspects-sym aspects-sym--${row.aspect}`}>{row.symbol}</span>
                    <span className="aspects-aspect-label">{ASPECT_LABEL[row.aspect]}</span>
                  </td>
                  <td className="aspects-signs-cell">
                    <span className="aspects-sign">{row.planet1.sign}</span>
                    <span className="aspects-sign-sep"> — </span>
                    <span className="aspects-sign">{row.planet2.sign}</span>
                  </td>
                  <td className="aspects-orb-cell">
                    {row.hasBirthTime ? `${row.orb}°` : <span className="aspects-orb-unknown" title="Orb not shown without birth time">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {noTimeNames.length > 0 && (
        <p className="tables-note">
          * No birth time recorded: {noTimeNames.join(', ')}. Moon and Mercury aspects excluded, orb not shown.
        </p>
      )}
    </>
  )
}

function FilterBar({ activeFilters, toggleFilter, showDescs, setShowDescs }) {
  return (
    <div className="aspects-filter-bar">
      <button
        className={`aspects-filter-pill${activeFilters.size === 0 ? ' aspects-filter-pill--on' : ''}`}
        onClick={() => activeFilters.size > 0 && toggleFilter('__clear__')}
      >All</button>
      {PLANET_FILTER_OPTIONS.map(f => (
        <button
          key={f.key}
          className={`aspects-filter-pill${activeFilters.has(f.key) ? ' aspects-filter-pill--on' : ''}`}
          onClick={() => toggleFilter(f.key)}
        >{f.glyph} {f.key}</button>
      ))}
      <label className="aspects-desc-toggle">
        <input type="checkbox" checked={showDescs} onChange={e => setShowDescs(e.target.checked)} />
        Descriptions
      </label>
    </div>
  )
}
