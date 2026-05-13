import { getElement, ELEMENT_COLORS } from '../../utils/astrology.js'
import { SIGN_SYMBOLS, SIGN_FLAVOR, PLANET_GLYPH } from './insightsData.js'

export function GroupAnalysisCards({ topSigns, groupHotspots, groupGaps, groupSaturnLines, groupJupiterGifts }) {
  return (
    <>
      {/* Planetary Patterns (Dominant Sign) */}
      {topSigns.length > 0 && (
        <div className="insight-card" data-count={topSigns.length} data-label={topSigns.length === 1 ? 'sign' : 'signs'}>
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
            Aries:       { core: 'initiative and action', daily: 'Conversations may move fast. New ideas tend to spark quickly, and follow-through may be the challenge.' },
            Taurus:      { core: 'comfort and stability', daily: 'Shared meals, familiar routines, and creating physical warmth together may be a recurring theme.' },
            Gemini:      { core: 'communication and ideas', daily: 'Gatherings probably run long. The group may process everything by talking it through, sometimes at the same time.' },
            Cancer:      { core: 'emotional safety and home', daily: 'Loyalty runs deep here. Family traditions, shared memories, and a strong protective instinct may define the group dynamic.' },
            Leo:         { core: 'self-expression and warmth', daily: 'Celebrating each other may come naturally. The group might be drawn to big moments and making sure no one feels overlooked.' },
            Virgo:       { core: 'precision and service', daily: 'Helping each other is a love language here. Standards may run high, both for the group and for themselves.' },
            Libra:       { core: 'harmony and fairness', daily: 'Conflict avoidance may be a pattern. Real effort goes into keeping things balanced, sometimes at the cost of directness.' },
            Scorpio:     { core: 'depth and honesty', daily: 'Surface-level interactions may not satisfy this group. There\'s likely a preference for truth, even when it\'s uncomfortable.' },
            Sagittarius: { core: 'meaning and expansion', daily: 'Big questions, new experiences, and a restless need to keep growing may bring the group together, and pull it in new directions.' },
            Capricorn:   { core: 'responsibility and structure', daily: 'The group may naturally organize around goals and timelines. Long-term planning might be a shared strength, and a shared pressure.' },
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
        const hotspotCount = Math.min(groupHotspots.length, 3)
        return (
        <div className="insight-card" data-count={hotspotCount} data-label={hotspotCount === 1 ? 'hotspot' : 'hotspots'}>
          <h3 className="insight-heading">Group Hotspots<span className="insight-pro-tag">✦</span></h3>
          <p className="insight-whisper">Zones of the zodiac where multiple people's planets concentrate. These themes tend to echo through the group's daily life.</p>
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
                Gaps aren't weaknesses. They're areas where the group may seek those qualities in others or develop them over time.
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
      {groupSaturnLines.length > 0 && (
        <div className="insight-card" data-count={groupSaturnLines.length} data-label={groupSaturnLines.length === 1 ? 'sign' : 'signs'}>
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
      {groupJupiterGifts.length > 0 && (
        <div className="insight-card" data-count={groupJupiterGifts.length} data-label={groupJupiterGifts.length === 1 ? 'sign' : 'signs'}>
          <h3 className="insight-heading">♃ Jupiter Gifts<span className="insight-pro-tag">✦</span></h3>
          <p className="insight-whisper">Jupiter's sign points to where each person tends to find expansion, opportunity, and natural ease.</p>
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
    </>
  )
}
