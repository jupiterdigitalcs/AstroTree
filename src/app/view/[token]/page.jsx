import { notFound } from 'next/navigation'
import { getSupabase } from '../../api/_lib/supabase.js'
import { getSunSign } from '../../../utils/astrology/sunSign.js'
import { getElement } from '../../../utils/astrology/elements.js'

function toRow(r) {
  return {
    id: r.id, title: r.title, nodes: r.nodes, edges: r.edges,
    counter: r.counter, savedAt: r.saved_at, shareToken: r.share_token ?? null,
    isPublic: r.is_public, isSample: r.is_sample,
  }
}

async function getChart(token) {
  const { data, error } = await getSupabase()
    .from('charts')
    .select('id,title,nodes,edges,counter,saved_at,share_token,is_public,is_sample')
    .eq('share_token', token)
    .single()
  if (error || !data) return null
  return toRow(data)
}

// Dynamic metadata with chart title + member count
export async function generateMetadata({ params }) {
  const { token } = await params
  const chart = await getChart(token)
  if (!chart) return { title: 'Chart Not Found — AstroDig' }

  const memberCount = chart.nodes?.length ?? 0
  const title = chart.title || 'Shared Chart'
  const description = `${title} — ${memberCount} member${memberCount !== 1 ? 's' : ''} mapped on AstroDig`

  return {
    title: `${title} — AstroDig`,
    description,
    robots: 'noindex, nofollow',
    openGraph: {
      title: `${title} — AstroDig`,
      description,
      url: `https://astrodig.com/view/${token}`,
      images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — AstroDig`,
      description,
    },
  }
}

const GOLD = '#c9a84c'
const TEXT = '#e8dcc8'
const SOFT = 'rgba(232, 220, 200, 0.6)'
const FAINT = 'rgba(232, 220, 200, 0.35)'

const btnStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(201, 168, 76, 0.12)',
  border: '1px solid rgba(201, 168, 76, 0.4)',
  borderRadius: '12px',
  padding: '0.9rem 1.2rem',
  color: GOLD,
  textDecoration: 'none',
  fontFamily: 'Cinzel, Georgia, serif',
  fontSize: '0.95rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textAlign: 'center',
}

const SIGN_SYMBOLS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
}

function memberSign(data) {
  const sign = data?.sign || (data?.birthdate ? getSunSign(data.birthdate).sign : null)
  return SIGN_SYMBOLS[sign] ?? '✦'
}

function elementLine(nodes) {
  const counts = {}
  let total = 0
  for (const n of nodes) {
    const sign = n.data?.sign || (n.data?.birthdate ? getSunSign(n.data.birthdate).sign : null)
    const el = sign ? getElement(sign).element : null
    if (!el || el === 'Unknown') continue
    counts[el] = (counts[el] ?? 0) + 1
    total++
  }
  if (total < 2) return null
  const [topEl, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  if (topCount / total >= 0.5) return `This group leans ${topEl.toLowerCase()}.`
  return 'A balanced mix of elements in this group.'
}

// Server-rendered title screen for shared charts — a menu into the
// experiences rather than an auto-redirect into one view
export default async function SharedChartPage({ params }) {
  const { token } = await params
  const chart = await getChart(token)
  if (!chart) notFound()

  const nodes = chart.nodes ?? []
  const memberCount = nodes.length
  const title = chart.title || 'Shared Chart'
  const appUrl = `/?view=${encodeURIComponent(token)}`
  const elements = elementLine(nodes)
  const shown = nodes.slice(0, 12)
  const extra = memberCount - shown.length

  return (
    <div style={{ background: '#09071a', color: TEXT, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Raleway, sans-serif', textAlign: 'center', padding: '3rem 1.5rem 2.5rem' }}>
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>

        <p style={{ fontFamily: 'Cinzel, Georgia, serif', color: FAINT, fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', margin: '0 0 1.2rem' }}>✦ AstroDig ✦</p>

        <h1 style={{ fontFamily: 'Cinzel, Georgia, serif', color: GOLD, fontSize: '1.7rem', fontWeight: 600, lineHeight: 1.25, margin: '0 0 0.6rem' }}>{title}</h1>

        <p style={{ color: SOFT, fontSize: '0.9rem', margin: '0 0 0.4rem' }}>
          {memberCount} {memberCount === 1 ? 'person' : 'people'}, one chart
        </p>
        {elements && (
          <p style={{ color: SOFT, fontSize: '0.85rem', margin: '0 0 1.5rem' }}>{elements}</p>
        )}

        {/* Member chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.4rem', margin: '0 0 2rem' }}>
          {shown.map(n => (
            <span key={n.id} style={{ border: '1px solid rgba(232, 220, 200, 0.15)', borderRadius: '999px', padding: '0.25rem 0.7rem', fontSize: '0.78rem', color: SOFT, whiteSpace: 'nowrap' }}>
              {n.data?.name || n.data?.label || 'Someone'} <span style={{ color: GOLD }}>{memberSign(n.data)}</span>
            </span>
          ))}
          {extra > 0 && (
            <span style={{ padding: '0.25rem 0.4rem', fontSize: '0.78rem', color: FAINT }}>+ {extra} more</span>
          )}
        </div>

        {/* Menu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', width: '100%', margin: '0 0 1.8rem' }}>
          <a href={appUrl} style={btnStyle}>✦ See the Constellation</a>
          <a href={`${appUrl}&open=insights`} style={btnStyle}>☽ Group Insights</a>
          <a href={`${appUrl}&open=dig`} style={btnStyle}>⟡ Play The DIG</a>
        </div>

        <p style={{ color: FAINT, fontSize: '0.75rem', lineHeight: 1.6, margin: '0 0 1.8rem' }}>
          Each view has a download button, so you can save a picture to keep or post.
        </p>

        <a href="/" style={{ color: SOFT, fontSize: '0.82rem', textDecoration: 'none', borderBottom: `1px solid ${FAINT}`, paddingBottom: '1px' }}>
          Curious about your own people? Start a chart of your own
        </a>
      </div>
    </div>
  )
}
