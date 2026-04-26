import { useState, useEffect } from 'react'
import { fetchResearchData, markChartAsTest } from './utils/adminStorage.js'

const ELEMENT_COLORS = { Fire: '#e74c3c', Earth: '#8b6914', Air: '#5dade2', Water: '#9b5de5' }
const MODALITY_COLORS = { Cardinal: '#e74c3c', Fixed: '#c9a84c', Mutable: '#5dade2' }
const SIGN_SYMBOLS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
}

function StatCard({ label, value, sub }) {
  return (
    <div className="admin-stat-card">
      <span className="admin-stat-value">{value}</span>
      <span className="admin-stat-label">{label}</span>
      {sub && <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{sub}</span>}
    </div>
  )
}

function ConfidenceBadge({ confidence }) {
  if (!confidence) return null
  return (
    <span className="research-confidence" style={{ color: confidence.color }}>
      <span className="research-confidence-dot" style={{ background: confidence.color }} />
      {confidence.label}
    </span>
  )
}

function ComparisonCard({ label, observed, expected, ratio, note, confidence }) {
  const isHigher = ratio != null && ratio > 1
  return (
    <div className="research-comparison-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <span className="research-comparison-label">{label}</span>
        <ConfidenceBadge confidence={confidence} />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span className="research-comparison-observed">{observed}</span>
        <span className="research-comparison-expected">vs {expected} expected</span>
      </div>
      {ratio != null && (
        <span className="research-comparison-ratio" style={{ color: isHigher ? '#e74c3c' : 'var(--text-muted)' }}>
          {ratio}x {isHigher ? 'above random chance' : 'of random expectation'}
        </span>
      )}
      {note && <span className="research-comparison-note">{note}</span>}
    </div>
  )
}

function Section({ title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="admin-chart research-section" style={{ marginTop: '1rem' }}>
      <button type="button" className="research-section-toggle" onClick={() => setOpen(!open)}>
        <span className="research-section-chevron">{open ? '▾' : '▸'}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.06em' }}>{title}</span>
      </button>
      {open && subtitle && <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0.15rem 0 0.6rem' }}>{subtitle}</p>}
      {open && children}
    </div>
  )
}

function FamilyDetailList({ items, renderItem }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? items : items.slice(0, 8)
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem' }}>
        {visible.map((item, i) => renderItem(item, i))}
      </div>
      {items.length > 8 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: '0.4rem', fontSize: '0.68rem', color: 'var(--gold)', background: 'none',
            border: 'none', cursor: 'pointer', padding: '0.2rem 0',
          }}
        >
          {expanded ? 'Show less' : `Show all ${items.length} entries...`}
        </button>
      )}
    </div>
  )
}

export default function AdminResearchPanel() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResearchData().then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 0' }}>Loading research data...</p>
  if (!data?.overview) return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No research data available.</p>

  const { overview, sharedSuns, sharedMoons, degreeClusters, topPairings,
    elementConcentration, modalityConcentration, opposites, significance,
    planetarySharing, complementChildren, suspects } = data
  const sunSig = significance?.sunSharing ?? {}
  const moonSig = significance?.moonSharing ?? {}
  const degSig = significance?.degreeClustering ?? {}
  const planetSig = planetarySharing?.stats ?? {}

  // Build summary rows (no personal data)
  const summaryRows = [
    sunSig.ratio != null && { label: 'Sun sign sharing', ratio: sunSig.ratio, observed: `${sunSig.normalizedRate}%`, expected: `${sunSig.expectedNormalizedRate}%`, confidence: sunSig.confidence },
    moonSig.ratio != null && { label: 'Moon sign sharing', ratio: moonSig.ratio, observed: `${moonSig.normalizedRate}%`, expected: `${moonSig.expectedNormalizedRate}%`, confidence: moonSig.confidence },
    planetSig.ratio != null && { label: 'Shared planetary placements', ratio: planetSig.ratio, observed: planetSig.observedPairs, expected: planetSig.expectedPairs, confidence: planetSig.confidence },
    elementConcentration?.ratio != null && { label: 'Element concentration', ratio: elementConcentration.ratio, observed: `${elementConcentration.avgDominantPct}%`, expected: `${elementConcentration.avgExpectedDominantPct}%`, confidence: elementConcentration.confidence },
    opposites?.ratio != null && { label: 'Opposite sign pairs', ratio: opposites.ratio, observed: opposites.observed, expected: opposites.expected, confidence: opposites.confidence },
    modalityConcentration?.ratio != null && { label: 'Modality concentration', ratio: modalityConcentration.ratio, observed: `${modalityConcentration.avgDominantPct}%`, expected: `${modalityConcentration.avgExpectedDominantPct}%`, confidence: modalityConcentration.confidence },
    degSig.ratio != null && { label: 'Sun degree clustering (5°)', ratio: degSig.ratio, observed: degSig.observedPairs, expected: degSig.expectedPairs, confidence: degSig.confidence },
  ].filter(Boolean)

  async function handleMarkSuspect(chartId) {
    const res = await markChartAsTest(chartId, true)
    if (res.ok) {
      // Reload research data
      setLoading(true)
      fetchResearchData().then(d => { setData(d); setLoading(false) })
    }
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.75rem', letterSpacing: '0.04em', lineHeight: 1.5 }}>
        Testing the hypothesis: <em style={{ color: 'var(--gold)' }}>families are built by divine order</em> —
        do astrological patterns within families exceed what random chance would produce?
        Each section compares observed family patterns against mathematical expectation.
      </p>

      {/* Overview */}
      <div className="admin-stat-cards">
        <StatCard label="Unique Individuals" value={overview.uniqueIndividuals} sub="deduplicated by birthdate" />
        <StatCard label="Family Charts" value={overview.totalCharts} sub="test charts excluded" />
        <StatCard label="Avg Family Size" value={overview.avgFamilySize} sub="members per chart" />
      </div>

      {/* ── Shareable Summary ────────────────────────────────────── */}
      {summaryRows.length > 0 && (
        <div className="research-summary-card">
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Research Summary
          </p>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
            Based on {overview.totalCharts} families, {overview.uniqueIndividuals} unique individuals. All values normalized — each family weighted equally regardless of size.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {summaryRows.map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem' }}>
                <span style={{ minWidth: '13rem', color: 'var(--text-muted)', flexShrink: 0 }}>{row.label}</span>
                <span style={{ minWidth: '5rem', color: 'var(--gold)' }}>{row.observed} <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>vs {row.expected}</span></span>
                <span style={{ minWidth: '3rem', fontWeight: 700, color: row.ratio > 1.5 ? '#e74c3c' : row.ratio > 1 ? 'var(--gold)' : 'var(--text-muted)' }}>
                  {row.ratio}x
                </span>
                <ConfidenceBadge confidence={row.confidence} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Data Quality ─────────────────────────────────────────── */}
      {suspects?.length > 0 && (
        <Section title={`Data Quality — ${suspects.length} suspect chart${suspects.length > 1 ? 's' : ''}`} defaultOpen>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            These charts have unrealistic data (e.g., parent younger than child). Mark as test to exclude from research.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {suspects.map((s, i) => (
              <div key={i} style={{ padding: '0.5rem 0.6rem', background: 'rgba(232,112,112,0.06)', borderRadius: '6px', border: '1px solid rgba(232,112,112,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, color: '#e87070', fontSize: '0.75rem' }}>{s.title}</span>
                  <button
                    type="button"
                    className="admin-badge admin-badge--test"
                    onClick={() => handleMarkSuspect(s.chartId)}
                    style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}
                  >
                    Mark as test
                  </button>
                </div>
                {s.flags.map((f, j) => (
                  <p key={j} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0.1rem 0' }}>
                    {f.type === 'future' ? '!' : f.type === 'ancient' ? '!' : f.type === 'parent-younger' ? '!' : f.type === 'parent-too-young' ? '!' : '!'} {f.detail}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── 1. Sun Sign Sharing ──────────────────────────────────── */}
      <Section
        title="Sun Sign Sharing"
        subtitle="Do family members share sun signs more than strangers would? With 12 signs, random chance gives each pair a 1-in-12 shot of matching."
      >
        <div className="research-comparison-grid">
          <ComparisonCard
            label="Families with shared sun signs"
            observed={`${sunSig.observedRate}%`}
            expected={`${sunSig.expectedRate}%`}
            note={`${sunSig.familiesWithSharing} of ${sunSig.totalFamilies} families`}
            confidence={sunSig.confidence}
          />
          <ComparisonCard
            label="Avg family sharing rate (normalized)"
            observed={`${sunSig.normalizedRate}%`}
            expected={`${sunSig.expectedNormalizedRate}%`}
            ratio={sunSig.ratio}
            note="Each family weighted equally regardless of size"
          />
        </div>
        {sharedSuns?.length > 0 && (
          <FamilyDetailList items={sharedSuns} renderItem={(s, i) => (
            <div key={i} className="research-detail-row">
              <span className="research-detail-family">{s.family}</span>
              <span className="research-detail-sign">{SIGN_SYMBOLS[s.sign]} {s.sign} ({s.count})</span>
              <span className="research-detail-names">{s.members.join(', ')}</span>
            </div>
          )} />
        )}
      </Section>

      {/* ── 2. Moon Sign Sharing ─────────────────────────────────── */}
      <Section
        title="Moon Sign Sharing"
        subtitle="Moon signs change every ~2.5 days, making shared moons within a family a stronger signal than shared suns. Same birthday-problem math: 12 categories."
      >
        <div className="research-comparison-grid">
          <ComparisonCard
            label="Families with shared moon signs"
            observed={`${moonSig.observedRate}%`}
            expected={`${moonSig.expectedRate}%`}
            note={`${moonSig.familiesWithSharing} of ${moonSig.totalFamilies} families`}
            confidence={moonSig.confidence}
          />
          <ComparisonCard
            label="Avg family sharing rate (normalized)"
            observed={`${moonSig.normalizedRate}%`}
            expected={`${moonSig.expectedNormalizedRate}%`}
            ratio={moonSig.ratio}
            note="Each family weighted equally regardless of size"
          />
        </div>
        {sharedMoons?.length > 0 && (
          <FamilyDetailList items={sharedMoons} renderItem={(sm, i) => (
            <div key={i} className="research-detail-row">
              <span className="research-detail-family">{sm.family}</span>
              <span className="research-detail-sign">{SIGN_SYMBOLS[sm.moonSign]} {sm.moonSign} ({sm.count})</span>
              <span className="research-detail-names">{sm.members.join(', ')}</span>
            </div>
          )} />
        )}
      </Section>

      {/* ── 3. Shared Planetary Placements ────────────────────────── */}
      {planetarySharing?.instances?.length > 0 && (
        <Section
          title="Shared Planetary Placements"
          subtitle="The invisible threads — Venus, Mars, Mercury, Jupiter, Saturn placements that family members share. These aren't visible without looking up the charts. Each planet sharing has a 1-in-12 random chance per pair."
        >
          <div className="research-comparison-grid">
            <ComparisonCard
              label="Shared planetary pairs"
              observed={planetSig.observedPairs}
              expected={planetSig.expectedPairs}
              ratio={planetSig.ratio}
              note={`${planetSig.totalInstances} instances across all families`}
              confidence={planetSig.confidence}
            />
          </div>
          <FamilyDetailList items={planetarySharing.instances} renderItem={(ps, i) => (
            <div key={i} className="research-detail-row">
              <span className="research-detail-family">{ps.family}</span>
              <span className="research-detail-sign" style={{ minWidth: '10rem' }}>
                {ps.planet} in {SIGN_SYMBOLS[ps.sign]} {ps.sign} ({ps.count})
              </span>
              <span className="research-detail-names">{ps.members.join(', ')}</span>
            </div>
          )} />
          <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
            &quot;{planetarySharing.instances[0]?.count} family members sharing {planetarySharing.instances[0]?.planet} in {planetarySharing.instances[0]?.sign}&quot; means they all express {planetarySharing.instances[0]?.desc} through the same zodiac energy — a connection most people would never know without looking up the charts.
          </p>
        </Section>
      )}

      {/* ── 4. Element Concentration ─────────────────────────────── */}
      {elementConcentration?.families?.length > 0 && (
        <Section
          title="Element Concentration"
          subtitle="Does one element dominate each family more than random placement would predict? With 4 elements, random dominant would average ~35-40% of a family."
        >
          <div className="research-comparison-grid">
            <ComparisonCard
              label="Avg dominant element %"
              observed={`${elementConcentration.avgDominantPct}%`}
              expected={`${elementConcentration.avgExpectedDominantPct}%`}
              ratio={elementConcentration.ratio}
              confidence={elementConcentration.confidence}
            />
          </div>
          <FamilyDetailList items={elementConcentration.families} renderItem={(f, i) => (
            <div key={i} className="research-detail-row">
              <span className="research-detail-family">{f.family}</span>
              <span className="research-detail-sign" style={{ color: ELEMENT_COLORS[f.element] }}>
                {f.element} — {f.count}/{f.total} ({f.pct}%)
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>expected ~{f.expectedPct}%</span>
            </div>
          )} />
        </Section>
      )}

      {/* ── 4. Opposite Sign Axes ────────────────────────────────── */}
      {opposites && (
        <Section
          title="Opposite Sign Axes"
          subtitle="Opposite signs sit across the zodiac wheel and are said to be magnetically drawn together. Does this hold within families? Random chance: 1-in-12 pairs would be opposites."
        >
          <div className="research-comparison-grid">
            <ComparisonCard
              label="Opposite-sign pairs"
              observed={opposites.observed}
              expected={opposites.expected}
              ratio={opposites.ratio}
              note={`out of ${opposites.totalPairs} total pairs`}
              confidence={opposites.confidence}
            />
          </div>
          {opposites.detail?.length > 0 && (
            <FamilyDetailList items={opposites.detail} renderItem={(op, i) => (
              <div key={i} className="research-detail-row">
                <span className="research-detail-family">{op.family}</span>
                <span className="research-detail-sign">{op.axis}</span>
                <span className="research-detail-names">{op.personA} + {op.personB}</span>
              </div>
            )} />
          )}
        </Section>
      )}

      {/* ── 5. Modality Clustering ───────────────────────────────── */}
      {modalityConcentration?.families?.length > 0 && (
        <Section
          title="Modality Clustering"
          subtitle="Cardinal (initiators), Fixed (sustainers), Mutable (adapters) — do families lean toward one mode? With 3 options, random dominant averages ~45-50%."
        >
          <div className="research-comparison-grid">
            <ComparisonCard
              label="Avg dominant modality %"
              observed={`${modalityConcentration.avgDominantPct}%`}
              expected={`${modalityConcentration.avgExpectedDominantPct}%`}
              ratio={modalityConcentration.ratio}
              confidence={modalityConcentration.confidence}
            />
          </div>
          <FamilyDetailList items={modalityConcentration.families} renderItem={(f, i) => (
            <div key={i} className="research-detail-row">
              <span className="research-detail-family">{f.family}</span>
              <span className="research-detail-sign" style={{ color: MODALITY_COLORS[f.modality] }}>
                {f.modality} — {f.count}/{f.total} ({f.pct}%)
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>expected ~{f.expectedPct}%</span>
            </div>
          )} />
        </Section>
      )}

      {/* ── 6. The Complement Child ──────────────────────────────── */}
      {complementChildren?.length > 0 && (
        <Section
          title="The Complement Child"
          subtitle="When a child is born into a family, do they fill an astrological gap? These children brought an element, modality, or planetary energy that no one else in the family had before them."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.4rem' }}>
            {complementChildren.map((cc, i) => (
              <div key={i} style={{ padding: '0.6rem 0.75rem', background: 'rgba(201,168,76,0.05)', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.1)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.78rem' }}>{cc.child}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                    {SIGN_SYMBOLS[cc.sign]} {cc.sign} — joined {cc.family}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  {cc.newElement && (
                    <span>
                      Brought <span style={{ color: ELEMENT_COLORS[cc.newElement], fontWeight: 600 }}>{cc.newElement}</span> energy — family only had {cc.elementsBefore.join(', ')} before
                    </span>
                  )}
                  {cc.newModality && (
                    <span>
                      Introduced <span style={{ color: MODALITY_COLORS[cc.newModality], fontWeight: 600 }}>{cc.newModality}</span> energy to the family
                    </span>
                  )}
                  {cc.newPlanets?.length > 0 && (
                    <span style={{ color: 'var(--text-muted)' }}>
                      New planetary placements: {cc.newPlanets.map(p => `${p.planet} in ${SIGN_SYMBOLS[p.sign] || ''} ${p.sign}`).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── 7. Degree Clustering ─────────────────────────────────── */}
      <Section
        title="Sun Degree Clustering"
        subtitle="Family members whose suns are within 5° on the zodiac wheel (out of 360°). Random chance would place most pairs far apart."
      >
        <div className="research-comparison-grid">
          <ComparisonCard
            label="Pairs within 5°"
            observed={degSig.observedPairs}
            expected={degSig.expectedPairs}
            ratio={degSig.ratio}
            note={`out of ${degSig.totalPairsAnalyzed} total pairs`}
            confidence={degSig.confidence}
          />
        </div>
        {degreeClusters?.length > 0 && (
          <FamilyDetailList items={degreeClusters} renderItem={(dc, i) => (
            <div key={i} className="research-detail-row">
              <span className="research-detail-family">{dc.family}</span>
              <span style={{ color: 'var(--text-primary)', minWidth: '6rem', fontSize: '0.72rem' }}>{dc.personA}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', minWidth: '5.5rem' }}>{SIGN_SYMBOLS[dc.signA]} {dc.signA} {dc.degA}°</span>
              <span style={{ color: 'var(--text-primary)', minWidth: '6rem', fontSize: '0.72rem' }}>{dc.personB}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', minWidth: '5.5rem' }}>{SIGN_SYMBOLS[dc.signB]} {dc.signB} {dc.degB}°</span>
              <span style={{ color: dc.gap <= 2 ? '#e74c3c' : 'var(--gold)', fontWeight: 700, fontSize: '0.75rem' }}>{dc.gap}°</span>
            </div>
          )} />
        )}
      </Section>

      {/* ── 7. Top Sign Pairings ─────────────────────────────────── */}
      {topPairings?.length > 0 && (
        <Section
          title="Top Sign Pairings"
          subtitle="Most common sign combinations within families. 'Expected' shows how many pairs you'd see if signs were randomly assigned. Ratio > 1 means the pairing appears more than chance predicts."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {topPairings.map(({ pair, count, expected, ratio }) => {
              const max = topPairings[0]?.count ?? 1
              return (
                <div key={pair} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem' }}>
                  <span style={{ width: '10rem', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>{pair}</span>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '3px', height: '1.1rem', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      width: `${Math.round((count / max) * 100)}%`, height: '100%',
                      background: ratio > 2 ? 'rgba(231,76,60,0.5)' : ratio > 1.3 ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.25)',
                      borderRadius: '3px', minWidth: '2px',
                    }} />
                    {expected > 0 && (
                      <div style={{
                        position: 'absolute', top: 0, bottom: 0,
                        left: `${Math.min(Math.round((expected / max) * 100), 100)}%`,
                        width: '1.5px', background: 'rgba(255,255,255,0.4)',
                      }} title={`Expected: ${expected}`} />
                    )}
                  </div>
                  <span style={{ color: 'var(--gold)', minWidth: '6.5rem', flexShrink: 0, fontSize: '0.68rem' }}>
                    {count} <span style={{ color: 'var(--text-muted)' }}>/ {expected} exp</span>
                    {ratio > 1.5 && <span style={{ color: '#e74c3c', fontWeight: 700 }}> {ratio}x</span>}
                  </span>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            White line = expected by chance. Red = notably above expectation. Counts are family-weighted (each family contributes equally regardless of size).
          </p>
        </Section>
      )}
    </div>
  )
}
